const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit'); // Moved to top
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Init Middleware
const app = express();

app.use(cors());
app.use(express.json());

// Load Config
// Note: .env is already loaded at the top

// Rate Limiter Strategy
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 10, // Limit each IP to 10 requests per `window` (here, per 1 minute)
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
