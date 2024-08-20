const express = require("express");
const bodyParser = require("body-parser");
const OpenAI = require("openai");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());


app.use(cors({
    origin: "http://localhost:3000"
}));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});



app.post("/api/chat", async (req,res) => {
    const { message,conversation }  = req.body
    const messages = [
        { role: "system", content: "You will be provided with statements, and your task is to convert them to standard English." },
        ...conversation.map(msg => ({ role: msg.sender === "user" ? "user" : "assistant", content: msg.text })),
        { role: "user", content: message }
    ];
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
        });

        const botReply = completion.choices[0].message.content;
        res.json({ reply: botReply });
    } catch (error) {
        console.error("Error with OpenAI API request:", error);
        res.status(500).json({ error: "Error generating response" });
    }
});

app.listen(3001, () => console.log("Server running on port 3001"));
