const db = require('../services/db');
const { 
    generalClient, 
    pubClient,
    persistClient
  } = require('../services/redisClient');

const getPersistKey = (messageId) => `message:${messageId}`;

exports.sendMessage = async (req, res) => {
    try {
      const { content, receiverId } = req.body;
      const senderId = req.user.id;
  
      const result = await db.query(
        `INSERT INTO messages (content, sender_id, receiver_id)
         VALUES ($1, $2, $3)
         RETURNING id, content, sender_id, receiver_id, created_at`,
        [content, senderId, receiverId]
      );
  
      const newMessage = result.rows[0];

      // Persistência permanente no Redis
      const persistKey = getPersistKey(newMessage.id);
      await persistClient.hSet(persistKey, {
        id: newMessage.id,
        content: newMessage.content,
        sender_id: newMessage.sender_id,
        receiver_id: newMessage.receiver_id,
        created_at: newMessage.created_at.toISOString()
      });

      // Cache com cliente geral - armazena por conversa
      const conversationKey = `conversation:${Math.min(senderId, receiverId)}:${Math.max(senderId, receiverId)}`;
      
      const pipeline = generalClient.multi();
      pipeline.lPush(conversationKey, JSON.stringify(newMessage));
      pipeline.lTrim(conversationKey, 0, 99); 
      pipeline.expire(conversationKey, 3600);
      pipeline.del(`contacts:${senderId}`);
      pipeline.del(`contacts:${receiverId}`);
      await pipeline.exec();

      // Publicar com cliente dedicado
      await pubClient.publish(
        'new_messages', 
        JSON.stringify({
          ...newMessage,
          sender: req.user.username
        })
      );
  
      res.status(201).json(newMessage);
      
    } catch (error) {
      console.error('Erro detalhado:', error);
      res.status(500).json({ 
        error: 'Erro ao enviar mensagem',
        details: error.message 
      });
    }
};

exports.getMessages = async (req, res) => {
    try {
      const userId = req.user.id;
      const { contactId } = req.params;
      
      const conversationKey = `conversation:${Math.min(userId, contactId)}:${Math.max(userId, contactId)}`;
      
      // Tenta obter do Redis
      const cachedMessages = await generalClient.lRange(conversationKey, 0, -1);
      if (cachedMessages.length > 0) {
        const messages = cachedMessages.map(msg => JSON.parse(msg));
        return res.json(messages);
      }
  
      // Se não houver cache, busca do PostgreSQL
      const result = await db.query(
        `SELECT m.*, u.username as sender_username
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
         ORDER BY m.created_at DESC
         LIMIT 100`,
        [userId, contactId]
      );
      
      // Armazena no Redis
      const pipeline = generalClient.multi();
      for (const message of result.rows.reverse()) {
        pipeline.lPush(conversationKey, JSON.stringify(message));
      }
      pipeline.expire(conversationKey, 3600);
      await pipeline.exec();

      res.json(result.rows);
    } catch (error) {
      console.error('Erro detalhado:', error);
      res.status(500).json({ error: error.message });
    }
};

exports.getRecentConversations = async (req, res) => {
    try {
      const userId = req.user.id;
      const key = `recent_conversations:${userId}`;
      
      const conversations = await cacheAside(
        key,
        async () => {
          const result = await db.query(
            `SELECT DISTINCT ON (other_user_id)
               other_user_id,
               username as other_username,
               content as last_message,
               created_at
             FROM (
               SELECT 
                 CASE 
                   WHEN m.sender_id = $1 THEN m.receiver_id
                   ELSE m.sender_id
                 END as other_user_id,
                 u.username,
                 m.content,
                 m.created_at
               FROM messages m
               JOIN users u ON (
                 CASE 
                   WHEN m.sender_id = $1 THEN m.receiver_id
                   ELSE m.sender_id
                 END = u.id
               )
               WHERE m.sender_id = $1 OR m.receiver_id = $1
             ) as conversations
             ORDER BY other_user_id, created_at DESC`,
            [userId]
          );
          return result.rows;
        },
        300 
      );

      res.json(conversations);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      res.status(500).json({ error: 'Erro ao buscar conversas recentes' });
    }
};