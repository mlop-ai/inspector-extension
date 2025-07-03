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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

      sendResponse({ success: true, data: items });
    } catch (error) {
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
