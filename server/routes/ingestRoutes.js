const express = require('express');
const multer = require('multer');
const ingestController = require('../controllers/ingestController');
const auth = require('../middleware/auth');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const isPdfMime = (file.mimetype || '').toLowerCase().includes('pdf');
        const hasPdfExt = (file.originalname || '').toLowerCase().endsWith('.pdf');

        if (isPdfMime || hasPdfExt) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});

const handleUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ msg: err.message });
        }
        return next();
    });
};

router.post('/notes/:id/ingest', auth, ingestController.ingestNote);
router.post('/upload', auth, handleUpload, ingestController.uploadPdf);

module.exports = router;
