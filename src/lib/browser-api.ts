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
}

export const browserAPI = new BrowserAPI();
export type { BrowserTab, BrowserCookie };
