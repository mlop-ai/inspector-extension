import { useState } from "react";
import { InteractiveFlameGraph } from "~components/interactive-flamegraph";
import { Button } from "~components/ui/button";
import type { WebRequest } from "~lib/browser-api";

interface WebRequestListProps {
  requests: WebRequest[];
  onRequestClick: (url: string) => void;
}

export function WebRequestList({
  requests,
  onRequestClick,
}: WebRequestListProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'flamegraph'>('list');

  const toggleRow = (requestId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRows(newExpanded);
  };

  if (requests.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-xs">
        No web requests detected
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between p-2 bg-muted/50 border-b">
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="text-xs h-6"
          >
            List
          </Button>
          <Button
            variant={viewMode === 'flamegraph' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('flamegraph')}
            className="text-xs h-6"
          >
            Flamegraph
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {requests.length} request{requests.length !== 1 ? 's' : ''}
        </div>
      </div>

      {viewMode === 'flamegraph' ? (
        <div className="p-4 w-full overflow-hidden">
          <InteractiveFlameGraph requests={requests} />
        </div>
      ) : (
        <div className="overflow-x-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-muted/80 backdrop-blur-sm p-2 text-xs font-bold border-b grid grid-cols-12 gap-2 text-muted-foreground min-w-0">
            <div className="col-span-1"></div>
            <div className="col-span-1 truncate">Status</div>
            <div className="col-span-1 truncate">Method</div>
            <div className="col-span-4 truncate">Name</div>
            <div className="col-span-2 truncate">Type</div>
            <div className="col-span-1 truncate">Size</div>
            <div className="col-span-1 truncate">Time</div>
            <div className="col-span-1 truncate">Age</div>
          </div>

          {/* Request Rows */}
          {requests.map((request, index) => (
            <WebRequestRow
              key={`${request.id}-${index}`}
              request={request}
              isExpanded={expandedRows.has(request.id)}
              onToggle={() => toggleRow(request.id)}
              onCopyUrl={() => onRequestClick(request.url)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface WebRequestRowProps {
  request: WebRequest;
  isExpanded: boolean;
  onToggle: () => void;
  onCopyUrl: () => void;
}

// Component to show detailed request information
function RequestDetails({ request }: { request: WebRequest }) {
  const formatHeaders = (headers?: { [key: string]: string }) => {
    if (!headers || Object.keys(headers).length === 0) {
      return <div className="text-muted-foreground text-xs p-2">No headers</div>;
    }

    return (
      <div className="space-y-1 max-h-48 overflow-y-auto bg-background/50 border rounded p-3">
        {Object.entries(headers).map(([key, value]) => (
          <div key={key} className="grid grid-cols-3 gap-2 text-xs">
            <div className="font-semibold text-blue-600 dark:text-blue-400 truncate">
              {key}:
            </div>
            <div className="col-span-2 text-muted-foreground break-all">
              {value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-background/50 border rounded">
        <div className="space-y-2">
          <h4 className="font-semibold text-xs text-blue-600 dark:text-blue-400">General</h4>
          <div className="text-xs space-y-1">
            <div><strong>URL:</strong> {request.url}</div>
            <div><strong>Method:</strong> <span className="text-blue-500">{request.method}</span></div>
            <div><strong>Status:</strong> <span className={request.status ? "text-green-500" : "text-red-500"}>{request.status || "Error"} {request.statusText}</span></div>
            <div><strong>Type:</strong> <span className="text-purple-500">{request.type}</span></div>
            {request.fromCache && <div><strong>Source:</strong> <span className="text-yellow-500">Cache</span></div>}
            {request.error && <div><strong>Error:</strong> <span className="text-red-500">{request.error}</span></div>}
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-xs text-green-600 dark:text-green-400">Timing</h4>
          <div className="text-xs space-y-1">
            <div><strong>Duration:</strong> {request.duration ? `${request.duration}ms` : "N/A"}</div>
            <div><strong>Timestamp:</strong> {new Date(request.timestamp).toLocaleString()}</div>
            {request.initiator && <div><strong>Initiator:</strong> {request.initiator}</div>}
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-xs text-orange-600 dark:text-orange-400">Size</h4>
          <div className="text-xs space-y-1">
            <div><strong>Size:</strong> {request.size ? `${request.size} bytes` : "N/A"}</div>
          </div>
        </div>
      </div>

      {/* Single Request Timing Visualization */}
      {request.duration && (
        <div className="p-3 bg-background/50 border rounded">
          <h4 className="font-semibold text-xs text-purple-600 dark:text-purple-400 mb-3">Request Timeline</h4>
          <div className="space-y-2">
            <div className="relative">
              <div className="h-4 bg-muted rounded overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0ms</span>
                <span>{request.duration}ms</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-blue-500">●</span> Request sent: 0ms
              </div>
              <div>
                <span className="text-green-500">●</span> Response received: {request.duration}ms
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Details */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400 border-b pb-2">
            Request
          </h4>

          <div>
            <div className="font-semibold text-xs mb-2">Request Headers</div>
            {formatHeaders(request.requestHeaders)}
          </div>

          {request.requestBody && (
            <div>
              <div className="font-semibold text-xs mb-2">Request Body</div>
              <div className="text-muted-foreground break-all text-xs bg-background/50 p-3 rounded border max-h-48 overflow-y-auto">
                {request.requestBody}
              </div>
            </div>
          )}
        </div>

        {/* Response Details */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-green-600 dark:text-green-400 border-b pb-2">
            Response
          </h4>

          <div>
            <div className="font-semibold text-xs mb-2">Response Headers</div>
            {formatHeaders(request.responseHeaders)}
          </div>

          {request.responseBody && (
            <div>
              <div className="font-semibold text-xs mb-2">Response Body</div>
              <div className="text-muted-foreground break-all text-xs bg-background/50 p-3 rounded border max-h-48 overflow-y-auto">
                {request.responseBody}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WebRequestRow({
  request,
  isExpanded,
  onToggle,
  onCopyUrl,
}: WebRequestRowProps) {
  const formatSize = (bytes?: number): string => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatAge = (timestamp: number): string => {
    const ageMs = Date.now() - timestamp;
    if (ageMs < 1000) return `${ageMs}ms`;
    if (ageMs < 60000) return `${(ageMs / 1000).toFixed(1)}s`;
    return `${(ageMs / 60000).toFixed(1)}m`;
  };

  const getStatusColor = (status?: number): string => {
    if (!status) return "text-red-500"; // Error
    if (status >= 200 && status < 300) return "text-green-500"; // Success
    if (status >= 300 && status < 400) return "text-yellow-500"; // Redirect
    if (status >= 400) return "text-red-500"; // Error
    return "text-muted-foreground";
  };

  const getMethodColor = (method: string): string => {
    switch (method.toUpperCase()) {
      case "GET":
        return "text-blue-500";
      case "POST":
        return "text-green-500";
      case "PUT":
        return "text-yellow-500";
      case "DELETE":
        return "text-red-500";
      case "PATCH":
        return "text-purple-500";
      default:
        return "text-muted-foreground";
    }
  };

  const formatUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;
      // Extract just the filename or last part of the path
      const pathParts = path.split('/');
      const filename = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || path;
      return filename.length > 40 ? `${filename.substring(0, 40)}...` : filename;
    } catch {
      return url.length > 40 ? `${url.substring(0, 40)}...` : url;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "main_frame":
        return "text-blue-600 dark:text-blue-400";
      case "sub_frame":
        return "text-blue-500 dark:text-blue-300";
      case "stylesheet":
        return "text-purple-500 dark:text-purple-400";
      case "script":
        return "text-yellow-500 dark:text-yellow-400";
      case "image":
        return "text-green-500 dark:text-green-400";
      case "font":
        return "text-orange-500 dark:text-orange-400";
      case "xmlhttprequest":
        return "text-red-500 dark:text-red-400";
      case "fetch":
        return "text-red-600 dark:text-red-300";
      default:
        return "text-muted-foreground";
    }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on the expand button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onToggle();
  };

  return (
    <>
      {/* Main Row */}
      <div 
        className={`text-xs border-b hover:bg-accent/30 cursor-pointer transition-colors ${
          isExpanded ? 'bg-accent/20 border-l-2 border-l-blue-500' : ''
        }`}
        onClick={handleRowClick}
      >
        <div className="px-2 py-1.5 grid grid-cols-12 gap-2 items-center">
          <div className="col-span-1 flex justify-center" onClick={(e) => e.stopPropagation()}>
            <div
              className={`w-3 h-3 flex items-center justify-center text-xs cursor-pointer hover:bg-accent rounded transition-colors ${
                isExpanded ? 'text-blue-500' : 'text-muted-foreground'
              }`}
              onClick={onToggle}
            >
              {isExpanded ? "▼" : "▶"}
            </div>
          </div>
          <div
            className={`col-span-1 text-xs ${getStatusColor(request.status)}`}
            title={`Status: ${request.status || "Error"}`}
          >
            {request.status || "ERR"}
          </div>
          <div
            className={`col-span-1 text-xs ${getMethodColor(request.method)}`}
            title={`Method: ${request.method}`}
          >
            {request.method}
          </div>
          <div
            className="col-span-4 break-all text-foreground text-xs"
            title={request.url}
          >
            {formatUrl(request.url)}
          </div>
          <div
            className={`col-span-2 ${getTypeColor(request.type)} text-xs`}
            title={`Type: ${request.type}`}
          >
            {request.type}
          </div>
          <div
            className="col-span-1 text-muted-foreground text-xs text-right"
            title={`Size: ${formatSize(request.size)}`}
          >
            {formatSize(request.size)}
          </div>
          <div
            className="col-span-1 text-muted-foreground text-xs text-right"
            title={`Duration: ${formatDuration(request.duration)}`}
          >
            {formatDuration(request.duration)}
          </div>
          <div
            className="col-span-1 text-muted-foreground text-xs text-right"
            title={`Age: ${formatAge(request.timestamp)}`}
          >
            {formatAge(request.timestamp)}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="bg-muted/20 border-t">
            <RequestDetails request={request} />
          </div>
        )}
      </div>
    </>
  );
}
