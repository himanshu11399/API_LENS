/* ============================================
   APILens — Collections Management Page
   ============================================ */

import {
  fetchCollections, createCollection, updateCollection, deleteCollection,
  createCollectionFolder, deleteCollectionFolder, deleteCollectionRequest, updateCollectionRequest
} from '../services/collections-api.js';
import { getCollections as getLocalCollections, saveCollections as saveLocalCollections } from '../services/storage.js';
import { isAuthenticated } from '../services/auth.js';

/**
 * Render Collections page into container
 * @param {HTMLElement} container
 * @param {Object} options - { onLoadRequest }
 */
export function renderCollectionsPage(container, options = {}) {
  container.className = 'collections-page animate-fade-in';
  container.style.cssText = 'padding:var(--space-6);overflow-y:auto;height:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:var(--space-6);';

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-4);">
      <div>
        <h1 style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:var(--text);margin:0 0 4px 0;">
          📁 API Collections
        </h1>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:0;">
          Organize, save, and manage your API request templates and test suites.
        </p>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-create-collection">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Collection
      </button>
    </div>

    <!-- Search filter bar -->
    <div style="display:flex;gap:var(--space-3);align-items:center;">
      <div style="position:relative;flex:1;max-width:360px;">
        <input type="text" id="col-search" class="input" placeholder="Search collections and requests..." style="width:100%;padding-left:32px;" />
        <svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
    </div>

    <!-- Collections Container -->
    <div id="collections-list" style="display:flex;flex-direction:column;gap:var(--space-4);">
      <div style="color:var(--text-muted);padding:var(--space-6);text-align:center;">Loading collections...</div>
    </div>

    <!-- Modal Container -->
    <div id="modal-container"></div>
  `;

  const btnCreate = container.querySelector('#btn-create-collection');
  const searchInput = container.querySelector('#col-search');

  btnCreate.addEventListener('click', () => showCreateCollectionModal(container, loadData));

  let searchQuery = '';
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderList();
  });

  let rawCollections = [];

  async function loadData() {
    try {
      if (isAuthenticated()) {
        rawCollections = await fetchCollections();
      } else {
        rawCollections = getLocalCollections();
      }
      renderList();
    } catch (err) {
      container.querySelector('#collections-list').innerHTML = `
        <div style="color:var(--error);padding:var(--space-4);">Failed to load collections: ${esc(err.message)}</div>
      `;
    }
  }

  function renderList() {
    const listEl = container.querySelector('#collections-list');
    listEl.innerHTML = '';

    const filtered = rawCollections.filter(c => 
      c.name.toLowerCase().includes(searchQuery) ||
      (c.description && c.description.toLowerCase().includes(searchQuery))
    );

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="card-glass" style="padding:var(--space-12);text-align:center;color:var(--text-muted);">
          <div style="font-size:var(--text-lg);margin-bottom:var(--space-2);">No collections found</div>
          <div style="font-size:var(--text-sm);">Create a new collection to start saving requests.</div>
        </div>
      `;
      return;
    }

    filtered.forEach(col => {
      const card = document.createElement('div');
      card.className = 'card-glass';
      card.style.padding = 'var(--space-5)';

      const reqCount = (col.requests || []).length + (col.folders || []).reduce((acc, f) => acc + (f.requests || []).length, 0);

      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3);flex-wrap:wrap;gap:var(--space-2);">
          <div>
            <h3 style="font-size:var(--text-md);font-weight:var(--weight-semibold);color:var(--text);margin:0 0 2px 0;">
              ${esc(col.name)}
            </h3>
            <span style="font-size:var(--text-xs);color:var(--text-secondary);">${reqCount} saved request${reqCount === 1 ? '' : 's'}</span>
          </div>
          <div style="display:flex;gap:var(--space-2);">
            ${isAuthenticated() ? `
              <button class="btn btn-ghost btn-sm btn-rename-col" title="Rename Collection">✏️ Rename</button>
              <button class="btn btn-ghost btn-sm btn-add-folder" title="Add Folder">📁 Folder</button>
              <button class="btn btn-ghost btn-sm btn-delete-col" style="color:var(--error);" title="Delete Collection">🗑️ Delete</button>
            ` : ''}
          </div>
        </div>

        ${col.description ? `<p style="font-size:var(--text-xs);color:var(--text-muted);margin:0 0 var(--space-3) 0;">${esc(col.description)}</p>` : ''}

        <!-- Root Requests -->
        <div class="col-requests-container" style="display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-3);">
          ${(col.requests || []).map(r => renderRequestRowHtml(col._id || col.id, r)).join('')}
        </div>

        <!-- Folders -->
        ${(col.folders || []).map(f => `
          <div style="margin-left:var(--space-4);padding-left:var(--space-3);border-left:2px solid var(--border);margin-bottom:var(--space-3);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);">
              <span style="font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--text-secondary);">📁 ${esc(f.name)}</span>
              ${isAuthenticated() ? `<button class="btn btn-ghost btn-sm btn-del-folder" data-fid="${f._id || f.id}" style="font-size:10px;color:var(--error);padding:2px 4px;">Delete Folder</button>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--space-2);">
              ${(f.requests || []).map(r => renderRequestRowHtml(col._id || col.id, r)).join('')}
            </div>
          </div>
        `).join('')}
      `;

      // Rename Collection
      card.querySelector('.btn-rename-col')?.addEventListener('click', async () => {
        const newName = prompt('Enter new collection name:', col.name);
        if (newName && newName.trim() && newName !== col.name) {
          try {
            await updateCollection(col._id, newName.trim(), col.description);
            loadData();
          } catch (err) { alert(err.message); }
        }
      });

      // Add Folder
      card.querySelector('.btn-add-folder')?.addEventListener('click', async () => {
        const folderName = prompt('Enter folder name:');
        if (folderName && folderName.trim()) {
          try {
            await createCollectionFolder(col._id, folderName.trim());
            loadData();
          } catch (err) { alert(err.message); }
        }
      });

      // Delete Collection
      card.querySelector('.btn-delete-col')?.addEventListener('click', async () => {
        if (confirm(`Delete collection "${col.name}" and all its requests?`)) {
          try {
            await deleteCollection(col._id);
            loadData();
          } catch (err) { alert(err.message); }
        }
      });

      // Delete Folder
      card.querySelectorAll('.btn-del-folder').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Delete this folder and all nested requests?')) {
            try {
              await deleteCollectionFolder(col._id, btn.dataset.fid);
              loadData();
            } catch (err) { alert(err.message); }
          }
        });
      });

      // Load request click handler
      card.querySelectorAll('.request-row-item').forEach(row => {
        row.addEventListener('click', (e) => {
          // If clicked on an action button inside the row, ignore row click
          if (e.target.closest('.btn-del-req') || e.target.closest('.btn-edit-req')) return;
          const reqData = JSON.parse(row.dataset.req);
          options.onLoadRequest?.(reqData);
        });
      });

      // Edit request handler
      card.querySelectorAll('.btn-edit-req').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const reqData = JSON.parse(btn.dataset.req);
          showEditRequestModal(container, col._id || col.id, reqData, loadData);
        });
      });

      // Delete request item handler
      card.querySelectorAll('.btn-del-req').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm('Delete saved request?')) {
            try {
              if (isAuthenticated()) {
                await deleteCollectionRequest(col._id, btn.dataset.rid);
              } else {
                // local storage fallback
                col.requests = (col.requests || []).filter(r => (r.id || r._id) !== btn.dataset.rid);
                (col.folders || []).forEach(f => {
                  f.requests = (f.requests || []).filter(r => (r.id || r._id) !== btn.dataset.rid);
                });
                saveLocalCollections(rawCollections);
              }
              loadData();
            } catch (err) { alert(err.message); }
          }
        });
      });

      listEl.appendChild(card);
    });
  }

  loadData();
}

