/* ============================================
   APILens — Signup Page
   ============================================ */

import { register } from '../services/auth.js';

const LOGO_SVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="url(#lg2)"/>
  <path d="M10 22L16 10L22 22" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="16" cy="18" r="2" fill="white"/>
  <defs><linearGradient id="lg2" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>
</svg>`;

const EYE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

/**
 * Render the signup page
 * @param {HTMLElement} container
 * @param {Function} navigate
 */
export function renderSignup(container, navigate) {
  container.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'auth-page';

  page.innerHTML = `
    <div class="auth-card">
      <div class="auth-card-logo" id="auth-logo">
        ${LOGO_SVG}
        <span>APILens</span>
      </div>

      <h1>Create your account</h1>
      <p class="auth-subtitle">Start testing APIs in seconds</p>

      <div id="auth-error" style="display:none;"></div>

      <form class="auth-form" id="signup-form" novalidate>
        <div class="auth-field">
          <label for="signup-username">Username</label>
          <input class="auth-input" type="text" id="signup-username" placeholder="Choose a username" autocomplete="username" required />
          <span class="field-error" id="username-error"></span>
        </div>

        <div class="auth-field">
          <label for="signup-email">Email address</label>
          <input class="auth-input" type="email" id="signup-email" placeholder="you@example.com" autocomplete="email" required />
          <span class="field-error" id="email-error"></span>
        </div>

        <div class="auth-field">
          <label for="signup-password">Password</label>
          <div class="auth-password-wrapper">
            <input class="auth-input" type="password" id="signup-password" placeholder="At least 6 characters" autocomplete="new-password" required />
            <button type="button" class="auth-password-toggle" id="toggle-password">${EYE_ICON}</button>
          </div>
          <div class="password-strength" id="password-strength">
            <div class="password-strength-bar"></div>
            <div class="password-strength-bar"></div>
            <div class="password-strength-bar"></div>
            <div class="password-strength-bar"></div>
          </div>
          <span class="password-strength-text" id="password-strength-text"></span>
          <span class="field-error" id="password-error"></span>
        </div>

        <div class="auth-field">
          <label for="signup-confirm">Confirm password</label>
          <input class="auth-input" type="password" id="signup-confirm" placeholder="Re-enter your password" autocomplete="new-password" required />
          <span class="field-error" id="confirm-error"></span>
        </div>

        <button type="submit" class="auth-submit" id="signup-submit">
          Create Account
        </button>
      </form>

      <div class="auth-links">
        Already have an account? <a id="login-link" class="auth-link">Sign in</a>
      </div>
    </div>
  `;

  container.appendChild(page);

  // Elements
  const form = page.querySelector('#signup-form');
  const usernameInput = page.querySelector('#signup-username');
  const emailInput = page.querySelector('#signup-email');
  const passwordInput = page.querySelector('#signup-password');
  const confirmInput = page.querySelector('#signup-confirm');
  const submitBtn = page.querySelector('#signup-submit');
  const errorEl = page.querySelector('#auth-error');
  const togglePassword = page.querySelector('#toggle-password');
  const strengthBars = page.querySelectorAll('.password-strength-bar');
  const strengthText = page.querySelector('#password-strength-text');

  // Password toggle
  let showPassword = false;
  togglePassword.addEventListener('click', () => {
    showPassword = !showPassword;
    passwordInput.type = showPassword ? 'text' : 'password';
    togglePassword.innerHTML = showPassword ? EYE_OFF_ICON : EYE_ICON;
  });

  // Password strength indicator
  passwordInput.addEventListener('input', () => {
    const pwd = passwordInput.value;
    const strength = getPasswordStrength(pwd);

    strengthBars.forEach((bar, i) => {
      bar.classList.remove('active', 'weak', 'fair', 'good', 'strong');
      if (i < strength.level) {
        bar.classList.add('active', strength.className);
      }
    });
    strengthText.textContent = pwd.length > 0 ? strength.text : '';
    strengthText.style.color = strength.color;
  });

  // Navigation
  page.querySelector('#auth-logo').addEventListener('click', () => navigate('landing'));
  page.querySelector('#login-link').addEventListener('click', () => navigate('login'));

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    // Client-side validation
    let valid = true;

    if (!username || username.length < 3) {
      page.querySelector('#username-error').textContent = 'Username must be at least 3 characters';
      usernameInput.classList.add('error');
      valid = false;
    } else {
      page.querySelector('#username-error').textContent = '';
      usernameInput.classList.remove('error');
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      page.querySelector('#email-error').textContent = 'Please enter a valid email';
      emailInput.classList.add('error');
      valid = false;
    } else {
      page.querySelector('#email-error').textContent = '';
      emailInput.classList.remove('error');
    }

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
    submitBtn.innerHTML = '<div class="spinner"></div> Creating account…';

    try {
      await register(username, email, password);
      navigate('workspace');
    } catch (err) {
      errorEl.innerHTML = `<div class="auth-error">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        ${esc(err.message)}
      </div>`;
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Create Account';
    }
  });

  usernameInput.focus();
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, className: 'weak', text: 'Weak', color: 'var(--error)' };
  if (score === 2) return { level: 2, className: 'fair', text: 'Fair', color: 'var(--warning)' };
  if (score === 3) return { level: 3, className: 'good', text: 'Good', color: '#06B6D4' };
  return { level: 4, className: 'strong', text: 'Strong', color: 'var(--success)' };
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
