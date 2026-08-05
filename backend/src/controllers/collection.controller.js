import Collection from '../models/Collection.js';
import { broadcastCollectionUpdate } from '../sockets/socket.js';

// @desc    Get all collections for logged in user
// @route   GET /api/collections
export const getCollections = async (req, res, next) => {
  try {
    const collections = await Collection.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(collections);
  } catch (err) {
    next(err);
  }
};

// @desc    Create a collection
// @route   POST /api/collections
export const createCollection = async (req, res, next) => {
  const { name, description } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const collection = await Collection.create({
      userId: req.user.id,
      name,
      description
    });

    broadcastCollectionUpdate(req.user.id, { action: 'CREATE', collection });

    res.status(201).json(collection);
  } catch (err) {
    next(err);
  }
};

// @desc    Update collection meta
// @route   PUT /api/collections/:id
export const updateCollection = async (req, res, next) => {
  const { name, description } = req.body;

  try {
    let collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this collection' });
    }

    collection.name = name || collection.name;
    collection.description = description !== undefined ? description : collection.description;
    await collection.save();

    broadcastCollectionUpdate(req.user.id, { action: 'UPDATE', collection });

    res.status(200).json(collection);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete collection
// @route   DELETE /api/collections/:id
export const deleteCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this collection' });
    }

    await collection.deleteOne();

    broadcastCollectionUpdate(req.user.id, { action: 'DELETE', collectionId: req.params.id });

    res.status(200).json({ success: true, message: 'Collection deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a request template to collection or folder
// @route   POST /api/collections/:id/requests
export const addRequest = async (req, res, next) => {
  const { name, method, url, headers, params, body, auth, folderId } = req.body;

  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const reqName = (name && name.trim()) ? name.trim() : (url ? `${method || 'GET'} ${url}` : 'Untitled Request');
    const requestData = { name: reqName, method: method || 'GET', url: url || '', headers, params, body, auth };

    if (folderId) {
      const folder = collection.folders.id(folderId);
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
      folder.requests.push(requestData);
    } else {
      collection.requests.push(requestData);
    }

    await collection.save();
    broadcastCollectionUpdate(req.user.id, { action: 'UPDATE', collection });

    res.status(201).json(collection);
  } catch (err) {
    next(err);
  }
};

// @desc    Update a request template inside collection
// @route   PUT /api/collections/:id/requests/:requestId
export const updateRequest = async (req, res, next) => {
  const { name, method, url, headers, params, body, auth, folderId } = req.body;

  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    let request = null;

    if (folderId) {
      const folder = collection.folders.id(folderId);
      if (folder) {
        request = folder.requests.id(req.params.requestId);
      }
    } else {
      request = collection.requests.id(req.params.requestId);
    }

    // fallback search all folders if folderId wasn't passed but request is inside a folder
    if (!request) {
      for (const folder of collection.folders) {
        request = folder.requests.id(req.params.requestId);
        if (request) break;
      }
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.name = name || request.name;
    request.method = method || request.method;
    request.url = url || request.url;
    request.headers = headers || request.headers;
    request.params = params || request.params;
    request.body = body !== undefined ? body : request.body;
    request.auth = auth || request.auth;

    await collection.save();
    broadcastCollectionUpdate(req.user.id, { action: 'UPDATE', collection });

    res.status(200).json(collection);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete request template from collection
// @route   DELETE /api/collections/:id/requests/:requestId
export const deleteRequest = async (req, res, next) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Attempt to pull from root requests
    const rootReqIndex = collection.requests.findIndex(r => r._id.toString() === req.params.requestId);
    if (rootReqIndex !== -1) {
      collection.requests.splice(rootReqIndex, 1);
    } else {
      // Find and pull from folders
      let pulled = false;
      for (const folder of collection.folders) {
        const reqIdx = folder.requests.findIndex(r => r._id.toString() === req.params.requestId);
        if (reqIdx !== -1) {
          folder.requests.splice(reqIdx, 1);
          pulled = true;
          break;
        }
      }
      if (!pulled) {
        return res.status(404).json({ error: 'Request not found' });
      }
    }

    await collection.save();
    broadcastCollectionUpdate(req.user.id, { action: 'UPDATE', collection });

    res.status(200).json(collection);
  } catch (err) {
    next(err);
  }
};

// @desc    Create subfolder inside collection
// @route   POST /api/collections/:id/folders
export const createFolder = async (req, res, next) => {
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    collection.folders.push({ name, requests: [] });
    await collection.save();

    broadcastCollectionUpdate(req.user.id, { action: 'UPDATE', collection });

    res.status(201).json(collection);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a folder and its templates
// @route   DELETE /api/collections/:id/folders/:folderId
export const deleteFolder = async (req, res, next) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const folderIndex = collection.folders.findIndex(f => f._id.toString() === req.params.folderId);
    if (folderIndex === -1) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    collection.folders.splice(folderIndex, 1);
    await collection.save();

    broadcastCollectionUpdate(req.user.id, { action: 'UPDATE', collection });

    res.status(200).json(collection);
  } catch (err) {
    next(err);
  }
};