function renderRequestRowHtml(collectionId, req) {
  const reqJson = esc(JSON.stringify(req));
  const reqId = req._id || req.id;
  return `
    <div class="request-row-item" data-req="${reqJson}" style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-2) var(--space-3);background:var(--surface-2);border-radius:var(--radius-md);cursor:pointer;transition:background var(--duration-fast);">
      <div style="display:flex;align-items:center;gap:var(--space-3);overflow:hidden;">
        <span class="method-badge ${req.method.toLowerCase()}">${req.method}</span>
        <span style="font-size:var(--text-sm);font-weight:var(--weight-medium);color:var(--text);">${esc(req.name || req.url)}</span>
        <span style="font-size:var(--text-xs);color:var(--text-muted);font-family:var(--font-mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(req.url)}</span>
      </div>
      <div style="display:flex;gap:var(--space-1);align-items:center;">
        <button class="btn btn-ghost btn-sm btn-edit-req" data-rid="${reqId}" data-req="${reqJson}" style="color:var(--text-secondary);padding:2px 6px;font-size:11px;" title="Edit Request">✏️</button>
        <button class="btn btn-ghost btn-sm btn-del-req" data-rid="${reqId}" style="color:var(--error);padding:2px 6px;font-size:11px;" title="Delete Request">✕</button>
      </div>
    </div>
  `;
}

