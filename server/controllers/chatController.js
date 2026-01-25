const mongoose = require('mongoose');
const Chunk = require('../models/Chunk');
const { embedQuery, generateAnswer } = require('../utils/aiService');

const searchChunks = async (userId, queryVector) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
        {
            $vectorSearch: {
                index: 'vector_index',
                path: 'embedding',
                queryVector,
                filter: { 'metadata.userId': userObjectId },
                limit: 5,
                numCandidates: 100,
            },
        },
        {
            $project: {
                text: 1,
                noteId: 1,
                metadata: 1,
                score: { $meta: 'vectorSearchScore' },
            },
        },
        { $limit: 5 },
    ];

    return Chunk.aggregate(pipeline);
};

exports.chat = async (req, res) => {
    try {
        const { query, userId: bodyUserId } = req.body || {};
        const authedUserId = req.user?.id;
        const effectiveUserId = authedUserId || bodyUserId;

        if (!query || !effectiveUserId) {
            return res.status(400).json({ msg: 'query and userId are required' });
        }

        if (bodyUserId && authedUserId && bodyUserId !== authedUserId) {
            return res.status(403).json({ msg: 'User mismatch' });
        }

        if (!mongoose.Types.ObjectId.isValid(effectiveUserId)) {
            return res.status(400).json({ msg: 'Invalid userId' });
        }

        // 1. Embed the query using Gemini
        const queryVector = await embedQuery(query);

        // 2. Search for relevant chunks
        const results = await searchChunks(effectiveUserId, queryVector);

        // 3. Build context
        const context = results
            .map((r) => r.text)
            .filter(Boolean)
            .join('\n---\n');

        // 4. Generate answer using Gemini
        const answer = await generateAnswer(query, context || '');

        const sources = results.map((r) => ({
            noteId: r.noteId,
            text: r.text,
            score: r.score,
            metadata: r.metadata,
        }));

        return res.json({ answer, sources });
    } catch (error) {
        console.error('Error handling chat:', error);
        return res.status(500).json({ msg: 'Failed to generate answer' });
    }
};
