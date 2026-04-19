require('dotenv').config();
const express = require('express');
const { WebClient } = require('@slack/web-api');

const app = express();
app.use(express.json()); // Essential for parsing Slack's JSON payloads

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

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

app.listen(3000, () => console.log('Server is running on port 3000'));
