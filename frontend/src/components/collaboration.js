/* ============================================
   APILens — Collaboration Component
   ============================================ */

/**
 * Render collaboration modal content.
 * @param {HTMLElement} container
 * @param {Object} requestState
 */
export function renderCollaboration(container, requestState) {
  container.innerHTML = '';

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width:560px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-5);">
        <h2 style="font-size:var(--text-xl);font-weight:var(--weight-bold);">Collaboration</h2>
        <button class="btn-icon" id="close-collab">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="collab-modal-content">
        <!-- Share Request -->
        <div>
          <h3 style="font-size:var(--text-md);font-weight:var(--weight-semibold);margin-bottom:var(--space-3);display:flex;align-items:center;gap:var(--space-2);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share Request
          </h3>
          <div class="share-link-box">
            <input type="text" value="https://apilens.dev/share/${generateId()}" readonly id="share-link" />
            <button class="btn btn-sm btn-primary" id="copy-share">Copy</button>
          </div>
        </div>

        <hr class="divider">

        <!-- Team Workspace -->
        <div>
          <h3 style="font-size:var(--text-md);font-weight:var(--weight-semibold);margin-bottom:var(--space-3);display:flex;align-items:center;gap:var(--space-2);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Team Members
          </h3>
          <div class="team-members">
            ${renderMember('AS', 'Alex Smith', 'Owner', '#3B82F6')}
            ${renderMember('JD', 'Jane Doe', 'Editor', '#8B5CF6')}
            ${renderMember('MK', 'Mike Kim', 'Viewer', '#22C55E')}
          </div>
          <button class="btn btn-ghost btn-sm" style="margin-top:var(--space-2);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Invite Member
          </button>
        </div>

        <hr class="divider">

        <!-- Comments -->
        <div>
          <h3 style="font-size:var(--text-md);font-weight:var(--weight-semibold);margin-bottom:var(--space-3);display:flex;align-items:center;gap:var(--space-2);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Comments
          </h3>
          <div class="comment-thread">
            <div class="comment">
              <div class="team-avatar" style="background:#3B82F6;width:28px;height:28px;font-size:11px;flex-shrink:0;">AS</div>
              <div class="comment-body">
                <div style="display:flex;align-items:center;gap:var(--space-2);">
                  <span class="comment-author">Alex Smith</span>
                  <span class="comment-time">2 min ago</span>
                </div>
                <p class="comment-text">This endpoint looks good. The response schema matches our spec. ✅</p>
              </div>
            </div>
            <div class="comment">
              <div class="team-avatar" style="background:#8B5CF6;width:28px;height:28px;font-size:11px;flex-shrink:0;">JD</div>
              <div class="comment-body">
                <div style="display:flex;align-items:center;gap:var(--space-2);">
                  <span class="comment-author">Jane Doe</span>
                  <span class="comment-time">5 min ago</span>
                </div>
                <p class="comment-text">Should we add rate limiting headers to the response? @alex</p>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:var(--space-2);margin-top:var(--space-3);">
            <input class="input" placeholder="Add a comment…" style="flex:1;font-size:var(--text-sm);" />
            <button class="btn btn-primary btn-sm">Send</button>
          </div>
        </div>

        <hr class="divider">

        <!-- Collection Sharing -->
        <div>
          <h3 style="font-size:var(--text-md);font-weight:var(--weight-semibold);margin-bottom:var(--space-3);display:flex;align-items:center;gap:var(--space-2);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Collection Sharing
          </h3>
          <div style="display:flex;gap:var(--space-2);">
            <button class="btn btn-secondary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export Collection
            </button>
            <button class="btn btn-secondary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import Collection
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.appendChild(modal);

  // Event handlers
  modal.querySelector('#close-collab').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#copy-share').addEventListener('click', () => {
    const input = modal.querySelector('#share-link');
    navigator.clipboard.writeText(input.value);
    const btn = modal.querySelector('#copy-share');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
}

function renderMember(initials, name, role, color) {
  return `
    <div class="team-member">
      <div class="team-avatar" style="background:${color};">${initials}</div>
      <div class="team-member-info">
        <div class="team-member-name">${name}</div>
        <div class="team-member-role">${role}</div>
      </div>
      <span style="font-size:var(--text-xs);padding:2px 8px;border-radius:var(--radius-full);background:var(--surface-2);color:var(--text-muted);">${role}</span>
    </div>
  `;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}
