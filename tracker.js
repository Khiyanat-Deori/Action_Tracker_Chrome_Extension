(async () => {
    let trackingEnabled = false;

    const clickHandler = (event) => recordAction(event, "click");
    const inputHandler = (event) => handleTypingEvent(event);
    const changeHandler = (event) => {
        if (event.target.tagName.toLowerCase() === "select") {
            recordAction(event, "select");
        }
    };

    let typingTimer; 
    const typingDelay = 1000; 

    async function recordAction(event, type) {
        if (!trackingEnabled) return;
        try {
            let element = event.target;
            let tagName = element.tagName.toLowerCase();
            let label = element.getAttribute('placeholder') ||
                        element.getAttribute('aria-label') ||
                        element.getAttribute('alt') ||
                        element.innerText.trim();

            if (!label || label === "Without label") return;

            let value = "";
            if (type === "type") {
                value = element.value; 
            } else if (type === "select" && tagName === "select") {
                value = element.options[element.selectedIndex].text; 
            }

            let action = `[${tagName}] ${label} -> ${type.toUpperCase()}${value ? ": " + value : ""}`;
            let raw_HTML = await getRawHTML();
            let cleaned_HTML = await getCleanedHTML();
            let actionData = { action, raw_HTML, cleaned_HTML };

            await saveAction(actionData);
            console.log("✅ Action recorded:", action);
        } catch (error) {
            console.error("❌ Error recording action:", error);
        }
    }

    function handleTypingEvent(event) {
        if (event.target.tagName.toLowerCase() === "input" ||
            event.target.tagName.toLowerCase() === "textarea") {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => recordAction(event, "type"), typingDelay);
        }
    }

    function addListeners() {
        if (document.readyState === "complete") {
            document.addEventListener("click", clickHandler);
            document.addEventListener("input", inputHandler);
            document.addEventListener("change", changeHandler);
            console.log("✅ Event listeners added");
        } else {
            window.addEventListener("load", addListeners);
        }
    }

    function removeListeners() {
        document.removeEventListener("click", clickHandler);
        document.removeEventListener("input", inputHandler);
        document.removeEventListener("change", changeHandler);
        console.log("🚫 Event listeners removed");
    }

    chrome.runtime.onMessage.addListener((request) => {
        if (request.type === "startTracking") {
            if (!trackingEnabled) {
                trackingEnabled = true;
                addListeners();
                console.log("🔔 Tracking started");
            }
        } else if (request.type === "stopTracking") {
            if (trackingEnabled) {
                trackingEnabled = false;
                removeListeners();
                console.log("🔔 Tracking stopped");
            }
        }
    });

    chrome.storage.local.get("trackingEnabled", (data) => {
        trackingEnabled = data.trackingEnabled ?? false;
        if (trackingEnabled) {
            addListeners();
        }
    });

    async function getRawHTML() {
        return document.documentElement.outerHTML;
    }

    async function getCleanedHTML() {
        let clonedDoc = document.documentElement.cloneNode(true);
        let elementsToRemove = clonedDoc.querySelectorAll('script, style, iframe, noscript');
        elementsToRemove.forEach(el => el.remove());
        return clonedDoc.outerHTML;
    }

    async function downloadJSON() {
        let actions = await getAllActions();
        let data = { actions };
        let blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `user_actions_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    async function clearActions() {
        await clearAllActions();
        console.log("✅ Actions cleared successfully.");
    }

    window.recordingTool = { downloadJSON, clearActions };
})();




