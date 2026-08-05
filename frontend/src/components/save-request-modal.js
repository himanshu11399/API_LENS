/* ============================================
   APILens — Save Request Modal Component
   Modal for saving current request into a collection or folder
   ============================================ */

import { fetchCollections, createCollection, addCollectionRequest, updateCollectionRequest } from '../services/collections-api.js';
import { getCollections as getLocalCollections, saveCollections as saveLocalCollections } from '../services/storage.js';
import { isAuthenticated } from '../services/auth.js';

/**
 * Open Save Request Modal
 * @param {HTMLElement} parentContainer
 * @param {Object} state - current request state
 * @param {Object} options - { onSaved }
 */
export async function openSaveRequestModal(parentContainer, state, options = {}) {
  // Remove existing modal if present
  parentContainer.querySelector('.save-modal-overlay')?.remove();

  const isAuthed = isAuthenticated();
  let collections = [];

  try {
    if (isAuthed) {
      collections = await fetchCollections();
    } else {
      collections = getLocalCollections();
    }
  } catch (err) {
    console.warn('Failed to load collections for save modal:', err);
    collections = getLocalCollections();
  }

  // Derive default request name from URL if missing
  let defaultName = state.name || '';
  if (!defaultName && state.url) {
    try {
      const u = new URL(state.url);
      defaultName = `${state.method} ${u.pathname}`;
    } catch {
      defaultName = `${state.method} ${state.url}`;
    }
  }
  if (!defaultName) defaultName = 'Untitled Request';

  const overlay = document.createElement('div');
  overlay.className = 'profile-modal-overlay save-modal-overlay';
  overlay.innerHTML = `
    <div class="profile-modal" style="max-width:480px;">
      <div class="profile-modal-header">
        <h2 style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-lg);">
          💾 Save Request to Collection
        </h2>
        <button class="btn-icon" id="save-modal-close">✕</button>
      </div>

      <form class="profile-form" id="save-request-form">
        <!-- Request Name -->
        <div class="auth-field">
          <label>Request Name</label>
          <input class="auth-input" type="text" id="save-req-name" value="${esc(defaultName)}" placeholder="e.g. Get User Profile" required />
        </div>

        <!-- Target Collection Select -->
        <div class="auth-field">
          <label style="display:flex;align-items:center;justify-content:space-between;">
            <span>Select Collection</span>
            <button type="button" class="btn btn-ghost btn-sm" id="btn-toggle-new-col" style="font-size:11px;color:var(--primary-neon);padding:0;">
              + Create New Collection
            </button>
          </label>
          <select class="auth-input" id="save-target-col" required>
            ${collections.length === 0 ? '<option value="">No collections available</option>' : ''}
            ${collections.map(c => `<option value="${c._id || c.id}">${esc(c.name)}</option>`).join('')}
          </select>
        </div>

        <!-- New Collection Name Input (Hidden by default) -->
        <div class="auth-field" id="new-col-field" style="display:none;background:var(--surface-2);padding:var(--space-3);border-radius:var(--radius-md);border:1px dashed var(--primary);">
          <label style="color:var(--primary-neon);">New Collection Name</label>
          <input class="auth-input" type="text" id="new-col-name-input" placeholder="e.g. Production APIs" />
        </div>

        <!-- Target Folder Select (Dynamic) -->
        <div class="auth-field" id="folder-select-field">
          <label>Select Folder (Optional)</label>
          <select class="auth-input" id="save-target-folder">
            <option value="">Root (No Folder)</option>
          </select>
        </div>

        <div id="save-modal-msg" style="min-height:16px;"></div>

        <div style="display:flex;justify-content:flex-end;gap:var(--space-3);margin-top:var(--space-2);">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-save">Cancel</button>
          <button type="submit" class="auth-submit" id="btn-submit-save" style="margin:0;max-width:140px;">
            Save Request
          </button>
        </div>
      </form>
    </div>
  `;

  parentContainer.appendChild(overlay);

  // References
  const form = overlay.querySelector('#save-request-form');
  const closeBtn = overlay.querySelector('#save-modal-close');
  const cancelBtn = overlay.querySelector('#btn-cancel-save');
  const colSelect = overlay.querySelector('#save-target-col');
  const folderSelect = overlay.querySelector('#save-target-folder');
  const toggleNewColBtn = overlay.querySelector('#btn-toggle-new-col');
  const newColField = overlay.querySelector('#new-col-field');
  const newColNameInput = overlay.querySelector('#new-col-name-input');
  const msgEl = overlay.querySelector('#save-modal-msg');
  const reqNameInput = overlay.querySelector('#save-req-name');

  let isCreatingNewCol = collections.length === 0;

  if (isCreatingNewCol) {
    newColField.style.display = 'flex';
    colSelect.parentElement.style.display = 'none';
    toggleNewColBtn.textContent = 'Use Existing Collection';
  }

  // Populate folder dropdown based on selected collection
  const updateFolderDropdown = () => {
    const selectedColId = colSelect.value;
    const targetCol = collections.find(c => (c._id || c.id) === selectedColId);
    folderSelect.innerHTML = '<option value="">Root (No Folder)</option>';

    if (targetCol && targetCol.folders && targetCol.folders.length > 0) {
      targetCol.folders.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f._id || f.id;
        opt.textContent = f.name;
        folderSelect.appendChild(opt);
      });
      overlay.querySelector('#folder-select-field').style.display = 'flex';
    }
  };

  colSelect.addEventListener('change', updateFolderDropdown);
  updateFolderDropdown();

  // Toggle inline new collection creation
  toggleNewColBtn.addEventListener('click', () => {
    isCreatingNewCol = !isCreatingNewCol;
    if (isCreatingNewCol) {
      newColField.style.display = 'flex';
      colSelect.parentElement.style.display = 'none';
      overlay.querySelector('#folder-select-field').style.display = 'none';
      toggleNewColBtn.textContent = 'Use Existing Collection';
      newColNameInput.focus();
    } else {
      newColField.style.display = 'none';
      colSelect.parentElement.style.display = 'flex';
      updateFolderDropdown();
      toggleNewColBtn.textContent = '+ Create New Collection';
    }
  });

  // Close modal
  const closeModal = () => overlay.remove();
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  // Handle Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgEl.innerHTML = '';

    const reqName = reqNameInput.value.trim();
    if (!reqName) {
      msgEl.innerHTML = '<span style="color:var(--error);font-size:var(--text-xs);">Request name is required.</span>';
      return;
    }

    let targetCollectionId = colSelect.value;

    try {
      // 1. Create new collection inline if specified
      if (isCreatingNewCol) {
        const newColName = newColNameInput.value.trim();
        if (!newColName) {
          msgEl.innerHTML = '<span style="color:var(--error);font-size:var(--text-xs);">Collection name is required.</span>';
          return;
        }

        if (isAuthed) {
          const createdCol = await createCollection(newColName);
          targetCollectionId = createdCol._id;
        } else {
          const newColObj = {
            id: crypto.randomUUID(),
            name: newColName,
            requests: []
          };
          collections.push(newColObj);
          saveLocalCollections(collections);
          targetCollectionId = newColObj.id;
        }
      }

      if (!targetCollectionId) {
        msgEl.innerHTML = '<span style="color:var(--error);font-size:var(--text-xs);">Please select or create a collection.</span>';
        return;
      }

      const folderId = isCreatingNewCol ? null : (folderSelect.value || null);

      // Clean payload for request template
      const requestData = {
        name: reqName,
        method: state.method || 'GET',
        url: state.url || '',
        headers: Array.isArray(state.headers) ? state.headers : [],
        params: Array.isArray(state.params) ? state.params : [],
        body: state.body || '',
        auth: state.auth || { type: 'none' },
        folderId: folderId
      };

      // 2. Save request template to collection
      let updatedCol = null;
      if (isAuthed) {
        updatedCol = await addCollectionRequest(targetCollectionId, requestData);
      } else {
        // LocalStorage fallback for guests
        const col = collections.find(c => (c.id || c._id) === targetCollectionId);
        if (col) {
          const reqObj = { ...requestData, id: crypto.randomUUID() };
          if (folderId && col.folders) {
            const folder = col.folders.find(f => (f.id || f._id) === folderId);
            if (folder) folder.requests = folder.requests || [], folder.requests.push(reqObj);
            else col.requests.push(reqObj);
          } else {
            col.requests = col.requests || [];
            col.requests.push(reqObj);
          }
          saveLocalCollections(collections);
        }
      }

      // 3. Update state name and saved references
      state.name = reqName;

      closeModal();
      options.onSaved?.({ name: reqName, collectionId: targetCollectionId, folderId });
    } catch (err) {
      msgEl.innerHTML = `<span style="color:var(--error);font-size:var(--text-xs);">${esc(err.message)}</span>`;
    }
  });

  reqNameInput.focus();
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
