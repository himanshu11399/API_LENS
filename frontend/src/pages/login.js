/* ============================================
   APILens — Login Page
   ============================================ */

import { login } from '../services/auth.js';

const LOGO_SVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="url(#lg)"/>
  <path d="M10 22L16 10L22 22" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="16" cy="18" r="2" fill="white"/>
  <defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>
</svg>`;

const EYE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

/**
 * Render the login page
 * @param {HTMLElement} container
 * @param {Function} navigate - router navigation function
 */
export function renderLogin(container, navigate) {
  container.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'auth-page';

  page.innerHTML = `
    <div class="auth-card">
      <div class="auth-card-logo" id="auth-logo">
        ${LOGO_SVG}
        <span>APILens</span>
      </div>

      <h1>Welcome back</h1>
      <p class="auth-subtitle">Sign in to your account to continue</p>

      <div id="auth-error" style="display:none;"></div>

      <form class="auth-form" id="login-form" novalidate>
        <div class="auth-field">
          <label for="login-email">Email address</label>
          <input class="auth-input" type="email" id="login-email" placeholder="you@example.com" autocomplete="email" required />
          <span class="field-error" id="email-error"></span>
        </div>

        <div class="auth-field">
          <label for="login-password">Password</label>
          <div class="auth-password-wrapper">
            <input class="auth-input" type="password" id="login-password" placeholder="Enter your password" autocomplete="current-password" required />
            <button type="button" class="auth-password-toggle" id="toggle-password">${EYE_ICON}</button>
          </div>
          <span class="field-error" id="password-error"></span>
        </div>

        <span class="auth-forgot-link" id="forgot-link">Forgot password?</span>

        <button type="submit" class="auth-submit" id="login-submit">
          Sign In
        </button>
      </form>

      <div class="auth-links">
        Don't have an account? <a id="signup-link" class="auth-link">Create one</a>
      </div>
    </div>
  `;

  container.appendChild(page);

  // Elements
  const form = page.querySelector('#login-form');
  const emailInput = page.querySelector('#login-email');
  const passwordInput = page.querySelector('#login-password');
  const submitBtn = page.querySelector('#login-submit');
  const errorEl = page.querySelector('#auth-error');
  const togglePassword = page.querySelector('#toggle-password');

  // Password toggle
  let showPassword = false;
  togglePassword.addEventListener('click', () => {
    showPassword = !showPassword;
    passwordInput.type = showPassword ? 'text' : 'password';
    togglePassword.innerHTML = showPassword ? EYE_OFF_ICON : EYE_ICON;
  });

  // Navigation
  page.querySelector('#auth-logo').addEventListener('click', () => navigate('landing'));
  page.querySelector('#signup-link').addEventListener('click', () => navigate('signup'));
  page.querySelector('#forgot-link').addEventListener('click', () => navigate('forgot-password'));

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Client-side validation
    let valid = true;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      page.querySelector('#email-error').textContent = 'Please enter a valid email';
      emailInput.classList.add('error');
      valid = false;
    } else {
      page.querySelector('#email-error').textContent = '';
      emailInput.classList.remove('error');
    }

    if (!password) {
      page.querySelector('#password-error').textContent = 'Password is required';
      passwordInput.classList.add('error');
      valid = false;
    } else {
      page.querySelector('#password-error').textContent = '';
      passwordInput.classList.remove('error');
    }

    if (!valid) return;

    // Submit
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Signing in…';

    try {
      await login(email, password);
      navigate('workspace');
    } catch (err) {
      errorEl.innerHTML = `<div class="auth-error">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        ${esc(err.message)}
      </div>`;
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In';
    }
  });

  // Focus first field
  emailInput.focus();
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
