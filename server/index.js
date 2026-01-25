const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// Load environment variables strictly before anything else relies on them
dotenv.config();

// check for critical env variables
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
    console.error(`FATAL ERROR: Missing environment variables: ${missingEnv.join(', ')}`);
    process.exit(1);
}

const rateLimit = require('express-rate-limit'); // Moved to top
const connectDB = require('./config/db');

// Connect to database
connectDB();

// Init Middleware
const app = express();

app.use(cors());
app.use(express.json());

// Rate Limiter Strategy
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 60, // Limit each IP to 60 requests per `window` (increased from 10 for better UX)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { msg: 'Too many requests from this IP, please try again after a minute' } // JSON error response
});

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api', require('./routes/ingestRoutes'));
app.use('/api', limiter, require('./routes/chatRoutes')); // Apply limiter to chat
app.post('/api/visualize', require('./controllers/visualizeController').visualizeNote);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        msg: err.message || 'Server Error',
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
