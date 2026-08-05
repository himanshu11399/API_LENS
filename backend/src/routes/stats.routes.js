import express from 'express';
import { getActiveUsers, getAnalytics } from '../controllers/stats.controller.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Stats
 *   description: Realcalculated analytics and online connections
 */

/**
 * @openapi
 * /api/stats/active-users:
 *   get:
 *     summary: Retrieve the actual count of active users currently online
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Connections count returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activeUsers:
 *                   type: integer
 *                   example: 1
 */
router.get('/active-users', getActiveUsers);

/**
 * @openapi
 * /api/stats/analytics:
 *   get:
 *     summary: Calculate and fetch statistics (success rate, average latency, p90, slowest, methods)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [ALL, 1H, 24H, 7D, 30D]
 *         description: Time window filter
 *     responses:
 *       200:
 *         description: Aggregated metrics returned successfully
 */
router.get('/analytics', optionalAuth, getAnalytics);

export default router;
