import "~main.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import { Button } from "~components/ui/button";
import { Skeleton } from "~components/ui/skeleton";
import { Toaster } from "~components/ui/toaster";
import {
  TooltipProvider
} from "~components/ui/tooltip";
import { useToast } from "~lib/use-toast";

import { CookieList } from "~components/cookie-list";
import { DataControls } from "~components/data-controls";
import { LocalStorageList } from "~components/localStorage-list";
import { WebRequestList } from "~components/web-request-list";
import { WebRequestTypeFilters } from "~components/web-request-type-filters";
import {
  useClearLocalStorage,
  useClearWebRequests,
  useCookies,
  useCopyAllCookies,
  useCopyAllLocalStorage,
  useCopyCookie,
  useCopyLocalStorageItem,
  useCopyWebRequestUrl,
  useCurrentTab,
  useDeleteCookie,
  useDeleteLocalStorageItem,
  useLocalStorage,
  useRefreshCookies,
  useRefreshLocalStorage,
  useRefreshWebRequests,
  useSendCookies,
  useSendLocalStorage,
  useWebRequests,
} from "~hooks/use-storage";
import type {
  BrowserCookie
} from "~lib/browser-api";
import { DownloadService } from "~lib/download-service";
import { useCookieStore } from "~store/cookie-store";

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
    systemDarkMode,
    endpoint,
    sendResult,
    activeTab,
    webRequestTypeFilters,
    setSearchTerm,
    setDarkMode,
    setSystemDarkMode,
    toggleDarkMode,
    setEndpoint,
    setActiveTab,
    toggleWebRequestTypeFilter,
    clearWebRequestTypeFilters,
    getFilteredCookies,
    getFilteredLocalStorage,
    getFilteredWebRequests,
  } = useCookieStore();

  // System dark mode detection and listener
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Set initial system dark mode
      setSystemDarkMode(mediaQuery.matches);
      
      // Listen for changes
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemDarkMode(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [setSystemDarkMode]);

  // Handle dark mode application
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // React Query hooks
  const { data: currentTab, error: tabError } = useCurrentTab();
  const {
    data: cookies = [],
    isLoading: cookiesLoading,
    error: cookiesError,
  } = useCookies();
  const {
    data: localStorageItems = [],
    isLoading: localStorageLoading,
    error: localStorageError,
  } = useLocalStorage();
  const {
    data: webRequests = [],
    isLoading: webRequestsLoading,
    error: webRequestsError,
  } = useWebRequests();

  const refreshCookies = useRefreshCookies();
  const refreshLocalStorage = useRefreshLocalStorage();
  const refreshWebRequests = useRefreshWebRequests();
  const sendCookies = useSendCookies();
  const sendLocalStorage = useSendLocalStorage();
  const copyCookie = useCopyCookie();
  const copyLocalStorageItem = useCopyLocalStorageItem();
  const copyWebRequestUrl = useCopyWebRequestUrl();
  const copyAllCookies = useCopyAllCookies();
  const copyAllLocalStorage = useCopyAllLocalStorage();
  const deleteCookie = useDeleteCookie();
  const deleteLocalStorageItem = useDeleteLocalStorageItem();
  const clearLocalStorage = useClearLocalStorage();
  const clearWebRequests = useClearWebRequests();

  // Get filtered data
  const filteredCookies = getFilteredCookies(cookies);
  const filteredLocalStorage = getFilteredLocalStorage(localStorageItems);
  const filteredWebRequests = getFilteredWebRequests(webRequests);

  // Get available request types for filtering
  const availableRequestTypes = Array.from(
    new Set(webRequests.map((request) => request.type))
  ).sort();

  // Generic handlers
  const handleItemClick = async (value: string, name?: string) => {
    try {
      if (activeTab === "cookies") {
        await copyCookie.mutateAsync({ value, name: name! });
        toast({
          title: "Copied",
          description: `Copied ${name}`,
          variant: "success",
        });
      } else if (activeTab === "localStorage") {
        await copyLocalStorageItem.mutateAsync({ value, key: name! });
        toast({
          title: "Copied",
          description: `Copied ${name}`,
          variant: "success",
        });
      } else if (activeTab === "webRequests") {
        await copyWebRequestUrl.mutateAsync(value);
        toast({
          title: "Copied",
          description: "Copied URL",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const handleCopyAll = async () => {
    try {
      if (activeTab === "cookies") {
        const count = await copyAllCookies.mutateAsync(cookies);
        toast({
          title: "Copied",
          description: `Copied ${count} cookies`,
          variant: "success",
        });
      } else {
        const count = await copyAllLocalStorage.mutateAsync(localStorageItems);
        toast({
          title: "Copied",
          description: `Copied ${count} localStorage items`,
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to copy ${activeTab}`,
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    try {
      if (activeTab === "cookies") {
        DownloadService.downloadCookies(cookies, currentUrl);
        toast({
          title: "Success",
          description: "Cookie file downloaded",
          variant: "success",
        });
      } else {
        DownloadService.downloadLocalStorage(localStorageItems, currentUrl);
        toast({
          title: "Success",
          description: "LocalStorage file downloaded",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to download ${activeTab}`,
        variant: "destructive",
      });
    }
  };

  const handleSendData = async () => {
    try {
      if (activeTab === "cookies") {
        await sendCookies.mutateAsync(cookies);
      } else {
        await sendLocalStorage.mutateAsync(localStorageItems);
      }

      if (sendResult?.startsWith("✓")) {
        toast({
          title: "Success",
          description: `${activeTab} exported successfully`,
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to export ${activeTab}`,
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    try {
      if (activeTab === "cookies") {
        await refreshCookies.mutateAsync();
        toast({
          title: "Refreshed",
          description: "Cookies reloaded",
          variant: "success",
        });
      } else if (activeTab === "localStorage") {
        await refreshLocalStorage.mutateAsync();
        toast({
          title: "Refreshed",
          description: "LocalStorage reloaded",
          variant: "success",
        });
      } else if (activeTab === "webRequests") {
        await refreshWebRequests.mutateAsync();
        toast({
          title: "Refreshed",
          description: "Web requests reloaded",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to refresh ${activeTab}`,
        variant: "destructive",
      });
    }
  };

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

  const handleDeleteLocalStorageItem = async (key: string) => {
    try {
      await deleteLocalStorageItem.mutateAsync(key);
      toast({
        title: "Deleted",
        description: `Deleted localStorage item: ${key}`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete localStorage item",
        variant: "destructive",
      });
    }
  };

  const handleClearAllLocalStorage = async () => {
    try {
      await clearLocalStorage.mutateAsync();
      toast({
        title: "Cleared",
        description: "All localStorage items cleared",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear localStorage",
        variant: "destructive",
      });
    }
  };

  const handleClearAllWebRequests = async () => {
    try {
      await clearWebRequests.mutateAsync();
      toast({
        title: "Cleared",
        description: "All web requests cleared",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear web requests",
        variant: "destructive",
      });
    }
  };

  // Loading state
  const isLoading =
    activeTab === "cookies"
      ? cookiesLoading
      : activeTab === "localStorage"
        ? localStorageLoading
        : webRequestsLoading;
  if (isLoading) {
    return (
      <div className="min-w-80 max-w-md p-4 space-y-4 relative">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <Toaster />
      </div>
    );
  }

  // Error state
  const error =
    tabError || cookiesError || localStorageError || webRequestsError;

  return (
    <TooltipProvider>
      <div className="min-w-80 max-w-md p-3 bg-background text-foreground flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-blue-600 dark:text-blue-400 leading-tight">
              Inspector
            </h1>
            <div className="text-xs text-muted-foreground truncate">
              {currentUrl ? new URL(currentUrl).hostname : "Loading..."}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDarkMode}
              className="h-8 w-8 p-0"
              title={`Toggle dark mode (System: ${systemDarkMode ? 'Dark' : 'Light'})`}
            >
              {darkMode ? "🌙" : "☀️"}
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              disabled={
                (activeTab === "cookies" && refreshCookies.isPending) ||
                (activeTab === "localStorage" &&
                  refreshLocalStorage.isPending) ||
                (activeTab === "webRequests" && refreshWebRequests.isPending)
              }
            >
              {(activeTab === "cookies" && refreshCookies.isPending) ||
              (activeTab === "localStorage" && refreshLocalStorage.isPending) ||
              (activeTab === "webRequests" && refreshWebRequests.isPending)
                ? "..."
                : "↻"}
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-3 border-b">
          <Button
            variant={activeTab === "cookies" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("cookies")}
            className="rounded-b-none h-8 text-xs px-2 flex-1"
          >
            Cookies ({cookies.length})
          </Button>
          <Button
            variant={activeTab === "localStorage" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("localStorage")}
            className="rounded-b-none h-8 text-xs px-2 flex-1"
          >
            Storage ({localStorageItems.length})
          </Button>
          <Button
            variant={activeTab === "webRequests" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("webRequests")}
            className="rounded-b-none h-8 text-xs px-2 flex-1"
          >
            Requests ({webRequests.length})
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-3 p-2 bg-red-500/20 border border-red-500 rounded text-red-400 text-xs">
            Error: {error.message}
          </div>
        )}

        {/* Controls */}
        <DataControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          endpoint={endpoint}
          onEndpointChange={setEndpoint}
          sendResult={sendResult}
          onCopyAll={handleCopyAll}
          onDownload={handleDownload}
          onSendData={handleSendData}
          isSending={
            (activeTab === "cookies" && sendCookies.isPending) ||
            (activeTab === "localStorage" && sendLocalStorage.isPending)
          }
          dataCount={
            activeTab === "cookies"
              ? cookies.length
              : activeTab === "localStorage"
                ? localStorageItems.length
                : webRequests.length
          }
          filteredCount={
            activeTab === "cookies"
              ? filteredCookies.length
              : activeTab === "localStorage"
                ? filteredLocalStorage.length
                : filteredWebRequests.length
          }
          dataType={activeTab}
          onClearAll={
            activeTab === "localStorage"
              ? handleClearAllLocalStorage
              : activeTab === "webRequests"
                ? handleClearAllWebRequests
                : undefined
          }
        />

        {/* Web Request Type Filters */}
        {activeTab === "webRequests" && (
          <WebRequestTypeFilters
            activeFilters={webRequestTypeFilters}
            onToggleFilter={toggleWebRequestTypeFilter}
            onClearFilters={clearWebRequestTypeFilters}
            availableTypes={availableRequestTypes}
          />
        )}

        {/* Data List */}
        <div className="border rounded bg-background/50 min-h-32 max-h-96 overflow-y-auto mb-3">
          {activeTab === "cookies" ? (
            filteredCookies.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                {cookies.length === 0
                  ? "No cookies detected"
                  : "No matching cookies"}
              </div>
            ) : (
              <CookieList
                cookies={filteredCookies}
                onCookieClick={handleItemClick}
                onCookieDelete={handleDeleteCookie}
              />
            )
          ) : activeTab === "localStorage" ? (
            filteredLocalStorage.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                {localStorageItems.length === 0
                  ? "No storage items detected"
                  : "No matching storage items"}
              </div>
            ) : (
              <LocalStorageList
                items={filteredLocalStorage}
                onItemClick={handleItemClick}
                onItemDelete={handleDeleteLocalStorageItem}
              />
            )
          ) : filteredWebRequests.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {webRequests.length === 0
                ? "No web requests detected"
                : "No matching web requests"}
            </div>
          ) : (
            <WebRequestList
              requests={filteredWebRequests}
              onRequestClick={handleItemClick}
            />
          )}
        </div>

        {/* Legend */}
        <div className="text-xs text-muted-foreground">
          {activeTab === "cookies"
            ? "Click row to copy • × to delete"
            : activeTab === "localStorage"
              ? "Click row to copy • × to delete"
              : "Click row to expand details"}
        </div>
        
        <Toaster />
      </div>
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
