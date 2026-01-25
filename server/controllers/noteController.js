const Note = require('../models/Note');
const { reindexNoteInternal } = require('./ingestController');

// @route   POST api/notes
// @desc    Create a note
// @access  Private
exports.createNote = async (req, res, next) => {
    try {
        const newNote = new Note({
            title: 'Untitled',
            content: {}, // Empty blocknote content
            userId: req.user.id,
            type: 'note' // Default
        });

        const note = await newNote.save();
        res.json(note);
    } catch (err) {
        next(err);
    }
};

// @route   GET api/notes
// @desc    Get all notes for user
// @access  Private
exports.getNotes = async (req, res, next) => {
    try {
        const notes = await Note.find({ userId: req.user.id }).sort({ updatedAt: -1 });
        res.json(notes);
    } catch (err) {
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
    if (title) noteFields.title = title;
    if (content) noteFields.content = content;
    if (type) noteFields.type = type;

    // Mark updated time
    noteFields.updatedAt = Date.now();

    try {
        let note = await Note.findById(req.params.id);

        if (!note) return res.status(404).json({ msg: 'Note not found' });

        // Make sure user owns note
        if (note.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        note = await Note.findByIdAndUpdate(
            req.params.id,
            { $set: noteFields },
            { new: true }
        );

        res.json(note);

        // Background re-indexing (Stale-While-Revalidate)
        reindexNoteInternal(req.params.id, req.user.id)
            .then(result => console.log(`[Background] Re-indexed note ${result.noteId}, chunks: ${result.chunksCreated}`))
            .catch(err => console.error(`[Background] Re-indexing failed for note ${req.params.id}:`, err));

    } catch (err) {
        next(err);
    }
};

// @route   DELETE api/notes/:id
// @desc    Delete note
// @access  Private
exports.deleteNote = async (req, res, next) => {
    try {
        let note = await Note.findById(req.params.id);

        if (!note) return res.status(404).json({ msg: 'Note not found' });

        // Make sure user owns note
        if (note.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Note.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Note removed' });
    } catch (err) {
        next(err);
    }
};
