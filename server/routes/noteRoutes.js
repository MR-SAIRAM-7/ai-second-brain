const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const auth = require('../middleware/auth');
const { validateObjectId, sanitizeStrings } = require('../middleware/validation');

router.post('/', auth, sanitizeStrings, noteController.createNote);
router.get('/', auth, noteController.getNotes);
router.put('/:id', auth, validateObjectId('id'), sanitizeStrings, noteController.updateNote);
router.delete('/:id', auth, validateObjectId('id'), noteController.deleteNote);

module.exports = router;
