const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables strictly before anything else relies on them
dotenv.config();

// check for critical env variables
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'GOOGLE_API_KEY'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
    console.error(`FATAL ERROR: Missing environment variables: ${missingEnv.join(', ')}`);
    console.error('Please copy .env.example to .env and fill in the required values');
    process.exit(1);
}

const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Connect to database
connectDB();

// Init Middleware
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') || []
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
};
app.use(cors(corsOptions));

// Request logging
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rate Limiter for Auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // Limit each IP to 10 auth requests per window
    message: { msg: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate Limiter for API routes (notes, upload, etc)
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Too many requests, please try again later' }
});

// Rate Limiter for Chat routes
const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 60, // Limit each IP to 60 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Too many requests from this IP, please try again after a minute' }
});

// Define Routes
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/notes', apiLimiter, require('./routes/noteRoutes'));
app.use('/api', apiLimiter, require('./routes/ingestRoutes'));
app.use('/api', chatLimiter, require('./routes/chatRoutes'));

const auth = require('./middleware/auth');
app.post('/api/visualize', auth, require('./controllers/visualizeController').visualizeNote);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ msg: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
        msg: message,
        ...(process.env.NODE_ENV !== 'production' && { 
            stack: err.stack,
            error: err 
        })
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    await new Promise((resolve) => server.close(resolve));
    console.log('HTTP server closed');

    // Close database connection (mongoose v9+ no callback)
    try {
        await require('mongoose').connection.close(false);
        console.log('MongoDB connection closed');
    } catch (err) {
        console.error('Error closing MongoDB connection', err);
    }

    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err);
    gracefulShutdown('unhandledRejection');
});
