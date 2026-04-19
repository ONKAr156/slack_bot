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

    const { command, text, response_url } = req.body;

    if (command === '/hello') {
        // Respond immediately to the user
        res.status(200).send({
            text: "Hello! I received your slash command. 🚀",
            response_type: "in_channel" // "ephemeral" to show only to the user
        });
    }
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