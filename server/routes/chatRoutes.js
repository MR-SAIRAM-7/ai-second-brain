const express = require('express');
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const { validateRequiredFields, sanitizeStrings } = require('../middleware/validation');

const router = express.Router();

router.post('/chat', 
    auth, 
    sanitizeStrings,
    validateRequiredFields(['query']),
    chatController.chat
);

module.exports = router;
