import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
};

// Type for localStorage items
export interface LocalStorageItem {
  key: string;
  value: string;
  size: number; // Size in bytes
}

// Firefox browser API type declaration
declare const browser: typeof chrome;

// Cross-browser API compatibility
const browserAPI = (() => {
  console.log("Content Script: Detecting browser environment...");
  
  if (typeof chrome !== "undefined" && chrome.runtime) {
    console.log("Content Script: Using Chrome API");
    return chrome;
  }
  
  if (typeof browser !== "undefined" && browser.runtime) {
    console.log("Content Script: Using Firefox browser API (global)");
    return browser;
  }
  
  if (typeof (globalThis as any).browser !== "undefined" && (globalThis as any).browser.runtime) {
    console.log("Content Script: Using Firefox browser API (globalThis)");
    return (globalThis as any).browser;
  }
  
  console.error("Content Script: Browser extension API not available");
  return null;
})();

if (!browserAPI) {
  console.error("Content Script: Browser extension API not available");
}

// Listen for messages from popup
browserAPI?.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content Script: Received message:", message.type);
  
  if (message.type === "GET_LOCALSTORAGE") {
    try {
      const items: LocalStorageItem[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || "";
          const size = new Blob([value]).size;
          items.push({
            key,
            value,
            size,
          });
        }
      }

      console.log("Content Script: Found localStorage items:", items.length);
      sendResponse({ success: true, data: items });
    } catch (error) {
      console.error("Content Script: Error getting localStorage:", error);
      sendResponse({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to access localStorage",
      });
    }
    return true; // Indicates we will send a response asynchronously
  }

  if (message.type === "SET_LOCALSTORAGE") {
    try {
      localStorage.setItem(message.key, message.value);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to set localStorage item",
      });
    }
    return true;
  }

  if (message.type === "DELETE_LOCALSTORAGE") {
    try {
      localStorage.removeItem(message.key);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete localStorage item",
      });
    }
    return true;
  }

  if (message.type === "CLEAR_LOCALSTORAGE") {
    try {
      localStorage.clear();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to clear localStorage",
      });
    }
    return true;
  }
});
