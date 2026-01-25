const pdfParse = require('pdf-parse');
const Note = require('../models/Note');
const Chunk = require('../models/Chunk');
const { generateEmbeddings } = require('../utils/aiService');

const normalizeWhitespace = (text) => (text || '').replace(/\s+/g, ' ').trim();

// Recursively walk BlockNote-style content and pull out visible text
const collectText = (node) => {
    if (!node) return [];
    if (typeof node === 'string') return [node];
    if (Array.isArray(node)) return node.flatMap(collectText);

    const parts = [];

    if (typeof node.text === 'string') {
        parts.push(node.text);
    }

    if (Array.isArray(node.content)) {
        parts.push(...node.content.flatMap(collectText));
    }

    if (Array.isArray(node.children)) {
        parts.push(...node.children.flatMap(collectText));
    }

    if (Array.isArray(node.blocks)) {
        parts.push(...node.blocks.flatMap(collectText));
    }

    return parts;
};

const extractPlainText = (content) => normalizeWhitespace(collectText(content).join(' '));

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

exports.ingestNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ msg: 'Note not found' });
        }

        if (note.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const contentText = extractPlainText(note.content);
        const additionalText = typeof req.body?.text === 'string' ? req.body.text : '';
        const textToEmbed = normalizeWhitespace(
            [note.title, additionalText, contentText].filter(Boolean).join('\n\n')
        );

        if (!textToEmbed) {
            return res.status(400).json({ msg: 'Note has no content to ingest' });
        }

        await Chunk.deleteMany({ noteId: note._id });

        const embeddings = await generateEmbeddings(textToEmbed);

        if (!embeddings?.length) {
            return res.status(500).json({ msg: 'Embedding generation failed' });
        }

        const docs = buildChunkDocs(note._id, req.user.id, embeddings);
        await Chunk.insertMany(docs);

        return res.json({ noteId: note._id, chunksCreated: docs.length });
    } catch (error) {
        console.error('Error ingesting note:', error);
        return res.status(500).json({ msg: 'Failed to ingest note' });
    }
};

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
