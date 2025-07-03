import "~main.css";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Button } from "~components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~components/ui/card";
import { Input } from "~components/ui/input";
import { Skeleton } from "~components/ui/skeleton";
import { Toaster } from "~components/ui/toaster";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~components/ui/tooltip";
import { useToast } from "~lib/use-toast";

import { CookieList } from "~components/cookie-list";
import { CookieControls } from "~components/cookie-controls";
import { DownloadService } from "~lib/download-service";
import { useCookieStore } from "~store/cookie-store";
import type { BrowserCookie } from "~lib/browser-api";
import {
  useCurrentTab,
  useCookies,
  useRefreshCookies,
  useSendCookies,
  useCopyCookie,
  useCopyAllCookies,
  useDeleteCookie,
} from "~hooks/use-cookies";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function CookieInspector() {
  const { toast } = useToast();

  // Zustand store
  const {
    currentUrl,
    searchTerm,
    darkMode,
    endpoint,
    sendResult,
    setSearchTerm,
    toggleDarkMode,
    setEndpoint,
    getFilteredCookies,
  } = useCookieStore();

  // React Query hooks
  const { data: currentTab, error: tabError } = useCurrentTab();
  const {
    data: cookies = [],
    isLoading: cookiesLoading,
    error: cookiesError,
  } = useCookies();

  const refreshCookies = useRefreshCookies();
  const sendCookies = useSendCookies();
  const copyCookie = useCopyCookie();
  const copyAllCookies = useCopyAllCookies();
  const deleteCookie = useDeleteCookie();

  // Handle dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Get filtered cookies
  const filteredCookies = getFilteredCookies(cookies);

  // Handle cookie click (copy value)
  const handleCookieClick = async (value: string, name: string) => {
    try {
      await copyCookie.mutateAsync({ value, name });
      toast({
        title: "Copied",
        description: `Copied ${name}`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  // Handle copy all cookies
  const handleCopyAll = async () => {
    try {
      const count = await copyAllCookies.mutateAsync(cookies);
      toast({
        title: "Copied",
        description: `Copied ${count} cookies`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy cookies",
        variant: "destructive",
      });
    }
  };

  // Handle download cookies
  const handleDownload = () => {
    try {
      DownloadService.downloadCookies(cookies, currentUrl);
      toast({
        title: "Success",
        description: "Cookie file downloaded",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download cookies",
        variant: "destructive",
      });
    }
  };

  // Handle send cookies
  const handleSendCookies = async () => {
    try {
      await sendCookies.mutateAsync(cookies);
      if (sendResult?.startsWith("✓")) {
        toast({
          title: "Success",
          description: "Cookies exported successfully",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export cookies",
        variant: "destructive",
      });
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshCookies.mutateAsync();
      toast({
        title: "Refreshed",
        description: "Cookies reloaded",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh cookies",
        variant: "destructive",
      });
    }
  };

  // Handle delete cookie
  const handleDeleteCookie = async (cookie: BrowserCookie) => {
    try {
      await deleteCookie.mutateAsync(cookie);
      toast({
        title: "Deleted",
        description: `Deleted cookie: ${cookie.name}`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete cookie",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (cookiesLoading) {
    return (
      <div className="w-[800px] h-[600px] p-6 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  const error = tabError || cookiesError;

  return (
    <TooltipProvider>
      <div className="w-[800px] h-[600px] p-6 bg-background text-foreground font-mono text-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">
              Cookie Inspector
            </h1>
            <div className="text-xs text-muted-foreground font-mono break-all">
              {currentUrl ? new URL(currentUrl).hostname : "Loading..."}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDarkMode}
              className="text-xs"
            >
              {darkMode ? "☀️" : "🌙"}
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={refreshCookies.isPending}
            >
              {refreshCookies.isPending ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-xs">
            Error: {error.message}
          </div>
        )}

        {/* Controls */}
        <CookieControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          endpoint={endpoint}
          onEndpointChange={setEndpoint}
          sendResult={sendResult}
          onCopyAll={handleCopyAll}
          onDownload={handleDownload}
          onSendCookies={handleSendCookies}
          isSending={sendCookies.isPending}
          cookiesCount={cookies.length}
          filteredCount={filteredCookies.length}
        />

        {/* Cookie List */}
        <div className="space-y-1 max-h-96 overflow-y-auto border rounded bg-background/50">
          {filteredCookies.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-xs">
              {cookies.length === 0
                ? "No cookies detected"
                : "No matching cookies"}
            </div>
          ) : (
            <CookieList
              cookies={filteredCookies}
              onCookieClick={handleCookieClick}
              onCookieDelete={handleDeleteCookie}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-2 text-xs text-muted-foreground">
          Flags: S=Secure, H=HttpOnly, SS=SameSite, T=Session • Click row to
          copy value • Click × to delete
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

function IndexPopup() {
  return (
    <QueryClientProvider client={queryClient}>
      <CookieInspector />
    </QueryClientProvider>
  );
}

export default IndexPopup;
