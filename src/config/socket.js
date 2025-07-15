let io;

function initSocket(server) {
  const socketio = require('socket.io');
  io = socketio(server, {
    cors: {
      origin: process.env.SOCKET_IO_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    // TODO: Add event handlers
  });
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

module.exports = { initSocket, getIO }; 