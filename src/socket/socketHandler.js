const jwt = require('jsonwebtoken');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { JWT_SECRET } = require('../utils/constants');
const { logInfo, logError } = require('../utils/helpers');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  // Setup Socket.io middleware for authentication
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace('Bearer ', '');
        
        // Verify JWT token
        const decoded = jwt.verify(cleanToken, JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.userId || decoded.adminId);
        if (!user || !user.isActive) {
          return next(new Error('User not found or inactive'));
        }

        // Attach user to socket
        socket.user = user;
        next();
      } catch (error) {
        logError(error, 'Socket authentication');
        next(new Error('Authentication failed'));
      }
    });
  }

  // Setup event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  // Handle new connection
  handleConnection(socket) {
    const userId = socket.user._id.toString();
    
    // Store connected user
    this.connectedUsers.set(userId, socket.id);
    
    // Join user-specific room
    socket.join(`user_${userId}`);
    
    // Handle user connection in notification service
    notificationService.handleUserConnection(socket, userId);
    
    logInfo('User connected', { 
      userId, 
      socketId: socket.id, 
      userEmail: socket.user.email 
    });

    // Send initial unread notification count
    this.sendUnreadCount(socket, userId);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket, userId);
    });

    // Handle notification read
    socket.on('notification:read', async (data) => {
      await this.handleNotificationRead(socket, userId, data);
    });

    // Handle notification read all
    socket.on('notification:readAll', async () => {
      await this.handleNotificationReadAll(socket, userId);
    });

    // Handle user typing (for future chat features)
    socket.on('typing:start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing:stop', (data) => {
      this.handleTypingStop(socket, data);
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle custom events
    socket.on('user:activity', (data) => {
      this.handleUserActivity(socket, userId, data);
    });

    // Handle admin events (if user is admin)
    if (socket.user.role === 'admin') {
      socket.join('admin_room');
      this.handleAdminConnection(socket);
    }
  }

  // Handle disconnection
  handleDisconnection(socket, userId) {
    // Remove from connected users
    this.connectedUsers.delete(userId);
    
    // Handle in notification service
    notificationService.handleUserDisconnection(socket, userId);
    
    logInfo('User disconnected', { 
      userId, 
      socketId: socket.id, 
      userEmail: socket.user.email 
    });
  }

  // Send unread notification count
  async sendUnreadCount(socket, userId) {
    try {
      const count = await notificationService.getUnreadCount(userId);
      socket.emit('notification:unreadCount', { count });
    } catch (error) {
      logError(error, 'sendUnreadCount');
    }
  }

  // Handle notification read
  async handleNotificationRead(socket, userId, data) {
    try {
      const { notificationId } = data;
      await notificationService.markNotificationAsRead(userId, notificationId);
      
      // Update unread count
      const count = await notificationService.getUnreadCount(userId);
      socket.emit('notification:unreadCount', { count });
      
      logInfo('Notification marked as read via socket', { userId, notificationId });
    } catch (error) {
      logError(error, 'handleNotificationRead');
      socket.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  // Handle notification read all
  async handleNotificationReadAll(socket, userId) {
    try {
      await notificationService.markAllNotificationsAsRead(userId);
      
      // Update unread count
      socket.emit('notification:unreadCount', { count: 0 });
      
      logInfo('All notifications marked as read via socket', { userId });
    } catch (error) {
      logError(error, 'handleNotificationReadAll');
      socket.emit('error', { message: 'Failed to mark all notifications as read' });
    }
  }

  // Handle typing start
  handleTypingStart(socket, data) {
    const { room } = data;
    socket.to(room).emit('typing:start', {
      userId: socket.user._id,
      userName: socket.user.name
    });
  }

  // Handle typing stop
  handleTypingStop(socket, data) {
    const { room } = data;
    socket.to(room).emit('typing:stop', {
      userId: socket.user._id
    });
  }

  // Handle user activity
  handleUserActivity(socket, userId, data) {
    // Log user activity for analytics
    logInfo('User activity', { 
      userId, 
      activity: data.type, 
      timestamp: new Date().toISOString() 
    });
  }

  // Handle admin connection
  handleAdminConnection(socket) {
    logInfo('Admin connected', { 
      adminId: socket.user._id, 
      adminEmail: socket.user.email 
    });

    // Send admin dashboard updates
    socket.emit('admin:dashboard:update', {
      message: 'Admin dashboard connected'
    });

    // Handle admin-specific events
    socket.on('admin:user:update', (data) => {
      this.handleAdminUserUpdate(socket, data);
    });

    socket.on('admin:stats:request', () => {
      this.handleAdminStatsRequest(socket);
    });
  }

  // Handle admin user update
  handleAdminUserUpdate(socket, data) {
    // Broadcast user update to all admin clients
    this.io.to('admin_room').emit('admin:user:updated', data);
  }

  // Handle admin stats request
  async handleAdminStatsRequest(socket) {
    try {
      // Get real-time stats
      const stats = await this.getRealTimeStats();
      socket.emit('admin:stats:response', stats);
    } catch (error) {
      logError(error, 'handleAdminStatsRequest');
      socket.emit('error', { message: 'Failed to get stats' });
    }
  }

  // Get real-time stats
  async getRealTimeStats() {
    try {
      const [
        totalUsers,
        onlineUsers,
        totalTips,
        totalQuestions
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        this.connectedUsers.size,
        require('../models/Tip').countDocuments({ isActive: true }),
        require('../models/Question').countDocuments({ isActive: true })
      ]);

      return {
        totalUsers,
        onlineUsers,
        totalTips,
        totalQuestions,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logError(error, 'getRealTimeStats');
      throw error;
    }
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit('notification:new', notification);
    }
  }

  // Send notification to all users
  sendNotificationToAll(notification) {
    this.io.emit('notification:new', notification);
  }

  // Send notification to admin users
  sendNotificationToAdmins(notification) {
    this.io.to('admin_room').emit('admin:notification', notification);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users list
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }
}

module.exports = SocketHandler; 