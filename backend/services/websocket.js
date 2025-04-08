const socketio = require('socket.io');
const { subClient } = require('./redisClient');
const jwt = require('jsonwebtoken');

let io;
const userSockets = new Map(); 

const initSocket = (server) => {
  io = socketio(server, { 
    cors: { 
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'] 
    },
    pingTimeout: 10000,
    pingInterval: 5000,
    connectTimeout: 15000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
  
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    
    console.log('Usuário conectado:', userId);
    
    userSockets.set(userId, socket);

    socket.on('typing', ({ receiverId, isTyping }) => {
      const receiverSocket = userSockets.get(receiverId);
      if (receiverSocket) {
        receiverSocket.emit('user_typing', {
          userId: socket.handshake.auth.userId,
          isTyping
        });
      }
    });
    
    socket.on('disconnect', () => {
      userSockets.delete(userId);
      console.log('Usuário desconectado:', userId);
    });


  });

  subClient.subscribe('new_messages', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      
      const senderSocket = userSockets.get(parsedMessage.sender_id);
      const receiverSocket = userSockets.get(parsedMessage.receiver_id);
      
      if (senderSocket) senderSocket.emit('new_message', parsedMessage);
      if (receiverSocket) receiverSocket.emit('new_message', parsedMessage);
      
    } catch (err) {
      console.error('Erro ao processar mensagem:', err);
    }
  });
};

module.exports = { initSocket };
