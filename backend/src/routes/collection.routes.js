import express from 'express';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addRequest,
  updateRequest,
  deleteRequest,
  createFolder,
  deleteFolder
} from '../controllers/collection.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Collections
 *   description: Request templates collections and nested folders CRUD
 */

router.use(protect);

/**
 * @openapi
 * /api/collections:
 *   get:
 *     summary: Get all collections for the logged-in user
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user collections
 *   post:
 *     summary: Create a new empty collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Production Tests
 *               description:
 *                 type: string
 *                 example: API test suite for live production deployment
 *     responses:
 *       201:
 *         description: Collection created
 */
router.route('/')
  .get(getCollections)
  .post(createCollection);

/**
 * @openapi
 * /api/collections/{id}:
 *   put:
 *     summary: Update collection meta description
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Collection updated
 *   delete:
 *     summary: Delete collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection ID
 *     responses:
 *       200:
 *         description: Collection deleted
 */
router.route('/:id')
  .put(updateCollection)
  .delete(deleteCollection);

/**
 * @openapi
 * /api/collections/{id}/requests:
 *   post:
 *     summary: Add request template inside collection or specific folder
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - method
 *               - url
 *             properties:
 *               name:
 *                 type: string
 *                 example: Get Health
 *               method:
 *                 type: string
 *                 example: GET
 *               url:
 *                 type: string
 *                 example: https://api.apilens.com/health
 *               folderId:
 *                 type: string
 *                 description: Target folder ID (leave empty for collection root)
 *     responses:
 *       201:
 *         description: Request added to collection
 */
router.route('/:id/requests')
  .post(addRequest);

/**
 * @openapi
 * /api/collections/{id}/requests/{requestId}:
 *   put:
 *     summary: Edit saved request template parameters
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               method:
 *                 type: string
 *               url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request template updated
 *   delete:
 *     summary: Delete request template from collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request template deleted
 */
router.route('/:id/requests/:requestId')
  .put(updateRequest)
  .delete(deleteRequest);

/**
 * @openapi
 * /api/collections/{id}/folders:
 *   post:
 *     summary: Create folder inside collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: User API
 *     responses:
 *       201:
 *         description: Folder created
 */
router.route('/:id/folders')
  .post(createFolder);

/**
 * @openapi
 * /api/collections/{id}/folders/{folderId}:
 *   delete:
 *     summary: Delete a folder and all its nested requests
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder deleted
 */
router.route('/:id/folders/:folderId')
  .delete(deleteFolder);

export default router;
