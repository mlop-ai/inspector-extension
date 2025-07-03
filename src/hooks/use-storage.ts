import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  browserAPI,
  type BrowserCookie,
  type LocalStorageItem,
  type WebRequest,
} from "~lib/browser-api";
import { useCookieStore } from "~store/cookie-store";

// Query keys
export const QUERY_KEYS = {
  cookies: (url: string) => ["cookies", url] as const,
  localStorage: (url: string) => ["localStorage", url] as const,
  webRequests: () => ["webRequests"] as const,
  currentTab: () => ["currentTab"] as const,
};

// Hook to get current tab
export function useCurrentTab() {
  const { setCurrentUrl } = useCookieStore();

  return useQuery({
    queryKey: QUERY_KEYS.currentTab(),
    queryFn: async () => {
      const tab = await browserAPI.getCurrentTab();
      if (tab.url) {
        setCurrentUrl(tab.url);
      }
      return tab;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  });
}

// Hook to get cookies for current tab
export function useCookies() {
  const { currentUrl } = useCookieStore();

  return useQuery({
    queryKey: QUERY_KEYS.cookies(currentUrl),
    queryFn: () => browserAPI.getCookies(currentUrl),
    enabled: !!currentUrl,
    staleTime: 1000 * 30, // 30 seconds
    retry: 2,
  });
}

// Hook to get localStorage for current tab
export function useLocalStorage() {
  const { currentUrl } = useCookieStore();

  return useQuery({
    queryKey: QUERY_KEYS.localStorage(currentUrl),
    queryFn: () => browserAPI.getLocalStorage(),
    enabled: !!currentUrl,
    staleTime: 1000 * 30, // 30 seconds
    retry: 2,
  });
}

// Hook to get web requests
export function useWebRequests() {
  return useQuery({
    queryKey: QUERY_KEYS.webRequests(),
    queryFn: () => browserAPI.getWebRequests(),
    staleTime: 1000 * 5, // 5 seconds
    retry: 2,
    refetchInterval: 2000, // Auto-refresh every 2 seconds
  });
}

// Hook to refresh cookies
export function useRefreshCookies() {
  const queryClient = useQueryClient();
  const { currentUrl } = useCookieStore();

  return useMutation({
    mutationFn: async () => {
      const cookies = await browserAPI.getCookies(currentUrl);
      queryClient.setQueryData(QUERY_KEYS.cookies(currentUrl), cookies);
      return cookies;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.cookies(currentUrl),
      });
    },
  });
}

// Hook to refresh localStorage
export function useRefreshLocalStorage() {
  const queryClient = useQueryClient();
  const { currentUrl } = useCookieStore();

  return useMutation({
    mutationFn: async () => {
      const items = await browserAPI.getLocalStorage();
      queryClient.setQueryData(QUERY_KEYS.localStorage(currentUrl), items);
      return items;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.localStorage(currentUrl),
      });
    },
  });
}

// Hook to refresh web requests
export function useRefreshWebRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const requests = await browserAPI.getWebRequests();
      queryClient.setQueryData(QUERY_KEYS.webRequests(), requests);
      return requests;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.webRequests(),
      });
    },
  });
}

// Hook to send cookies to endpoint
export function useSendCookies() {
  const { endpoint, currentUrl, setSendResult } = useCookieStore();

  return useMutation({
    mutationFn: async (cookies: BrowserCookie[]) => {
      setSendResult(null);

      const payload = {
        url: currentUrl,
        timestamp: new Date().toISOString(),
        cookies: cookies.map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite,
          expires: cookie.expirationDate
            ? new Date(cookie.expirationDate * 1000).toISOString()
            : null,
          session: cookie.session,
        })),
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return response;
    },
    onSuccess: (response) => {
      setSendResult(`✓ Success: ${response.status} ${response.statusText}`);
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? `✗ Error: ${error.message}`
          : "✗ Unknown error occurred";
      setSendResult(errorMessage);
    },
  });
}

