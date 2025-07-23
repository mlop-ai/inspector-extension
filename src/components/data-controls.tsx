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
        ? "items"
        : "requests";

  return (
    <div className="space-y-2 mb-3">
      {/* Count Display */}
      <div className="text-xs text-muted-foreground">
        {filteredCount === dataCount
          ? `${dataCount} ${dataLabel}`
          : `${filteredCount} of ${dataCount} ${dataLabel}`}
      </div>

      {/* Search and Actions */}
      <div className="flex gap-1">
        <Input
          placeholder={`Filter ${dataLabel}...`}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 h-8 text-xs"
        />
        {dataType !== "webRequests" && (
          <Button
            onClick={onCopyAll}
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs"
          >
            Copy
          </Button>
        )}
        {dataType !== "webRequests" && (
          <Button
            onClick={onDownload}
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs"
          >
            Save
          </Button>
        )}
        {(dataType === "localStorage" || dataType === "webRequests") &&
          onClearAll && (
            <Button
              onClick={onClearAll}
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs text-red-500 hover:text-red-700"
            >
              Clear
            </Button>
          )}
      </div>

      {/* Export Section for non-webRequests */}
      {dataType !== "webRequests" && (
        <div className="flex gap-1">
          <Input
            placeholder="Export endpoint..."
            value={endpoint}
            onChange={(e) => onEndpointChange(e.target.value)}
            className="flex-1 h-8 text-xs"
          />
          <Button
            onClick={onSendData}
            variant="outline"
            size="sm"
            disabled={isSending}
            className="h-8 px-2 text-xs"
          >
            {isSending ? "..." : "Send"}
          </Button>
        </div>
      )}

      {/* Send Result */}
      {sendResult && (
        <div className="text-xs">
          <span
            className={
              sendResult.startsWith("✓")
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }
          >
            {sendResult}
          </span>
        </div>
      )}
    </div>
  );
}
