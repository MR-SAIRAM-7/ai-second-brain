const express = require('express');
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/chat', auth, chatController.chat);

module.exports = router;
