/* ============================================
   APILens — AI Controller
   ============================================ */

import { processChat, processQuickAction } from '../services/ai/chat_assistance.js';

// @desc    Chat with AI Assistant
// @route   POST /api/ai/chat
export const handleChat = async (req, res, next) => {
  const { message, context, sessionId } = req.body;
  const effectiveSessionId = sessionId || (req.user ? req.user.id : req.ip);

  try {
    const result = await processChat({
      message,
      sessionId: effectiveSessionId,
      context: context || {}
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// @desc    Trigger AI Quick Actions (Explain Response, Debug Error, Generate Code, etc.)
// @route   POST /api/ai/quick-action
export const handleQuickAction = async (req, res, next) => {
  const { actionType, context, options, sessionId } = req.body;
  const effectiveSessionId = sessionId || (req.user ? req.user.id : req.ip);

  try {
    if (!actionType) {
      return res.status(400).json({ error: 'Action type is required' });
    }

    const result = await processQuickAction({
      actionType,
      sessionId: effectiveSessionId,
      context: context || {},
      options: options || {}
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// @desc    Generate structured request object for populating workspace editor
// @route   POST /api/ai/generate-request
export const handleGenerateRequest = async (req, res, next) => {
  const { prompt, context, sessionId } = req.body;
  const effectiveSessionId = sessionId || (req.user ? req.user.id : req.ip);

  try {
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const fullPrompt = `Please generate an API request based on the following instruction: "${prompt}".\nOutput a structured JSON request block (\`\`\`json:request) containing name, method, url, headers, params, and body.`;

    const result = await processChat({
      message: fullPrompt,
      sessionId: effectiveSessionId,
      context: context || {}
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
