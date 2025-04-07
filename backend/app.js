require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { initSocket } = require('./services/websocket');

const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Configuração CORS mais permissiva para desenvolvimento
app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://frontend:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Rotas de autenticação e mensagens
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
