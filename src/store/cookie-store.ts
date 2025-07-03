import { create } from "zustand";
import type { BrowserCookie, LocalStorageItem } from "~lib/browser-api";

interface CookieStore {
  // State
  currentUrl: string;
  searchTerm: string;
  darkMode: boolean;
  endpoint: string;
  sendResult: string | null;
  activeTab: "cookies" | "localStorage";

  // Actions
  setCurrentUrl: (url: string) => void;
  setSearchTerm: (term: string) => void;
  toggleDarkMode: () => void;
  setEndpoint: (endpoint: string) => void;
  setSendResult: (result: string | null) => void;
  setActiveTab: (tab: "cookies" | "localStorage") => void;

  // Computed values
  getFilteredCookies: (cookies: BrowserCookie[]) => BrowserCookie[];
  getFilteredLocalStorage: (items: LocalStorageItem[]) => LocalStorageItem[];
}

export const useCookieStore = create<CookieStore>((set, get) => ({
  // Initial state
  currentUrl: "",
  searchTerm: "",
  darkMode: false,
  endpoint: "https://httpbin.org/post",
  sendResult: null,
  activeTab: "cookies",

  // Actions
  setCurrentUrl: (url) => set({ currentUrl: url }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setEndpoint: (endpoint) => set({ endpoint }),
  setSendResult: (result) => set({ sendResult: result }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Computed values
  getFilteredCookies: (cookies) => {
    const { searchTerm } = get();
    if (!searchTerm) return cookies;

    const term = searchTerm.toLowerCase();
    return cookies.filter(
      (cookie) =>
        cookie.name.toLowerCase().includes(term) ||
        cookie.value.toLowerCase().includes(term)
    );
  },
  getFilteredLocalStorage: (items) => {
    const { searchTerm } = get();
    if (!searchTerm) return items;

    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.key.toLowerCase().includes(term) ||
        item.value.toLowerCase().includes(term)
    );
  },
}));
