import jwt from 'jsonwebtoken';

let ioInstance = null;
const activeConnections = new Set();

export function initSockets(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Track new connection
    activeConnections.add(socket.id);
    console.log(`Socket connected: ${socket.id} (Total Online: ${activeConnections.size})`);
    
    // Broadcast active users count on connection
    broadcastActiveUsersCount();

    // Authenticate client connection optionally to join user-specific channel
    socket.on('authenticate', (token) => {
      if (!token) return;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.join(decoded.id.toString());
        console.log(`Socket ${socket.id} authenticated for User: ${decoded.id}`);
      } catch (err) {
        socket.emit('error', 'Authentication failed');
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      activeConnections.delete(socket.id);
      console.log(`Socket disconnected: ${socket.id} (Total Online: ${activeConnections.size})`);
      broadcastActiveUsersCount();
    });
  });
}

// Get the actual number of connected users
export function getActiveUsersCount() {
  return activeConnections.size;
}

// Broadcast online users count globally
export function broadcastActiveUsersCount() {
  if (ioInstance) {
    ioInstance.emit('activeUsersCount', { activeUsers: activeConnections.size });
  }
}

// Send real-time request analytics updates to a specific user (or globally if guest)
export function broadcastRequestAnalyticsUpdate(userId, data) {
  if (!ioInstance) return;
  if (userId) {
    ioInstance.to(userId.toString()).emit('requestAnalyticsUpdate', data);
  } else {
    // broadcast to general guest room or globally
    ioInstance.emit('requestAnalyticsUpdate', data);
  }
}

// Send real-time collection updates to a specific user
export function broadcastCollectionUpdate(userId, data) {
  if (!ioInstance || !userId) return;
  ioInstance.to(userId.toString()).emit('collectionUpdate', data);
}
