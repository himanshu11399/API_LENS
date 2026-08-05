/* ============================================
   APILens — Reset Password Page
   ============================================ */

import { resetPassword } from '../services/auth.js';

const LOGO_SVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="url(#lg4)"/>
  <path d="M10 22L16 10L22 22" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="16" cy="18" r="2" fill="white"/>
  <defs><linearGradient id="lg4" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>
</svg>`;

const EYE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

/**
 * Render the reset password page
 * @param {HTMLElement} container
 * @param {Function} navigate
 */
export function renderResetPassword(container, navigate) {
  container.innerHTML = '';

  // Extract token from URL hash params
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const token = hashParams.get('token');

  const page = document.createElement('div');
  page.className = 'auth-page';

  if (!token) {
    page.innerHTML = `
      <div class="auth-card">
        <div class="auth-card-logo" id="auth-logo">
          ${LOGO_SVG}
          <span>APILens</span>
        </div>
        <h1>Invalid Link</h1>
        <p class="auth-subtitle">This password reset link is invalid or has expired.</p>
        <div class="auth-links">
          <a id="forgot-link" class="auth-link">Request a new reset link</a>
        </div>
      </div>
    `;
    container.appendChild(page);
    page.querySelector('#auth-logo').addEventListener('click', () => navigate('landing'));
    page.querySelector('#forgot-link').addEventListener('click', () => navigate('forgot-password'));
    return;
  }

  page.innerHTML = `
    <div class="auth-card">
      <div class="auth-card-logo" id="auth-logo">
        ${LOGO_SVG}
        <span>APILens</span>
      </div>

      <h1>Set new password</h1>
      <p class="auth-subtitle">Enter your new password below</p>

      <div id="auth-message" style="display:none;"></div>

      <form class="auth-form" id="reset-form" novalidate>
        <div class="auth-field">
          <label for="reset-password">New password</label>
          <div class="auth-password-wrapper">
            <input class="auth-input" type="password" id="reset-password" placeholder="At least 6 characters" autocomplete="new-password" required />
            <button type="button" class="auth-password-toggle" id="toggle-password">${EYE_ICON}</button>
          </div>
          <span class="field-error" id="password-error"></span>
        </div>

        <div class="auth-field">
          <label for="reset-confirm">Confirm new password</label>
          <input class="auth-input" type="password" id="reset-confirm" placeholder="Re-enter your password" autocomplete="new-password" required />
          <span class="field-error" id="confirm-error"></span>
        </div>

        <button type="submit" class="auth-submit" id="reset-submit">
          Reset Password
        </button>
      </form>

      <div class="auth-links">
        <a id="login-link" class="auth-link">Back to sign in</a>
      </div>
    </div>
  `;

  container.appendChild(page);

  const form = page.querySelector('#reset-form');
  const passwordInput = page.querySelector('#reset-password');
  const confirmInput = page.querySelector('#reset-confirm');
  const submitBtn = page.querySelector('#reset-submit');
  const messageEl = page.querySelector('#auth-message');
  const togglePassword = page.querySelector('#toggle-password');

  let showPassword = false;
  togglePassword.addEventListener('click', () => {
    showPassword = !showPassword;
    passwordInput.type = showPassword ? 'text' : 'password';
    togglePassword.innerHTML = showPassword ? EYE_OFF_ICON : EYE_ICON;
  });

  page.querySelector('#auth-logo').addEventListener('click', () => navigate('landing'));
  page.querySelector('#login-link').addEventListener('click', () => navigate('login'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageEl.style.display = 'none';

    const password = passwordInput.value;
    const confirm = confirmInput.value;

    let valid = true;
    if (!password || password.length < 6) {
      page.querySelector('#password-error').textContent = 'Password must be at least 6 characters';
      passwordInput.classList.add('error');
      valid = false;
    } else {
      page.querySelector('#password-error').textContent = '';
      passwordInput.classList.remove('error');
    }

    if (password !== confirm) {
      page.querySelector('#confirm-error').textContent = 'Passwords do not match';
      confirmInput.classList.add('error');
      valid = false;
    } else {
      page.querySelector('#confirm-error').textContent = '';
      confirmInput.classList.remove('error');
    }

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Resetting…';

    try {
      await resetPassword(token, password);
      messageEl.innerHTML = `<div class="auth-success">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Password reset successful! Redirecting…
      </div>`;
      messageEl.style.display = 'block';
      form.style.display = 'none';

      setTimeout(() => navigate('workspace'), 1500);
    } catch (err) {
      messageEl.innerHTML = `<div class="auth-error">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        ${esc(err.message)}
      </div>`;
      messageEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Reset Password';
    }
  });

  passwordInput.focus();
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
