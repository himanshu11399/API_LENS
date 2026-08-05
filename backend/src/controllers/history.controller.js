import History from '../models/History.js';
import { optionalAuth } from '../middleware/auth.js';
import axios from 'axios';

// @desc    Get request history with pagination, query search, and method filtering
// @route   GET /api/history
export const getHistory = async (req, res, next) => {
  const userId = req.user ? req.user.id : null;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { search, method, status } = req.query;

  // Build filter query
  const query = { userId }; // show logged user records or anonymous guest records

  if (search) {
    query.url = { $regex: search, $options: 'i' };
  }

  if (method && method !== 'ALL') {
    query.method = method.toUpperCase();
  }

  if (status && status !== 'ALL') {
    if (status === '2xx') {
      query.status = { $gte: 200, $lt: 300 };
    } else if (status === '3xx') {
      query.status = { $gte: 300, $lt: 400 };
    } else if (status === '4xx') {
      query.status = { $gte: 400, $lt: 500 };
    } else if (status === '5xx') {
      query.status = { $gte: 500 };
    }
  }

  try {
    const total = await History.countDocuments(query);
    const logs = await History.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      logs,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      totalCount: total
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a single request history entry
// @route   DELETE /api/history/:id
export const deleteHistoryItem = async (req, res, next) => {
  const userId = req.user ? req.user.id : null;

  try {
    const log = await History.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Request log entry not found' });
    }

    // Ownership check (both must be null or match req.user.id)
    if (log.userId?.toString() !== userId?.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this request log' });
    }

    await log.deleteOne();
    res.status(200).json({ success: true, message: 'Request log entry deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Clear all request history logs for user
// @route   DELETE /api/history
export const clearHistory = async (req, res, next) => {
  const userId = req.user ? req.user.id : null;

  try {
    await History.deleteMany({ userId });
    res.status(200).json({ success: true, message: 'All request history cleared successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Re-run an existing historical request
// @route   POST /api/history/:id/rerun
export const rerunRequest = async (req, res, next) => {
  const userId = req.user ? req.user.id : null;

  try {
    const log = await History.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Request log not found' });
    }

    // Prepare forward options from log template
    const headersList = Object.entries(log.requestHeaders || {}).map(([key, value]) => ({
      key,
      value,
      enabled: true
    }));

    const paramsList = Object.entries(log.queryParams || {}).map(([key, value]) => ({
      key,
      value,
      enabled: true
    }));

    // Forward execution back to execution logic (proxy call helper)
    req.body = {
      method: log.method,
      url: log.url,
      headers: headersList,
      params: paramsList,
      body: log.requestBody
    };

    // Re-use request forwarding execution handler
    // We import and direct call the logic from request controller
    // Wait, let's just forward it using redirect or import the executeRequest module
    // To prevent circular dependency, we did it cleanly: we will just forward the req, res
    const { executeRequest } = await import('./request.controller.js');
    return executeRequest(req, res, next);

  } catch (err) {
    next(err);
  }
};
