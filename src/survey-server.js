require("dotenv").config();
const OpenAI = require("openai");
const express = require("express");
const cors = require("cors");
const terminal = require("terminal-kit");
const { OPENAI_API_KEY, ASSISTANT_ID } = process.env;

const term = terminal.terminal;
// Setup Express
const app = express();
const corsOptions = {
    origin: true,
};

app.use(cors(corsOptions));
app.use(express.json()); // Middleware to parse JSON bodies

// Set up OpenAI Client
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

// Assistant can be created via API or UI
const assistantId = ASSISTANT_ID;
let pollingInterval;

const log = {};

// Set up a Thread
async function createThread() {
    console.log("Creating a new thread...");
    const thread = await openai.beta.threads.create();
    return thread;
}

async function addMessage(threadId, message) {
    console.log("Adding a new message to thread: " + threadId);
    const response = await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message,
    });
    if (!log[threadId]) {
        log[threadId] = [];
    }
    log[threadId].unshift({
        role: "user",
        content: message,
    });
    return response;
}

async function runAssistant(threadId) {
    console.log("Running assistant for thread: " + threadId);
    const response = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
        // Make sure to not overwrite the original instruction, unless you want to
    });

    console.log("RESPONSE",response);

    return response;
}

async function checkingStatus(res, threadId, runId) {
    const runObject = await openai.beta.threads.runs.retrieve(threadId, runId);

    const status = runObject.status;
    console.log(runObject);
    console.log("Current status: " + status);

    if (status == "completed") {
        clearInterval(pollingInterval);

        const messagesList = await openai.beta.threads.messages.list(threadId);
        let messages = [];

        messagesList.body.data.forEach((message) => {
            messages.push(message.content);
        });

        res.json({ messages : messages[0][0] });
    }
}

//=========================================================
//============== ROUTE SERVER =============================
//=========================================================

// Open a new thread
app.get("/thread", (req, res) => {
    createThread().then((thread) => {
        res.json({ threadId: thread.id });
    });
});

app.post("/message", (req, res) => {
    const { message, threadId } = req.body;
    addMessage(threadId, message).then((message) => {
        // res.json({ messageId: message.id });

        // Run the assistant
        runAssistant(threadId).then((run) => {
            const runId = run.id;

            // Check the status
            pollingInterval = setInterval(() => {
                checkingStatus(res, threadId, runId);
            }, 5000);
        });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
