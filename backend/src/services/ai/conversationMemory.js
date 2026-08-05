/* ============================================
   APILens — Conversation Memory Manager
   Per-session in-memory conversation history manager
   ============================================ */

const sessions = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes TTL
const MAX_MESSAGES_PER_SESSION = 15;

/**
 * Memory manager service
 */
class ConversationMemoryService {
  /**
   * Get history for a session
   * @param {string} sessionId
   * @returns {Array} messages
   */
  getHistory(sessionId) {
    if (!sessionId) return [];
    const session = sessions.get(sessionId);
    if (!session) return [];

    // Check expiry
    if (Date.now() - session.lastAccess > SESSION_TTL_MS) {
      sessions.delete(sessionId);
      return [];
    }

    session.lastAccess = Date.now();
    return session.messages;
  }

  /**
   * Add a message pair (user + assistant) to session history
   * @param {string} sessionId
   * @param {string} userText
   * @param {string} assistantText
   */
  addTurn(sessionId, userText, assistantText) {
    if (!sessionId) return;

    let session = sessions.get(sessionId);
    if (!session) {
      session = { messages: [], lastAccess: Date.now() };
      sessions.set(sessionId, session);
    }

    session.lastAccess = Date.now();
    session.messages.push({ role: 'user', content: userText, timestamp: Date.now() });
    session.messages.push({ role: 'assistant', content: assistantText, timestamp: Date.now() });

    // Truncate to MAX_MESSAGES_PER_SESSION
    if (session.messages.length > MAX_MESSAGES_PER_SESSION * 2) {
      session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION * 2);
    }
  }

  /**
   * Clear session history
   * @param {string} sessionId
   */
  clearSession(sessionId) {
    if (sessionId) {
      sessions.delete(sessionId);
    }
  }
}

// Periodic cleanup of stale sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastAccess > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}, 10 * 60 * 1000);

export const conversationMemory = new ConversationMemoryService();
