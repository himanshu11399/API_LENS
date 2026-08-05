/* ============================================
   APILens — AI Assistant Core Service
   Orchestrates AI provider, context builder, prompt builder, & session memory
   ============================================ */

import { aiProvider } from './aiProvider.js';
import { buildContext } from './contextBuilder.js';
import { buildPromptMessages, buildQuickActionQuery } from './promptBuilder.js';
import { conversationMemory } from './conversationMemory.js';

/**
 * Handle conversational AI chat request
 * @param {Object} params
 * @param {string} params.message - user prompt message
 * @param {string} params.sessionId - user session or socket ID
 * @param {Object} params.context - workspace context (request, response, collection, history)
 * @returns {Promise<Object>} response - { content, reasoning, provider, model, parsedRequest }
 */
export async function processChat({ message, sessionId = 'default', context = {} }) {
  if (!message || !message.trim()) {
    throw new Error('Message content is required');
  }

  // 1. Build sanitized context
  const structuredContext = buildContext(context);

  // 2. Fetch session history memory
  const history = conversationMemory.getHistory(sessionId);

  // 3. Build prompt messages array
  const messages = buildPromptMessages(message, structuredContext, history);

  // 4. Execute completion via AI provider
  const result = await aiProvider.generateCompletion(messages);

  // 5. Store turn in conversation memory
  conversationMemory.addTurn(sessionId, message, result.content);

  // 6. Check if response contains structured request JSON payload to populate editor
  const parsedRequest = extractStructuredRequest(result.content);

  return {
    success: true,
    content: result.content,
    reasoning: result.reasoning,
    provider: result.provider,
    model: result.model,
    parsedRequest
  };
}

/**
 * Handle AI quick actions (Explain Response, Debug Error, Generate Code, etc.)
 * @param {Object} params
 * @param {string} params.actionType - 'EXPLAIN_RESPONSE'|'DEBUG_ERROR'|'GENERATE_CODE'|'GENERATE_DOCS'|'IMPROVE_REQUEST'|'EXPLAIN_STATUS'
 * @param {string} params.sessionId
 * @param {Object} params.context
 * @param {Object} params.options - { language }
 */
export async function processQuickAction({ actionType, sessionId = 'default', context = {}, options = {} }) {
  const query = buildQuickActionQuery(actionType, context, options);
  return await processChat({ message: query, sessionId, context });
}

/**
 * Parse structured JSON request payload block from AI message if present
 */
function extractStructuredRequest(content) {
  if (!content) return null;
  const match = content.match(/```json:request\s*([\s\S]*?)\s*```/) || content.match(/```json\s*(\{[\s\S]*?"url"[\s\S]*?\})\s*```/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch {
      return null;
    }
  }
  return null;
}
