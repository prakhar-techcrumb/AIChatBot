import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import styles from "./styles.module.css";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

const ASSISTANT_ID = "asst_ltGdrxJli7IefufmCziIOsx2";
const LOGO_URL = "https://media-b.performoo.com/logos-performoo/orange-1000-184.png"

function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const init = useRef(false)
    const threadId = useRef(null)

    const scrollToBottom = () => {
        const messageContainer = messagesEndRef.current;
        if (!messageContainer) return;

        messageContainer.scrollTo({
            top: messageContainer.scrollHeight,
            behavior: "smooth",
        });
    };

    useEffect(scrollToBottom, [messages, loading]);
    
    const toggleChatbot = async () => {
        if (!init.current) {
            try {
                setLoading(true)
                await getThreadId();
                if (threadId.current) {
                    sendMessage("json", false);
                    init.current = true;
                } else {
                    console.error("Thread ID not found.");
                    setLoading(false)
                }
            } catch (error) {
                console.error("Failed to initialize thread:", error);
                setLoading(false)
                return;
            }
        }
        setLoading(false)
        setIsOpen(!isOpen);
    };

    async function getThreadId() {
        let newMessages = [...messages];
        try{
            const thread = await fetch("https://qa.performoo.com/thread", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await thread.json();
            threadId.current = data.threadId;
        }
        catch (error) {
            console.error("Error getting threadId", error);

            const errorMessage = {
                sender: "bot",
                text: "Could not process your request. Please refresh or try again later",
                type: "error",
            };

            setMessages([...newMessages, errorMessage]);
            setLoading(false)
        }
    }

    const sendMessage = async (message = userInput, render = true) => {
        if (message.trim() === "" && messages.length > 0) return;

        setLoading(true);
        setUserInput("");

        let newMessages = [...messages];
        if (render) {
            newMessages.push({ sender: "user", text: message });
        }

        setMessages(newMessages);


        const placeholderMessage = { sender: "bot", text: "Typing . . ." };
        setMessages([...newMessages,placeholderMessage]);

        try {
            const response = await fetch("https://qa.performoo.com/message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    assistantId : ASSISTANT_ID,
                    message: message,
                    threadId: threadId.current,
                }),
            });

            const data = await response.json();
            let content = data.messages.text.value;
            let jsonObject = JSON.parse(content);
            let type = jsonObject?.type;

            const botMessage = {
                sender: "bot",
                text: jsonObject?.content,
                type: type,
            };
            setMessages([...newMessages, botMessage]);
            setLoading(false);
        } catch (error) {
            console.error("Error sending message:", error);

            const errorMessage = {
                sender: "bot",
                text: "Could not process your request. Please refresh or try again later",
                type: "error",
            };

            setMessages([...newMessages, errorMessage]);
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
                {loading ? (
                    <div className={styles.loader}></div>
                ) : (
                    <span>Learn More</span>
                )}
            </button>
            {isOpen && (
                <div className={styles.chatbotModal}>
                    <div className={styles.chatbotHeader}>
                        <img src={LOGO_URL} style={{ width: "6rem" }} />
                        <button
                            className={styles.chatbotCloseButton}
                            onClick={toggleChatbot}>
                            &times;
                        </button>
                    </div>
                    <div
                        className={styles.chatbotMessages}
                        ref={messagesEndRef}>
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`${styles.message} ${
                                    styles[
                                        `message${
                                            msg.sender.charAt(0).toUpperCase() +
                                            msg.sender.slice(1)
                                        }`
                                    ]
                                }`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeSanitize]}
                                    className={styles.md}>
                                    {msg.text || msg.content}
                                </ReactMarkdown>

                                {msg.type === "question" && (
                                    <div className={styles.buttonGroup}>
                                        <button
                                            className={styles.yesButton}
                                            onClick={() => sendMessage("Yes")}>
                                            Yes
                                        </button>
                                        <button
                                            className={styles.noButton}
                                            onClick={() => sendMessage("No")}>
                                            No
                                        </button>
                                    </div>
                                )}

                                {msg.type === "form" && (
                                    <form
                                        className={styles.contactForm}
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const formData = new FormData(
                                                e.target
                                            );
                                            const formValues =
                                                Object.fromEntries(
                                                    formData.entries()
                                                );
                                            sendMessage(
                                                JSON.stringify(formValues),
                                                false
                                            );
                                        }}>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Name"
                                            required
                                        />
                                        <input
                                            type="text"
                                            name="company"
                                            placeholder="Company Name"
                                            required
                                        />
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="Phone Number"
                                            required
                                        />
                                        <input
                                            type="text"
                                            name="time"
                                            placeholder="Preferred Time Slot"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            className={styles.submitButton}>
                                            Submit
                                        </button>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
                    {messages[messages.length - 1]?.type == "general" && (
                        <div
                            className={styles.chatbotInput}
                        >
                            <input
                                disabled={loading}
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message..."
                                className={styles.chatbotInputInput}
                            />
                            <button
                                onClick={() => sendMessage(userInput)}
                                disabled={loading}
                                className={styles.chatbotInputButton}>
                                {loading ? (
                                    <div className={styles.loader}></div>
                                ) : (
                                    <span>Send</span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Chatbot;