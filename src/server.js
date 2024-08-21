const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();
const app = express();


const corsOptions = {
  origin: true, 
};

app.use(cors(corsOptions));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

const threadByUser = {};

app.post("/api/chat", async (req, res) => {
  const assistantIdToUse = process.env.ASSISTANT_ID;
  const userId = req.body.userId;
  console.log("USER ID : " , userId)

  // Create a new thread if it's the user's first message
  if (!threadByUser[userId]) {
    try {
      const myThread = await openai.beta.threads.create();
      console.log("New thread created with ID: ", myThread.id, "\n");
      threadByUser[userId] = myThread.id; // Store the thread ID for this user
    } catch (error) {
      console.error("Error creating thread:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  const userMessage = req.body.message;

  // Add a message to the thread
  try {
    const myThreadMessage = await openai.beta.threads.messages.create(
      threadByUser[userId], // Use the stored thread ID for this user
      {
        role: "user",
        content: userMessage,
      }
    );
    console.log("This is the message object: ", myThreadMessage, "\n");

    // Run the Assistant
    const myRun = await openai.beta.threads.runs.create(
      threadByUser[userId], // Use the stored thread ID for this user
      {
        assistant_id: assistantIdToUse,
        stream: true
      }
    );

    console.log("This is the run object: ", myRun.iterator, "\n");


    async function getIdFromAsyncGenerator(asyncGeneratorFunction) {
        const asyncIterator = asyncGeneratorFunction(); // Call the function to get the async iterator

        for await (const chunk of asyncIterator) {
            console.log("CHUNK",chunk)
            if (chunk && chunk.data.id) {
                return chunk.data.id; // Return the id if found
            }
        }

        return null; 
    }


    const id = await getIdFromAsyncGenerator(myRun.iterator);
    console.log("Retrieved ID:", id);

    // Periodically retrieve the run to check on its status
    const retrieveRun = async () => {
      let keepRetrievingRun;

      while (myRun.status !== "completed") {
        keepRetrievingRun = await openai.beta.threads.runs.retrieve(
          threadByUser[userId], // Use the stored thread ID for this user
          id
        );

        console.log(`Run status: ${keepRetrievingRun.status}`);

        if (keepRetrievingRun.status === "completed") {
          console.log("\n");
          break;
        }
      }
    };
    await retrieveRun();

    // Retrieve the messages added by the assistant to the thread
    const allMessages = await openai.beta.threads.messages.list(
      threadByUser[userId] // Use the stored thread ID for this user
    );

    // Send the response back to the front end
    const assistantResponse = allMessages.data.find(
      (msg) => msg.role === "assistant"
    ).content[0].text.value;

    res.status(200).json({
      reply: assistantResponse,
    });
    console.log("User: ", myThreadMessage.content[0].text.value);
    console.log("Assistant: ", assistantResponse);

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
