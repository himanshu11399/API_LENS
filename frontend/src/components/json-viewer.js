/* ============================================
   APILens — JSON Viewer (Tree) Component
   ============================================ */

/**
 * Renders a collapsible JSON tree.
 * @param {HTMLElement} container
 * @param {*} data - parsed JSON data
 * @param {Object} opts
 * @param {string} opts.searchTerm
 */
export function renderJsonViewer(container, data, opts = {}) {
  container.innerHTML = '';
  container.className = 'json-viewer';

  if (data === null || data === undefined) {
    container.innerHTML = '<div class="empty-state"><p>No response data</p></div>';
    return;
  }

  const tree = buildNode(data, '', true, opts.searchTerm);
  container.appendChild(tree);
}

function buildNode(data, key, isLast, searchTerm, depth = 0) {
  const frag = document.createDocumentFragment();

  if (data !== null && typeof data === 'object') {
    const isArray = Array.isArray(data);
    const entries = isArray ? data.map((v, i) => [i, v]) : Object.entries(data);
    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';

    // Toggle line
    const line = document.createElement('div');
    line.className = 'jv-line';

    const toggle = document.createElement('span');
    toggle.className = 'jv-toggle open';

    let keyHtml = key !== '' ? `<span class="jv-key">"${escapeHtml(String(key))}"</span>: ` : '';
    toggle.innerHTML = `${keyHtml}<span class="jv-bracket">${openBracket}</span>`;
    line.appendChild(toggle);

    // Collapsed preview
    const preview = document.createElement('span');
    preview.className = 'jv-collapsed-preview';
    preview.style.display = 'none';
    const count = entries.length;
    preview.textContent = ` ${count} ${isArray ? 'items' : 'keys'} ${closeBracket}${isLast ? '' : ','}`;
    line.appendChild(preview);

    frag.appendChild(line);

    // Children container
    const children = document.createElement('div');
    children.className = 'jv-children';

    entries.forEach(([k, v], i) => {
      const last = i === entries.length - 1;
      const childNode = buildNode(v, k, last, searchTerm, depth + 1);
      children.appendChild(childNode);
    });

    frag.appendChild(children);

    // Close bracket
    const closeLine = document.createElement('div');
    closeLine.className = 'jv-line';
    closeLine.innerHTML = `<span class="jv-bracket">${closeBracket}${isLast ? '' : ','}</span>`;
    frag.appendChild(closeLine);

    // Toggle click
    toggle.addEventListener('click', () => {
      const isOpen = toggle.classList.contains('open');
      toggle.classList.toggle('open');
      children.style.display = isOpen ? 'none' : 'block';
      closeLine.style.display = isOpen ? 'none' : 'block';
      preview.style.display = isOpen ? 'inline' : 'none';
    });

  } else {
    // Primitive value
    const line = document.createElement('div');
    line.className = 'jv-line';

    let keyHtml = key !== '' ? `<span class="jv-key">"${escapeHtml(String(key))}"</span>: ` : '';
    let valueHtml = formatPrimitive(data);
    let comma = isLast ? '' : ',';

    line.innerHTML = `${keyHtml}${valueHtml}${comma}`;

    // Search highlight
    if (searchTerm && line.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
      line.style.background = 'rgba(59,130,246,.15)';
      line.style.borderRadius = '3px';
    }

    frag.appendChild(line);
  }

  return frag;
}

function formatPrimitive(val) {
  if (val === null) return '<span class="jv-null">null</span>';
  if (typeof val === 'boolean') return `<span class="jv-boolean">${val}</span>`;
  if (typeof val === 'number') return `<span class="jv-number">${val}</span>`;
  if (typeof val === 'string') {
    const escaped = escapeHtml(val);
    if (escaped.length > 300) {
      return `<span class="jv-string">"${escaped.substring(0, 300)}…"</span>`;
    }
    return `<span class="jv-string">"${escaped}"</span>`;
  }
  return `<span>${escapeHtml(String(val))}</span>`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
