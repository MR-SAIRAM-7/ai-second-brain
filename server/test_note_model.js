const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Note = require('./models/Note');
const User = require('./models/User');

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Create a dummy user if not exists
        let user = await User.findOne({ email: 'testnoteuser@example.com' });
        if (!user) {
            user = new User({
                username: 'testnoteuser',
                email: 'testnoteuser@example.com',
                passwordHash: 'dummyhash'
            });
            await user.save();
            console.log('Dummy user created');
        }

        // 2. Create a Note
        const newNote = new Note({
            userId: user._id,
            title: 'Test Note',
            content: { ops: [{ insert: 'Hello check' }] }, // mimic blocknote/quill
            type: 'note'
        });

        const savedNote = await newNote.save();
        console.log('Note saved successfully:', savedNote);

        // 3. Cleanup (optional, keeping for inspection)
        // await Note.findByIdAndDelete(savedNote._id);

        process.exit(0);
    } catch (err) {
        console.error('Error testing Note model:', err);
        process.exit(1);
    }
};

runTest();
