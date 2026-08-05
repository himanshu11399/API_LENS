/* ============================================
   APILens — Forgot Password Page
   ============================================ */

import { forgotPassword } from '../services/auth.js';

const LOGO_SVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="url(#lg3)"/>
  <path d="M10 22L16 10L22 22" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="16" cy="18" r="2" fill="white"/>
  <defs><linearGradient id="lg3" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>
</svg>`;

/**
 * Render the forgot password page
 * @param {HTMLElement} container
 * @param {Function} navigate
 */
export function renderForgotPassword(container, navigate) {
  container.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'auth-page';

  page.innerHTML = `
    <div class="auth-card">
      <div class="auth-card-logo" id="auth-logo">
        ${LOGO_SVG}
        <span>APILens</span>
      </div>

      <h1>Reset password</h1>
      <p class="auth-subtitle">Enter your email and we'll send you a reset link</p>

      <div id="auth-message" style="display:none;"></div>

      <form class="auth-form" id="forgot-form" novalidate>
        <div class="auth-field">
          <label for="forgot-email">Email address</label>
          <input class="auth-input" type="email" id="forgot-email" placeholder="you@example.com" autocomplete="email" required />
          <span class="field-error" id="email-error"></span>
        </div>

        <button type="submit" class="auth-submit" id="forgot-submit">
          Send Reset Link
        </button>
      </form>

      <div class="auth-links">
        Remember your password? <a id="login-link" class="auth-link">Sign in</a>
      </div>
    </div>
  `;

  container.appendChild(page);

  const form = page.querySelector('#forgot-form');
  const emailInput = page.querySelector('#forgot-email');
  const submitBtn = page.querySelector('#forgot-submit');
  const messageEl = page.querySelector('#auth-message');

  page.querySelector('#auth-logo').addEventListener('click', () => navigate('landing'));
  page.querySelector('#login-link').addEventListener('click', () => navigate('login'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageEl.style.display = 'none';

    const email = emailInput.value.trim();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      page.querySelector('#email-error').textContent = 'Please enter a valid email';
      emailInput.classList.add('error');
      return;
    } else {
      page.querySelector('#email-error').textContent = '';
      emailInput.classList.remove('error');
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Sending…';

    try {
      const result = await forgotPassword(email);
      messageEl.innerHTML = `<div class="auth-success">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        ${result.resetUrl
          ? `Reset link generated. <a href="${result.resetUrl}" style="color:var(--primary-neon);text-decoration:underline;">Click here to reset</a> (dev mode)`
          : 'If an account with that email exists, a reset link has been sent.'
        }
      </div>`;
      messageEl.style.display = 'block';
      form.style.display = 'none';
    } catch (err) {
      messageEl.innerHTML = `<div class="auth-error">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        ${esc(err.message)}
      </div>`;
      messageEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Reset Link';
    }
  });

  emailInput.focus();
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
