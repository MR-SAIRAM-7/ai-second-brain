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
                queryVector: queryVector,
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
        // Handle case where userId might come from Auth middleware OR body
        const { query, userId: bodyUserId } = req.body || {};
        const authedUserId = req.user?.id;
        const effectiveUserId = authedUserId || bodyUserId;

        if (!query) {
            return res.status(400).json({ msg: 'Query is required' });
        }

        if (!effectiveUserId || !mongoose.Types.ObjectId.isValid(effectiveUserId)) {
            return res.status(400).json({ msg: 'Invalid or missing userId' });
        }

        console.log(`[Chat] Processing query for user: ${effectiveUserId}`);

        // 1. Embed the query
        const queryVector = await embedQuery(query);

        // 2. Search for relevant chunks
        // NOTE: Ensure your Atlas Vector Index is created and has 768 dimensions!
        const results = await searchChunks(effectiveUserId, queryVector);
        console.log(`[Chat] Found ${results.length} relevant chunks`);

        // 3. Build context
        const context = results
            .map((r) => r.text)
            .filter(Boolean)
            .join('\n---\n');

        // Fallback if no context found
        if (!context) {
            return res.json({ 
                answer: "I couldn't find any notes related to your query.", 
                sources: [] 
            });
        }

        // 4. Generate answer
        const answer = await generateAnswer(query, context);

        const sources = results.map((r) => ({
            noteId: r.noteId,
            text: r.text,
            score: r.score,
            metadata: r.metadata,
        }));

        return res.json({ answer, sources });

    } catch (error) {
        console.error('[Chat Controller Error]:', error);
        
        // Return 500 but log the specific error on server
        return res.status(500).json({ 
            msg: 'Failed to generate answer. Check server logs.', 
            error: error.message 
        });
    }
};