import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserAPI, type BrowserCookie } from "~lib/browser-api";
import { useCookieStore } from "~store/cookie-store";

// Query keys
export const QUERY_KEYS = {
  cookies: (url: string) => ["cookies", url] as const,
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

// Hook to copy cookie value
export function useCopyCookie() {
  return useMutation({
    mutationFn: async ({ value, name }: { value: string; name: string }) => {
      await browserAPI.copyToClipboard(value);
      return { value, name };
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
