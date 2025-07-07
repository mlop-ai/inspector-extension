import { Button } from "~components/ui/button";
import { Input } from "~components/ui/input";

interface DataControlsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  endpoint: string;
  onEndpointChange: (endpoint: string) => void;
  sendResult: string | null;
  onCopyAll: () => void;
  onDownload: () => void;
  onSendData: () => void;
  isSending: boolean;
  dataCount: number;
  filteredCount: number;
  dataType: "cookies" | "localStorage" | "webRequests";
  onClearAll?: () => void; // For localStorage and webRequests
}

export function DataControls({
  searchTerm,
  onSearchChange,
  endpoint,
  onEndpointChange,
  sendResult,
  onCopyAll,
  onDownload,
  onSendData,
  isSending,
  dataCount,
  filteredCount,
  dataType,
  onClearAll,
}: DataControlsProps) {
  const dataLabel =
    dataType === "cookies"
      ? "cookies"
      : dataType === "localStorage"
        ? "localStorage items"
        : "web requests";
  const actionLabel =
    dataType === "cookies"
      ? "Export Cookies"
      : dataType === "localStorage"
        ? "Export LocalStorage"
        : "Export Requests";

  return (
    <div className="space-y-2 mb-3">
      {/* Search and Actions */}
      <div className="flex gap-2">
        <Input
          placeholder={`Filter ${dataLabel}...`}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 font-mono text-xs bg-background h-7"
        />
        {dataType !== "webRequests" && (
          <Button
            onClick={onCopyAll}
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2"
          >
            Copy All
          </Button>
        )}
        {dataType !== "webRequests" && (
          <Button
            onClick={onDownload}
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2"
          >
            Download
          </Button>
        )}
        {(dataType === "localStorage" || dataType === "webRequests") &&
          onClearAll && (
            <Button
              onClick={onClearAll}
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2 text-red-500 hover:text-red-700"
            >
              Clear All
            </Button>
          )}
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

      {/* Data Count */}
      <div className="text-xs text-muted-foreground">
        {filteredCount} of {dataCount} {dataLabel}
        {filteredCount !== dataCount && " (filtered)"}
      </div>
    </div>
  );
}
