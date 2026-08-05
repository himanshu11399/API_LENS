/* ============================================
   APILens — Profile Modal Component
   ============================================ */

import { getCurrentUser, updateProfile, changePassword } from '../services/auth.js';

/**
 * Open a profile modal overlay
 * @param {HTMLElement} parentContainer - parent to append modal to
 */
export function openProfileModal(parentContainer) {
  const user = getCurrentUser();
  if (!user) return;

  // Remove existing modal if any
  parentContainer.querySelector('.profile-modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'profile-modal-overlay';
  overlay.innerHTML = `
    <div class="profile-modal">
      <div class="profile-modal-header">
        <h2>Profile & Settings</h2>
        <button class="btn-icon profile-close-btn" id="profile-close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="profile-tabs">
        <button class="profile-tab active" data-tab="account">Account</button>
        <button class="profile-tab" data-tab="password">Password</button>
        <button class="profile-tab" data-tab="preferences">Preferences</button>
      </div>

      <div class="profile-tab-content" id="profile-tab-content"></div>
    </div>
  `;

  parentContainer.appendChild(overlay);

  // Close handlers
  overlay.querySelector('#profile-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Tab handling
  let activeTab = 'account';
  const tabContent = overlay.querySelector('#profile-tab-content');

  overlay.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      overlay.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTab();
    });
  });

  function renderTab() {
    tabContent.innerHTML = '';
    if (activeTab === 'account') renderAccountTab();
    else if (activeTab === 'password') renderPasswordTab();
    else if (activeTab === 'preferences') renderPreferencesTab();
  }

  function renderAccountTab() {
    const currentUser = getCurrentUser();
    tabContent.innerHTML = `
      <form class="profile-form" id="account-form">
        <div class="auth-field">
          <label>Username</label>
          <input class="auth-input" type="text" id="profile-username" value="${esc(currentUser.username)}" />
        </div>
        <div class="auth-field">
          <label>Email</label>
          <input class="auth-input" type="email" value="${esc(currentUser.email)}" disabled style="opacity:0.6;cursor:not-allowed;" />
          <span class="field-error" style="color:var(--text-muted);font-size:10px;">Email cannot be changed</span>
        </div>
        <div class="auth-field">
          <label>Member since</label>
          <input class="auth-input" type="text" value="${new Date(currentUser.createdAt).toLocaleDateString()}" disabled style="opacity:0.6;cursor:not-allowed;" />
        </div>
        <div id="account-message" style="min-height:20px;"></div>
        <button type="submit" class="auth-submit" style="max-width:200px;">Save Changes</button>
      </form>
    `;

    tabContent.querySelector('#account-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msgEl = tabContent.querySelector('#account-message');
      const username = tabContent.querySelector('#profile-username').value.trim();

      try {
        await updateProfile({ username });
        msgEl.innerHTML = '<span style="color:var(--success);font-size:var(--text-sm);">✓ Profile updated</span>';
      } catch (err) {
        msgEl.innerHTML = `<span style="color:var(--error);font-size:var(--text-sm);">${esc(err.message)}</span>`;
      }
    });
  }

  function renderPasswordTab() {
    tabContent.innerHTML = `
      <form class="profile-form" id="password-form">
        <div class="auth-field">
          <label>Current password</label>
          <input class="auth-input" type="password" id="current-pw" placeholder="Enter current password" required />
        </div>
        <div class="auth-field">
          <label>New password</label>
          <input class="auth-input" type="password" id="new-pw" placeholder="At least 6 characters" required />
        </div>
        <div class="auth-field">
          <label>Confirm new password</label>
          <input class="auth-input" type="password" id="confirm-pw" placeholder="Re-enter new password" required />
        </div>
        <div id="password-message" style="min-height:20px;"></div>
        <button type="submit" class="auth-submit" style="max-width:200px;">Change Password</button>
      </form>
    `;

    tabContent.querySelector('#password-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msgEl = tabContent.querySelector('#password-message');
      const currentPw = tabContent.querySelector('#current-pw').value;
      const newPw = tabContent.querySelector('#new-pw').value;
      const confirmPw = tabContent.querySelector('#confirm-pw').value;

      if (newPw.length < 6) {
        msgEl.innerHTML = '<span style="color:var(--error);font-size:var(--text-sm);">New password must be at least 6 characters</span>';
        return;
      }
      if (newPw !== confirmPw) {
        msgEl.innerHTML = '<span style="color:var(--error);font-size:var(--text-sm);">Passwords do not match</span>';
        return;
      }

      try {
        await changePassword(currentPw, newPw);
        msgEl.innerHTML = '<span style="color:var(--success);font-size:var(--text-sm);">✓ Password changed successfully</span>';
        tabContent.querySelector('#current-pw').value = '';
        tabContent.querySelector('#new-pw').value = '';
        tabContent.querySelector('#confirm-pw').value = '';
      } catch (err) {
        msgEl.innerHTML = `<span style="color:var(--error);font-size:var(--text-sm);">${esc(err.message)}</span>`;
      }
    });
  }

  function renderPreferencesTab() {
    const currentUser = getCurrentUser();
    const prefs = currentUser.preferences || {};

    tabContent.innerHTML = `
      <form class="profile-form" id="prefs-form">
        <div class="auth-field">
          <label>Default HTTP Method</label>
          <select class="auth-input" id="pref-method">
            ${['GET','POST','PUT','DELETE','PATCH','OPTIONS','HEAD'].map(m =>
              `<option value="${m}" ${prefs.defaultMethod === m ? 'selected' : ''}>${m}</option>`
            ).join('')}
          </select>
        </div>
        <div class="auth-field">
          <label>Request Timeout (ms)</label>
          <input class="auth-input" type="number" id="pref-timeout" value="${prefs.requestTimeout || 15000}" min="1000" max="120000" />
        </div>
        <div class="auth-field">
          <label>History Retention (max entries)</label>
          <input class="auth-input" type="number" id="pref-retention" value="${prefs.historyRetention || 200}" min="10" max="1000" />
        </div>
        <div id="prefs-message" style="min-height:20px;"></div>
        <button type="submit" class="auth-submit" style="max-width:200px;">Save Preferences</button>
      </form>
    `;

    tabContent.querySelector('#prefs-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msgEl = tabContent.querySelector('#prefs-message');

      try {
        await updateProfile({
          preferences: {
            defaultMethod: tabContent.querySelector('#pref-method').value,
            requestTimeout: parseInt(tabContent.querySelector('#pref-timeout').value),
            historyRetention: parseInt(tabContent.querySelector('#pref-retention').value)
          }
        });
        msgEl.innerHTML = '<span style="color:var(--success);font-size:var(--text-sm);">✓ Preferences saved</span>';
      } catch (err) {
        msgEl.innerHTML = `<span style="color:var(--error);font-size:var(--text-sm);">${esc(err.message)}</span>`;
      }
    });
  }

  renderTab();
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
