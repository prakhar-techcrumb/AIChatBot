import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

window.chatBot = {
    setup: (id) => {
        const rootElement = document.getElementById(id);
        if (rootElement) {
            // Apply styling to the root element
            rootElement.style.width = "500px";
            rootElement.style.height = "500px";
            rootElement.style.border = "1px solid #ccc"; // Soft border
            rootElement.style.margin = "0 auto"; // Center the element horizontally

            const root = ReactDOM.createRoot(rootElement);
            root.render(<App />);
        } else {
            console.error(`Element with id ${id} not found.`);
        }
    },
};


(() => {
    // Get the script tag element
    const scriptTag = document.currentScript;
    if (!scriptTag) {
        console.error("Script Not Found")
        return
    }

    // Create a new div element
    const newDiv = document.createElement("div");
    newDiv.id = "pf-pai"

    // Insert the new div after the script tag
    scriptTag.parentNode.insertBefore(newDiv, scriptTag.nextSibling);
    var pfPaiSetupFun = window?.chatBot?.setup
    if (pfPaiSetupFun && typeof pfPaiSetupFun === 'function'){
        window.chatBot.setup("pf-pai");
    }
    else{
        console.error("setup not possible")
    }
})();
