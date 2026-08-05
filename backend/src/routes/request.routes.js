import express from 'express';
import { executeRequest } from '../controllers/request.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { requestExecutionLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Requests
 *   description: Request execution forwarder engine
 */

/**
 * @openapi
 * /api/request/execute:
 *   post:
 *     summary: Forward and execute an API request, capturing performance metrics (limited to 10 requests/min)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *               - url
 *             properties:
 *               method:
 *                 type: string
 *                 example: GET
 *               url:
 *                 type: string
 *                 example: https://jsonplaceholder.typicode.com/posts/1
 *     responses:
 *       200:
 *         description: Request executed successfully
 *       429:
 *         description: Rate limit exceeded (more than 10 requests in 1 minute)
 */
router.post('/execute', optionalAuth, requestExecutionLimiter, executeRequest);

export default router;

