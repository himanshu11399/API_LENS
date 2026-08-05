/* ============================================
   APILens — Request Panel Component
   ============================================ */

import { renderKeyValueEditor } from './key-value-editor.js';
import { createJsonEditor } from './json-editor.js';

/**
 * Render the request panel.
 * @param {HTMLElement} container
 * @param {Object} state - app state reference
 * @param {Object} handlers - { onSend }
 */
export function renderRequestPanel(container, state, handlers = {}) {
  container.innerHTML = '';
  container.className = 'request-panel';

  // Tabs
  const tabs = ['Params', 'Headers', 'Authorization', 'Body', 'Scripts'];
  let activeTab = state._reqTab || 'Params';

  const tabBar = document.createElement('div');
  tabBar.className = 'tabs';
  tabs.forEach(t => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (t === activeTab ? ' active' : '');
    tab.textContent = t;
    tab.addEventListener('click', () => {
      activeTab = t;
      state._reqTab = t;
      renderTabContent();
      tabBar.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
      tab.classList.add('active');
    });
    tabBar.appendChild(tab);
  });
  container.appendChild(tabBar);

  // Tab content area
  const content = document.createElement('div');
  content.className = 'tab-content';
  container.appendChild(content);

  let editorInstance = null;

  function renderTabContent() {
    // Destroy old editor if any
    if (editorInstance) {
      editorInstance.destroy();
      editorInstance = null;
    }
    content.innerHTML = '';

    if (activeTab === 'Params') {
      renderKeyValueEditor(content, state.params, {
        onChange: rows => { state.params = rows; },
        keyPlaceholder: 'Parameter',
        valuePlaceholder: 'Value',
      });
    }

    else if (activeTab === 'Headers') {
      renderKeyValueEditor(content, state.headers, {
        onChange: rows => { state.headers = rows; },
        keyPlaceholder: 'Header Name',
        valuePlaceholder: 'Header Value',
      });
    }

    else if (activeTab === 'Authorization') {
      renderAuthTab(content, state);
    }

    else if (activeTab === 'Body') {
      renderBodyTab(content, state);
    }

    else if (activeTab === 'Scripts') {
      renderScriptsTab(content, state);
    }
  }

  function renderAuthTab(el, state) {
    const auth = state.auth || { type: 'none' };
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        <div>
          <label style="font-size:var(--text-sm);color:var(--text-secondary);display:block;margin-bottom:var(--space-2);">Authorization Type</label>
          <select id="auth-type" class="input" style="max-width:260px;">
            <option value="none" ${auth.type === 'none' ? 'selected' : ''}>No Auth</option>
            <option value="bearer" ${auth.type === 'bearer' ? 'selected' : ''}>Bearer Token</option>
            <option value="basic" ${auth.type === 'basic' ? 'selected' : ''}>Basic Auth</option>
            <option value="apikey" ${auth.type === 'apikey' ? 'selected' : ''}>API Key</option>
          </select>
        </div>
        <div id="auth-fields"></div>
      </div>
    `;

    const typeSelect = el.querySelector('#auth-type');
    const fieldsContainer = el.querySelector('#auth-fields');

    function updateFields() {
      const t = typeSelect.value;
      state.auth = { ...auth, type: t };
      fieldsContainer.innerHTML = '';

      if (t === 'bearer') {
        fieldsContainer.innerHTML = `
          <label style="font-size:var(--text-sm);color:var(--text-secondary);display:block;margin-bottom:var(--space-2);">Token</label>
          <input id="auth-token" class="input mono" style="font-size:var(--text-sm);" placeholder="Enter bearer token" value="${esc(auth.token || '')}" />
        `;
        fieldsContainer.querySelector('#auth-token').addEventListener('input', e => {
          state.auth.token = e.target.value;
        });
      }
      else if (t === 'basic') {
        fieldsContainer.innerHTML = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
            <div>
              <label style="font-size:var(--text-sm);color:var(--text-secondary);display:block;margin-bottom:var(--space-2);">Username</label>
              <input id="auth-user" class="input" placeholder="Username" value="${esc(auth.username || '')}" />
            </div>
            <div>
              <label style="font-size:var(--text-sm);color:var(--text-secondary);display:block;margin-bottom:var(--space-2);">Password</label>
              <input id="auth-pass" class="input" type="password" placeholder="Password" value="${esc(auth.password || '')}" />
            </div>
          </div>
        `;
        fieldsContainer.querySelector('#auth-user').addEventListener('input', e => { state.auth.username = e.target.value; });
        fieldsContainer.querySelector('#auth-pass').addEventListener('input', e => { state.auth.password = e.target.value; });
      }
      else if (t === 'apikey') {
        fieldsContainer.innerHTML = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
            <div>
              <label style="font-size:var(--text-sm);color:var(--text-secondary);display:block;margin-bottom:var(--space-2);">Key Name</label>
              <input id="auth-keyname" class="input" placeholder="X-API-Key" value="${esc(auth.headerName || 'X-API-Key')}" />
            </div>
            <div>
              <label style="font-size:var(--text-sm);color:var(--text-secondary);display:block;margin-bottom:var(--space-2);">Value</label>
              <input id="auth-keyval" class="input mono" style="font-size:var(--text-sm);" placeholder="API Key" value="${esc(auth.apiKey || '')}" />
            </div>
          </div>
          <div style="margin-top:var(--space-2);">
            <label style="font-size:var(--text-sm);color:var(--text-secondary);">Add to:
              <select id="auth-addto" class="input" style="max-width:160px;display:inline-block;margin-left:var(--space-2);">
                <option value="header" ${auth.addTo !== 'query' ? 'selected' : ''}>Header</option>
                <option value="query" ${auth.addTo === 'query' ? 'selected' : ''}>Query Params</option>
              </select>
            </label>
          </div>
        `;
        fieldsContainer.querySelector('#auth-keyname')?.addEventListener('input', e => { state.auth.headerName = e.target.value; });
        fieldsContainer.querySelector('#auth-keyval')?.addEventListener('input', e => { state.auth.apiKey = e.target.value; });
        fieldsContainer.querySelector('#auth-addto')?.addEventListener('change', e => { state.auth.addTo = e.target.value; });
      }
    }

    typeSelect.addEventListener('change', updateFields);
    updateFields();
  }

  function renderBodyTab(el, state) {
    // Format button
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3);';
    toolbar.innerHTML = `
      <span style="font-size:var(--text-sm);color:var(--text-muted);">JSON Body</span>
    `;
    const fmtBtn = document.createElement('button');
    fmtBtn.className = 'btn btn-ghost btn-sm';
    fmtBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> Format`;
    toolbar.appendChild(fmtBtn);
    el.appendChild(toolbar);

    const editorEl = document.createElement('div');
    editorEl.style.cssText = 'border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;min-height:200px;';
    el.appendChild(editorEl);

    const defaultBody = state.body || '{\n  \n}';
    editorInstance = createJsonEditor(editorEl, defaultBody, {
      onChange: text => { state.body = text; }
    });

    fmtBtn.addEventListener('click', () => editorInstance.formatJSON());
  }

  function renderScriptsTab(el, state) {
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        <div>
          <label style="font-size:var(--text-sm);color:var(--text-secondary);display:block;margin-bottom:var(--space-2);">Pre-request Script</label>
          <textarea class="input mono" style="min-height:100px;resize:vertical;font-size:var(--text-sm);line-height:1.5;" placeholder="// Run before sending request&#10;console.log('Pre-request');">${esc(state.preScript || '')}</textarea>
        </div>
        <div>
          <label style="font-size:var(--text-sm);color:var(--text-secondary);display:block;margin-bottom:var(--space-2);">Test Script</label>
          <textarea class="input mono" style="min-height:100px;resize:vertical;font-size:var(--text-sm);line-height:1.5;" placeholder="// Run after receiving response&#10;// pm.test('Status is 200', () => pm.response.status === 200);">${esc(state.testScript || '')}</textarea>
        </div>
      </div>
    `;
    const textareas = el.querySelectorAll('textarea');
    textareas[0].addEventListener('input', e => { state.preScript = e.target.value; });
    textareas[1].addEventListener('input', e => { state.testScript = e.target.value; });
  }

  renderTabContent();
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
