const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
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

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api', require('./routes/ingestRoutes'));
app.use('/api', require('./routes/chatRoutes'));
app.post('/api/visualize', require('./controllers/visualizeController').visualizeNote);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
