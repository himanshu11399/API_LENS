import axios from 'axios';
import History from '../models/History.js';
import { broadcastRequestAnalyticsUpdate } from '../sockets/socket.js';

// @desc    Execute an API request and record stats
// @route   POST /api/request/execute
export const executeRequest = async (req, res, next) => {
  const { method, url, headers = [], params = [], body, auth } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!url) {
    return res.status(400).json({ error: 'Request URL is required' });
  }

  // 1. Build Query Parameters
  const parsedParams = {};
  const queryObj = {};
  headers.forEach(h => {
    if (h.enabled && h.key) {
      queryObj[h.key] = h.value;
    }
  });
  
  params.filter(p => p.enabled && p.key).forEach(p => {
    parsedParams[p.key] = p.value;
  });

  // 2. Build Headers
  const parsedHeaders = {};
  headers.filter(h => h.enabled && h.key).forEach(h => {
    parsedHeaders[h.key] = h.value;
  });

  // 3. Setup Auth Headers
  if (auth) {
    if (auth.type === 'bearer' && auth.token) {
      parsedHeaders['Authorization'] = `Bearer ${auth.token}`;
    } else if (auth.type === 'basic' && auth.username) {
      parsedHeaders['Authorization'] = 'Basic ' + Buffer.from(`${auth.username}:${auth.password || ''}`).toString('base64');
    } else if (auth.type === 'apikey' && auth.apiKey) {
      const headerName = auth.headerName || 'X-API-Key';
      if (auth.addTo === 'header') {
        parsedHeaders[headerName] = auth.apiKey;
      } else if (auth.addTo === 'query') {
        parsedParams[headerName] = auth.apiKey;
      }
    }
  }

  // 4. Build Axios Configuration
  const axiosConfig = {
    method: method.toUpperCase(),
    url: url,
    headers: parsedHeaders,
    params: parsedParams,
    data: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase()) ? body : undefined,
    timeout: 15000, // 15s timeout
    validateStatus: () => true, // Don't throw errors for non-2xx status codes
    responseType: 'text' // capture raw text response first
  };

  const startTime = performance.now();
  let result = null;

  try {
    const response = await axios(axiosConfig);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // Parse response body if JSON
    let parsedBody = response.data;
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      try {
        parsedBody = JSON.parse(response.data);
      } catch {
        parsedBody = response.data;
      }
    }

    // Estimate response size in bytes
    const sizeBytes = Buffer.byteLength(response.data || '', 'utf8');

    result = {
      success: response.status >= 200 && response.status < 400,
      status: response.status,
      statusText: response.statusText || 'OK',
      duration,
      size: sizeBytes,
      headers: Object.entries(response.headers).map(([key, value]) => ({ key, value })),
      body: parsedBody
    };

  } catch (err) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    result = {
      success: false,
      status: 0,
      statusText: err.code || 'Network Error',
      duration,
      size: 0,
      headers: [],
      body: err.message
    };
  }

  try {
    // 5. Store Request in MongoDB History
    const historyEntry = await History.create({
      userId,
      url,
      method: method.toUpperCase(),
      queryParams: parsedParams,
      requestHeaders: parsedHeaders,
      requestBody: body || null,
      responseHeaders: result.headers,
      responseBody: result.body,
      duration: result.duration,
      status: result.status,
      size: result.size,
      success: result.success,
      timestamp: new Date()
    });

    // 6. Broadcast Real-Time socket update for real-time dashboard calculations
    broadcastRequestAnalyticsUpdate(userId, {
      id: historyEntry._id,
      userId,
      method: historyEntry.method,
      url: historyEntry.url,
      status: historyEntry.status,
      duration: historyEntry.duration,
      size: historyEntry.size,
      success: historyEntry.success,
      timestamp: historyEntry.timestamp
    });

    // 7. Return execution details to client
    return res.status(200).json(result);

  } catch (err) {
    next(err);
  }
};
