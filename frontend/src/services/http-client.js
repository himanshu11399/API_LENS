import { getTokens } from './storage.js';
import { API_BASE_URL } from '../config/api.js';

/**
 * Send an HTTP request through the backend proxy.
 * Automatically includes auth headers if user is logged in.
 * @param {Object} config
 * @param {string} config.method
 * @param {string} config.url
 * @param {Array}  config.headers  - [{key, value, enabled}]
 * @param {Array}  config.params   - [{key, value, enabled}]
 * @param {string} config.body     - raw body string
 * @param {Object} config.auth     - {type, token, username, password, apiKey, addTo}
 * @returns {Promise<Object>} result
 */
export async function sendRequest(config) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Attach auth token if available
    const { accessToken } = getTokens();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/request/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify(config)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        statusText: response.status === 429 ? 'Too Many Requests' : (response.statusText || 'Error'),
        duration: 0,
        size: 0,
        headers: [],
        body: data,
        bodyText: data.error || (typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)),
        cookies: [],
        error: data.error || 'Rate limit exceeded'
      };
    }

    return {
      success: data.success,
      status: data.status,
      statusText: data.statusText,
      duration: data.duration,
      size: data.size,
      headers: data.headers || [],
      body: data.body,
      bodyText: typeof data.body === 'object' ? JSON.stringify(data.body, null, 2) : (data.body || ''),
      cookies: []
    };
  } catch (err) {
    return {
      success: false,
      status: 0,
      statusText: 'Network Error',
      duration: 0,
      size: 0,
      headers: [],
      body: null,
      bodyText: '',
      cookies: [],
      error: err.message
    };
  }
}

function parseCookies(headers) {
  const cookies = [];
  const setCookie = headers.get('set-cookie');
  if (setCookie) {
    setCookie.split(',').forEach(c => {
      const parts = c.trim().split(';');
      const [nameVal, ...attrs] = parts;
      const [name, ...valParts] = nameVal.split('=');
      cookies.push({
        name: name?.trim(),
        value: valParts.join('=').trim(),
        attributes: attrs.map(a => a.trim()),
      });
    });
  }
  return cookies;
}
