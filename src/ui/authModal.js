// Sign in / sign up modal. Uses the auth layer (local provider by default).
// On success it closes and calls onDone(user).

import { openModal } from './modal.js';
import { signIn, signUp, signInWithProfile, AUTH_ERRORS } from '../auth/auth.js';
import { renderGoogleButton, verifyGoogleToken, googleConfigured } from '../auth/google.js';
import { t, getLang } from '../i18n.js';

export function openAuthModal({ onDone, startTab = 'signin' } = {}) {
  openModal({
    title: t('Account'),
    render(body, close) {
      let mode = startTab; // 'signin' | 'signup'

      const tabs = document.createElement('div');
      tabs.className = 'segmented auth-tabs';
      const tabSignin = document.createElement('button');
      const tabSignup = document.createElement('button');
      tabSignin.className = 'seg-btn';
      tabSignup.className = 'seg-btn';
      tabSignin.textContent = t('Sign in');
      tabSignup.textContent = t('Create account');
      tabs.append(tabSignin, tabSignup);

      const form = document.createElement('form');
      form.className = 'auth-form';
      form.autocomplete = 'on';

      const nameField = field('text', t('Name'), 'name');
      const emailField = field('email', t('Email'), 'email');
      const passField = field('password', t('Password'), 'password');

      const err = document.createElement('p');
      err.className = 'auth-error';

      const submit = document.createElement('button');
      submit.type = 'submit';
      submit.className = 'btn btn-primary';
      submit.style.width = '100%';

      const note = document.createElement('p');
      note.className = 'muted auth-note';
      note.textContent = t('Local demo accounts — no real server yet.');

      form.append(nameField.wrap, emailField.wrap, passField.wrap, err, submit, note);

      // Google Sign-In (rendered above the email form when configured).
      if (googleConfigured()) {
        const gWrap = document.createElement('div');
        gWrap.className = 'google-signin';
        const divider = document.createElement('div');
        divider.className = 'auth-divider';
        divider.innerHTML = `<span>${t('or')}</span>`;
        renderGoogleButton(gWrap, async (idToken) => {
          err.textContent = '';
          try {
            const profile = await verifyGoogleToken(idToken);
            const user = await signInWithProfile(profile);
            close();
            onDone && onDone(user);
          } catch {
            err.textContent = t('Google sign-in failed. Please try again.');
          }
        });
        body.append(tabs, gWrap, divider, form);
      } else {
        body.append(tabs, form);
      }

      function sync() {
        tabSignin.classList.toggle('active', mode === 'signin');
        tabSignup.classList.toggle('active', mode === 'signup');
        nameField.wrap.style.display = mode === 'signup' ? '' : 'none';
        submit.textContent = mode === 'signin' ? t('Sign in') : t('Create account');
        err.textContent = '';
      }
      tabSignin.addEventListener('click', () => ((mode = 'signin'), sync()));
      tabSignup.addEventListener('click', () => ((mode = 'signup'), sync()));
      sync();

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        err.textContent = '';
        submit.disabled = true;
        try {
          const details = {
            name: nameField.input.value,
            email: emailField.input.value,
            password: passField.input.value,
          };
          const user = mode === 'signin' ? await signIn(details) : await signUp(details);
          close();
          onDone && onDone(user);
        } catch (ex) {
          const m = AUTH_ERRORS[ex.message];
          err.textContent = m ? m[getLang()] || m.en : ex.message;
          submit.disabled = false;
        }
      });
    },
  });
}

function field(type, label, name) {
  const wrap = document.createElement('label');
  wrap.className = 'auth-field';
  const span = document.createElement('span');
  span.textContent = label;
  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.autocomplete =
    name === 'password' ? 'current-password' : name === 'email' ? 'email' : 'name';
  wrap.append(span, input);
  return { wrap, input };
}
