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
  dataType: "cookies" | "localStorage";
  onClearAll?: () => void; // Only for localStorage
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
  const dataLabel = dataType === "cookies" ? "cookies" : "localStorage items";
  const actionLabel =
    dataType === "cookies" ? "Export Cookies" : "Export LocalStorage";

  return (
    <div className="space-y-3 mb-4">
      {/* Search and Actions */}
      <div className="flex gap-2">
        <Input
          placeholder={`Filter ${dataLabel}...`}
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
        {dataType === "localStorage" && onClearAll && (
          <Button
            onClick={onClearAll}
            variant="outline"
            size="sm"
            className="text-xs text-red-500 hover:text-red-700"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* HTTP Endpoint */}
      {/* <div className="flex gap-2">
        <Input
          placeholder="HTTP endpoint URL..."
          value={endpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
          className="flex-1 font-mono text-xs bg-background"
        />
        <Button
          onClick={onSendData}
          disabled={isSending || !endpoint}
          variant="default"
          size="sm"
          className="text-xs bg-blue-600 hover:bg-blue-700"
        >
          {isSending ? "Sending..." : actionLabel}
        </Button>
      </div> */}

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
