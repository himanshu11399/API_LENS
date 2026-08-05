import express from 'express';
import { getHistory, deleteHistoryItem, clearHistory, rerunRequest } from '../controllers/history.controller.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: History
 *   description: Request logs database lookup and re-run executions
 */

router.use(optionalAuth);

/**
 * @openapi
 * /api/history:
 *   get:
 *     summary: Retrieve history entries with pagination and queries
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page offset
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Page limit size
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Substring match for target URL
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *         description: HTTP method name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ALL, 2xx, 3xx, 4xx, 5xx]
 *         description: Response status code class
 *     responses:
 *       200:
 *         description: History logs records list returned
 *   delete:
 *     summary: Clear all request logs for the current user
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History ledger cleared successfully
 */
router.route('/')
  .get(getHistory)
  .delete(clearHistory);

/**
 * @openapi
 * /api/history/{id}:
 *   delete:
 *     summary: Delete a single history log entry
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: History ID
 *     responses:
 *       200:
 *         description: History entry deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Entry not found
 */
router.route('/:id')
  .delete(deleteHistoryItem);

/**
 * @openapi
 * /api/history/{id}/rerun:
 *   post:
 *     summary: Execute a historical request again, capturing new metrics
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: History ID
 *     responses:
 *       200:
 *         description: Request executed and logged
 */
router.route('/:id/rerun')
  .post(rerunRequest);

export default router;
