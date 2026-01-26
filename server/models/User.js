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

// Indexes for better query performance
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);
