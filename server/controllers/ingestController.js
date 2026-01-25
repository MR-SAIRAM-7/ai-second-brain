const pdfParse = require('pdf-parse');
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
    // Note: In manual re-indexing, we might not have 'additionalText' from body easily available unless passed.
    // For automatic background re-indexing, we assume we just index title + content.
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
        // For the explicit ingest endpoint, we might want to include 'text' from body if valid
        // But for consistency, let's just stick to what reindexNoteInternal does, 
        // OR we can handle the specific logic here if the body has extra text?
        // The original code handled req.body.text. Let's support it if we want to separate logic,
        // but to keep it DRY, we might lose that if we strictly use reindexNoteInternal.
        // However, standard re-indexing usually just looks at the note content. 
        // If req.body.text was used to append context during ingest, we might lose that.
        // Let's assume re-indexing from DB is the primary source of truth.
        // If we really need req.body.text, we can pass it to the internal function.

        // Let's call the internal function for now. If req.body.text is crucial for *manual* ingest, 
        // we might need to update the note content first? Unlikely.
        // The original logic: const additionalText = typeof req.body?.text === 'string' ? req.body.text : '';

        // Let's keep the original logic for the route to be safe, but use the inner helpers?
        // Or better: update reindexNoteInternal to take optional text.

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

        const parsed = await pdfParse(req.file.buffer);
        const rawText = normalizeWhitespace(parsed?.text || '');

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

        const embeddings = await generateEmbeddings(rawText);

        if (!embeddings?.length) {
            return res.status(500).json({ msg: 'Embedding generation failed' });
        }

        const docs = buildChunkDocs(note._id, req.user.id, embeddings);
        if (docs.length) {
            await Chunk.insertMany(docs);
        }

        return res.status(201).json({ note, chunksCreated: docs.length });
    } catch (error) {
        console.error('Error ingesting PDF:', error);
        return res.status(500).json({ msg: 'Failed to ingest PDF' });
    }
};
