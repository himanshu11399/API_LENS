/* ============================================
   APILens — Integrated Analytics Component
   ============================================ */

import { Chart, registerables } from 'chart.js';
import { apiRequest } from '../services/auth.js';
import { getTokens } from '../services/storage.js';

Chart.register(...registerables);

// Module-level interactive state to preserve settings across page updates
let activeTimeFilter = 'ALL';
let logsSearchQuery = '';
let logsMethodFilter = 'ALL';
let logsStatusFilter = 'ALL';
let logsCurrentPage = 1;
const LOGS_PAGE_SIZE = 10;

let chartInstances = {
  trend: null,
  status: null,
  volume: null
};

let activeSocket = null;

import { API_BASE_URL } from '../config/api.js';

const BACKEND_URL = API_BASE_URL;

/**
 * Render analytics dashboard.
 * @param {HTMLElement} container
 */
export function renderAnalytics(container) {
  // Cleanup existing WebSocket client to avoid connection leak
  if (activeSocket) {
    activeSocket.disconnect();
    activeSocket = null;
  }

  // 1. Initial skeleton loader UI
  container.className = '';
  container.innerHTML = `
    <div class="analytics-page" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;color:var(--text-secondary);gap:var(--space-4);">
      <div class="spinner spinner-lg"></div>
      <div style="font-size:var(--text-sm);font-weight:var(--weight-semibold);">Loading live analytics from server...</div>
    </div>
  `;

  // Fetch data and render
  refreshDashboard();

  async function refreshDashboard() {
    try {
      // Fetch Calculated Analytics and Paginated Logs concurrently using apiRequest
      const [statsRes, logsRes] = await Promise.all([
        apiRequest(`${BACKEND_URL}/api/stats/analytics?filter=${activeTimeFilter}`).then(r => r.json()),
        apiRequest(`${BACKEND_URL}/api/history?page=${logsCurrentPage}&limit=${LOGS_PAGE_SIZE}&search=${logsSearchQuery}&method=${logsMethodFilter}&status=${logsStatusFilter}`).then(r => r.json())
      ]);

      const stats = statsRes;
      const logsData = logsRes;

      container.innerHTML = '';
      container.className = '';

      // Create a scrollable page element wrapper inside the container
      const pageEl = document.createElement('div');
      pageEl.className = 'analytics-page animate-fade-in';
      pageEl.style.height = '100%';
      pageEl.style.width = '100%';
      pageEl.style.overflowY = 'auto';

      // 2. Header Panel
      const headerEl = document.createElement('div');
      headerEl.className = 'analytics-header-container';
      headerEl.innerHTML = `
        <div class="analytics-header">
          <h2>
            📊 Analytics Dashboard
            <span class="live-indicator">
              <span class="live-dot"></span>
              Live Monitoring (<span id="online-users-count">...</span> online)
            </span>
          </h2>
          <p>Performance profiles, HTTP distribution, and request logs</p>
        </div>
        <div class="analytics-controls">
          <div class="analytics-filters">
            <button class="btn-ghost filter-btn ${activeTimeFilter === '1H' ? 'active' : ''}" data-filter="1H">1H</button>
            <button class="btn-ghost filter-btn ${activeTimeFilter === '24H' ? 'active' : ''}" data-filter="24H">24H</button>
            <button class="btn-ghost filter-btn ${activeTimeFilter === '7D' ? 'active' : ''}" data-filter="7D">7D</button>
            <button class="btn-ghost filter-btn ${activeTimeFilter === '30D' ? 'active' : ''}" data-filter="30D">30D</button>
            <button class="btn-ghost filter-btn ${activeTimeFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">ALL</button>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-export-analytics" title="Export Analytics to JSON">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-clear-analytics" style="color:var(--error);border-color:rgba(239,68,68,0.25);" title="Clear Request History">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Clear
          </button>
        </div>
      `;
      pageEl.appendChild(headerEl);

      // 3. Metrics Cards
      const metricsEl = document.createElement('div');
      metricsEl.className = 'metrics-grid';

      const summary = stats.summary || {
        totalRequests: 0,
        successRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        p90ResponseTime: 0,
        slowestRequest: 0,
        fastestRequest: 0,
        successRate: 0,
        totalBytes: 0
      };

      metricsEl.innerHTML = `
        <!-- Card 1: Avg Latency -->
        <div class="metric-card success-card animate-slide-up delay-1">
          <div class="metric-card-header">
            <div class="metric-info">
              <div class="metric-label">Avg Latency</div>
              <div class="metric-value-container">
                <div class="metric-value" data-animate-to="${summary.totalRequests ? summary.avgResponseTime : 0}" data-suffix="ms">${summary.totalRequests ? '0ms' : '—'}</div>
              </div>
            </div>
            <div class="metric-icon" style="background:var(--primary-soft);color:var(--primary-neon);">⚡</div>
          </div>
          <div class="metric-sparkline-container">
            <canvas class="metric-sparkline-canvas" id="sparkline-avg"></canvas>
          </div>
        </div>

        <!-- Card 2: p90 Percentile Latency -->
        <div class="metric-card animate-slide-up delay-2">
          <div class="metric-card-header">
            <div class="metric-info">
              <div class="metric-label">p90 Latency</div>
              <div class="metric-value-container">
                <div class="metric-value" data-animate-to="${summary.totalRequests ? summary.p90ResponseTime : 0}" data-suffix="ms">${summary.totalRequests ? '0ms' : '—'}</div>
              </div>
            </div>
            <div class="metric-icon" style="background:var(--primary-soft);color:var(--accent-purple);">📈</div>
          </div>
          <div class="metric-sparkline-container">
            <canvas class="metric-sparkline-canvas" id="sparkline-p90"></canvas>
          </div>
        </div>

        <!-- Card 3: Success Rate -->
        <div class="metric-card animate-slide-up delay-3">
          <div class="metric-card-header">
            <div class="metric-info">
              <div class="metric-label">Success Rate</div>
              <div class="metric-value-container">
                <div class="metric-value" data-animate-to="${summary.totalRequests ? summary.successRate : 0}" data-suffix="%" data-decimals="1">${summary.totalRequests ? '0%' : '—'}</div>
              </div>
            </div>
            <div class="metric-icon" style="background:var(--success-soft);color:var(--success);">✅</div>
          </div>
          <div class="metric-sparkline-container">
            <canvas class="metric-sparkline-canvas" id="sparkline-success"></canvas>
          </div>
        </div>

        <!-- Card 4: Request Volume -->
        <div class="metric-card animate-slide-up delay-4">
          <div class="metric-card-header">
            <div class="metric-info">
              <div class="metric-label">Total Volume</div>
              <div class="metric-value-container">
                <div class="metric-value" data-animate-to="${summary.totalRequests}" data-suffix=" reqs">0 reqs</div>
              </div>
            </div>
            <div class="metric-icon" style="background:var(--info-soft);color:var(--info);">📊</div>
          </div>
          <div class="metric-sparkline-container">
            <canvas class="metric-sparkline-canvas" id="sparkline-volume"></canvas>
          </div>
        </div>

        <!-- Card 5: Bandwidth -->
        <div class="metric-card animate-slide-up delay-5">
          <div class="metric-card-header">
            <div class="metric-info">
              <div class="metric-label">Bandwidth</div>
              <div class="metric-value-container">
                <div class="metric-value">${formatBytes(summary.totalBytes)}</div>
              </div>
            </div>
            <div class="metric-icon" style="background:var(--warning-soft);color:var(--warning);">💾</div>
          </div>
          <div class="metric-sparkline-container">
            <canvas class="metric-sparkline-canvas" id="sparkline-bandwidth"></canvas>
          </div>
        </div>
      `;
      pageEl.appendChild(metricsEl);

      // Animate metric card counter values
      requestAnimationFrame(() => {
        metricsEl.querySelectorAll('.metric-value[data-animate-to]').forEach(el => {
          const target = parseFloat(el.dataset.animateTo);
          const suffix = el.dataset.suffix || '';
          const decimals = parseInt(el.dataset.decimals) || 0;
          if (target === 0) { el.textContent = '—'; return; }
          animateMetricValue(el, 0, target, 1200, suffix, decimals);
        });
      });

      // 4. Main Charts Section
      const chartsSection = document.createElement('div');
      chartsSection.className = 'charts-grid';
      chartsSection.innerHTML = `
        <div class="chart-card animate-fade-in-up delay-3">
          <div class="chart-card-header">
            <h3>📈 Response Latency Profile</h3>
          </div>
          <div style="position:relative;flex:1;min-height:240px;">
            <canvas id="chart-trend"></canvas>
          </div>
        </div>
        <div class="chart-card animate-fade-in-up delay-4">
          <div class="chart-card-header">
            <h3>🍩 Status Code breakdown</h3>
          </div>
          <div style="position:relative;flex:1;max-height:180px;">
            <canvas id="chart-status"></canvas>
          </div>
          <div class="doughnut-legend-container" id="status-legend"></div>
        </div>
      `;
      pageEl.appendChild(chartsSection);

      // 5. Leaderboard and Method Breakdown
      const middleSection = document.createElement('div');
      middleSection.className = 'charts-grid';
      middleSection.innerHTML = `
        <!-- Leaderboard Column -->
        <div class="leaderboard-card animate-fade-in-up delay-4">
          <div class="chart-card-header">
            <h3 style="margin-bottom:0;">🐢 Slowest Endpoints Performance</h3>
          </div>
          <div class="leaderboard-list" id="leaderboard-list">
            <!-- Populated dynamically -->
          </div>
        </div>
        <!-- HTTP Methods Bar Column -->
        <div class="chart-card animate-fade-in-up delay-5">
          <div class="chart-card-header">
            <h3>⚡ Request Volume by Method</h3>
          </div>
          <div style="position:relative;flex:1;min-height:200px;">
            <canvas id="chart-volume"></canvas>
          </div>
        </div>
      `;
      pageEl.appendChild(middleSection);

      // Populate Leaderboard list
      populateLeaderboardList(stats.leaderboard || []);

      // 6. Recent Request Logs Table (Searchable & Filterable)
      const logsEl = document.createElement('div');
      logsEl.className = 'logs-card animate-fade-in-up delay-5';
      
      const totalLogs = logsData.totalCount || 0;
      const startIndex = totalLogs ? (logsData.page - 1) * LOGS_PAGE_SIZE : 0;
      const endIndex = Math.min(startIndex + LOGS_PAGE_SIZE, totalLogs);

      logsEl.innerHTML = `
        <div class="logs-filter-bar">
          <h3 style="font-size:var(--text-md);font-weight:var(--weight-semibold);color:var(--text);margin-bottom:0;display:flex;align-items:center;gap:var(--space-2);">
            📋 Request Log History
          </h3>
          <div class="logs-filter-selects">
            <div class="logs-search-wrapper">
              <svg class="logs-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="logs-search-input" id="log-search" placeholder="Search endpoint URL..." value="${logsSearchQuery}">
            </div>
            <select class="logs-select" id="log-filter-method">
              <option value="ALL">All Methods</option>
              <option value="GET" ${logsMethodFilter === 'GET' ? 'selected' : ''}>GET</option>
              <option value="POST" ${logsMethodFilter === 'POST' ? 'selected' : ''}>POST</option>
              <option value="PUT" ${logsMethodFilter === 'PUT' ? 'selected' : ''}>PUT</option>
              <option value="PATCH" ${logsMethodFilter === 'PATCH' ? 'selected' : ''}>PATCH</option>
              <option value="DELETE" ${logsMethodFilter === 'DELETE' ? 'selected' : ''}>DELETE</option>
            </select>
            <select class="logs-select" id="log-filter-status">
              <option value="ALL">All Statuses</option>
              <option value="2xx" ${logsStatusFilter === '2xx' ? 'selected' : ''}>2xx (Success)</option>
              <option value="3xx" ${logsStatusFilter === '3xx' ? 'selected' : ''}>3xx (Redirect)</option>
              <option value="4xx" ${logsStatusFilter === '4xx' ? 'selected' : ''}>4xx (Client Error)</option>
              <option value="5xx" ${logsStatusFilter === '5xx' ? 'selected' : ''}>5xx (Server Error)</option>
            </select>
          </div>
        </div>
        <div class="logs-table-wrapper">
          <table class="logs-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Method</th>
                <th>Request Path / URL</th>
                <th style="text-align:center;">Status</th>
                <th style="text-align:right;">Latency</th>
              </tr>
            </thead>
            <tbody id="logs-tbody">
              <!-- Populated dynamically -->
            </tbody>
          </table>
        </div>
        <div class="response-status-bar" style="border:none;margin-top:var(--space-2);justify-content:space-between;padding:0 var(--space-2);">
          <div style="color:var(--text-secondary);font-size:var(--text-xs);">
            Showing <strong>${totalLogs ? startIndex + 1 : 0}</strong> - <strong>${endIndex}</strong> of <strong>${totalLogs}</strong> request logs
          </div>
          <div style="display:flex;gap:var(--space-2);">
            <button class="btn btn-secondary btn-sm" id="btn-logs-prev" ${logsCurrentPage === 1 ? 'disabled' : ''} style="padding:4px 10px;">
              &larr; Prev
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-logs-next" ${logsCurrentPage * LOGS_PAGE_SIZE >= totalLogs ? 'disabled' : ''} style="padding:4px 10px;">
              Next &rarr;
            </button>
          </div>
        </div>
      `;
      pageEl.appendChild(logsEl);

      // Append the full page elements structure to the main container
      container.appendChild(pageEl);

      // Populate log entries rows
      populateLogsRows(logsData.logs || []);

      // 7. Hook Event Listeners
      attachControlsEvents();

      // 8. Render Sparklines and Advanced Charts asynchronously
      requestAnimationFrame(() => {
        if (stats.sparklines) {
          renderSparklines(stats.sparklines);
        }
        renderTrendChart(logsData.logs || []);
        renderStatusChart(stats.statusDistribution || {});
        renderVolumeChart(stats.methodDistribution || {});
      });

      // 9. Initialize WebSocket connection for active user tracking and live updates
      setupSockets();

    } catch (err) {
      console.error(err);
      container.innerHTML = `
        <div style="padding:var(--space-12);text-align:center;color:var(--error);display:flex;flex-direction:column;align-items:center;gap:var(--space-4);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div style="font-weight:var(--weight-semibold);">Failed to load analytics from server</div>
          <div style="font-size:var(--text-xs);color:var(--text-secondary);">${err.message}</div>
          <button class="btn btn-secondary btn-sm" id="btn-analytics-retry">Retry Connection</button>
        </div>
      `;
      container.querySelector('#btn-analytics-retry')?.addEventListener('click', () => {
        renderAnalytics(container);
      });
    }
  }

  // Setup Socket.IO Client connection
  function setupSockets() {
    if (activeSocket) return;

    if (window.io) {
      activeSocket = window.io(BACKEND_URL);

      activeSocket.on('connect', () => {
        console.log('Socket.IO Connected to backend server.');
        const { accessToken } = getTokens();
        if (accessToken) {
          activeSocket.emit('authenticate', accessToken);
        }
      });

      // Update online count live
      activeSocket.on('activeUsersCount', (data) => {
        const onlineEl = container.querySelector('#online-users-count');
        if (onlineEl) {
          onlineEl.textContent = data.activeUsers;
        }
      });

      // Live dashboard stats update upon execution complete
      activeSocket.on('requestAnalyticsUpdate', () => {
        console.log('Analytics updated. Refreshing dashboard details...');
        // Throttle refresh slightly to avoid thrashing during rapid requests
        if (activeSocket.refreshTimeout) clearTimeout(activeSocket.refreshTimeout);
        activeSocket.refreshTimeout = setTimeout(() => {
          refreshDashboard();
        }, 300);
      });
    }
  }

  // Helper for popup notifications
  function triggerToast(type, message) {
    const container = document.querySelector('#toast-container');
    if (!container) return;
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

  // Attach controls listeners
  function attachControlsEvents() {
    // Time Range filters
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTimeFilter = btn.dataset.filter;
        logsCurrentPage = 1; // reset page
        refreshDashboard();
      });
    });

    // Clear Data Handler
    container.querySelector('#btn-clear-analytics').addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear your entire request history and analytics ledger on the backend?')) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/history`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            triggerToast('info', 'Analytics history cleared successfully.');
            refreshDashboard();
          }
        } catch (err) {
          triggerToast('error', 'Failed to clear history: ' + err.message);
        }
      }
    });

    // Export Handler
    container.querySelector('#btn-export-analytics').addEventListener('click', async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/history?page=1&limit=500&search=${logsSearchQuery}`);
        const data = await res.json();
        if (!data.logs || !data.logs.length) {
          triggerToast('error', 'No request logs available to export.');
          return;
        }
        const jsonStr = JSON.stringify(data.logs, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `apilens_analytics_report.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        triggerToast('success', `Exported ${data.logs.length} logs successfully.`);
      } catch (err) {
        triggerToast('error', 'Failed to export report: ' + err.message);
      }
    });

    // Search input
    let searchTimeout = null;
    const searchInput = container.querySelector('#log-search');
    searchInput.addEventListener('input', (e) => {
      logsSearchQuery = e.target.value;
      logsCurrentPage = 1; // reset page

      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        refreshDashboard();
      }, 400);
    });

    // Method Filter select
    container.querySelector('#log-filter-method').addEventListener('change', (e) => {
      logsMethodFilter = e.target.value;
      logsCurrentPage = 1;
      refreshDashboard();
    });

    // Status Filter select
    container.querySelector('#log-filter-status').addEventListener('change', (e) => {
      logsStatusFilter = e.target.value;
      logsCurrentPage = 1;
      refreshDashboard();
    });

    // Log pagination buttons
    container.querySelector('#btn-logs-prev').addEventListener('click', () => {
      if (logsCurrentPage > 1) {
        logsCurrentPage--;
        refreshDashboard();
      }
    });

    container.querySelector('#btn-logs-next').addEventListener('click', () => {
      logsCurrentPage++;
      refreshDashboard();
    });
  }

  // Populate leaderboard html
  function populateLeaderboardList(leaderboard) {
    const listEl = container.querySelector('#leaderboard-list');
    if (!listEl) return;

    if (leaderboard.length === 0) {
      listEl.innerHTML = `
        <div style="padding:var(--space-6);text-align:center;color:var(--text-muted);font-size:var(--text-sm);">
          No endpoint data in this time range.
        </div>
      `;
      return;
    }

    const maxAvg = Math.max(...leaderboard.map(l => l.avgDuration)) || 1;

    listEl.innerHTML = leaderboard.map(item => {
      const widthPct = Math.round((item.avgDuration / maxAvg) * 100);
      let statusColor = 'var(--success)';
      if (item.avgDuration > 150) statusColor = 'var(--warning)';
      if (item.avgDuration > 300) statusColor = 'var(--error)';

      return `
        <div class="leaderboard-item">
          <div class="leaderboard-method">
            <span class="badge badge-${item.method.toLowerCase()}">${item.method}</span>
          </div>
          <div class="leaderboard-path" title="${item.path}">${item.path}</div>
          <div class="leaderboard-bar-container">
            <div class="leaderboard-bar-bg">
              <div class="leaderboard-bar-fill" style="width: ${widthPct}%; background: ${statusColor}"></div>
            </div>
          </div>
          <div class="leaderboard-stats">
            <div class="leaderboard-time">${item.avgDuration}ms</div>
            <div class="leaderboard-count">${item.count} calls</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Populate logs table tbody rows
  function populateLogsRows(logs) {
    const tbody = container.querySelector('#logs-tbody');
    if (!tbody) return;

    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="logs-empty">No requests found matching filters.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = logs.map(l => {
      const timeStr = new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const statusClass = l.status >= 200 && l.status < 400 ? 'status-2xx' : (l.status >= 400 && l.status < 500 ? 'status-4xx' : 'status-5xx');
      const statusText = l.status === 0 ? 'ERR' : l.status;
      
      let latencyClass = 'fast';
      if (l.duration > 150) latencyClass = 'avg';
      if (l.duration > 300) latencyClass = 'slow';

      // clean route path
      let cleanUrl = l.url;
      try {
        const urlObj = new URL(l.url);
        cleanUrl = urlObj.pathname + urlObj.search;
      } catch {
        cleanUrl = l.url;
      }

      return `
        <tr>
          <td class="logs-table-time" title="${new Date(l.timestamp).toLocaleString()}">${timeStr}</td>
          <td><span class="badge badge-${l.method.toLowerCase()}">${l.method}</span></td>
          <td>
            <div class="logs-table-url" title="${l.url}">${cleanUrl}</div>
          </td>
          <td style="text-align:center;">
            <span class="status-code ${statusClass}">${statusText}</span>
          </td>
          <td style="text-align:right;" class="logs-table-latency ${latencyClass}">${l.duration}ms</td>
        </tr>
      `;
    }).join('');
  }
}

/**
 * Format bytes nicely
 */
function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Draw custom sparklines on card canvases
 */
function renderSparklines(sparklines) {
  // Sparkline 1: Avg Latency
  drawSparkline(document.getElementById('sparkline-avg'), sparklines.latencies || [], '#3B82F6');
  // Sparkline 2: p90 Latency
  drawSparkline(document.getElementById('sparkline-p90'), sparklines.latencies || [], '#A78BFA');
  // Sparkline 3: Success Rate
  drawSparkline(document.getElementById('sparkline-success'), sparklines.success || [], '#10B981');
  // Sparkline 4: Total Volume
  drawSparkline(document.getElementById('sparkline-volume'), sparklines.volume || [], '#06B6D4');
  // Sparkline 5: Bandwidth
  drawSparkline(document.getElementById('sparkline-bandwidth'), sparklines.sizes || [], '#F59E0B');
}

/**
 * Raw canvas sparkline renderer
 */
function drawSparkline(canvas, points, color) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);
  if (points.length < 2) return;

  const max = Math.max(...points) || 1;
  const min = Math.min(...points) || 0;
  const range = max - min || 1;

  // Area under line
  ctx.beginPath();
  const stepX = width / (points.length - 1);
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, color + '25'); // 15% opacity
  grad.addColorStop(1, color + '00'); // transparent

  ctx.moveTo(0, height);
  for (let i = 0; i < points.length; i++) {
    const x = i * stepX;
    const y = height - ((points[i] - min) / range) * (height - 8) - 4;
    if (i === 0) ctx.lineTo(x, y);
    else {
      const prevX = (i - 1) * stepX;
      const prevY = height - ((points[i-1] - min) / range) * (height - 8) - 4;
      ctx.bezierCurveTo(prevX + stepX/2, prevY, x - stepX/2, y, x, y);
    }
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line path
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const x = i * stepX;
    const y = height - ((points[i] - min) / range) * (height - 8) - 4;
    if (i === 0) ctx.moveTo(x, y);
    else {
      const prevX = (i - 1) * stepX;
      const prevY = height - ((points[i-1] - min) / range) * (height - 8) - 4;
      ctx.bezierCurveTo(prevX + stepX/2, prevY, x - stepX/2, y, x, y);
    }
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.stroke();
}

/**
 * Render Trend Line Chart (Avg vs Raw latency profile)
 */
function renderTrendChart(logs) {
  const ctx = document.getElementById('chart-trend');
  if (!ctx) return;

  const recent = [...logs].reverse().slice(-15);
  const labels = recent.map(d => {
    const t = new Date(d.timestamp);
    return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const rawDurations = recent.map(d => d.duration || 0);
  
  // calculate running averages
  const runningAverages = recent.map((d, i) => {
    const slice = recent.slice(0, i + 1);
    const total = slice.reduce((a, b) => a + (b.duration || 0), 0);
    return Math.round(total / slice.length);
  });

  const demoLabels = ['15:20', '15:21', '15:22', '15:23', '15:24', '15:25', '15:26', '15:27', '15:28', '15:29'];
  const demoRaw = [120, 85, 230, 95, 150, 67, 180, 110, 200, 92];
  const demoAvg = [120, 102, 145, 132, 136, 124, 132, 129, 137, 132];

  if (chartInstances.trend) chartInstances.trend.destroy();

  chartInstances.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: logs.length ? labels : demoLabels,
      datasets: [
        {
          label: 'Request Duration (ms)',
          data: logs.length ? rawDurations : demoRaw,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59,130,246,0.06)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#0F172A',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#60A5FA',
          pointHoverBorderColor: '#FFFFFF',
          pointHoverBorderWidth: 2
        },
        {
          label: 'Running Avg (ms)',
          data: logs.length ? runningAverages : demoAvg,
          borderColor: '#A78BFA',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#A78BFA',
          pointBorderColor: '#0F172A',
          pointBorderWidth: 1.5,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#94A3B8', boxWidth: 12, font: { size: 11 }, padding: 16 }
        },
        tooltip: {
          backgroundColor: 'rgba(17, 22, 34, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          titleColor: '#F8FAFC',
          bodyColor: '#94A3B8',
          titleFont: { size: 12, weight: '600' },
          bodyFont: { size: 11 },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 4
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.02)', drawBorder: false },
          ticks: { color: '#64748B', font: { size: 10 }, padding: 8 }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
          ticks: { color: '#64748B', font: { size: 10 }, callback: v => v + 'ms', padding: 8 }
        }
      }
    }
  });
}

/**
 * Render Doughnut Chart for Status Code distribution
 */
function renderStatusChart(statusCounts) {
  const ctx = document.getElementById('chart-status');
  if (!ctx) return;

  const labels = ['2xx (Success)', '3xx (Redirect)', '4xx (Client Err)', '5xx (Server Err)'];
  const values = [
    statusCounts['2xx'] || 0,
    statusCounts['3xx'] || 0,
    statusCounts['4xx'] || 0,
    statusCounts['5xx'] || 0
  ];
  
  const colors = ['#10B981', '#F59E0B', '#EF4444', '#DC2626'];
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const successPct = Math.round(((statusCounts['2xx'] || 0) / total) * 100);

  // Custom inner success label plugin
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw(chart) {
      const { ctx, chartArea: { left, right, top, bottom, width, height } } = chart;
      ctx.save();
      ctx.font = 'bold 15px Inter, -apple-system, sans-serif';
      ctx.fillStyle = '#F8FAFC';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(successPct + '%', left + width / 2, top + height / 2 - 8);
      ctx.font = 'bold 8px Inter, -apple-system, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('SUCCESS', left + width / 2, top + height / 2 + 8);
      ctx.restore();
    }
  };

  if (chartInstances.status) chartInstances.status.destroy();

  chartInstances.status = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#111622',
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    plugins: [centerTextPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17, 22, 34, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          titleColor: '#F8FAFC',
          bodyColor: '#94A3B8',
          padding: 12,
          cornerRadius: 8,
          boxPadding: 4
        }
      }
    }
  });

  // Render HTML custom legend
  const legendBox = document.getElementById('status-legend');
  if (legendBox) {
    legendBox.innerHTML = labels.map((lbl, idx) => {
      const val = values[idx];
      const pct = Math.round((val / total) * 100);
      return `
        <div class="legend-item">
          <span class="legend-label">
            <span class="legend-dot" style="background:${colors[idx]}"></span>
            ${lbl}
          </span>
          <span class="legend-value">${val} (${pct}%)</span>
        </div>
      `;
    }).join('');
  }
}

/**
 * Render Horizontal Bar Chart for HTTP Request Volume by Method
 */
function renderVolumeChart(methodCounts) {
  const ctx = document.getElementById('chart-volume');
  if (!ctx) return;

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  const values = methods.map(m => methodCounts[m] || 0);
  const colors = ['#22C55E', '#F59E0B', '#3B82F6', '#A855F7', '#EF4444'];
  const borderColors = colors;

  if (chartInstances.volume) chartInstances.volume.destroy();

  chartInstances.volume = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: methods,
      datasets: [{
        label: 'Requests',
        data: values,
        backgroundColor: colors.map(c => c + '25'),
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 6,
        barThickness: 18,
        hoverBackgroundColor: colors.map(c => c + '50')
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17, 22, 34, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          titleColor: '#F8FAFC',
          bodyColor: '#94A3B8',
          padding: 12,
          cornerRadius: 8,
          boxPadding: 4
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.02)', drawBorder: false },
          ticks: { color: '#64748B', font: { size: 10 }, stepSize: 1, padding: 8 }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#94A3B8', font: { size: 11, weight: 'bold' }, padding: 8 }
        }
      }
    }
  });
}

/**
 * Animate a metric value element from start to end
 */
function animateMetricValue(element, start, end, duration, suffix = '', decimals = 0) {
  let startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = start + eased * (end - start);
    element.textContent = value.toFixed(decimals) + suffix;
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}
