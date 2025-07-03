import { Button } from "~components/ui/button";
import { Input } from "~components/ui/input";
import type { BrowserCookie } from "~lib/browser-api";

interface CookieControlsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  endpoint: string;
  onEndpointChange: (endpoint: string) => void;
  sendResult: string | null;
  onCopyAll: () => void;
  onDownload: () => void;
  onSendCookies: () => void;
  isSending: boolean;
  cookiesCount: number;
  filteredCount: number;
}

export function CookieControls({
  searchTerm,
  onSearchChange,
  endpoint,
  onEndpointChange,
  sendResult,
  onCopyAll,
  onDownload,
  onSendCookies,
  isSending,
  cookiesCount,
  filteredCount,
}: CookieControlsProps) {
  return (
    <div className="space-y-3 mb-4">
      {/* Search and Actions */}
      <div className="flex gap-2">
        <Input
          placeholder="Filter cookies..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 font-mono text-xs bg-background"
        />
        <Button
          onClick={onCopyAll}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Copy All
        </Button>
        <Button
          onClick={onDownload}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Download
        </Button>
      </div>

      {/* HTTP Endpoint */}
      <div className="flex gap-2">
        <Input
          placeholder="HTTP endpoint URL..."
          value={endpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
          className="flex-1 font-mono text-xs bg-background"
        />
        <Button
          onClick={onSendCookies}
          disabled={isSending || !endpoint}
          variant="default"
          size="sm"
          className="text-xs bg-blue-600 hover:bg-blue-700"
        >
          {isSending ? "Sending..." : "Export Cookies"}
        </Button>
      </div>

      {/* Send Result */}
      {sendResult && (
        <div
          className={`text-xs p-2 rounded ${
            sendResult.startsWith("✓")
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {sendResult}
        </div>
      )}

      {/* Cookie Count */}
      <div className="text-xs text-muted-foreground">
        {filteredCount} of {cookiesCount} cookies
        {filteredCount !== cookiesCount && " (filtered)"}
      </div>
    </div>
  );
}
