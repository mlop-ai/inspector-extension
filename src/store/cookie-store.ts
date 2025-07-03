import { create } from "zustand";
import type {
  BrowserCookie,
  LocalStorageItem,
  WebRequest,
} from "~lib/browser-api";

interface CookieStore {
  // State
  currentUrl: string;
  searchTerm: string;
  darkMode: boolean;
  endpoint: string;
  sendResult: string | null;
  activeTab: "cookies" | "localStorage" | "webRequests";
  webRequestTypeFilters: Set<string>;

  // Actions
  setCurrentUrl: (url: string) => void;
  setSearchTerm: (term: string) => void;
  toggleDarkMode: () => void;
  setEndpoint: (endpoint: string) => void;
  setSendResult: (result: string | null) => void;
  setActiveTab: (tab: "cookies" | "localStorage" | "webRequests") => void;
  toggleWebRequestTypeFilter: (type: string) => void;
  clearWebRequestTypeFilters: () => void;

  // Computed values
  getFilteredCookies: (cookies: BrowserCookie[]) => BrowserCookie[];
  getFilteredLocalStorage: (items: LocalStorageItem[]) => LocalStorageItem[];
  getFilteredWebRequests: (requests: WebRequest[]) => WebRequest[];
}

export const useCookieStore = create<CookieStore>((set, get) => ({
  // Initial state
  currentUrl: "",
  searchTerm: "",
  darkMode: false,
  endpoint: "https://httpbin.org/post",
  sendResult: null,
  activeTab: "cookies",
  webRequestTypeFilters: new Set(),

  // Actions
  setCurrentUrl: (url) => set({ currentUrl: url }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setEndpoint: (endpoint) => set({ endpoint }),
  setSendResult: (result) => set({ sendResult: result }),
  setActiveTab: (tab) =>
    set((state) => ({
      activeTab: tab,
      // Clear web request type filters when switching away from webRequests tab
      webRequestTypeFilters:
        tab === "webRequests" ? state.webRequestTypeFilters : new Set(),
    })),
  toggleWebRequestTypeFilter: (type) =>
    set((state) => {
      const newFilters = new Set(state.webRequestTypeFilters);
      if (newFilters.has(type)) {
        newFilters.delete(type);
      } else {
        newFilters.add(type);
      }
      return { webRequestTypeFilters: newFilters };
    }),
  clearWebRequestTypeFilters: () => set({ webRequestTypeFilters: new Set() }),

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
  getFilteredWebRequests: (requests) => {
    const { searchTerm, webRequestTypeFilters } = get();

    let filteredRequests = requests;

    // Apply type filters
    if (webRequestTypeFilters.size > 0) {
      filteredRequests = filteredRequests.filter((request) =>
        webRequestTypeFilters.has(request.type)
      );
    }

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredRequests = filteredRequests.filter(
        (request) =>
          request.url.toLowerCase().includes(term) ||
          request.method.toLowerCase().includes(term) ||
          request.type.toLowerCase().includes(term) ||
          (request.status?.toString() || "").includes(term)
      );
    }

    return filteredRequests;
  },
}));
