require('dotenv').config();
const { server } = require('./app');
const { SERVER_CONFIG } = require('./utils/constants');
const cronJobManager = require('./scripts/cronJobs');

const PORT = SERVER_CONFIG.PORT;

server.listen(PORT, () => {
  console.log(`🚀 SpeakCraft backend server running on port ${PORT}`);
  console.log(`🌍 Environment: ${SERVER_CONFIG.NODE_ENV}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.io: ws://localhost:${PORT}`);
  
  // Initialize and start cron jobs
  cronJobManager.init();
  cronJobManager.start();
  console.log(`⏰ Cron jobs started`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server; 