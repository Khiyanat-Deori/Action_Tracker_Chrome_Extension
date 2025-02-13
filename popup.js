document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.getElementById("toggleTracking");
  
    chrome.storage.local.get("trackingEnabled", (data) => {
      const isTracking = data.trackingEnabled ?? false;
      toggleButton.textContent = isTracking ? "⏹ Stop Tracking" : "▶ Start Tracking";
    });
  
    toggleButton.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs.length) return;
        const tabId = tabs[0].id;
  
        chrome.storage.local.get("trackingEnabled", (data) => {
          const newState = !data.trackingEnabled;

          chrome.storage.local.set({ trackingEnabled: newState });
          toggleButton.textContent = newState ? "⏹ Stop Tracking" : "▶ Start Tracking";
  
          chrome.tabs.sendMessage(tabId, { type: newState ? "startTracking" : "stopTracking" });
        });
      });
    });
  
    document.getElementById("download").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "downloadJSON" }, (response) => {
        console.log("Download JSON response:", response);
      });
    });
  
    document.getElementById("clear").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "clearActions" }, (response) => {
        console.log("Clear actions response:", response);
      });
    });
  });
  

