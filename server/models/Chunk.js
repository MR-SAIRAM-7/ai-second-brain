const mongoose = require('mongoose');

const ChunkSchema = new mongoose.Schema({
    noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

module.exports = mongoose.model('Chunk', ChunkSchema);
