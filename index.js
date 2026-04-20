require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const snowflake = require('snowflake-sdk');

const app = express();
const PORT = process.env.PORT || 3000;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

if (!SLACK_SIGNING_SECRET) {
    throw new Error('Missing SLACK_SIGNING_SECRET in environment variables');
}

app.use(
    express.urlencoded({
        extended: false,
        verify: (req, res, buf) => {
            req.rawBody = buf.toString('utf8');
        },
    })
);

function verifySlackRequest(req) {
    const timestamp = req.headers['x-slack-request-timestamp'];
    const slackSignature = req.headers['x-slack-signature'];

    if (!timestamp || !slackSignature || !req.rawBody) {
        return false;
    }

    const fiveMinutes = 60 * 5;
    const currentTime = Math.floor(Date.now() / 1000);

    if (Math.abs(currentTime - Number(timestamp)) > fiveMinutes) {
        return false;
    }

    const sigBaseString = `v0:${timestamp}:${req.rawBody}`;

    const computedSignature =
        'v0=' +
        crypto
            .createHmac('sha256', SLACK_SIGNING_SECRET)
            .update(sigBaseString, 'utf8')
            .digest('hex');

    const slackSigBuffer = Buffer.from(slackSignature, 'utf8');
    const computedSigBuffer = Buffer.from(computedSignature, 'utf8');

    if (slackSigBuffer.length !== computedSigBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(slackSigBuffer, computedSigBuffer);
}

app.post('/slack/commands', (req, res) => {
    // return res.send('✅ Sent!');;
    if (!verifySlackRequest(req)) {
        return res.status(401).json({ error: 'Invalid Slack signature' });
    }

    if (req.body.ssl_check === '1') {
        return res.status(200).send();
    }

    const { command, text, user_id } = req.body;

    if (command === '/hello') {
        return res.status(200).json({
            response_type: 'ephemeral',
            text: `Hello <@${user_id}>! You sent: ${text || 'nothing'}`,
        });
    }

    return res.status(200).json({
        response_type: 'ephemeral',
        text: `Unknown command: ${command}`,
    });
});


app.post('/slack/events', (req, res) => {
    return res.send('✅ Sent!');;
    if (!verifySlackRequest(req)) {
        return res.status(401).json({ error: 'Invalid Slack signature' });
    }

    if (req.body.ssl_check === '1') {
        return res.status(200).send();
    }

    const { command, text, user_id } = req.body;

    if (command === '/hello') {
        return res.status(200).json({
            response_type: 'ephemeral',
            text: `Hello <@${user_id}>! You sent: ${text || 'nothing'}`,
        });
    }

    return res.status(200).json({
        response_type: 'ephemeral',
        text: `Unknown command: ${command}`,
    });
});


function createSnowflakeConnection() {
    return snowflake.createConnection({
        // account: process.env.SNOWFLAKE_ACCOUNT,
        accessUrl: 'https://MFEPVVL-JR70205.snowflakecomputing.com',
        username: process.env.SNOWFLAKE_USERNAME,
        password: process.env.SNOWFLAKE_PASSWORD,
        warehouse: process.env.SNOWFLAKE_WAREHOUSE,
        database: process.env.SNOWFLAKE_DATABASE,
        schema: process.env.SNOWFLAKE_SCHEMA,
        role: process.env.SNOWFLAKE_ROLE,
        application: 'slack-express-demo',
    });
}

function getSnowflakeVersion() {
    return new Promise((resolve, reject) => {
        const connection = createSnowflakeConnection();

        connection.connect((connectErr, conn) => {
            if (connectErr) {
                return reject(connectErr);
            }

            conn.execute({
                sqlText: 'select current_version() as VERSION',
                complete: (err, stmt, rows) => {
                    conn.destroy(() => { });

                    if (err) {
                        return reject(err);
                    }

                    return resolve(rows[0]?.VERSION);
                },
            });
        });
    });
}

app.post('/test-snowflake', async (req, res) => {
    // return res.send('✅ snowflake!');
    try {
        const version = await getSnowflakeVersion();
        res.send(`Snowflake connected. Version: ${version}`);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/', (req, res) => {
    res.send('Slack Express app is running');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});