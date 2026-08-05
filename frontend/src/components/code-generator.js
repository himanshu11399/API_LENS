/* ============================================
   APILens — Code Generator Component
   ============================================ */

const LANGUAGES = [
  { id: 'fetch', name: 'JavaScript Fetch' },
  { id: 'axios', name: 'Axios' },
  { id: 'python', name: 'Python Requests' },
  { id: 'java', name: 'Java OkHttp' },
  { id: 'kotlin', name: 'Kotlin Ktor' },
  { id: 'curl', name: 'cURL' },
];

/**
 * Render code generator panel.
 * @param {HTMLElement} container
 * @param {Object} requestState - { method, url, headers, params, body, auth }
 */
export function renderCodeGenerator(container, requestState) {
  container.innerHTML = '';
  container.className = 'codegen-panel';

  let activeTab = 'fetch';

  // Tab bar
  const tabBar = document.createElement('div');
  tabBar.className = 'codegen-tabs';
  LANGUAGES.forEach(lang => {
    const tab = document.createElement('div');
    tab.className = 'codegen-tab' + (lang.id === activeTab ? ' active' : '');
    tab.textContent = lang.name;
    tab.addEventListener('click', () => {
      activeTab = lang.id;
      renderCode();
      tabBar.querySelectorAll('.codegen-tab').forEach(el => el.classList.remove('active'));
      tab.classList.add('active');
    });
    tabBar.appendChild(tab);
  });
  container.appendChild(tabBar);

  // Code block
  const codeContainer = document.createElement('div');
  codeContainer.className = 'codegen-code';
  container.appendChild(codeContainer);

  function renderCode() {
    const code = generateCode(activeTab, requestState);
    codeContainer.innerHTML = `
      <button class="btn btn-ghost btn-sm codegen-copy" title="Copy to clipboard">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy
      </button>
      <pre>${escapeHtml(code)}</pre>
    `;
    codeContainer.querySelector('.codegen-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(code).then(() => {
        const btn = codeContainer.querySelector('.codegen-copy');
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        setTimeout(() => renderCode(), 1500);
      });
    });
  }

  renderCode();
}

function generateCode(lang, state) {
  const { method = 'GET', url = '', headers = [], body = '', auth = {} } = state;
  const enabledHeaders = headers.filter(h => h.enabled && h.key);

  // Build auth header
  let authHeader = null;
  if (auth.type === 'bearer' && auth.token) {
    authHeader = { key: 'Authorization', value: `Bearer ${auth.token}` };
  } else if (auth.type === 'basic' && auth.username) {
    authHeader = { key: 'Authorization', value: `Basic <base64>` };
  }

  const allHeaders = [...enabledHeaders];
  if (authHeader) allHeaders.push(authHeader);
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method) && body;

  switch (lang) {
    case 'fetch':
      return generateFetch(method, url, allHeaders, hasBody ? body : null);
    case 'axios':
      return generateAxios(method, url, allHeaders, hasBody ? body : null);
    case 'python':
      return generatePython(method, url, allHeaders, hasBody ? body : null);
    case 'java':
      return generateJava(method, url, allHeaders, hasBody ? body : null);
    case 'kotlin':
      return generateKotlin(method, url, allHeaders, hasBody ? body : null);
    case 'curl':
      return generateCurl(method, url, allHeaders, hasBody ? body : null);
    default:
      return '';
  }
}

function generateFetch(method, url, headers, body) {
  let code = `const response = await fetch('${url}'`;
  const opts = [];

  if (method !== 'GET') {
    opts.push(`  method: '${method}'`);
  }

  if (headers.length > 0) {
    const hdr = headers.map(h => `    '${h.key}': '${h.value}'`).join(',\n');
    opts.push(`  headers: {\n${hdr}\n  }`);
  }

  if (body) {
    opts.push(`  body: JSON.stringify(${body.trim()})`);
  }

  if (opts.length > 0) {
    code += `, {\n${opts.join(',\n')}\n}`;
  }

  code += `);\n\nconst data = await response.json();\nconsole.log(data);`;
  return code;
}

function generateAxios(method, url, headers, body) {
  let code = `import axios from 'axios';\n\n`;
  code += `const response = await axios.${method.toLowerCase()}('${url}'`;

  if (body) {
    code += `, ${body.trim()}`;
  }

  if (headers.length > 0) {
    const hdr = headers.map(h => `    '${h.key}': '${h.value}'`).join(',\n');
    code += `, {\n  headers: {\n${hdr}\n  }\n}`;
  }

  code += `);\n\nconsole.log(response.data);`;
  return code;
}

function generatePython(method, url, headers, body) {
  let code = `import requests\n\n`;

  if (headers.length > 0) {
    code += `headers = {\n`;
    headers.forEach(h => {
      code += `    '${h.key}': '${h.value}',\n`;
    });
    code += `}\n\n`;
  }

  if (body) {
    code += `payload = ${body.trim()}\n\n`;
  }

  code += `response = requests.${method.toLowerCase()}(\n    '${url}'`;
  if (headers.length > 0) code += `,\n    headers=headers`;
  if (body) code += `,\n    json=payload`;
  code += `\n)\n\nprint(response.json())`;
  return code;
}

function generateJava(method, url, headers, body) {
  let code = `OkHttpClient client = new OkHttpClient();\n\n`;

  if (body) {
    code += `MediaType mediaType = MediaType.parse("application/json");\n`;
    code += `RequestBody body = RequestBody.create(mediaType,\n    ${JSON.stringify(body.trim())});\n\n`;
  }

  code += `Request request = new Request.Builder()\n`;
  code += `    .url("${url}")\n`;
  code += `    .method("${method}"${body ? ', body' : method === 'GET' ? '' : ', null'})\n`;
  headers.forEach(h => {
    code += `    .addHeader("${h.key}", "${h.value}")\n`;
  });
  code += `    .build();\n\n`;
  code += `Response response = client.newCall(request).execute();\nSystem.out.println(response.body().string());`;
  return code;
}

function generateKotlin(method, url, headers, body) {
  let code = `val client = HttpClient(CIO) {\n    install(ContentNegotiation) {\n        json()\n    }\n}\n\n`;
  code += `val response: HttpResponse = client.${method.toLowerCase()}("${url}") {\n`;
  headers.forEach(h => {
    code += `    header("${h.key}", "${h.value}")\n`;
  });
  if (body) {
    code += `    contentType(ContentType.Application.Json)\n`;
    code += `    setBody(${body.trim()})\n`;
  }
  code += `}\n\nprintln(response.bodyAsText())`;
  return code;
}

function generateCurl(method, url, headers, body) {
  let code = `curl`;
  if (method !== 'GET') {
    code += ` -X ${method}`;
  }
  code += ` \\\n  '${url}'`;
  headers.forEach(h => {
    code += ` \\\n  -H '${h.key}: ${h.value}'`;
  });
  if (body) {
    code += ` \\\n  -d '${body.trim().replace(/\n/g, '')}'`;
  }
  return code;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
