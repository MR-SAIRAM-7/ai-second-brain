const mongoose = require('mongoose');

const ChunkSchema = new mongoose.Schema({
    noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    text: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number], // Array of numbers for vector embedding
        required: true
    },
    metadata: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            index: true
        },
        pageNumber: {
            type: Number
        },
        sectionTitle: {
            type: String
        }
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
ChunkSchema.index({ noteId: 1, createdAt: -1 });
ChunkSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Chunk', ChunkSchema);
