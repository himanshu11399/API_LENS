import History from '../models/History.js';
import { getActiveUsersCount } from '../sockets/socket.js';

// @desc    Get active online users count
// @route   GET /api/stats/active-users
export const getActiveUsers = async (req, res, next) => {
  try {
    const count = getActiveUsersCount();
    res.status(200).json({ activeUsers: count });
  } catch (err) {
    next(err);
  }
};

// @desc    Get calculated request analytics statistics
// @route   GET /api/stats/analytics
export const getAnalytics = async (req, res, next) => {
  const userId = req.user ? req.user.id : null;
  const timeFilter = req.query.filter || 'ALL'; // ALL, 1H, 24H, 7D, 30D
  const now = new Date();

  // 1. Build filter query
  const query = { userId };

  if (timeFilter === '1H') {
    query.timestamp = { $gte: new Date(now.getTime() - 60 * 60 * 1000) };
  } else if (timeFilter === '24H') {
    query.timestamp = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
  } else if (timeFilter === '7D') {
    query.timestamp = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  } else if (timeFilter === '30D') {
    query.timestamp = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
  }

  try {
    // Capped query to latest 500 logs inside the filtered period
    const logs = await History.find(query)
      .sort({ timestamp: -1 })
      .limit(500);

    const total = logs.length;
    const durations = logs.map(l => l.duration).filter(Boolean);
    
    // Sort durations to calculate p90
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p90 = sortedDurations.length ? sortedDurations[Math.floor(sortedDurations.length * 0.9)] : 0;

    const successes = logs.filter(l => l.success).length;
    const errors = total - successes;
    
    const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const slowest = durations.length ? Math.max(...durations) : 0;
    const fastest = durations.length ? Math.min(...durations) : 0;
    
    const successRate = total ? Math.round((successes / total) * 1000) / 10 : 0;
    const errorRate = total ? Math.round((errors / total) * 1000) / 10 : 0;
    const totalBytes = logs.reduce((acc, l) => acc + (l.size || 0), 0);

    // Group status code distributions
    const statusCounts = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
    logs.forEach(l => {
      if (l.status >= 200 && l.status < 300) statusCounts['2xx']++;
      else if (l.status >= 300 && l.status < 400) statusCounts['3xx']++;
      else if (l.status >= 400 && l.status < 500) statusCounts['4xx']++;
      else if (l.status >= 500 || l.status === 0) statusCounts['5xx']++;
    });

    // Group HTTP method distributions
    const methodCounts = { GET: 0, POST: 0, PUT: 0, PATCH: 0, DELETE: 0 };
    logs.forEach(l => {
      const m = l.method?.toUpperCase();
      if (methodCounts[m] !== undefined) {
        methodCounts[m]++;
      }
    });

    // Slowest endpoints leaderboard
    const endpointStats = {};
    logs.forEach(l => {
      let path = 'Unknown';
      try {
        const url = new URL(l.url);
        path = url.pathname;
      } catch {
        path = l.url || 'Unknown';
      }

      if (!endpointStats[path]) {
        endpointStats[path] = { path, totalDuration: 0, count: 0, method: l.method };
      }
      endpointStats[path].totalDuration += l.duration || 0;
      endpointStats[path].count += 1;
    });

    const slowestEndpoints = Object.values(endpointStats).map(e => ({
      path: e.path,
      method: e.method,
      avgDuration: Math.round(e.totalDuration / e.count),
      count: e.count
    })).sort((a, b) => b.avgDuration - a.avgDuration).slice(0, 5);

    // Cronological sparklines coordinates
    const recentLogs = [...logs].reverse().slice(-15);
    const sparklines = {
      latencies: recentLogs.map(l => l.duration),
      success: recentLogs.map((l, i) => {
        const subset = recentLogs.slice(0, i + 1);
        const succ = subset.filter(x => x.success).length;
        return Math.round((succ / subset.length) * 100);
      }),
      volume: recentLogs.map((_, i) => i + 1),
      sizes: recentLogs.map(l => l.size)
    };

    res.status(200).json({
      summary: {
        totalRequests: total,
        successRequests: successes,
        failedRequests: errors,
        avgResponseTime: avg,
        p90ResponseTime: p90,
        slowestRequest: slowest,
        fastestRequest: fastest,
        successRate,
        errorRate,
        totalBytes
      },
      statusDistribution: statusCounts,
      methodDistribution: methodCounts,
      leaderboard: slowestEndpoints,
      sparklines
    });

  } catch (err) {
    next(err);
  }
};
