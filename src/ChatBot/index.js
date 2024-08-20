import React, { useEffect, useRef, useState } from "react";
import "./index.css";

function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    const sendMessage = async () => {
        if (userInput.trim() === "") return;

        setLoading(true);
        setUserInput("");

        const newMessages = [...messages, { sender: "user", text: userInput }];
        setMessages(newMessages);

        try {
            const response = await fetch("http://localhost:3001/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: userInput,
                    conversation: newMessages,
                }),
            });

            const data = await response.json();
            const botReply = data.reply;

            setMessages([...newMessages, { sender: "bot", text: botReply }]);
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
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
        <div>
            <button className="chatbot-button" onClick={toggleChatbot}>
                {isOpen ? "Close Chat" : "Chat with Us!"}
            </button>

            {isOpen && (
                <div className="chatbot-modal">
                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.sender}`}>
                                {msg.text}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chatbot-input">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                        />
                        <button onClick={sendMessage} disabled={loading}>
                            {loading ? <div className="loader"></div> : "Send"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chatbot;
