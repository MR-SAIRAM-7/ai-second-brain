const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { embedQuery } = require('./utils/aiService');
const Chunk = require('./models/Chunk');
const connectDB = require('./config/db');

dotenv.config();

const run = async () => {
    try {
        console.log('1. Connecting to DB...');
        await connectDB();

        console.log('2. Testing Embedding Generation...');
        const query = "Test query";
        const vector = await embedQuery(query);
        console.log('   Embedding generated successfully. Length:', vector.length);

        console.log('3. Testing Vector Search...');
        const User = require('./models/User');
        const user = await User.findOne();
        if (!user) {
            console.log('   No user found in DB. Skipping filtered search test.');
        } else {
            console.log('   Found user:', user._id);
            // Create a dummy chunk for this user if needed or just search
            const pipeline = [
                {
                    $vectorSearch: {
                        index: 'vector_index',
                        path: 'embedding',
                        queryVector: vector,
                        filter: { 'metadata.userId': user._id },
                        limit: 1,
                        numCandidates: 10,
                    },
                }
            ];
            const results = await Chunk.aggregate(pipeline);
            console.log('   Vector search (filtered) successful. Found:', results.length);
        }

        console.log('4. Testing Answer Generation with multiple models...');
        const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
        const { HumanMessage } = require("@langchain/core/messages");

        const modelsToTest = [
            "gemini-flash-latest",
            "gemini-2.0-flash",
            "gemini-pro-latest"
        ];

        for (const modelName of modelsToTest) {
            console.log(`   Testing model (v1beta default): ${modelName}...`);
            try {
                const chatModel = new ChatGoogleGenerativeAI({
                    model: modelName,
                    temperature: 0.2,
                    maxOutputTokens: 100,
                    // Remove apiVersion to use default (v1beta) as listModels showed them in v1beta endpoint
                });
                const res = await chatModel.invoke([new HumanMessage("Hello")]);
                console.log(`   SUCCESS: ${modelName} worked! Response:`, res.content.slice(0, 20));
                break;
            } catch (e) {
                console.log(`   FAILED: ${modelName}. Error: ${e.message.split('\n')[0]}`);
            }
        }


    } catch (err) {
        console.error('CRITICAL FAILURE:', err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
