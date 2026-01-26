const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRequiredFields, validateEmail, validatePassword, sanitizeStrings } = require('../middleware/validation');

router.post('/register', 
    sanitizeStrings,
    validateRequiredFields(['username', 'email', 'password']),
    validateEmail,
    validatePassword,
    authController.register
);

router.post('/login', 
    sanitizeStrings,
    validateRequiredFields(['email', 'password']),
    validateEmail,
    authController.login
);

module.exports = router;
