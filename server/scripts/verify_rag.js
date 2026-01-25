const dotenv = require('dotenv');
// Load environment variables strictly before other imports
dotenv.config({ path: __dirname + '/../.env' });

const mongoose = require('mongoose');
const { ingestNote } = require('../controllers/ingestController');
const { chat } = require('../controllers/chatController');
const Note = require('../models/Note');
const User = require('../models/User');
const Chunk = require('../models/Chunk');

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.jsonData = data;
        return res;
    };
    return res;
};

const runVerification = async () => {
    console.log('Starting RAG Verification...');

    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-second-brain');
        console.log('Connected to MongoDB');

        // Cleanup previous test data
        const TEST_EMAIL = 'verify_rag_user@test.com';
        await User.deleteMany({ email: TEST_EMAIL });
        const existingUser = await User.findOne({ email: TEST_EMAIL });
        if (existingUser) {
            await Note.deleteMany({ userId: existingUser._id });
            await Chunk.deleteMany({ userId: existingUser._id });
        }

        // 1. Create User
        const user = await User.create({
            username: 'VerifyUser',
            email: TEST_EMAIL,
            passwordHash: 'hashedpassword123'
        });
        console.log('1. User Created:', user._id);

        // 2. Create Note
        const note = await Note.create({
            userId: user._id,
            title: 'Gemini Verification Note',
            content: 'Gemini is a family of multimodal AI models developed by Google DeepMind. It is designed to be natively multimodal.',
            type: 'note'
        });
        console.log('2. Note Created:', note._id);

        // 3. Ingest Note
        console.log('3. Ingesting Note...');
        const reqIngest = {
            params: { id: note._id },
            user: { id: user._id.toString() },
            body: {}
        };
        const resIngest = mockRes();
        await ingestNote(reqIngest, resIngest);

        if (resIngest.statusCode && resIngest.statusCode !== 200) {
            throw new Error(`Ingestion failed with status ${resIngest.statusCode}: ${JSON.stringify(resIngest.jsonData)}`);
        }
        console.log('   Ingestion Response:', resIngest.jsonData);

        // Verify Chunks
        const chunks = await Chunk.find({ noteId: note._id });
        console.log(`   Chunks found inside DB: ${chunks.length}`);
        if (chunks.length === 0) throw new Error('No chunks created!');
        if (!chunks[0].embedding || chunks[0].embedding.length === 0) throw new Error('Chunks have no embeddings!');

        // 4. Chat
        console.log('4. Testing Chat...');
        const reqChat = {
            body: {
                query: 'Who developed Gemini?',
                userId: user._id.toString()
            },
            user: { id: user._id.toString() }
        };
        const resChat = mockRes();
        await chat(reqChat, resChat);

        if (resChat.statusCode && resChat.statusCode !== 200) {
            throw new Error(`Chat failed with status ${resChat.statusCode}: ${JSON.stringify(resChat.jsonData)}`);
        }
        console.log('   Chat Answer:', resChat.jsonData.answer);
        console.log('   Sources:', resChat.jsonData.sources.length);

        if (!resChat.jsonData.answer.includes('Google') && !resChat.jsonData.answer.includes('DeepMind')) {
            console.warn('WARNING: Answer does not seem relevant. Check model performance or context retrieval.');
        }

        console.log('SUCCESS: RAG Pipeline Verified!');

    } catch (error) {
        console.error('VERIFICATION FAILED:', error);
    } finally {
        await mongoose.connection.close();
    }
};

runVerification();
