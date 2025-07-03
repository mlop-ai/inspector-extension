/**
 * Cross-browser compatible API service
 * Uses Plasmo's browser utilities for maximum compatibility
 */

interface BrowserTab {
  id?: number;
  url?: string;
}

interface BrowserCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?:
    | "Strict"
    | "Lax"
    | "None"
    | "no_restriction"
    | "lax"
    | "strict"
    | "unspecified";
  expirationDate?: number;
  session: boolean;
}

interface LocalStorageItem {
  key: string;
  value: string;
  size: number; // Size in bytes
}

interface WebRequest {
  id: string;
  url: string;
  method: string;
  status?: number;
  timestamp: number;
  type: string; // main_frame, sub_frame, stylesheet, script, image, etc.
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
}

class BrowserAPI {
  private async getBrowser() {
    // Plasmo provides cross-browser compatibility
    if (typeof chrome !== "undefined" && chrome.tabs) {
      return chrome;
    }
    // Firefox WebExtensions API
    if (
      typeof (globalThis as any).browser !== "undefined" &&
      (globalThis as any).browser.tabs
    ) {
      return (globalThis as any).browser;
    }
    throw new Error("Browser API not available");
  }

  async getCurrentTab(): Promise<BrowserTab> {
    const browserAPI = await this.getBrowser();

    const tabs = await browserAPI.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tabs[0]?.url) {
      throw new Error("Cannot access current tab URL");
    }

    return tabs[0];
  }

  async getCookies(url: string): Promise<BrowserCookie[]> {
    const browserAPI = await this.getBrowser();

    if (!browserAPI.cookies) {
      throw new Error("Cookies API not available");
    }

    const cookies = await browserAPI.cookies.getAll({ url });

    return cookies.map(
      (cookie): BrowserCookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: this.normalizeSameSite(cookie.sameSite),
        expirationDate: cookie.expirationDate,
        session: cookie.session,
      })
    );
  }

  private normalizeSameSite(sameSite?: string): BrowserCookie["sameSite"] {
    if (!sameSite) return undefined;

    const normalized = sameSite.toLowerCase();
    switch (normalized) {
      case "strict":
      case "lax":
      case "none":
        return sameSite as BrowserCookie["sameSite"];
      case "no_restriction":
        return "None";
      case "unspecified":
        return undefined;
      default:
        return sameSite as BrowserCookie["sameSite"];
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  }

  async deleteCookie(cookie: BrowserCookie): Promise<void> {
    const browserAPI = await this.getBrowser();

    if (!browserAPI.cookies) {
      throw new Error("Cookies API not available");
    }

    // Construct the URL for the cookie's domain
    const protocol = cookie.secure ? "https://" : "http://";
    const url = `${protocol}${cookie.domain}${cookie.path}`;

    try {
      await browserAPI.cookies.remove({
        url: url,
        name: cookie.name,
      });
    } catch (error) {
      throw new Error(`Failed to delete cookie: ${error.message}`);
    }
  }

  // LocalStorage methods
  async getLocalStorage(): Promise<LocalStorageItem[]> {
    const browserAPI = await this.getBrowser();
    const tab = await this.getCurrentTab();

    if (!tab.id) {
      throw new Error("No active tab found");
    }

    return new Promise((resolve, reject) => {
      browserAPI.tabs.sendMessage(
        tab.id!,
        { type: "GET_LOCALSTORAGE" },
        (response) => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
            return;
          }

          if (!response) {
            reject(new Error("No response from content script"));
            return;
          }

          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error || "Failed to get localStorage"));
          }
        }
      );
    });
  }

  async setLocalStorageItem(key: string, value: string): Promise<void> {
    const browserAPI = await this.getBrowser();
    const tab = await this.getCurrentTab();

    if (!tab.id) {
      throw new Error("No active tab found");
    }

    return new Promise((resolve, reject) => {
      browserAPI.tabs.sendMessage(
        tab.id!,
        { type: "SET_LOCALSTORAGE", key, value },
        (response) => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
            return;
          }

          if (!response) {
            reject(new Error("No response from content script"));
            return;
          }

          if (response.success) {
            resolve();
          } else {
            reject(
              new Error(response.error || "Failed to set localStorage item")
            );
          }
        }
      );
    });
  }

  async deleteLocalStorageItem(key: string): Promise<void> {
    const browserAPI = await this.getBrowser();
    const tab = await this.getCurrentTab();

    if (!tab.id) {
      throw new Error("No active tab found");
    }

    return new Promise((resolve, reject) => {
      browserAPI.tabs.sendMessage(
        tab.id!,
        { type: "DELETE_LOCALSTORAGE", key },
        (response) => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
            return;
          }

          if (!response) {
            reject(new Error("No response from content script"));
            return;
          }

          if (response.success) {
            resolve();
          } else {
            reject(
              new Error(response.error || "Failed to delete localStorage item")
            );
          }
        }
      );
    });
  }

  async clearLocalStorage(): Promise<void> {
    const browserAPI = await this.getBrowser();
    const tab = await this.getCurrentTab();

    if (!tab.id) {
      throw new Error("No active tab found");
    }

    return new Promise((resolve, reject) => {
      browserAPI.tabs.sendMessage(
        tab.id!,
        { type: "CLEAR_LOCALSTORAGE" },
        (response) => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
            return;
          }

          if (!response) {
            reject(new Error("No response from content script"));
            return;
          }

          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || "Failed to clear localStorage"));
          }
        }
      );
    });
  }

  // WebRequest methods
  async getWebRequests(): Promise<WebRequest[]> {
    const browserAPI = await this.getBrowser();

    return new Promise((resolve, reject) => {
      browserAPI.runtime.sendMessage(
        { type: "GET_WEB_REQUESTS" },
        (response) => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
            return;
          }

          if (!response) {
            reject(new Error("No response from background script"));
            return;
          }

          if (response.success) {
            resolve(response.data || []);
          } else {
            reject(new Error(response.error || "Failed to get web requests"));
          }
        }
      );
    });
  }

  async clearWebRequests(): Promise<void> {
    const browserAPI = await this.getBrowser();

    return new Promise((resolve, reject) => {
      browserAPI.runtime.sendMessage(
        { type: "CLEAR_WEB_REQUESTS" },
        (response) => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
            return;
          }

          if (!response) {
            reject(new Error("No response from background script"));
            return;
          }

          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || "Failed to clear web requests"));
          }
        }
      );
    });
  }
}

export const browserAPI = new BrowserAPI();
export type { BrowserTab, BrowserCookie, LocalStorageItem, WebRequest };
