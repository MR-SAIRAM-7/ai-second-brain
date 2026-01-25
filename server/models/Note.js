const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
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

module.exports = mongoose.model('Note', NoteSchema);