function showCreateCollectionModal(container, onSuccess) {
  const modalContainer = container.querySelector('#modal-container');
  modalContainer.innerHTML = `
    <div class="profile-modal-overlay">
      <div class="profile-modal" style="max-width:400px;">
        <div class="profile-modal-header">
          <h2>New Collection</h2>
          <button class="btn-icon" id="col-close">✕</button>
        </div>
        <form id="col-form" class="profile-form">
          <div class="auth-field">
            <label>Collection Name</label>
            <input class="auth-input" id="col-name" placeholder="e.g. User Service API" required />
          </div>
          <div class="auth-field">
            <label>Description (optional)</label>
            <input class="auth-input" id="col-desc" placeholder="Brief overview of collection" />
          </div>
          <button type="submit" class="auth-submit">Create Collection</button>
        </form>
      </div>
    </div>
  `;

  const overlay = modalContainer.querySelector('.profile-modal-overlay');
  overlay.querySelector('#col-close').addEventListener('click', () => modalContainer.innerHTML = '');
  overlay.addEventListener('click', (e) => { if (e.target === overlay) modalContainer.innerHTML = ''; });

  modalContainer.querySelector('#col-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = modalContainer.querySelector('#col-name').value.trim();
    const description = modalContainer.querySelector('#col-desc').value.trim();

    try {
      if (isAuthenticated()) {
        await createCollection(name, description);
      } else {
        const local = getLocalCollections();
        local.push({ id: crypto.randomUUID(), name, description, requests: [] });
        saveLocalCollections(local);
      }
      modalContainer.innerHTML = '';
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  });
}

function showEditRequestModal(container, collectionId, reqData, onSuccess) {
  const modalContainer = container.querySelector('#modal-container');
  const reqId = reqData._id || reqData.id;

  modalContainer.innerHTML = `
    <div class="profile-modal-overlay">
      <div class="profile-modal" style="max-width:440px;">
        <div class="profile-modal-header">
          <h2>Edit Saved Request</h2>
          <button class="btn-icon" id="edit-req-close">✕</button>
        </div>
        <form id="edit-req-form" class="profile-form">
          <div class="auth-field">
            <label>Request Name</label>
            <input class="auth-input" id="edit-req-name" value="${esc(reqData.name || '')}" required />
          </div>
          <div class="auth-field">
            <label>HTTP Method</label>
            <select class="auth-input" id="edit-req-method">
              ${['GET','POST','PUT','PATCH','DELETE','OPTIONS','HEAD'].map(m =>
                `<option value="${m}" ${reqData.method === m ? 'selected' : ''}>${m}</option>`
              ).join('')}
            </select>
          </div>
          <div class="auth-field">
            <label>URL</label>
            <input class="auth-input" id="edit-req-url" value="${esc(reqData.url || '')}" required />
          </div>
          <button type="submit" class="auth-submit">Update Request</button>
        </form>
      </div>
    </div>
  `;

  const overlay = modalContainer.querySelector('.profile-modal-overlay');
  overlay.querySelector('#edit-req-close').addEventListener('click', () => modalContainer.innerHTML = '');
  overlay.addEventListener('click', (e) => { if (e.target === overlay) modalContainer.innerHTML = ''; });

  modalContainer.querySelector('#edit-req-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatedName = modalContainer.querySelector('#edit-req-name').value.trim();
    const updatedMethod = modalContainer.querySelector('#edit-req-method').value;
    const updatedUrl = modalContainer.querySelector('#edit-req-url').value.trim();

    try {
      if (isAuthenticated()) {
        await updateCollectionRequest(collectionId, reqId, {
          name: updatedName,
          method: updatedMethod,
          url: updatedUrl
        });
      }
      modalContainer.innerHTML = '';
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  });
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
