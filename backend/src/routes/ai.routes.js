/* ============================================
   APILens — AI Routes
   ============================================ */

import express from 'express';
import { handleChat, handleQuickAction, handleGenerateRequest } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: AI Assistant
 *   description: AI Assistant Chat, Debug, Code Generation, and Request Synthesis (Requires Authentication)
 */

router.post('/chat', protect, authLimiter, handleChat);
router.post('/quick-action', protect, authLimiter, handleQuickAction);
router.post('/generate-request', protect, authLimiter, handleGenerateRequest);

export default router;
