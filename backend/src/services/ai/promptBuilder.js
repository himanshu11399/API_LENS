/* ============================================
   APILens — Prompt Builder Service
   Structured system prompts, context formatting, and prompt engineering
   ============================================ */

const SYSTEM_PROMPT = `You are APILens Assistant, an expert AI pair programmer and API architect embedded inside the APILens API Testing Platform.
Your mission is to help developers test, debug, document, and design APIs with extreme efficiency.

Guidelines:
1. Provide concise, clear, and actionable advice formatted in Markdown.
2. When analyzing errors (400, 401, 403, 404, 422, 429, 500, etc.), explicitly state:
   - Likely Cause
   - Step-by-Step Fix Instructions
   - Security/Best Practice recommendations
3. When asked to generate code, output ready-to-run snippets with fenced code blocks (e.g. \`\`\`javascript, \`\`\`python, \`\`\`bash, \`\`\`go).
4. When generating or suggesting an API request payload, include a structured JSON block tagged with \`\`\`json:request containing:
   {
     "name": "Short Request Name",
     "method": "GET|POST|PUT|PATCH|DELETE",
     "url": "https://...",
     "headers": [{"key": "Content-Type", "value": "application/json", "enabled": true}],
     "params": [],
     "body": "raw body string or json object"
   }
5. Base your answers directly on the workspace context provided below (current request, latest response, headers, history). Never ask the user for info that exists in the context.`;

/**
 * Build system and user prompt messages with context injection
 * @param {string} userQuery - user's text message or action intent
 * @param {Object} context - structured context from contextBuilder
 * @param {Array} history - conversation memory array
 * @returns {Array} messages - [{ role, content }]
 */
export function buildPromptMessages(userQuery, context = {}, history = []) {
  const sanitizedQuery = sanitizeInput(userQuery);

  // Format context string
  let contextBlock = '### ACTIVE WORKSPACE CONTEXT:\n';

  if (context.hasActiveRequest) {
    const r = context.request;
    contextBlock += `\n**Current Request:**
- Method: ${r.method}
- URL: ${r.url}
- Headers: ${JSON.stringify(r.headers)}
- Params: ${JSON.stringify(r.params)}
- Auth Type: ${r.authType}
- Body:\n\`\`\`\n${r.body || '(empty)'}\n\`\`\`\n`;
  }

  if (context.hasActiveResponse) {
    const res = context.response;
    contextBlock += `\n**Latest Response:**
- Status: ${res.status} ${res.statusText}
- Latency: ${res.durationMs}ms | Size: ${res.sizeBytes} bytes
- Response Headers: ${JSON.stringify(res.headers)}
- Response Body Sample:\n\`\`\`\n${res.bodySample || '(empty)'}\n\`\`\`\n`;
  }

  if (context.collection) {
    contextBlock += `\n**Active Collection:** ${context.collection.name} (${context.collection.requestCount} requests)\n`;
  }

  if (context.recentHistory && context.recentHistory.length > 0) {
    contextBlock += `\n**Recent History:**\n${context.recentHistory.map(h => `- ${h.method} ${h.url} [${h.status}] (${h.durationMs}ms)`).join('\n')}\n`;
  }

  const systemMessage = {
    role: 'system',
    content: `${SYSTEM_PROMPT}\n\n${contextBlock}`
  };

  // Append session conversation memory
  const memoryMessages = (history || []).slice(-10).map(m => ({
    role: m.role,
    content: m.content
  }));

  const userMessage = {
    role: 'user',
    content: sanitizedQuery
  };

  return [systemMessage, ...memoryMessages, userMessage];
}

/**
 * Build task-specific quick action prompts
 * @param {string} actionType - 'EXPLAIN_RESPONSE'|'DEBUG_ERROR'|'GENERATE_CODE'|'GENERATE_DOCS'|'IMPROVE_REQUEST'
 * @param {Object} context
 * @param {Object} options - extra args (e.g. language for code generation)
 */
export function buildQuickActionQuery(actionType, context = {}, options = {}) {
  switch (actionType) {
    case 'EXPLAIN_RESPONSE':
      return 'Please explain this API response in simple language, outlining the key fields, status code meaning, and what the data represents.';

    case 'DEBUG_ERROR':
      return 'Analyze the latest API response error. Explain the root cause of this HTTP status code/error message, provide concrete step-by-step fix instructions, and highlight any missing headers or bad payload inputs.';

    case 'GENERATE_CODE': {
      const lang = options.language || 'Fetch (JavaScript)';
      return `Convert the current request (${context.request?.method || 'GET'} ${context.request?.url || ''}) into clean, production-ready code in ${lang}. Include headers, authentication, and body payload.`;
    }

    case 'GENERATE_DOCS':
      return 'Generate complete OpenAPI/Postman-style documentation for this endpoint. Include description, URL path, headers, query parameters, request body schema, response example, and error status codes.';

    case 'IMPROVE_REQUEST':
      return 'Review the current API request configuration. Suggest improvements for security (auth/headers), optimization, payload structure, and URL parameters.';

    case 'EXPLAIN_STATUS':
      return `Explain the HTTP status code ${context.response?.status || 200} ${context.response?.statusText || ''}, why it occurs, and standard best practices for handling it in client applications.`;

    default:
      return 'Analyze the current API request and response context.';
  }
}

function sanitizeInput(text) {
  if (!text) return '';
  // Basic prompt injection mitigation
  return String(text)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}
