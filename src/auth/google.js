// Google Sign-In client helper. Loads Google Identity Services on demand, renders
// the official button, and verifies the returned ID token SERVER-SIDE (via the
// Worker at /api/auth/google) before signing the user in — the client never
// trusts the token by itself.

import { GOOGLE_CLIENT_ID } from './googleConfig.js';

export { googleConfigured } from './googleConfig.js';

let _gis = null;
function loadGIS() {
  if (_gis) return _gis;
  _gis = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google);
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(window.google);
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(s);
  });
  return _gis;
}

// Render the "Continue with Google" button into `el`. onCredential(idToken) fires
// when the user completes Google sign-in.
export async function renderGoogleButton(el, onCredential) {
  if (!GOOGLE_CLIENT_ID) return;
  const google = await loadGIS();
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (resp) => resp?.credential && onCredential(resp.credential),
  });
  google.accounts.id.renderButton(el, {
    theme: 'filled_black',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    logo_alignment: 'center',
    width: 300,
  });
}

// Send the ID token to the Worker for signature/audience verification. Returns the
// verified profile { email, name }. Throws on failure.
export async function verifyGoogleToken(idToken) {
  const r = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ credential: idToken }),
  });
  if (!r.ok) throw new Error('google-verify-failed');
  return r.json();
}
