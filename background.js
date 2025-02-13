chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ trackingEnabled: false });
  console.log("User Action Tracker Extension Installed, Tracking Disabled");
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) {
    console.error("No active tab found. Cannot inject script.");
    return;
  }
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    file: "db.js"
  });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    file: "tracker.js"
  });
  console.log("Injected tracking scripts into the active page.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "downloadJSON" || request.type === "clearActions") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0 || !tabs[0].id) {
        console.error("No active tab found. Cannot execute script.");
        sendResponse({ status: "error", message: "No active tab found" });
        return;
      }

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (actionType) => {
          if (window.recordingTool && typeof window.recordingTool[actionType] === "function") {
            window.recordingTool[actionType]();
          } else {
            console.error("window.recordingTool is not available.");
          }
        },
        args: [request.type]
      });

      sendResponse({ status: "success" });
    });

    return true;
  }
});
