/* ============================================
   APILens — Context Builder Service
   Aggregates workspace, request, response, collection, and history context
   ============================================ */

/**
 * Build a structured, sanitized context object for AI prompt construction
 * @param {Object} inputContext
 * @param {Object} inputContext.request - active request state
 * @param {Object} inputContext.response - latest response object
 * @param {Object} inputContext.collection - active collection context
 * @param {Array}  inputContext.history - recent history logs
 * @returns {Object} structuredContext
 */
export function buildContext(inputContext = {}) {
  const { request, response, collection, history } = inputContext;

  const context = {
    timestamp: new Date().toISOString(),
    hasActiveRequest: false,
    hasActiveResponse: false,
  };

  // 1. Sanitize Request Context
  if (request && (request.url || request.method)) {
    context.hasActiveRequest = true;
    context.request = {
      method: request.method || 'GET',
      url: request.url || '',
      headers: filterEnabled(request.headers),
      params: filterEnabled(request.params),
      authType: request.auth?.type || 'none',
      body: truncateBody(request.body, 1500)
    };
  }

  // 2. Sanitize Response Context
  if (response && response.status !== undefined) {
    context.hasActiveResponse = true;
    context.response = {
      status: response.status,
      statusText: response.statusText || getHttpStatusText(response.status),
      durationMs: response.duration || 0,
      sizeBytes: response.size || 0,
      headers: Array.isArray(response.headers) ? response.headers.slice(0, 15) : [],
      bodySample: truncateBody(response.bodyText || response.body, 2000)
    };
  }

  // 3. Collection Context
  if (collection && collection.name) {
    context.collection = {
      name: collection.name,
      description: collection.description || '',
      requestCount: (collection.requests || []).length
    };
  }

  // 4. Recent History Context (last 5 entries)
  if (Array.isArray(history) && history.length > 0) {
    context.recentHistory = history.slice(0, 5).map(h => ({
      method: h.method,
      url: h.url,
      status: h.status,
      durationMs: h.duration
    }));
  }

  return context;
}

function filterEnabled(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(item => item && item.enabled !== false && item.key)
    .map(item => ({ key: item.key, value: item.value }));
}

function truncateBody(body, maxLen = 2000) {
  if (!body) return '';
  let str = typeof body === 'object' ? JSON.stringify(body, null, 2) : String(body);
  if (str.length > maxLen) {
    return str.slice(0, maxLen) + `\n... [Truncated ${str.length - maxLen} bytes]`;
  }
  return str;
}

function getHttpStatusText(code) {
  const map = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 422: 'Unprocessable Entity', 429: 'Too Many Requests',
    500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable'
  };
  return map[code] || 'Unknown';
}
