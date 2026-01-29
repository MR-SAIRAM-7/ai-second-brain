const { PDFParse } = require('pdf-parse');
const Note = require('../models/Note');
const Chunk = require('../models/Chunk');
const { generateEmbeddings } = require('../utils/aiService');
const { normalizeWhitespace, extractPlainText } = require('../utils/textProcessing');

const buildChunkDocs = (noteId, userId, embeddings) => {
    return embeddings.map((chunk) => ({
        noteId,
        userId,
        text: chunk.text,
        embedding: chunk.vector,
        metadata: {
            userId,
            pageNumber: chunk.metadata?.loc?.pageNumber || chunk.metadata?.pageNumber,
            sectionTitle: chunk.metadata?.sectionTitle,
        },
    }));
};

/**
 * Internal function to re-index a note.
 * Can be called by the route handler or background jobs.
 */
const reindexNoteInternal = async (noteId, userId) => {
    const note = await Note.findById(noteId);
    if (!note) throw new Error('Note not found');
    if (note.userId.toString() !== userId) throw new Error('Not authorized');

    const contentText = extractPlainText(note.content);
    const textToEmbed = normalizeWhitespace(
        [note.title, contentText].filter(Boolean).join('\n\n')
    );

    if (!textToEmbed) {
        // If empty, just clear chunks
        await Chunk.deleteMany({ noteId: note._id });
        return { noteId: note._id, chunksCreated: 0 };
    }

    await Chunk.deleteMany({ noteId: note._id });

    const embeddings = await generateEmbeddings(textToEmbed);

    if (!embeddings?.length) {
        throw new Error('Embedding generation failed');
    }

    const docs = buildChunkDocs(note._id, userId, embeddings);
    await Chunk.insertMany(docs);

    return { noteId: note._id, chunksCreated: docs.length };
};

exports.ingestNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ msg: 'Note not found' });
        if (note.userId.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

        const contentText = extractPlainText(note.content);
        const additionalText = typeof req.body?.text === 'string' ? req.body.text : '';
        const textToEmbed = normalizeWhitespace(
            [note.title, additionalText, contentText].filter(Boolean).join('\n\n')
        );

        if (!textToEmbed) return res.status(400).json({ msg: 'Note has no content to ingest' });

        await Chunk.deleteMany({ noteId: note._id });
        const embeddings = await generateEmbeddings(textToEmbed);

        if (!embeddings?.length) return res.status(500).json({ msg: 'Embedding generation failed' });

        const docs = buildChunkDocs(note._id, req.user.id, embeddings);
        await Chunk.insertMany(docs);

        return res.json({ noteId: note._id, chunksCreated: docs.length });

    } catch (error) {
        console.error('Error ingesting note:', error);
        return res.status(500).json({ msg: 'Failed to ingest note' });
    }
};

exports.reindexNoteInternal = reindexNoteInternal;

exports.uploadPdf = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'PDF file is required' });
        }
        console.log(`[Upload] Received file: ${req.file.originalname}, size: ${req.file.size}`);

        let rawText = '';
        try {
            const parser = new PDFParse({ data: req.file.buffer });
            const result = await parser.getText();
            rawText = normalizeWhitespace(result.text || '');
            // Clean up if necessary, though memory storage usually handles it.
            // parser.destroy(); // Unclear if strictly needed for simple text, but good practice if available.
        } catch (e) {
            console.error('[Upload] PDF Parse failed:', e);
            return res.status(400).json({ msg: 'Failed to parse PDF content', error: e.message });
        }

        console.log(`[Upload] Extract text length: ${rawText.length}`);

        if (!rawText) {
            return res.status(400).json({ msg: 'Unable to extract text from PDF' });
        }

        const titleFromBody = typeof req.body?.title === 'string' ? req.body.title : '';
        const derivedTitle = req.file.originalname?.replace(/\.pdf$/i, '') || 'Uploaded PDF';
        const title = titleFromBody || derivedTitle;

        const note = await Note.create({
            userId: req.user.id,
            title,
            content: { source: 'pdf-upload', filename: req.file.originalname },
            type: 'pdf',
        });

        console.log(`[Upload] Note created: ${note._id}`);

        let embeddings;
        try {
            embeddings = await generateEmbeddings(rawText);
        } catch (e) {
            console.error('[Upload] Embedding generation failed:', e);
            // Cleanup note if embeddings fail
            await Note.findByIdAndDelete(note._id);
            return res.status(500).json({ msg: 'AI Embedding generation failed', error: e.message });
        }

        if (!embeddings?.length) {
            await Note.findByIdAndDelete(note._id);
            return res.status(500).json({ msg: 'Embedding generation returned no results' });
        }

        const docs = buildChunkDocs(note._id, req.user.id, embeddings);
        if (docs.length) {
            await Chunk.insertMany(docs);
        }

        return res.status(201).json({ note, chunksCreated: docs.length });
    } catch (error) {
        console.error('Error ingesting PDF:', error);
        return res.status(500).json({ msg: 'Failed to ingest PDF', error: error.message });
    }
};
