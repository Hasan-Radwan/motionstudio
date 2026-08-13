// Authentication layer with a swappable provider. The default LOCAL provider
// keeps accounts in the browser (passwords stored only as SHA-256 hashes) so the
// full sign-in / sign-up flow works today WITHOUT a backend. It is NOT secure
// multi-device auth — swap in a real provider (Supabase / your API) by
// implementing the same interface and setting it via `setAuthProvider`.
//
// Provider interface:
//   signUp({ name, email, password }) -> user
//   signIn({ email, password })       -> user
//   signOut()                         -> void
//   getUser()                         -> user | null
// where user = { id, email, name }.

const SESSION = 'ms-session';
const USERS = 'ms-users';
const listeners = new Set();

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---- LOCAL provider ----
const localProvider = {
  _users() {
    try {
      return JSON.parse(localStorage.getItem(USERS) || '{}');
    } catch {
      return {};
    }
  },
  _save(map) {
    localStorage.setItem(USERS, JSON.stringify(map));
  },
  async signUp({ name, email, password }) {
    email = String(email || '').trim().toLowerCase();
    if (!email || !password) throw new Error('auth/missing-fields');
    const users = this._users();
    if (users[email]) throw new Error('auth/email-in-use');
    const user = { id: email, email, name: name || email.split('@')[0] };
    users[email] = { ...user, pass: await sha256(password) };
    this._save(users);
    localStorage.setItem(SESSION, email);
    return user;
  },
  async signIn({ email, password }) {
    email = String(email || '').trim().toLowerCase();
    const rec = this._users()[email];
    if (!rec || rec.pass !== (await sha256(password))) throw new Error('auth/invalid-credentials');
    localStorage.setItem(SESSION, email);
    return { id: rec.id, email: rec.email, name: rec.name };
  },
  signOut() {
    localStorage.removeItem(SESSION);
  },
  getUser() {
    const email = localStorage.getItem(SESSION);
    if (!email) return null;
    const rec = this._users()[email];
    return rec ? { id: rec.id, email: rec.email, name: rec.name } : null;
  },
};

let provider = localProvider;
export function setAuthProvider(p) {
  provider = p;
}

let _user = provider.getUser();

function emit() {
  listeners.forEach((fn) => fn(_user));
}

export function currentUser() {
  return _user;
}
export function isSignedIn() {
  return !!_user;
}
export function onAuth(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function signUp(details) {
  _user = await provider.signUp(details);
  emit();
  return _user;
}
export async function signIn(details) {
  _user = await provider.signIn(details);
  emit();
  return _user;
}
export function signOut() {
  provider.signOut();
  _user = null;
  emit();
}

// Sign in via a verified external profile (e.g. Google). No password; the user is
// created in the local store on first sign-in and keyed by email like any other.
export async function signInWithProfile({ email, name }) {
  email = String(email || '').trim().toLowerCase();
  if (!email) throw new Error('auth/missing-fields');
  const users = localProvider._users();
  if (!users[email]) {
    users[email] = { id: email, email, name: name || email.split('@')[0], provider: 'google' };
    localProvider._save(users);
  } else if (name && !users[email].name) {
    users[email].name = name;
    localProvider._save(users);
  }
  localStorage.setItem(SESSION, email);
  _user = { id: email, email, name: users[email].name };
  emit();
  return _user;
}

// Human-readable messages for the known error codes (used by the auth modal).
export const AUTH_ERRORS = {
  'auth/missing-fields': { en: 'Please fill in all fields.', ar: 'يرجى تعبئة كل الحقول.' },
  'auth/email-in-use': { en: 'This email is already registered.', ar: 'هذا البريد مسجّل مسبقاً.' },
  'auth/invalid-credentials': { en: 'Wrong email or password.', ar: 'بريد أو كلمة مرور غير صحيحة.' },
};
