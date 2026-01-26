const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        default: 'Untitled'
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    type: {
        type: String,
        enum: ['note', 'pdf'],
        default: 'note'
    }
}, {
    timestamps: true
});

// Compound index for efficient user queries
NoteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Note', NoteSchema);
