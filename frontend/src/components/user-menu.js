/* ============================================
   APILens — User Menu Component
   Dropdown menu for authenticated users
   ============================================ */

import { getCurrentUser, logout, isAuthenticated } from '../services/auth.js';

/**
 * Render user menu into container
 * @param {HTMLElement} container
 * @param {Function} navigate - router navigate function
 * @param {Object} callbacks - { onProfileOpen }
 */
export function renderUserMenu(container, navigate, callbacks = {}) {
  const user = getCurrentUser();
  const authed = isAuthenticated();

  container.innerHTML = '';

  if (!authed || !user) {
    // Guest mode — show sign in button
    container.innerHTML = `
      <button class="btn btn-ghost btn-sm" id="header-login-btn" style="font-size: var(--text-sm);">Sign In</button>
      <button class="btn btn-primary btn-sm" id="header-signup-btn" style="font-size: var(--text-sm);">Sign Up</button>
    `;
    container.querySelector('#header-login-btn')?.addEventListener('click', () => navigate('login'));
    container.querySelector('#header-signup-btn')?.addEventListener('click', () => navigate('signup'));
    return;
  }

  // Authenticated user — avatar + dropdown
  const initials = (user.username || user.email || 'U').slice(0, 2).toUpperCase();

  const wrapper = document.createElement('div');
  wrapper.className = 'user-menu-wrapper';
  wrapper.innerHTML = `
    <button class="user-avatar-btn" id="user-avatar-btn" title="${esc(user.username)}">
      ${initials}
    </button>
    <div class="user-dropdown" id="user-dropdown">
      <div class="user-dropdown-header">
        <div class="user-dropdown-avatar">${initials}</div>
        <div class="user-dropdown-info">
          <div class="user-dropdown-name">${esc(user.username)}</div>
          <div class="user-dropdown-email">${esc(user.email)}</div>
        </div>
      </div>
      <div class="user-dropdown-divider"></div>
      <button class="user-dropdown-item" id="menu-profile">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Profile & Settings
      </button>
      <button class="user-dropdown-item" id="menu-logout">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign Out
      </button>
    </div>
  `;

  container.appendChild(wrapper);

  const avatarBtn = wrapper.querySelector('#user-avatar-btn');
  const dropdown = wrapper.querySelector('#user-dropdown');

  // Toggle dropdown
  avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  // Profile
  wrapper.querySelector('#menu-profile').addEventListener('click', () => {
    dropdown.classList.remove('open');
    callbacks.onProfileOpen?.();
  });

  // Logout
  wrapper.querySelector('#menu-logout').addEventListener('click', async () => {
    dropdown.classList.remove('open');
    await logout();
    navigate('landing');
  });
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
