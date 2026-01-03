const mongoose = require('mongoose');
const mongoUri = 'mongodb://localhost:27017/procurement';

const ChatMessageSchema = new mongoose.Schema({
    role: String,
    content: String,
    sessionId: String
}, { timestamps: true });

const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);

async function run() {
    try {
        await mongoose.connect(mongoUri);

        // Insert a test message to show history works
        await ChatMessage.create({
            role: 'ai',
            content: 'I have started tracking your procurement chat history. All future messages will be stored here!',
            sessionId: 'default-session'
        });

        const history = await ChatMessage.find({ sessionId: 'default-session' }).sort({ createdAt: 1 });

        console.log('--- CHAT HISTORY START ---');
        history.forEach((msg, i) => {
            console.log(`[${i + 1}] ${msg.role.toUpperCase()}: ${msg.content}`);
        });
        console.log('--- CHAT HISTORY END ---');

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

run();
