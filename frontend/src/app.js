/* ============================================
   APILens — App Orchestrator
   ============================================ */

import { renderSidebar } from './components/sidebar.js';
import { renderRequestPanel } from './components/request-panel.js';
import { renderResponsePanel } from './components/response-panel.js';
import { renderAnalytics } from './components/analytics.js';
import { renderAiPanel } from './components/ai-panel.js';
import { renderCodeGenerator } from './components/code-generator.js';
import { renderCollaboration } from './components/collaboration.js';
import { renderUserMenu } from './components/user-menu.js';
import { openProfileModal } from './components/profile-modal.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderCollectionsPage } from './pages/collections.js';
import { renderHistoryPage } from './pages/history.js';
import { sendRequest } from './services/http-client.js';
import { openSaveRequestModal } from './components/save-request-modal.js';
import { isAuthenticated } from './services/auth.js';

/**
 * Initialize the main workspace application.
 * @param {HTMLElement} container
 * @param {Function} onGoHome - callback to return to landing
 * @param {Function} navigate - hash router navigate function
 */
export function initApp(root, onGoHome, navigate) {
  // Request state
  const state = {
    name: '',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    params: [{ key: '', value: '', enabled: true }],
    headers: [
      { key: 'Accept', value: 'application/json', enabled: true },
      { key: '', value: '', enabled: true },
    ],
    auth: { type: 'none' },
    body: '{\n  \n}',
    preScript: '',
    testScript: '',
    _reqTab: 'Params',
  };

  let currentResponse = null;
  let isLoading = false;
  let currentView = isAuthenticated() ? 'dashboard' : 'request'; // Default to dashboard if logged in, else request builder

  // Build layout
  root.innerHTML = `
    <div class="workspace">
      <!-- Header -->
      <header class="app-header">
        <div class="app-header-left">
          <div class="app-header-logo" id="app-logo">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#applogo)"/>
              <path d="M10 22L16 10L22 22" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="16" cy="18" r="2" fill="white"/>
              <defs><linearGradient id="applogo" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>
            </svg>
            <span>APILens</span>
          </div>
          <div style="display:flex;align-items:center;gap:2px;margin-left:var(--space-4);overflow-x:auto;">
            ${isAuthenticated() ? `
              <button class="btn btn-ghost btn-sm view-btn" data-view="dashboard">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Dashboard
              </button>
            ` : ''}
            <button class="btn btn-ghost btn-sm view-btn active" data-view="request">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Request
            </button>
            <button class="btn btn-ghost btn-sm view-btn" data-view="collections">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              Collections
            </button>
            <button class="btn btn-ghost btn-sm view-btn" data-view="history">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              History
            </button>
            <button class="btn btn-ghost btn-sm view-btn" data-view="analytics">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Analytics
            </button>
            <button class="btn btn-ghost btn-sm view-btn" data-view="codegen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Code
            </button>
          </div>
        </div>
        <div class="app-header-right">
          <button class="btn btn-ghost btn-sm" id="btn-collab" title="Collaboration">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Share
          </button>
          <button class="btn btn-ghost btn-sm" id="btn-ai" title="AI Analysis">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/><circle cx="12" cy="15" r="1"/></svg>
            AI
          </button>
          <div style="width:1px;height:20px;background:var(--border);margin:0 var(--space-2);"></div>
          <div id="user-menu-container"></div>
        </div>
      </header>

      <!-- Sidebar -->
      <aside id="app-sidebar"></aside>

      <!-- Main content -->
      <main class="main-content" id="app-main">
        <!-- Request bar -->
        <div class="request-bar" id="request-bar">
          <select class="method-select ${state.method.toLowerCase()}" id="method-select">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input class="request-url" id="url-input" type="text" placeholder="Enter request URL" value="${state.url}" />
          <button class="btn btn-secondary btn-sm" id="save-req-btn" style="height:36px;padding:0 14px;gap:6px;font-size:var(--text-sm);" title="Save request to collection">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save
          </button>
          <button class="btn-send" id="send-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send
          </button>
        </div>

        <!-- Dynamic view area -->
        <div id="view-area" style="flex:1;overflow:hidden;display:flex;flex-direction:column;"></div>
      </main>
    </div>

    <!-- AI Panel (fixed, slide-out) -->
    <div id="ai-panel-container"></div>

    <!-- Collab modal container -->
    <div id="collab-container"></div>

    <!-- Toast container -->
    <div class="toast-container" id="toast-container"></div>
  `;

  // References
  const sidebarEl = root.querySelector('#app-sidebar');
  const viewArea = root.querySelector('#view-area');
  const methodSelect = root.querySelector('#method-select');
  const urlInput = root.querySelector('#url-input');
  const sendBtn = root.querySelector('#send-btn');
  const aiPanelContainer = root.querySelector('#ai-panel-container');
  const collabContainer = root.querySelector('#collab-container');
  const requestBar = root.querySelector('#request-bar');
  const userMenuContainer = root.querySelector('#user-menu-container');

  // Render User Menu
  renderUserMenu(userMenuContainer, navigate, {
    onProfileOpen: () => openProfileModal(root)
  });

  // Load Request Helper
  const loadRequest = (req) => {
    state.method = req.method || 'GET';
    state.url = req.url || '';
    if (req.headers) state.headers = req.headers;
    if (req.params) state.params = req.params;
    if (req.body) state.body = req.body;
    methodSelect.value = state.method;
    methodSelect.className = `method-select ${state.method.toLowerCase()}`;
    urlInput.value = state.url;
    switchView('request');
  };

  // Init sidebar
  renderSidebar(sidebarEl, {
    onSelectRequest: loadRequest,
    onNewRequest: () => {
      state.method = 'GET';
      state.url = '';
      methodSelect.value = 'GET';
      methodSelect.className = 'method-select get';
      urlInput.value = '';
      currentResponse = null;
      switchView('request');
    },
  });

  // Init AI panel
  renderAiPanel(aiPanelContainer, null, state, { onLoadRequest: loadRequest });

  // Method select
  methodSelect.addEventListener('change', () => {
    state.method = methodSelect.value;
    methodSelect.className = `method-select ${state.method.toLowerCase()}`;
  });

  // URL input
  urlInput.addEventListener('input', () => {
    state.url = urlInput.value;
  });

  // Ctrl+Enter to send
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      doSend();
    }
  });

  // Save button
  const saveReqBtn = root.querySelector('#save-req-btn');
  saveReqBtn.addEventListener('click', () => {
    openSaveRequestModal(root, state, {
      onSaved: (savedInfo) => {
        showToast('success', `Saved "${savedInfo.name}" to collection!`);
        // Refresh sidebar collections immediately
        renderSidebar(sidebarEl, {
          onSelectRequest: loadRequest,
          onNewRequest: () => {
            state.name = '';
            state.method = 'GET';
            state.url = '';
            methodSelect.value = 'GET';
            methodSelect.className = 'method-select get';
            urlInput.value = '';
            currentResponse = null;
            switchView('request');
          },
        });
      }
    });
  });

  // Send button
  sendBtn.addEventListener('click', doSend);

  async function doSend() {
    if (isLoading || !state.url) return;

    isLoading = true;
    sendBtn.innerHTML = '<div class="spinner"></div> Sending…';
    sendBtn.classList.add('loading');

    try {
      currentResponse = await sendRequest({
        method: state.method,
        url: state.url,
        headers: state.headers,
        params: state.params,
        body: state.body,
        auth: state.auth,
      });

      // Update response panel if on request view
      if (currentView === 'request') {
        renderRequestView();
      }

      // Update AI panel
      renderAiPanel(aiPanelContainer, currentResponse, state, { onLoadRequest: loadRequest });

      // Re-render sidebar (history updated)
      renderSidebar(sidebarEl, {
        onSelectRequest: loadRequest,
        onNewRequest: () => {
          state.method = 'GET';
          state.url = '';
          methodSelect.value = 'GET';
          methodSelect.className = 'method-select get';
          urlInput.value = '';
          currentResponse = null;
          switchView('request');
        },
      });

      // Show toast
      showToast(
        currentResponse.status >= 200 && currentResponse.status < 400 ? 'success' : 'error',
        `${state.method} ${currentResponse.status} — ${currentResponse.duration}ms`
      );

    } catch (err) {
      showToast('error', `Request failed: ${err.message}`);
    } finally {
      isLoading = false;
      sendBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Send
      `;
      sendBtn.classList.remove('loading');
    }
  }

  // View switching
  root.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.view);
    });
  });

  function switchView(view) {
    currentView = view;
    root.querySelectorAll('.view-btn').forEach(el => el.classList.remove('active'));
    root.querySelector(`.view-btn[data-view="${view}"]`)?.classList.add('active');

    // Show/hide request bar
    requestBar.style.display = view === 'request' ? 'flex' : 'none';

    if (view === 'dashboard') {
      renderDashboard(viewArea, {
        onSwitchView: switchView,
        onNewRequest: () => switchView('request')
      });
    } else if (view === 'request') {
      renderRequestView();
    } else if (view === 'collections') {
      renderCollectionsPage(viewArea, {
        onLoadRequest: loadRequest
      });
    } else if (view === 'history') {
      renderHistoryPage(viewArea, {
        onLoadRequest: loadRequest
      });
    } else if (view === 'analytics') {
      renderAnalytics(viewArea);
    } else if (view === 'codegen') {
      renderCodeGenerator(viewArea, state);
    }
  }

  function renderRequestView() {
    viewArea.innerHTML = '';
    const panels = document.createElement('div');
    panels.className = 'panels horizontal';

    const reqPanel = document.createElement('div');
    const resPanel = document.createElement('div');

    panels.appendChild(reqPanel);
    panels.appendChild(resPanel);
    viewArea.appendChild(panels);

    renderRequestPanel(reqPanel, state);
    renderResponsePanel(resPanel, currentResponse);
  }

  // AI button with strict Auth Guard
  root.querySelector('#btn-ai').addEventListener('click', () => {
    if (!isAuthenticated()) {
      showToast('error', 'Authentication Required: Please sign in to use AI Assistant features.');
      navigate('login');
      return;
    }
    aiPanelContainer.classList.toggle('open');
  });

  // Collaboration button
  root.querySelector('#btn-collab').addEventListener('click', () => {
    renderCollaboration(collabContainer, state);
  });

  // Logo click -> home
  root.querySelector('#app-logo').addEventListener('click', onGoHome);

  // Toast helper
  function showToast(type, message) {
    const container = root.querySelector('#toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="btn-icon" style="margin-left:auto;padding:2px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    toast.querySelector('button').addEventListener('click', () => toast.remove());
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // Initialize default view
  switchView(currentView);
}
