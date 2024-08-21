require("dotenv").config();
const OpenAI = require("openai");
const express = require("express");
const cors = require("cors");
const terminal = require("terminal-kit")
const { OPENAI_API_KEY, ASSISTANT_ID } = process.env;

const term = terminal.terminal
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

const log = {}

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

async function runAssistant(res,threadId) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    return new Promise((resolve, reject) => {
        openai.beta.threads.runs
            .createAndStream(threadId, {
                assistant_id: assistantId,
            })
            .on("textCreated", (text) => {
                console.log("\n");
                term.inverse("Assistant:\n");
            })
            .on("textDelta", (textDelta, snapshot) => {
                term.inverse(textDelta.value);
                res.write(`${textDelta.value}\n\n`);
            })
            .on("event", (event) => {
                if (event.event === "thread.message.completed") {
                    let message = event.data.content[0].text.value
                    log[threadId].unshift({
                        role: "bot",
                        content: message,
                    });
                    res.write("[DONE]\n\n");
                    res.end();
                    console.log("LOG",log);
                    resolve(event.data.run_id);
                }
            })
            .on("error", (error) => {
                console.log(error);
                reject(error);
            });
    });

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
        runAssistant(res,threadId)
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
