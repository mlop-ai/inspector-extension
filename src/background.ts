/**
 * Cross-browser compatible background script
 * Handles extension initialization and maintains proper API compatibility
 */

// Firefox browser API type declaration
declare const browser: typeof chrome;

// Cross-browser API compatibility
const browserAPI = (() => {
  console.log("Background: Detecting browser environment...");
  
  if (typeof chrome !== "undefined" && chrome.runtime) {
    console.log("Background: Using Chrome API");
    return chrome;
  }
  
  if (typeof browser !== "undefined" && browser.runtime) {
    console.log("Background: Using Firefox browser API (global)");
    return browser;
  }
  
  if (typeof (globalThis as any).browser !== "undefined" && (globalThis as any).browser.runtime) {
    console.log("Background: Using Firefox browser API (globalThis)");
    return (globalThis as any).browser;
  }
  
  console.error("Background: Browser extension API not available");
  return null;
})();

if (!browserAPI) {
  console.error("Background: Browser extension API not available");
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
    console.log("Background: Action clicked (Chrome MV3)");
  });
} else if (browserAPI?.browserAction) {
  // Manifest V2 fallback - Firefox
  browserAPI.browserAction.onClicked.addListener(() => {
    // Action handled by popup
    console.log("Background: Browser action clicked (Firefox MV2)");
  });
}

// Web requests storage
let webRequests: Array<{
  id: string;
  url: string;
  method: string;
  status?: number;
  timestamp: number;
  type: string;
  initiator?: string;
  size?: number;
  duration?: number;
  requestHeaders?: { [key: string]: string };
  responseHeaders?: { [key: string]: string };
  requestBody?: string;
  responseBody?: string;
  statusText?: string;
  fromCache?: boolean;
  error?: string;
}> = [];

// Track request start times for duration calculation
const requestStartTimes = new Map<string, number>();

// Listen to web requests
if (browserAPI?.webRequest) {
  console.log("Background: Setting up webRequest listeners...");
  
  // Capture request start
  browserAPI.webRequest.onBeforeRequest.addListener(
    (details) => {
      try {
        requestStartTimes.set(details.requestId, Date.now());

        let requestBody = "";
        if (details.requestBody) {
          if (details.requestBody.raw) {
            try {
              const decoder = new TextDecoder();
              requestBody = details.requestBody.raw
                .map((chunk) => decoder.decode(chunk.bytes))
                .join("");
            } catch (e) {
              requestBody = "[Binary data]";
            }
          } else if (details.requestBody.formData) {
            requestBody = JSON.stringify(details.requestBody.formData, null, 2);
          }
        }

        const request = {
          id: details.requestId,
          url: details.url,
          method: details.method,
          timestamp: Date.now(),
          type: details.type,
          initiator: details.initiator?.url,
          requestBody: requestBody || undefined,
        };

        webRequests.unshift(request);

        // Limit to last 500 requests to prevent memory issues
        if (webRequests.length > 500) {
          webRequests = webRequests.slice(0, 500);
        }
        
        console.log("Background: Captured web request:", details.method, details.url);
      } catch (error) {
        console.error("Background: Error in onBeforeRequest:", error);
      }
    },
    { urls: ["<all_urls>"] },
    ["requestBody"]
  );

  // Capture request headers
  browserAPI.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      const requestIndex = webRequests.findIndex(
        (r) => r.id === details.requestId
      );
      if (requestIndex !== -1) {
        const headers: { [key: string]: string } = {};
        details.requestHeaders?.forEach((header) => {
          headers[header.name] = header.value || "";
        });
        webRequests[requestIndex] = {
          ...webRequests[requestIndex],
          requestHeaders: headers,
        };
      }
    },
    { urls: ["<all_urls>"] },
    ["requestHeaders"]
  );

  // Capture response details
  browserAPI.webRequest.onCompleted.addListener(
    (details) => {
      const startTime = requestStartTimes.get(details.requestId);
      const duration = startTime ? Date.now() - startTime : undefined;
      requestStartTimes.delete(details.requestId);

      // Find and update the request
      const requestIndex = webRequests.findIndex(
        (r) => r.id === details.requestId
      );
      if (requestIndex !== -1) {
        const responseHeaders: { [key: string]: string } = {};
        details.responseHeaders?.forEach((header) => {
          responseHeaders[header.name] = header.value || "";
        });

        const contentLength = details.responseHeaders?.find(
          (h) => h.name.toLowerCase() === "content-length"
        );

        webRequests[requestIndex] = {
          ...webRequests[requestIndex],
          status: details.statusCode,
          statusText: details.statusLine?.split(" ").slice(2).join(" ") || "",
          duration,
          size: contentLength
            ? parseInt(contentLength.value || "0")
            : undefined,
          responseHeaders,
          fromCache: details.fromCache || false,
        };
      }
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
  );

  // Capture errors
  browserAPI.webRequest.onErrorOccurred.addListener(
    (details) => {
      const startTime = requestStartTimes.get(details.requestId);
      const duration = startTime ? Date.now() - startTime : undefined;
      requestStartTimes.delete(details.requestId);

      // Find and update the request
      const requestIndex = webRequests.findIndex(
        (r) => r.id === details.requestId
      );
      if (requestIndex !== -1) {
        webRequests[requestIndex] = {
          ...webRequests[requestIndex],
          status: 0, // Error status
          statusText: "Error",
          duration,
          error: details.error,
        };
      }
    },
    { urls: ["<all_urls>"] }
  );
} else {
  console.warn("Background: webRequest API not available - web requests won't be captured");
}

// Handle messages from content scripts or popup
browserAPI?.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background: Received message:", message.type, "from", sender.tab?.url || "popup");

  try {
    // Handle any background processing if needed
    if (message.type === "HEALTH_CHECK") {
      console.log("Background: Health check requested");
      sendResponse({ status: "ok", timestamp: Date.now() });
      return true;
    }

    if (message.type === "GET_WEB_REQUESTS") {
      console.log("Background: Sending web requests data:", webRequests.length, "requests");
      sendResponse({ success: true, data: webRequests });
      return true;
    }

    if (message.type === "CLEAR_WEB_REQUESTS") {
      console.log("Background: Clearing web requests data");
      webRequests = [];
      requestStartTimes.clear();
      sendResponse({ success: true });
      return true;
    }

    console.log("Background: Unhandled message type:", message.type);
    // Return false for unhandled messages
    return false;
  } catch (error) {
    console.error("Background: Error handling message:", error);
    sendResponse({ success: false, error: error.message });
    return true;
  }
});

// Ensure proper cleanup
browserAPI?.runtime.onSuspend?.addListener(() => {
  console.log("Cookie Inspector background script suspending");
});

export { };

