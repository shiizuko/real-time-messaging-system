const socketio = require('socket.io');
const { subClient } = require('./redisClient');

let io;
const userSockets = new Map(); 

const initSocket = (server) => {
  io = socketio(server, { cors: { origin: '*' } });
  
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
