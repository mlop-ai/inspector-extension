import { create } from "zustand";
import type { BrowserCookie } from "~lib/browser-api";

interface CookieStore {
  // State
  currentUrl: string;
  searchTerm: string;
  darkMode: boolean;
  endpoint: string;
  sendResult: string | null;

  // Actions
  setCurrentUrl: (url: string) => void;
  setSearchTerm: (term: string) => void;
  toggleDarkMode: () => void;
  setEndpoint: (endpoint: string) => void;
  setSendResult: (result: string | null) => void;

  // Computed values
  getFilteredCookies: (cookies: BrowserCookie[]) => BrowserCookie[];
}

export const useCookieStore = create<CookieStore>((set, get) => ({
  // Initial state
  currentUrl: "",
  searchTerm: "",
  darkMode: false,
  endpoint: "https://httpbin.org/post",
  sendResult: null,

  // Actions
  setCurrentUrl: (url) => set({ currentUrl: url }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setEndpoint: (endpoint) => set({ endpoint }),
  setSendResult: (result) => set({ sendResult: result }),

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
}));
