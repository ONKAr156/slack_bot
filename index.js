require('dotenv').config({ path: './.env' });

const express = require('express');
const axios = require('axios');
const { App, ExpressReceiver } = require('@slack/bolt');

const app = express();
const PORT = process.env.PORT || 4200;

// ======================
// 1. Slack Bolt Setup
// ======================
// The receiver must be defined to handle the Slack request parsing
const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const slackApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver: receiver,
});

// ======================
// 2. Mounting Slack Receiver
// ======================
// IMPORTANT: This must be mounted BEFORE your global Express middleware 
// that might intercept and consume the raw request body.
app.use('/slack/events', receiver.router);

// ======================
// 3. Express Middleware & Routes
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`<h2>✅ Server is Running</h2>`);
});

app.get('/notify', async (req, res) => {
    await axios.post(process.env.SLACK_WEBHOOK_URL, { text: '🚀 Test!' });
    res.send('✅ Sent!');
});

// ======================
// 4. Slack Handlers (Defined after App init)
// ======================
slackApp.command('/hello', async ({ command, ack, say }) => {
    await ack();
    await say(`Hello <@${command.user_id}>!`);
});

// 404 Handler - Must be at the very end
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});