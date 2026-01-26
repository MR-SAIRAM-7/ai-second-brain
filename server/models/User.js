const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Note: unique on email already creates an index; no extra index needed to avoid duplicates

module.exports = mongoose.model('User', UserSchema);
