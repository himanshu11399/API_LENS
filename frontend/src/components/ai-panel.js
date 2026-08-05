import { sendAiChatMessage, triggerAiQuickAction } from '../services/ai-api.js';
import { isAuthenticated } from '../services/auth.js';

// Session-level chat messages memory for the UI drawer
let chatMessages = [];
let sessionId = 'session_' + Math.random().toString(36).substring(2, 9);
let isGenerating = false;

/**
 * Render interactive AI Assistant drawer.
 * @param {HTMLElement} container - the AI panel element
 * @param {Object} response - current response data
 * @param {Object} requestState - current request state
 * @param {Object} options - { onLoadRequest }
 */
export function renderAiPanel(container, response, requestState, options = {}) {
  container.className = 'ai-panel';

  const isAuthed = isAuthenticated();

  if (!isAuthed) {
    container.innerHTML = `
      <div class="ai-panel-header" style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-4);border-bottom:1px solid var(--border);">
        <h3 style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-md);font-weight:var(--weight-bold);margin:0;color:var(--text);">
          🔒 AI Assistant Restricted
        </h3>
        <button class="btn-icon" id="close-ai-panel" title="Close Panel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div style="padding:var(--space-8);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:var(--space-4);height:80%;">
        <div style="width:56px;height:56px;border-radius:50%;background:var(--primary-soft);display:flex;align-items:center;justify-content:center;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-neon)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h3 style="font-size:var(--text-lg);font-weight:var(--weight-bold);color:var(--text);margin:0;">Sign In Required</h3>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:0;max-width:280px;">
          The AI Assistant features (debugging 4xx/5xx errors, response explanations, payload generation, multi-language codegen) are available exclusively to registered users.
        </p>
        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-2);">
          <a href="#/login" class="btn btn-secondary btn-sm" style="text-decoration:none;">Sign In</a>
          <a href="#/signup" class="btn btn-primary btn-sm" style="text-decoration:none;">Create Free Account</a>
        </div>
      </div>
    `;
    container.querySelector('#close-ai-panel').addEventListener('click', () => container.classList.remove('open'));
    return;
  }

  const contextData = {
    request: requestState,
    response: response,
  };

  container.innerHTML = `
    <!-- Header -->
    <div class="ai-panel-header" style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-4);border-bottom:1px solid var(--border);">
      <h3 style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-md);font-weight:var(--weight-bold);margin:0;color:var(--text);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-neon)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/><circle cx="12" cy="15" r="1"/></svg>
        APILens AI Assistant
      </h3>
      <div style="display:flex;align-items:center;gap:var(--space-2);">
        <button class="btn btn-ghost btn-sm" id="clear-chat-btn" style="font-size:11px;color:var(--text-muted);" title="Clear Chat History">Clear</button>
        <button class="btn-icon" id="close-ai-panel" title="Close Panel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- Active Workspace Context Badge -->
    <div class="ai-context-badge" style="padding:var(--space-2) var(--space-4);background:var(--surface-2);border-bottom:1px solid var(--border);font-size:var(--text-xs);display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:var(--space-2);overflow:hidden;">
        <span style="color:var(--text-muted);">Active Context:</span>
        ${requestState && requestState.url ? `
          <span class="method-badge ${requestState.method.toLowerCase()}">${requestState.method}</span>
          <span style="font-family:var(--font-mono);color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">${esc(requestState.url)}</span>
        ` : '<span style="color:var(--text-muted);">No request set</span>'}
      </div>
      ${response && response.status ? `
        <span class="status-code ${response.status >= 200 && response.status < 400 ? 'status-2xx' : 'status-4xx'}">${response.status}</span>
      ` : ''}
    </div>

    <!-- Quick Action Pills -->
    <div class="ai-quick-actions" style="padding:var(--space-3) var(--space-4);display:flex;gap:var(--space-2);overflow-x:auto;border-bottom:1px solid var(--border);background:var(--surface);">
      <button class="btn btn-secondary btn-sm ai-action-btn" data-action="EXPLAIN_RESPONSE" style="white-space:nowrap;font-size:11px;">💡 Explain Response</button>
      <button class="btn btn-secondary btn-sm ai-action-btn" data-action="DEBUG_ERROR" style="white-space:nowrap;font-size:11px;">🐛 Debug Error</button>
      <button class="btn btn-secondary btn-sm ai-action-btn" data-action="GENERATE_CODE" style="white-space:nowrap;font-size:11px;">💻 Generate Code</button>
      <button class="btn btn-secondary btn-sm ai-action-btn" data-action="IMPROVE_REQUEST" style="white-space:nowrap;font-size:11px;">⚡ Improve Request</button>
      <button class="btn btn-secondary btn-sm ai-action-btn" data-action="GENERATE_DOCS" style="white-space:nowrap;font-size:11px;">📄 Generate Docs</button>
    </div>

    <!-- Code Generation Language Selector (Hidden by default) -->
    <div id="code-lang-bar" style="display:none;padding:var(--space-2) var(--space-4);background:var(--surface-2);border-bottom:1px solid var(--border);align-items:center;gap:var(--space-2);font-size:var(--text-xs);">
      <span>Select Language:</span>
      <select id="code-lang-select" class="input" style="font-size:11px;padding:2px 6px;">
        <option value="Fetch (JavaScript)">JavaScript Fetch</option>
        <option value="Axios (JavaScript)">JavaScript Axios</option>
        <option value="Python Requests">Python Requests</option>
        <option value="cURL">cURL</option>
        <option value="Node.js">Node.js</option>
        <option value="Java">Java</option>
        <option value="Go">Go</option>
        <option value="PHP">PHP</option>
      </select>
      <button class="btn btn-primary btn-sm" id="btn-run-codegen" style="font-size:11px;padding:2px 8px;">Generate</button>
    </div>

    <!-- Chat Feed Area -->
    <div class="ai-panel-body" id="ai-chat-feed" style="flex:1;overflow-y:auto;padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4);">
      <!-- Messages rendered dynamically -->
    </div>

    <!-- Input Box -->
    <div class="ai-chat-input-container" style="padding:var(--space-3) var(--space-4);border-top:1px solid var(--border);background:var(--surface);display:flex;gap:var(--space-2);align-items:flex-end;">
      <textarea id="ai-chat-input" class="input" placeholder="Ask AI a question or request (e.g. 'Explain this JSON' or 'Create a POST user request')..." style="flex:1;min-height:38px;max-height:120px;resize:none;font-size:var(--text-sm);padding:8px 12px;"></textarea>
      <button class="btn btn-primary" id="ai-send-btn" style="height:38px;padding:0 14px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  `;

  // References
  const chatFeed = container.querySelector('#ai-chat-feed');
  const chatInput = container.querySelector('#ai-chat-input');
  const sendBtn = container.querySelector('#ai-send-btn');
  const closeBtn = container.querySelector('#close-ai-panel');
  const clearBtn = container.querySelector('#clear-chat-btn');
  const codeLangBar = container.querySelector('#code-lang-bar');
  const codeLangSelect = container.querySelector('#code-lang-select');
  const runCodegenBtn = container.querySelector('#btn-run-codegen');

  // Close panel
  closeBtn.addEventListener('click', () => container.classList.remove('open'));

  // Clear history
  clearBtn.addEventListener('click', () => {
    chatMessages = [];
    renderMessages();
  });

  // Render welcome message if empty
  if (chatMessages.length === 0) {
    chatMessages.push({
      role: 'assistant',
      content: `Hello! I'm your **APILens AI Assistant** 🤖\n\nI have automatic context of your active request, latest response, and collections. Ask me any question or click a Quick Action above!`
    });
  }

  renderMessages();

  function renderMessages() {
    chatFeed.innerHTML = '';
    chatMessages.forEach(msg => {
      const bubble = document.createElement('div');
      bubble.className = `ai-message-bubble ${msg.role}`;
      bubble.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        max-width: 90%;
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-lg);
        font-size: var(--text-sm);
        line-height: var(--leading-normal);
        ${msg.role === 'user'
          ? 'align-self: flex-end; background: var(--primary); color: #fff;'
          : 'align-self: flex-start; background: var(--surface-2); border: 1px solid var(--border); color: var(--text);'
        }
      `;

      // Render Markdown-formatted content
      bubble.innerHTML = renderMarkdown(msg.content);

      // Handle Apply to Request buttons inside message
      if (msg.parsedRequest) {
        const applyBtn = document.createElement('button');
        applyBtn.className = 'btn btn-primary btn-sm';
        applyBtn.style.marginTop = 'var(--space-2)';
        applyBtn.innerHTML = '⚡ Apply to Workspace Request';
        applyBtn.addEventListener('click', () => {
          options.onLoadRequest?.(msg.parsedRequest);
          triggerToast('success', `Applied ${msg.parsedRequest.method} ${msg.parsedRequest.url} to Request Panel!`);
        });
        bubble.appendChild(applyBtn);
      }

      chatFeed.appendChild(bubble);
    });

    // Add Copy buttons to code blocks
    chatFeed.querySelectorAll('pre code').forEach(codeBlock => {
      const parentPre = codeBlock.parentElement;
      if (!parentPre.querySelector('.copy-code-btn')) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-btn btn btn-ghost btn-sm';
        copyBtn.style.cssText = 'position:absolute;top:6px;right:6px;font-size:10px;padding:2px 6px;background:rgba(255,255,255,0.1);color:#fff;';
        copyBtn.textContent = 'Copy';
        parentPre.style.position = 'relative';
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(codeBlock.textContent);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => copyBtn.textContent = 'Copy', 2000);
        });
        parentPre.appendChild(copyBtn);
      }
    });

    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  // Handle User Send
  async function handleUserSend(text) {
    const userText = text || chatInput.value.trim();
    if (!userText || isGenerating) return;

    chatInput.value = '';
    isGenerating = true;
    sendBtn.disabled = true;

    // Push user message
    chatMessages.push({ role: 'user', content: userText });
    renderMessages();

    // Push loading typing indicator
    const typingBubble = document.createElement('div');
    typingBubble.className = 'ai-message-bubble assistant typing';
    typingBubble.style.cssText = 'align-self: flex-start; background: var(--surface-2); border: 1px solid var(--border); padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg);';
    typingBubble.innerHTML = '<div class="spinner spinner-sm"></div> <span style="font-size:var(--text-xs);color:var(--text-secondary);margin-left:8px;">AI is thinking…</span>';
    chatFeed.appendChild(typingBubble);
    chatFeed.scrollTop = chatFeed.scrollHeight;

    try {
      const res = await sendAiChatMessage(userText, contextData, sessionId);
      chatMessages.push({
        role: 'assistant',
        content: res.content,
        parsedRequest: res.parsedRequest
      });
    } catch (err) {
      chatMessages.push({
        role: 'assistant',
        content: `⚠️ **AI Error**: ${err.message}`
      });
    } finally {
      isGenerating = false;
      sendBtn.disabled = false;
      renderMessages();
    }
  }

  sendBtn.addEventListener('click', () => handleUserSend());

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserSend();
    }
  });

  // Quick Action Pills Handler
  container.querySelectorAll('.ai-action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;

      if (action === 'GENERATE_CODE') {
        codeLangBar.style.display = codeLangBar.style.display === 'none' ? 'flex' : 'none';
        return;
      }
      codeLangBar.style.display = 'none';

      if (isGenerating) return;
      isGenerating = true;

      chatMessages.push({ role: 'user', content: `[Action: ${btn.textContent.trim()}]` });
      renderMessages();

      const typingBubble = document.createElement('div');
      typingBubble.className = 'ai-message-bubble assistant typing';
      typingBubble.style.cssText = 'align-self: flex-start; background: var(--surface-2); border: 1px solid var(--border); padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg);';
      typingBubble.innerHTML = '<div class="spinner spinner-sm"></div> <span style="font-size:var(--text-xs);color:var(--text-secondary);margin-left:8px;">Analyzing request context…</span>';
      chatFeed.appendChild(typingBubble);
      chatFeed.scrollTop = chatFeed.scrollHeight;

      try {
        const res = await triggerAiQuickAction(action, contextData, {}, sessionId);
        chatMessages.push({
          role: 'assistant',
          content: res.content,
          parsedRequest: res.parsedRequest
        });
      } catch (err) {
        chatMessages.push({
          role: 'assistant',
          content: `⚠️ **AI Error**: ${err.message}`
        });
      } finally {
        isGenerating = false;
        renderMessages();
      }
    });
  });

  // Code Gen Run Handler
  runCodegenBtn.addEventListener('click', async () => {
    const lang = codeLangSelect.value;
    codeLangBar.style.display = 'none';
    if (isGenerating) return;
    isGenerating = true;

    chatMessages.push({ role: 'user', content: `Generate request code in ${lang}` });
    renderMessages();

    try {
      const res = await triggerAiQuickAction('GENERATE_CODE', contextData, { language: lang }, sessionId);
      chatMessages.push({
        role: 'assistant',
        content: res.content
      });
    } catch (err) {
      chatMessages.push({
        role: 'assistant',
        content: `⚠️ **AI Error**: ${err.message}`
      });
    } finally {
      isGenerating = false;
      renderMessages();
    }
  });
}

/**
 * Basic Markdown parser for AI messages
 */
function renderMarkdown(text) {
  if (!text) return '';
  let html = esc(text);

  // Fenced Code Blocks
  html = html.replace(/```([a-z0-9:-]*)\n([\s\S]*?)```/gi, (match, lang, code) => {
    const cleanLang = lang.split(':')[0] || 'code';
    return `<pre style="background:var(--bg-deep);padding:var(--space-3);border-radius:var(--radius-md);overflow-x:auto;margin:var(--space-2) 0;border:1px solid var(--border);"><code class="language-${cleanLang}">${code.trim()}</code></pre>`;
  });

  // Inline Code
  html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:12px;">$1</code>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h4 style="font-size:14px;font-weight:bold;margin:8px 0 4px 0;">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 style="font-size:15px;font-weight:bold;margin:10px 0 4px 0;">$1</h3>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

function triggerToast(type, message) {
  const container = document.querySelector('#toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
