import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

window.chatBot = {
    setup: (id) => {
        const rootElement = document.getElementById(id);
        if (rootElement) {
            const root = ReactDOM.createRoot(rootElement);
            root.render(
                <React.StrictMode>
                    <App />
                </React.StrictMode>
            );
        } else {
            console.error(`Element with id ${id} not found.`);
        }
    },
};

// Call reportWebVitals to measure performance (optional)
reportWebVitals();
