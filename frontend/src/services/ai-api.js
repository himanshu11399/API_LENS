/* ============================================
   APILens — AI API Service
   ============================================ */

import { apiRequest } from './auth.js';
import { API_BASE_URL } from '../config/api.js';

const BASE_URL = `${API_BASE_URL}/api/ai`;

/**
 * Send a chat message to AI assistant with current workspace context
 * @param {string} message
 * @param {Object} context - { request, response, collection, history }
 * @param {string} sessionId
 */
export async function sendAiChatMessage(message, context = {}, sessionId = 'default') {
  const res = await apiRequest(`${BASE_URL}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, context, sessionId })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'AI request failed');
  }
  return data;
}

/**
 * Execute an AI Quick Action (Explain Response, Debug Error, Generate Code, etc.)
 * @param {string} actionType - 'EXPLAIN_RESPONSE'|'DEBUG_ERROR'|'GENERATE_CODE'|'GENERATE_DOCS'|'IMPROVE_REQUEST'|'EXPLAIN_STATUS'
 * @param {Object} context
 * @param {Object} options - { language }
 * @param {string} sessionId
 */
export async function triggerAiQuickAction(actionType, context = {}, options = {}, sessionId = 'default') {
  const res = await apiRequest(`${BASE_URL}/quick-action`, {
    method: 'POST',
    body: JSON.stringify({ actionType, context, options, sessionId })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Quick action failed');
  }
  return data;
}

/**
 * Request AI to generate a structured request object from natural language
 * @param {string} prompt
 * @param {Object} context
 * @param {string} sessionId
 */
export async function generateRequestFromPrompt(prompt, context = {}, sessionId = 'default') {
  const res = await apiRequest(`${BASE_URL}/generate-request`, {
    method: 'POST',
    body: JSON.stringify({ prompt, context, sessionId })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request generation failed');
  }
  return data;
}
