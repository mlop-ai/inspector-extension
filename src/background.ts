/**
 * Cross-browser compatible background script
 * Handles extension initialization and maintains proper API compatibility
 */

// Cross-browser API compatibility
const browserAPI = (() => {
  if (typeof chrome !== "undefined" && chrome.runtime) {
    return chrome;
  }
  if (
    typeof (globalThis as any).browser !== "undefined" &&
    (globalThis as any).browser.runtime
  ) {
    return (globalThis as any).browser;
  }
  return null;
})();

if (!browserAPI) {
  console.error("Browser extension API not available");
}

// Extension installation/startup handler
browserAPI?.runtime.onInstalled.addListener((details) => {
  console.log("Cookie Inspector extension installed/updated:", details.reason);

  // Set up default configuration if needed
  if (details.reason === "install") {
    console.log("First time installation completed");
  } else if (details.reason === "update") {
    console.log("Extension updated");
  }
});

// Handle extension startup
browserAPI?.runtime.onStartup.addListener(() => {
  console.log("Cookie Inspector extension started");
});

// Keep service worker alive for Chrome/Edge compatibility
if (browserAPI?.action) {
  // Manifest V3 - Chrome/Edge
  browserAPI.action.onClicked.addListener(() => {
    // Action handled by popup
  });
} else if (browserAPI?.browserAction) {
  // Manifest V2 fallback - Firefox
  browserAPI.browserAction.onClicked.addListener(() => {
    // Action handled by popup
  });
}

// Handle messages from content scripts or popup
browserAPI?.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  // Handle any background processing if needed
  if (message.type === "HEALTH_CHECK") {
    sendResponse({ status: "ok", timestamp: Date.now() });
    return true;
  }

  // Return false for unhandled messages
  return false;
});

// Ensure proper cleanup
browserAPI?.runtime.onSuspend?.addListener(() => {
  console.log("Cookie Inspector background script suspending");
});

export {};
