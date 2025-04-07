require('dotenv').config();
const db = require('./services/db');

async function testDB() {
  try {
    const resUser = await db.query(
      'INSERT INTO users(username, password) VALUES($1, $2) RETURNING *',
      ['testeUser1', 'senhaCriptografada']
    );
    console.log('Usuário inserido:', resUser.rows[0]);

    const resMessage = await db.query(
      'INSERT INTO messages(sender_id, receiver_id, content) VALUES($1, $2, $3) RETURNING *',
      [resUser.rows[0].id, resUser.rows[0].id, 'Olá, mundo!']
    );
    console.log('Mensagem inserida:', resMessage.rows[0]);
  } catch (error) {
    console.error('Erro ao testar o DB:', error);
  } finally {
    db.end();
  }
}

testDB();
