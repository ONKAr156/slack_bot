require('dotenv').config({ path: './.env' });

const express = require('express');
const axios = require('axios');
const { App, ExpressReceiver } = require('@slack/bolt');

const app = express();
const PORT = process.env.PORT || 4200;

// ✅ Important: Middleware must come first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("🔍 Starting server...");

// ======================
// Slack Bolt Setup
// ======================
const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const slackApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver: receiver,
});

// Slack Handlers
slackApp.command('/hello', async ({ command, ack, say }) => {
    console.log("✅ /hello command received!");
    await ack();
    await say(`Hello <@${command.user_id}>! 👋 Connected successfully.`);
});

slackApp.message('ping', async ({ say }) => {
    await say('Pong! 🏓');
});

// ======================
// Express Routes
// ======================
app.get('/', (req, res) => {
    res.send(`<h2>✅ Server is Running on Port ${PORT}</h2>
              <p><a href="/notify">Click here to test /notify</a></p>`);
});

app.get('/notify', async (req, res) => {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: '🚀 Test from /notify endpoint!'
    });
    res.send('✅ Message sent to Slack!');
});

// ======================
// Mount Slack Receiver - MUST BE BEFORE 404
// ======================
app.use('/slack/events', receiver.router);
console.log("✅ /slack/events route mounted successfully");

// 404 Handler - Last route
app.use((req, res) => {
    console.log(`❌ 404 → ${req.method} ${req.url}`);
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running → http://localhost:${PORT}`);
    console.log(`Slack Events URL → http://localhost:${PORT}/slack/events`);
});