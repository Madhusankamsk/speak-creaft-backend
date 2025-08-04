require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Import configuration
const { SERVER_CONFIG, DB_CONFIG, RATE_LIMIT_CONFIG } = require('./utils/constants');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import services
const notificationService = require('./services/notificationService');

// Import routes
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const tipsRoutes = require('./routes/tips');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const dailyUnlockRoutes = require('./routes/dailyUnlock');
const notificationRoutes = require('./routes/notifications');
const profileRoutes = require('./routes/profile');

// Initialize express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: SERVER_CONFIG.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Set up Socket.io handler
const SocketHandler = require('./socket/socketHandler');
const socketHandler = new SocketHandler(io);

// Set Socket.io instance in notification service
notificationService.setIO(io);

// Connect to MongoDB
mongoose.connect(DB_CONFIG.URI, DB_CONFIG.OPTIONS)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: SERVER_CONFIG.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  message: {
    error: true,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (SERVER_CONFIG.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: SERVER_CONFIG.NODE_ENV,
    connectedUsers: socketHandler.getConnectedUsersCount()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/tips', tipsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/daily-unlock', dailyUnlockRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'SpeakCraft API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      quiz: '/api/quiz',
      tips: '/api/tips',
      admin: '/api/admin',
      users: '/api/users',
      dailyUnlock: '/api/daily-unlock',
      notifications: '/api/notifications'
    },
    documentation: '/api/docs',
    socket: {
      connected: true,
      connectedUsers: socketHandler.getConnectedUsersCount()
    }
  });
});

// Serve React app for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'Route not found',
      error: true
    });
  }
  
  // Return JSON response for unknown routes
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: true,
    path: req.path
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Export both app and server
module.exports = { app, server, io }; 