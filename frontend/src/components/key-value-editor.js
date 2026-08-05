/* ============================================
   APILens — Key-Value Editor Component
   ============================================ */

/**
 * Renders a key-value pair editor (for params, headers, env vars).
 * @param {HTMLElement} container
 * @param {Array} rows - [{key, value, enabled}]
 * @param {Object} opts
 * @param {Function} opts.onChange - called with updated rows
 * @param {string} opts.keyPlaceholder
 * @param {string} opts.valuePlaceholder
 */
export function renderKeyValueEditor(container, rows, opts = {}) {
  const {
    onChange = () => {},
    keyPlaceholder = 'Key',
    valuePlaceholder = 'Value',
  } = opts;

  function rebuild() {
    container.innerHTML = '';
    container.className = 'kv-editor';

    rows.forEach((row, i) => {
      const el = document.createElement('div');
      el.className = 'kv-row animate-fade-in';
      el.innerHTML = `
        <div class="toggle ${row.enabled ? 'active' : ''}" data-i="${i}" data-action="toggle" title="Toggle"></div>
        <input type="text" placeholder="${keyPlaceholder}" value="${escHtml(row.key)}" data-i="${i}" data-field="key" />
        <input type="text" placeholder="${valuePlaceholder}" value="${escHtml(row.value)}" data-i="${i}" data-field="value" />
        <div class="kv-remove" data-i="${i}" data-action="remove" title="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>
      `;
      container.appendChild(el);
    });

    // Add row button
    const addBtn = document.createElement('div');
    addBtn.className = 'sidebar-add-btn';
    addBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add`;
    addBtn.addEventListener('click', () => {
      rows.push({ key: '', value: '', enabled: true });
      onChange(rows);
      rebuild();
    });
    container.appendChild(addBtn);

    // Event delegation
    container.addEventListener('click', e => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const idx = parseInt(target.dataset.i);
      if (target.dataset.action === 'toggle') {
        rows[idx].enabled = !rows[idx].enabled;
        onChange(rows);
        rebuild();
      } else if (target.dataset.action === 'remove') {
        rows.splice(idx, 1);
        onChange(rows);
        rebuild();
      }
    });

    container.addEventListener('input', e => {
      if (e.target.tagName === 'INPUT') {
        const idx = parseInt(e.target.dataset.i);
        const field = e.target.dataset.field;
        rows[idx][field] = e.target.value;
        onChange(rows);
      }
    });
  }

  rebuild();
  return { rebuild };
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
