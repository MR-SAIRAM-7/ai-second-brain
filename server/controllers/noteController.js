const Note = require('../models/Note');
const Chunk = require('../models/Chunk');
const { reindexNoteInternal } = require('./ingestController');
const logger = require('../utils/logger');

// @route   POST api/notes
// @desc    Create a note
// @access  Private
exports.createNote = async (req, res, next) => {
    try {
        const newNote = new Note({
            title: req.body.title || 'Untitled',
            content: {}, // Empty blocknote content
            userId: req.user.id,
            type: 'note' // Default
        });

        const note = await newNote.save();
        logger.info('Note created', { noteId: note._id, userId: req.user.id });
        res.json(note);
    } catch (err) {
        logger.error('Failed to create note', err, { userId: req.user.id });
        next(err);
    }
};

// @route   GET api/notes
// @desc    Get all notes for user
// @access  Private
exports.getNotes = async (req, res, next) => {
    try {
        const notes = await Note.find({ userId: req.user.id })
            .sort({ updatedAt: -1 })
            .select('-__v') // Exclude version field
            .lean(); // Return plain JS objects for better performance

        logger.debug('Notes fetched', { userId: req.user.id, count: notes.length });
        res.json(notes);
    } catch (err) {
        logger.error('Failed to fetch notes', err, { userId: req.user.id });
        next(err);
    }
};

// @route   PUT api/notes/:id
// @desc    Update a note
// @access  Private
exports.updateNote = async (req, res, next) => {
    const { title, content, type } = req.body;

    // Build note object
    const noteFields = {};
    if (title !== undefined) noteFields.title = title;
    if (content !== undefined) noteFields.content = content;
    if (type !== undefined) noteFields.type = type;

    // Mark updated time
    noteFields.updatedAt = Date.now();

    try {
        let note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ msg: 'Note not found' });
        }

        // Make sure user owns note
        if (note.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        note = await Note.findByIdAndUpdate(
            req.params.id,
            { $set: noteFields },
            { new: true }
        );

        logger.info('Note updated', { noteId: note._id, userId: req.user.id });
        res.json(note);

        // Background re-indexing (Stale-While-Revalidate)
        reindexNoteInternal(req.params.id, req.user.id)
            .then(result => logger.success('Note re-indexed in background', { 
                noteId: result.noteId, 
                chunks: result.chunksCreated 
            }))
            .catch(err => logger.error('Background re-indexing failed', err, { 
                noteId: req.params.id 
            }));

    } catch (err) {
        logger.error('Failed to update note', err, { noteId: req.params.id, userId: req.user.id });
        next(err);
    }
};

// @route   DELETE api/notes/:id
// @desc    Delete note and associated chunks
// @access  Private
exports.deleteNote = async (req, res, next) => {
    try {
        let note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ msg: 'Note not found' });
        }

        // Make sure user owns note
        if (note.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Delete associated chunks first (important for cleanup)
        const chunkDeleteResult = await Chunk.deleteMany({ noteId: req.params.id });
        logger.info('Deleted note chunks', { 
            noteId: req.params.id, 
            chunksDeleted: chunkDeleteResult.deletedCount 
        });

        // Delete the note
        await Note.findByIdAndDelete(req.params.id);

        logger.success('Note deleted', { noteId: req.params.id, userId: req.user.id });
        res.json({ 
            msg: 'Note removed successfully',
            chunksDeleted: chunkDeleteResult.deletedCount
        });
    } catch (err) {
        logger.error('Failed to delete note', err, { noteId: req.params.id, userId: req.user.id });
        next(err);
    }
};
