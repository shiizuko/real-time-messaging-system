const db = require('../services/db');
const { generalClient } = require('../services/redisClient');

exports.getContacts = async (req, res) => {
  try {
    //  buscar do cache primeiro
    const cachedContacts = await generalClient.get(`contacts:${req.user.id}`);
    if (cachedContacts) {
      return res.json(JSON.parse(cachedContacts));
    }

    // Se não estiver em cache, busca do banco
    const result = await db.query(`
      SELECT 
        u.id,
        u.username,
        (
          SELECT m.content
          FROM messages m
          WHERE (m.sender_id = u.id AND m.receiver_id = $1)
             OR (m.sender_id = $1 AND m.receiver_id = u.id)
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        (
          SELECT m.created_at
          FROM messages m
          WHERE (m.sender_id = u.id AND m.receiver_id = $1)
             OR (m.sender_id = $1 AND m.receiver_id = u.id)
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message_time
      FROM users u
      WHERE u.id != $1
      ORDER BY last_message_time DESC NULLS LAST
    `, [req.user.id]);

    const contacts = result.rows;

    await generalClient.setEx(
      `contacts:${req.user.id}`, 
      300, 
      JSON.stringify(contacts)
    );

    res.json(contacts);
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar contatos',
      details: error.message 
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username FROM users WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};