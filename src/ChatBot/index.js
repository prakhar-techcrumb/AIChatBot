import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import styles from "./styles.module.css";
import remarkGfm from "remark-gfm"; 
import rehypeSanitize from "rehype-sanitize";

function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [threadId, setThreadId] = useState();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(()=>{
        getThreadId()
    },[])

    useEffect(scrollToBottom, [messages,loading]);

    const toggleChatbot = () => {
        sendMessage()
        setIsOpen(!isOpen);
    };

    async function getThreadId(){
        const thread = await fetch("http://localhost:3000/thread",{
            method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
        });
        const data = await thread.json();
        setThreadId(data.threadId)
    }

    const sendMessage = async () => {
    if (userInput.trim() === "" && messages.length > 0) return;

    setLoading(true);
    setUserInput("");

    const newMessages = [...messages, { sender: "user", text: userInput }];
    setMessages(newMessages);

    // const placeholderMessage = { sender: "bot", text: ". . ." };
    // setMessages([...newMessages, placeholderMessage])

    try {
        const response = await fetch("http://localhost:3000/message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: userInput || "hey",
                threadId: threadId,
            }),
        });

        const reader = response.body.getReader();
        const textDecoder = new TextDecoder();
        let receivedText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            const chunk = textDecoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (line === "[DONE]") {
                    setLoading(false);
                    return;
                } else {
                    receivedText += line;
                    const newMessages = [...messages, { sender: "user", text: userInput }];
                    const botMessage = { sender: "bot", text: receivedText };
                    setMessages([...newMessages, botMessage])
                    
                }
            }
        }
    } catch (error) {
        console.error("Error sending message:", error);
        setLoading(false);
    }
};

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className={styles.parentDiv}>
            <button className={styles.chatbotButton} onClick={toggleChatbot}>
                Learn More
            </button>

            {isOpen && (
                <div className={styles.chatbotModal}>
                     <button className={styles.chatbotCloseButton} onClick={toggleChatbot}>
                        &times;
                    </button>
                    <div className={styles.chatbotMessages}>
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`${styles.message} ${styles[`message${msg.sender.charAt(0).toUpperCase() + msg.sender.slice(1)}`]}`}>
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]} 
                                    rehypePlugins={[rehypeSanitize]}
                                    className={styles.md}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className={styles.chatbotInput}>
                        <input
                            disabled={loading}
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className={styles.chatbotInputInput}
                        />
                        <button onClick={sendMessage} disabled={loading} className={styles.chatbotInputButton}>
                            {loading ? <div className={styles.loader}></div> : "Send"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chatbot;
