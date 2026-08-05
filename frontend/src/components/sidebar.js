import { getCollections, getHistory, getFavorites, getEnvironments, getWorkspaces } from '../services/storage.js';
import { fetchCollections } from '../services/collections-api.js';
import { fetchHistoryLogs } from '../services/history-api.js';
import { isAuthenticated } from '../services/auth.js';

const ICONS = {
  collections: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  history: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  favorites: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  env: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  workspaces: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  chevron: '<svg class="sidebar-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
};

const METHOD_COLORS = {
  GET: 'var(--method-get)',
  POST: 'var(--method-post)',
  PUT: 'var(--method-put)',
  PATCH: 'var(--method-patch)',
  DELETE: 'var(--method-delete)',
};

/**
 * Render sidebar into container.
 * @param {HTMLElement} container
 * @param {Object} handlers - { onSelectRequest, onNewRequest }
 */
export async function renderSidebar(container, handlers = {}) {
  let collections = getCollections();
  let history = getHistory();
  const favorites = getFavorites();
  const environments = getEnvironments();
  const workspaces = getWorkspaces();

  if (isAuthenticated()) {
    try {
      const [colRes, histRes] = await Promise.all([
        fetchCollections().catch(() => collections),
        fetchHistoryLogs({ limit: 20 }).then(r => (r && Array.isArray(r.logs)) ? r.logs : history).catch(() => history)
      ]);
      if (Array.isArray(colRes)) collections = colRes;
      if (Array.isArray(histRes)) history = histRes;
    } catch {
      // Fallback to storage
    }
  }

  const safeCollections = Array.isArray(collections) ? collections : [];
  const safeHistory = Array.isArray(history) ? history : [];

  container.innerHTML = '';
  container.className = 'sidebar';

  // -- Collections --
  container.appendChild(createSection('Collections', ICONS.collections, () => {
    const content = document.createElement('div');
    if (!safeCollections || safeCollections.length === 0) {
      content.innerHTML = '<div style="padding: 8px 12px; font-size: 11px; color: var(--text-muted);">No collections yet</div>';
    } else {
      safeCollections.forEach(col => {
        const colHeader = document.createElement('div');
        colHeader.className = 'sidebar-item';
        colHeader.style.fontWeight = '600';
        colHeader.style.color = 'var(--text)';
        colHeader.innerHTML = `${ICONS.collections} <span class="truncate">${esc(col.name)}</span>`;
        content.appendChild(colHeader);

        // Root Requests
        (col.requests || []).forEach(req => {
          const item = document.createElement('div');
          item.className = 'sidebar-item';
          item.style.paddingLeft = '28px';
          item.innerHTML = `
            <span class="method-badge" style="background: ${METHOD_COLORS[req.method] || 'var(--primary)'}20; color: ${METHOD_COLORS[req.method] || 'var(--primary)'}">${req.method}</span>
            <span class="truncate">${esc(req.name || req.url)}</span>
          `;
          item.addEventListener('click', () => {
            handlers.onSelectRequest?.(req);
            document.querySelectorAll('.sidebar-item.active').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
          });
          content.appendChild(item);
        });

        // Folders & Folder Requests
        (col.folders || []).forEach(folder => {
          const folderHeader = document.createElement('div');
          folderHeader.className = 'sidebar-item';
          folderHeader.style.paddingLeft = '24px';
          folderHeader.style.fontSize = '11px';
          folderHeader.style.color = 'var(--text-secondary)';
          folderHeader.innerHTML = `📁 <span class="truncate">${esc(folder.name)}</span>`;
          content.appendChild(folderHeader);

          (folder.requests || []).forEach(req => {
            const item = document.createElement('div');
            item.className = 'sidebar-item';
            item.style.paddingLeft = '38px';
            item.innerHTML = `
              <span class="method-badge" style="background: ${METHOD_COLORS[req.method] || 'var(--primary)'}20; color: ${METHOD_COLORS[req.method] || 'var(--primary)'}">${req.method}</span>
              <span class="truncate">${esc(req.name || req.url)}</span>
            `;
            item.addEventListener('click', () => {
              handlers.onSelectRequest?.(req);
              document.querySelectorAll('.sidebar-item.active').forEach(el => el.classList.remove('active'));
              item.classList.add('active');
            });
            content.appendChild(item);
          });
        });
      });
    }

    const addBtn = document.createElement('div');
    addBtn.className = 'sidebar-add-btn';
    addBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New Request';
    addBtn.addEventListener('click', () => handlers.onNewRequest?.());
    content.appendChild(addBtn);

    return content;
  }));

  // -- History --
  container.appendChild(createSection('History', ICONS.history, () => {
    const content = document.createElement('div');
    if (safeHistory.length === 0) {
      content.innerHTML = '<div style="padding: 8px 12px; font-size: 11px; color: var(--text-muted);">No history yet</div>';
      return content;
    }
    safeHistory.slice(0, 20).forEach(entry => {
      const item = document.createElement('div');
      item.className = 'sidebar-item';
      const time = formatTime(entry.timestamp);
      item.innerHTML = `
        <span class="method-badge" style="background: ${METHOD_COLORS[entry.method] || 'var(--primary)'}20; color: ${METHOD_COLORS[entry.method] || 'var(--primary)'}">${entry.method}</span>
        <span class="truncate" style="flex:1">${esc(shortenUrl(entry.url))}</span>
        <span style="font-size:10px;color:var(--text-dim)">${time}</span>
      `;
      item.addEventListener('click', () => {
        handlers.onSelectRequest?.({ method: entry.method, url: entry.url });
      });
      content.appendChild(item);
    });
    return content;
  }));

  // -- Favorites --
  container.appendChild(createSection('Favorites', ICONS.favorites, () => {
    const content = document.createElement('div');
    if (favorites.length === 0) {
      content.innerHTML = '<div style="padding: 8px 12px; font-size: 11px; color: var(--text-muted);">No favorites yet</div>';
      return content;
    }
    favorites.forEach(fav => {
      const item = document.createElement('div');
      item.className = 'sidebar-item';
      item.innerHTML = `
        <span class="method-badge" style="background: ${METHOD_COLORS[fav.method]}20; color: ${METHOD_COLORS[fav.method]}">${fav.method}</span>
        <span class="truncate">${esc(fav.name || fav.url)}</span>
      `;
      item.addEventListener('click', () => {
        handlers.onSelectRequest?.({ method: fav.method, url: fav.url });
      });
      content.appendChild(item);
    });
    return content;
  }, true));

  // -- Environment Variables --
  container.appendChild(createSection('Environment', ICONS.env, () => {
    const content = document.createElement('div');
    environments.forEach(env => {
      const item = document.createElement('div');
      item.className = 'sidebar-item';
      item.style.fontFamily = 'var(--font-mono)';
      item.style.fontSize = '11px';
      item.innerHTML = `
        <span style="color: var(--info)">${esc(env.key)}</span>
        <span style="color: var(--text-muted); flex:1; overflow:hidden; text-overflow:ellipsis;">= ${esc(env.value)}</span>
      `;
      content.appendChild(item);
    });
    return content;
  }, true));

  // -- Workspaces --
  container.appendChild(createSection('Workspaces', ICONS.workspaces, () => {
    const content = document.createElement('div');
    workspaces.forEach(ws => {
      const item = document.createElement('div');
      item.className = 'sidebar-item' + (ws.active ? ' active' : '');
      item.innerHTML = `${ICONS.workspaces} <span class="truncate">${esc(ws.name)}</span>`;
      content.appendChild(item);
    });
    return content;
  }, true));
}

function createSection(title, icon, contentFn, collapsed = false) {
  const section = document.createElement('div');
  section.className = 'sidebar-section' + (collapsed ? ' collapsed' : '');

  const header = document.createElement('div');
  header.className = 'sidebar-header';
  header.innerHTML = `
    <div class="sidebar-header-left">${icon} ${title}</div>
    ${ICONS.chevron}
  `;
  header.addEventListener('click', () => {
    section.classList.toggle('collapsed');
  });

  const content = document.createElement('div');
  content.className = 'sidebar-content';
  content.appendChild(contentFn());

  section.appendChild(header);
  section.appendChild(content);
  return section;
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function shortenUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString();
}
