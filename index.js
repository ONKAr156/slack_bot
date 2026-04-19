require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { WebClient } = require('@slack/web-api');

const app = express();
app.use(express.json()); // Essential for parsing Slack's JSON payloads

const client = new WebClient(process.env.SLACK_BOT_TOKEN);
app.get('/', (req, res) => {
    res.send(`<h2>✅ Server is Running</h2>`);
});

app.get('/notify', async (req, res) => {
    await axios.post(process.env.SLACK_WEBHOOK_URL, { text: '🚀 Test!' });
    res.send('✅ Sent!');
});

app.post('/slack/events', (req, res) => {
    const { type, challenge, event } = req.body;

    // 1. Handle Slack URL verification challenge
    if (type === 'url_verification') {
        return res.status(200).send(challenge);
    }

    // 2. Handle specific events (e.g., a message being sent)
    if (event && event.type === 'message' && !event.bot_id) {
        console.log(`Received message: ${event.text}`);

        // Example: Respond to "hello"
        if (event.text.toLowerCase().includes('hello')) {
            client.chat.postMessage({
                channel: event.channel,
                text: 'Hello there! I am your Express-powered bot.'
            });
        }
    }

    res.status(200).end(); // Always respond with 200 OK to Slack
});

// Handle Slack Slash Command
app.post('/slack/commands', (req, res) => {
    const { command, text, response_url } = req.body;

    if (command === '/hello') {
        // Respond immediately to the user
        res.status(200).send({
            text: "Hello! I received your slash command. 🚀",
            response_type: "in_channel" // "ephemeral" to show only to the user
        });
    }
});

app.listen(3000, () => console.log('Server is running on port 3000'));
//