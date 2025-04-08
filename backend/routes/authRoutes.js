const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    standardHeaders: true,
    message: 'Muitas tentativas de login, tente novamente mais tarde'
});

router.post('/login', authLimiter, authController.login);
router.post('/register', authLimiter, authController.register);

router.get('/validate', authController.validateToken);

module.exports = router;