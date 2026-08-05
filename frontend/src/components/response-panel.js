/* ============================================
   APILens — Response Panel Component
   ============================================ */

import { renderJsonViewer } from './json-viewer.js';

/**
 * Render the response panel.
 * @param {HTMLElement} container
 * @param {Object|null} response - response data from http-client
 */
export function renderResponsePanel(container, response) {
  container.innerHTML = '';
  container.className = 'response-panel';

  if (!response) {
    container.innerHTML = `
      <div class="empty-state" style="flex:1;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.3;">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        <p style="font-size:var(--text-md);color:var(--text-muted);">Send a request to see the response</p>
        <p style="font-size:var(--text-sm);color:var(--text-dim);">Click the Send button or press Ctrl+Enter</p>
      </div>
    `;
    return;
  }

  // Status bar
  const statusBar = document.createElement('div');
  statusBar.className = 'response-status-bar animate-fade-in';

  const statusClass = getStatusClass(response.status);
  statusBar.innerHTML = `
    <div class="response-stat">
      Status: <span class="status-code ${statusClass}">${response.status} ${response.statusText}</span>
    </div>
    <div class="response-stat">
      Time: <strong>${response.duration}ms</strong>
    </div>
    <div class="response-stat">
      Size: <strong>${formatSize(response.size)}</strong>
    </div>
  `;
  container.appendChild(statusBar);

  // Tabs
  const tabs = ['Body', 'Headers', 'Cookies', 'Logs'];
  let activeTab = 'Body';

  const tabBar = document.createElement('div');
  tabBar.className = 'tabs';
  tabs.forEach(t => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (t === activeTab ? ' active' : '');
    tab.textContent = t;
    if (t === 'Headers') tab.textContent += ` (${response.headers.length})`;
    if (t === 'Cookies') tab.textContent += ` (${response.cookies.length})`;
    tab.addEventListener('click', () => {
      activeTab = t;
      renderTabContent();
      tabBar.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
      tab.classList.add('active');
    });
    tabBar.appendChild(tab);
  });
  container.appendChild(tabBar);

  // Content
  const content = document.createElement('div');
  content.className = 'tab-content animate-fade-in';
  container.appendChild(content);

  let searchTerm = '';

  function renderTabContent() {
    content.innerHTML = '';

    if (activeTab === 'Body') {
      // Search bar
      if (response.body && typeof response.body === 'object') {
        const searchBar = document.createElement('div');
        searchBar.className = 'json-search';
        searchBar.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search in response…" value="${searchTerm}" />
        `;
        searchBar.querySelector('input').addEventListener('input', e => {
          searchTerm = e.target.value;
          renderBody();
        });
        content.appendChild(searchBar);
      }
      renderBody();
    }

    else if (activeTab === 'Headers') {
      const table = document.createElement('div');
      table.style.cssText = 'font-size:var(--text-sm);';
      if (response.headers.length === 0) {
        table.innerHTML = '<p style="color:var(--text-muted);padding:var(--space-4);">No headers</p>';
      } else {
        response.headers.forEach(h => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;padding:var(--space-2) 0;border-bottom:1px solid var(--border);gap:var(--space-4);';
          row.innerHTML = `
            <span style="color:var(--info);font-family:var(--font-mono);min-width:200px;font-weight:500;">${esc(h.key)}</span>
            <span style="color:var(--text-secondary);font-family:var(--font-mono);word-break:break-all;">${esc(h.value)}</span>
          `;
          table.appendChild(row);
        });
      }
      content.appendChild(table);
    }

    else if (activeTab === 'Cookies') {
      if (response.cookies.length === 0) {
        content.innerHTML = '<p style="color:var(--text-muted);padding:var(--space-4);font-size:var(--text-sm);">No cookies in response</p>';
      } else {
        response.cookies.forEach(c => {
          const el = document.createElement('div');
          el.style.cssText = 'padding:var(--space-3);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:var(--space-2);font-size:var(--text-sm);';
          el.innerHTML = `
            <div style="font-weight:600;color:var(--text);margin-bottom:4px;">${esc(c.name)}</div>
            <div style="color:var(--text-secondary);font-family:var(--font-mono);font-size:var(--text-xs);">${esc(c.value)}</div>
          `;
          content.appendChild(el);
        });
      }
    }

    else if (activeTab === 'Logs') {
      const logEl = document.createElement('div');
      logEl.style.cssText = 'font-family:var(--font-mono);font-size:var(--text-sm);color:var(--text-secondary);';

      const logs = [];
      if (response.error) {
        logs.push({ type: 'error', msg: `Error: ${response.error}` });
      }
      logs.push({ type: 'info', msg: `${response.status ? 'HTTP' : 'Failed'} ${response.status} — ${response.duration}ms` });
      if (response.size > 0) {
        logs.push({ type: 'info', msg: `Response size: ${formatSize(response.size)}` });
      }

      logs.forEach(log => {
        const line = document.createElement('div');
        line.style.cssText = `padding:var(--space-1) 0;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:var(--space-2);`;
        const color = log.type === 'error' ? 'var(--error)' : log.type === 'warn' ? 'var(--warning)' : 'var(--text-muted)';
        line.innerHTML = `<span style="color:${color};font-size:10px;">●</span> <span>${esc(log.msg)}</span>`;
        logEl.appendChild(line);
      });

      content.appendChild(logEl);
    }
  }

  function renderBody() {
    // Remove old viewer if present
    const existing = content.querySelector('.json-viewer, .raw-body');
    if (existing) existing.remove();

    if (response.body && typeof response.body === 'object') {
      const viewerEl = document.createElement('div');
      content.appendChild(viewerEl);
      renderJsonViewer(viewerEl, response.body, { searchTerm });
    } else {
      const pre = document.createElement('pre');
      pre.className = 'raw-body';
      pre.style.cssText = 'font-family:var(--font-mono);font-size:var(--text-sm);color:var(--text-secondary);white-space:pre-wrap;word-break:break-all;';
      pre.textContent = response.bodyText || '(empty response)';
      content.appendChild(pre);
    }
  }

  renderTabContent();
}

function getStatusClass(status) {
  if (status >= 200 && status < 300) return 'status-2xx';
  if (status >= 300 && status < 400) return 'status-3xx';
  if (status >= 400 && status < 500) return 'status-4xx';
  return 'status-5xx';
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
