/* ============================================
   APILens — Request History Management Page
   ============================================ */

import { fetchHistoryLogs, deleteHistoryItem, clearAllHistory, rerunRequestLog } from '../services/history-api.js';
import { getHistory as getLocalHistory, clearHistory as clearLocalHistory } from '../services/storage.js';
import { isAuthenticated } from '../services/auth.js';

/**
 * Render History page into container
 * @param {HTMLElement} container
 * @param {Object} options - { onLoadRequest }
 */
export function renderHistoryPage(container, options = {}) {
  container.className = 'history-page animate-fade-in';
  container.style.cssText = 'padding:var(--space-6);overflow-y:auto;height:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:var(--space-6);';

  let currentPage = 1;
  const pageSize = 15;
  let searchQuery = '';
  let selectedMethod = 'ALL';
  let selectedStatus = 'ALL';

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-4);">
      <div>
        <h1 style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:var(--text);margin:0 0 4px 0;">
          📜 Request History Log
        </h1>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:0;">
          Search, view, re-run, or delete your API request execution history.
        </p>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-clear-history" style="color:var(--error);border-color:rgba(239,68,68,0.25);">
        🗑️ Clear All History
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="card-glass" style="padding:var(--space-4);display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center;">
      <div style="position:relative;flex:1;min-width:200px;">
        <input type="text" id="hist-search" class="input" placeholder="Filter URL or path..." style="width:100%;padding-left:32px;" value="${searchQuery}" />
        <svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>

      <select class="input" id="hist-method" style="max-width:140px;">
        <option value="ALL">All Methods</option>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>
      </select>

      <select class="input" id="hist-status" style="max-width:140px;">
        <option value="ALL">All Statuses</option>
        <option value="2xx">2xx (Success)</option>
        <option value="3xx">3xx (Redirect)</option>
        <option value="4xx">4xx (Client Error)</option>
        <option value="5xx">5xx (Server Error)</option>
      </select>
    </div>

    <!-- History Table -->
    <div class="card-glass" style="padding:0;overflow:hidden;">
      <table class="logs-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Method</th>
            <th>URL / Endpoint</th>
            <th style="text-align:center;">Status</th>
            <th style="text-align:right;">Latency</th>
            <th style="text-align:center;width:120px;">Actions</th>
          </tr>
        </thead>
        <tbody id="hist-tbody">
          <tr><td colspan="6" style="padding:var(--space-6);text-align:center;color:var(--text-muted);">Loading history...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div style="display:flex;align-items:center;justify-space-between;color:var(--text-secondary);font-size:var(--text-xs);">
      <div id="hist-page-info">Showing logs</div>
      <div style="display:flex;gap:var(--space-2);">
        <button class="btn btn-secondary btn-sm" id="btn-page-prev" disabled>&larr; Prev</button>
        <button class="btn btn-secondary btn-sm" id="btn-page-next" disabled>Next &rarr;</button>
      </div>
    </div>
  `;

  const tbody = container.querySelector('#hist-tbody');
  const searchInput = container.querySelector('#hist-search');
  const methodSelect = container.querySelector('#hist-method');
  const statusSelect = container.querySelector('#hist-status');
  const btnClear = container.querySelector('#btn-clear-history');
  const btnPrev = container.querySelector('#btn-page-prev');
  const btnNext = container.querySelector('#btn-page-next');
  const pageInfo = container.querySelector('#hist-page-info');

  let debounceTimeout = null;

  async function loadData() {
    try {
      if (isAuthenticated()) {
        const data = await fetchHistoryLogs({
          page: currentPage,
          limit: pageSize,
          search: searchQuery,
          method: selectedMethod,
          status: selectedStatus
        });
        renderRows(data.logs || [], data.totalCount || 0, data.totalPages || 1);
      } else {
        // Guest mode fallback to localStorage
        const local = getLocalHistory();
        const filtered = local.filter(l => {
          if (searchQuery && !l.url.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          if (selectedMethod !== 'ALL' && l.method !== selectedMethod) return false;
          return true;
        });
        renderRows(filtered, filtered.length, 1);
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--error);padding:var(--space-4);text-align:center;">Failed to load history: ${esc(err.message)}</td></tr>`;
    }
  }

  function renderRows(logs, totalCount, totalPages) {
    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding:var(--space-8);text-align:center;color:var(--text-muted);">No request history entries found matching filters.</td></tr>`;
      pageInfo.textContent = '0 entries';
      btnPrev.disabled = true;
      btnNext.disabled = true;
      return;
    }

    pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalCount} total logs)`;
    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= totalPages;

    tbody.innerHTML = logs.map(item => {
      const id = item._id || item.id;
      const timeStr = new Date(item.timestamp).toLocaleString();
      const statusClass = item.status >= 200 && item.status < 400 ? 'status-2xx' : (item.status >= 400 && item.status < 500 ? 'status-4xx' : 'status-5xx');

      return `
        <tr>
          <td style="font-size:var(--text-xs);color:var(--text-secondary);white-space:nowrap;">${timeStr}</td>
          <td><span class="method-badge ${item.method.toLowerCase()}">${item.method}</span></td>
          <td style="font-family:var(--font-mono);font-size:var(--text-xs);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(item.url)}">
            ${esc(item.url)}
          </td>
          <td style="text-align:center;"><span class="status-code ${statusClass}">${item.status || 'ERR'}</span></td>
          <td style="text-align:right;font-size:var(--text-xs);color:var(--text-secondary);">${item.duration}ms</td>
          <td style="text-align:center;">
            <div style="display:flex;gap:var(--space-1);justify-content:center;">
              <button class="btn btn-ghost btn-sm btn-load" data-id="${id}" data-item="${esc(JSON.stringify(item))}" style="padding:2px 6px;" title="Load in Request Panel">⚡ Load</button>
              ${isAuthenticated() ? `<button class="btn btn-ghost btn-sm btn-del" data-id="${id}" style="color:var(--error);padding:2px 6px;" title="Delete Entry">🗑️</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row button events
    tbody.querySelectorAll('.btn-load').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = JSON.parse(btn.dataset.item);
        options.onLoadRequest?.({
          method: item.method,
          url: item.url,
          headers: Object.entries(item.requestHeaders || {}).map(([k, v]) => ({ key: k, value: v, enabled: true })),
          params: Object.entries(item.queryParams || {}).map(([k, v]) => ({ key: k, value: v, enabled: true })),
          body: typeof item.requestBody === 'object' ? JSON.stringify(item.requestBody, null, 2) : (item.requestBody || '')
        });
      });
    });

    tbody.querySelectorAll('.btn-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Delete this history log entry?')) {
          try {
            await deleteHistoryItem(btn.dataset.id);
            loadData();
          } catch (err) { alert(err.message); }
        }
      });
    });
  }

  // Filter event listeners
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(loadData, 300);
  });

  methodSelect.addEventListener('change', (e) => {
    selectedMethod = e.target.value;
    currentPage = 1;
    loadData();
  });

  statusSelect.addEventListener('change', (e) => {
    selectedStatus = e.target.value;
    currentPage = 1;
    loadData();
  });

  btnPrev.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; loadData(); }
  });

  btnNext.addEventListener('click', () => {
    currentPage++; loadData();
  });

  btnClear.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear ALL request history? This action cannot be undone.')) {
      try {
        if (isAuthenticated()) {
          await clearAllHistory();
        } else {
          clearLocalHistory();
        }
        currentPage = 1;
        loadData();
      } catch (err) { alert(err.message); }
    }
  });

  loadData();
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
