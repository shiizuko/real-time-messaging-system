const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const db = require('../services/db');

exports.register = async (req, res) => {
    try {
      //console.log('Dados recebidos', req.body); 
      
      const { username, password } = req.body;
      
      if (!username || username.length < 3) {
        return res.status(400).json({ error: 'Nome de usuário deve ter pelo menos 3 caracteres' });
      }
      
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
      }
  
      // Verifica existência do usuário
      const userCheck = await db.query(
        'SELECT id FROM users WHERE username = $1', 
        [username]
      );
      //console.log('Resultado da verificação', userCheck.rows);
  
      if (userCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Usuário já existe' });
      }
  
      const hashedPassword = await argon2.hash(password);
      //console.log('Hash gerado', hashedPassword); 
  
      const newUser = await db.query(
        `INSERT INTO users 
          (username, password) 
         VALUES ($1, $2) 
         RETURNING id, username`,
        [username, hashedPassword]
      );
      //console.log('Novo usuário', newUser.rows[0]); 
  
      const token = jwt.sign(
        { id: newUser.rows[0].id, username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      res.status(201).json({ token });
      
    } catch (error) {
      console.error('Erro no registro:', error); 
      res.status(500).json({ 
        error: 'Erro interno',
        details: error.message 
      });
    }
  };

exports.login = async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }
  
      const result = await db.query(
        'SELECT id, username, password FROM users WHERE username = $1', 
        [username]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
  
      const user = result.rows[0];
      const validPassword = await argon2.verify(user.password, password);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
  
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      res.json({ token });
  
    } catch (error) {
      console.error('Erro:', error);
      res.status(500).json({ error: 'Erro interno' });
    }
  };

exports.validateToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ valid: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.query(
      'SELECT id, username FROM users WHERE id = $1', 
      [decoded.id]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ valid: false });
    }

    res.json({ 
      valid: true,
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username
      }
    });
  } catch (err) {
    res.status(401).json({ valid: false });
  }
};