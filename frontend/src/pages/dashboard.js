/* ============================================
   APILens — Dashboard Page
   Overview dashboard for logged-in users
   ============================================ */

import { getCurrentUser } from '../services/auth.js';
import { API_BASE_URL } from '../config/api.js';

const BACKEND_URL = API_BASE_URL;

/**
 * Render user dashboard view into target element
 * @param {HTMLElement} container
 * @param {Object} options - { onSwitchView, onNewRequest }
 */
export function renderDashboard(container, options = {}) {
  const user = getCurrentUser();
  container.className = 'dashboard-view animate-fade-in';
  container.style.cssText = 'padding:var(--space-6);overflow-y:auto;height:100%;display:flex;flex-direction:column;gap:var(--space-6);box-sizing:border-box;';

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-4);">
      <div>
        <h1 style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:var(--text);margin:0 0 4px 0;">
          Welcome back, ${esc(user ? user.username : 'Developer')}! 👋
        </h1>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:0;">
          Here is an overview of your API workspace activity and analytics.
        </p>
      </div>
      <div style="display:flex;gap:var(--space-3);">
        <button class="btn btn-primary btn-sm" id="dash-btn-new">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Request
        </button>
        <button class="btn btn-secondary btn-sm" id="dash-btn-analytics">
          📊 Full Analytics
        </button>
      </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="metrics-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-4);">
      <div class="metric-card card-glass" style="padding:var(--space-4);">
        <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:4px;">Total Requests</div>
        <div style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:var(--text);" id="stat-total-reqs">—</div>
      </div>
      <div class="metric-card card-glass" style="padding:var(--space-4);">
        <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:4px;">Avg Response Time</div>
        <div style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:var(--primary-neon);" id="stat-avg-time">—</div>
      </div>
      <div class="metric-card card-glass" style="padding:var(--space-4);">
        <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:4px;">Success Rate</div>
        <div style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:var(--success);" id="stat-success-rate">—</div>
      </div>
      <div class="metric-card card-glass" style="padding:var(--space-4);">
        <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:4px;">Total Collections</div>
        <div style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:var(--accent-purple);" id="stat-collections">—</div>
      </div>
    </div>

    <!-- Dashboard Content Layout -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--space-6);">
      <!-- Left Column: Recent Activity Feed -->
      <div class="card-glass" style="padding:var(--space-5);display:flex;flex-direction:column;gap:var(--space-4);">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <h3 style="font-size:var(--text-md);font-weight:var(--weight-semibold);color:var(--text);margin:0;">
            🕒 Recent Activity
          </h3>
          <button class="btn btn-ghost btn-sm" id="dash-view-all-history" style="font-size:var(--text-xs);">View All</button>
        </div>
        <div id="dash-history-list" style="display:flex;flex-direction:column;gap:var(--space-2);">
          <div style="color:var(--text-muted);font-size:var(--text-sm);padding:var(--space-4);text-align:center;">Loading activity...</div>
        </div>
      </div>

      <!-- Right Column: Quick Start & System Info -->
      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        <div class="card-glass" style="padding:var(--space-5);">
          <h3 style="font-size:var(--text-md);font-weight:var(--weight-semibold);color:var(--text);margin:0 0 var(--space-3) 0;">
            🚀 Quick Shortcuts
          </h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-2);">
            <button class="btn btn-secondary btn-sm" id="shortcut-history" style="justify-content:flex-start;">
              📜 Request History
            </button>
            <button class="btn btn-secondary btn-sm" id="shortcut-collections" style="justify-content:flex-start;">
              📁 Manage Collections
            </button>
            <button class="btn btn-secondary btn-sm" id="shortcut-codegen" style="justify-content:flex-start;">
              💻 Code Generator
            </button>
          </div>
        </div>

        <div class="card-glass" style="padding:var(--space-5);font-size:var(--text-xs);color:var(--text-secondary);display:flex;flex-direction:column;gap:8px;">
          <div style="font-weight:var(--weight-semibold);color:var(--text);">💡 Pro Tip</div>
          <div>All requests executed in APILens are logged automatically to your history and calculated into real-time analytics.</div>
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  container.querySelector('#dash-btn-new').addEventListener('click', () => options.onNewRequest?.());
  container.querySelector('#dash-btn-analytics').addEventListener('click', () => options.onSwitchView?.('analytics'));
  container.querySelector('#dash-view-all-history').addEventListener('click', () => options.onSwitchView?.('history'));
  container.querySelector('#shortcut-history').addEventListener('click', () => options.onSwitchView?.('history'));
  container.querySelector('#shortcut-collections').addEventListener('click', () => options.onSwitchView?.('collections'));
  container.querySelector('#shortcut-codegen').addEventListener('click', () => options.onSwitchView?.('codegen'));

  // Load live data from API
  loadDashboardStats(container);
}

async function loadDashboardStats(container) {
  try {
    const { getTokens } = await import('../services/storage.js');
    const { accessToken } = getTokens();
    const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};

    const [statsRes, historyRes, colRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/stats/analytics?filter=ALL`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${BACKEND_URL}/api/history?page=1&limit=5`, { headers }).then(r => r.json()).catch(() => ({ logs: [] })),
      fetch(`${BACKEND_URL}/api/collections`, { headers }).then(r => r.json()).catch(() => ([]))
    ]);

    const summary = statsRes.summary || {};
    container.querySelector('#stat-total-reqs').textContent = summary.totalRequests !== undefined ? summary.totalRequests : '0';
    container.querySelector('#stat-avg-time').textContent = summary.avgResponseTime ? `${summary.avgResponseTime}ms` : '0ms';
    container.querySelector('#stat-success-rate').textContent = summary.successRate ? `${summary.successRate}%` : '100%';
    container.querySelector('#stat-collections').textContent = Array.isArray(colRes) ? colRes.length : '0';

    const historyList = container.querySelector('#dash-history-list');
    const logs = historyRes.logs || [];
    if (logs.length === 0) {
      historyList.innerHTML = '<div style="color:var(--text-muted);font-size:var(--text-sm);padding:var(--space-2);">No recent request activity.</div>';
    } else {
      historyList.innerHTML = logs.map(item => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-2) var(--space-3);background:var(--surface-2);border-radius:var(--radius-md);font-size:var(--text-sm);">
          <div style="display:flex;align-items:center;gap:var(--space-2);overflow:hidden;">
            <span class="method-badge ${item.method.toLowerCase()}">${item.method}</span>
            <span style="font-family:var(--font-mono);color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(item.url)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:var(--space-3);font-size:var(--text-xs);color:var(--text-secondary);">
            <span class="${item.status >= 200 && item.status < 400 ? 'status-2xx' : 'status-4xx'}">${item.status || 'ERR'}</span>
            <span>${item.duration}ms</span>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.warn('Failed loading dashboard stats:', err);
  }
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