// Hook to send localStorage to endpoint
export function useSendLocalStorage() {
  const { endpoint, currentUrl, setSendResult } = useCookieStore();

  return useMutation({
    mutationFn: async (items: LocalStorageItem[]) => {
      setSendResult(null);

      const payload = {
        url: currentUrl,
        timestamp: new Date().toISOString(),
        localStorage: items.map((item) => ({
          key: item.key,
          value: item.value,
          size: item.size,
        })),
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return response;
    },
    onSuccess: (response) => {
      setSendResult(`✓ Success: ${response.status} ${response.statusText}`);
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? `✗ Error: ${error.message}`
          : "✗ Unknown error occurred";
      setSendResult(errorMessage);
    },
  });
}

// Hook to copy cookie value
export function useCopyCookie() {
  return useMutation({
    mutationFn: async ({ value, name }: { value: string; name: string }) => {
      await browserAPI.copyToClipboard(value);
      return { value, name };
    },
  });
}

// Hook to copy localStorage item value
export function useCopyLocalStorageItem() {
  return useMutation({
    mutationFn: async ({ value, key }: { value: string; key: string }) => {
      await browserAPI.copyToClipboard(value);
      return { value, key };
    },
  });
}

// Hook to copy web request URL
export function useCopyWebRequestUrl() {
  return useMutation({
    mutationFn: async (url: string) => {
      await browserAPI.copyToClipboard(url);
      return url;
    },
  });
}

// Hook to copy all cookies
export function useCopyAllCookies() {
  return useMutation({
    mutationFn: async (cookies: BrowserCookie[]) => {
      const cookieString = cookies
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");
      await browserAPI.copyToClipboard(cookieString);
      return cookies.length;
    },
  });
}

// Hook to copy all localStorage items
export function useCopyAllLocalStorage() {
  return useMutation({
    mutationFn: async (items: LocalStorageItem[]) => {
      const storageString = items
        .map((item) => `${item.key}=${item.value}`)
        .join("\n");
      await browserAPI.copyToClipboard(storageString);
      return items.length;
    },
  });
}

// Hook to delete a cookie
export function useDeleteCookie() {
  const queryClient = useQueryClient();
  const { currentUrl } = useCookieStore();

  return useMutation({
    mutationFn: async (cookie: BrowserCookie) => {
      await browserAPI.deleteCookie(cookie);
      return cookie;
    },
    onSuccess: () => {
      // Refresh the cookies list after deletion
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.cookies(currentUrl),
      });
    },
  });
}

// Hook to delete a localStorage item
export function useDeleteLocalStorageItem() {
  const queryClient = useQueryClient();
  const { currentUrl } = useCookieStore();

  return useMutation({
    mutationFn: async (key: string) => {
      await browserAPI.deleteLocalStorageItem(key);
      return key;
    },
    onSuccess: () => {
      // Refresh the localStorage list after deletion
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.localStorage(currentUrl),
      });
    },
  });
}

// Hook to set a localStorage item
export function useSetLocalStorageItem() {
  const queryClient = useQueryClient();
  const { currentUrl } = useCookieStore();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await browserAPI.setLocalStorageItem(key, value);
      return { key, value };
    },
    onSuccess: () => {
      // Refresh the localStorage list after setting
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.localStorage(currentUrl),
      });
    },
  });
}

// Hook to clear all localStorage
export function useClearLocalStorage() {
  const queryClient = useQueryClient();
  const { currentUrl } = useCookieStore();

  return useMutation({
    mutationFn: async () => {
      await browserAPI.clearLocalStorage();
    },
    onSuccess: () => {
      // Refresh the localStorage list after clearing
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.localStorage(currentUrl),
      });
    },
  });
}

// Hook to clear web requests
export function useClearWebRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await browserAPI.clearWebRequests();
    },
    onSuccess: () => {
      // Refresh the web requests list after clearing
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.webRequests(),
      });
    },
  });
}
