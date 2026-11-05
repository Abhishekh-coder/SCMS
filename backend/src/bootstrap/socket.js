const { Server } = require('socket.io');
const { logger } = require('../config/logger');

let ioInstance = null;

function initializeSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);
    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('⚡ Socket.io Service Initialized');
  return ioInstance;
}

function getIO() {
  return ioInstance;
}

module.exports = { initializeSocket, getIO };
