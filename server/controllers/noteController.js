const Note = require('../models/Note');

// @route   POST api/notes
// @desc    Create a note
// @access  Private
exports.createNote = async (req, res) => {
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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/notes
// @desc    Get all notes for user
// @access  Private
exports.getNotes = async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.user.id }).sort({ updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const { reindexNoteInternal } = require('./ingestController');

/* ... existing code ... */

// @route   PUT api/notes/:id
// @desc    Update a note
// @access  Private
exports.updateNote = async (req, res) => {
    const { title, content, type } = req.body;

    // Build note object
    const noteFields = {};
    if (title) noteFields.title = title;
    if (content) noteFields.content = content;
    if (type) noteFields.type = type;

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
        // We do not await this, so the response is fast.
        // We catch errors locally so they don't crash the process if uncaught (though promises usually handle this safetly in modern node, explicit catch is good practice).
        reindexNoteInternal(req.params.id, req.user.id)
            .then(result => console.log(`[Background] Re-indexed note ${result.noteId}, chunks: ${result.chunksCreated}`))
            .catch(err => console.error(`[Background] Re-indexing failed for note ${req.params.id}:`, err));

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   DELETE api/notes/:id
// @desc    Delete note
// @access  Private
exports.deleteNote = async (req, res) => {
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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
