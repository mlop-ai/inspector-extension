import { useState } from "react";
import type { WebRequest } from "~lib/browser-api";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~components/ui/tooltip";
import { Button } from "~components/ui/button";

interface WebRequestListProps {
  requests: WebRequest[];
  onRequestClick: (url: string) => void;
}

export function WebRequestList({
  requests,
  onRequestClick,
}: WebRequestListProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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
      {/* Header */}
      <div className="sticky top-0 bg-muted p-2 text-xs font-bold border-b grid grid-cols-12 gap-2">
        <div className="col-span-1">Expand</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1">Method</div>
        <div className="col-span-4">URL</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-1">Size</div>
        <div className="col-span-1">Time</div>
        <div className="col-span-1">Age</div>
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
      return <div className="text-muted-foreground">No headers</div>;
    }

    return (
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {Object.entries(headers).map(([key, value]) => (
          <div key={key} className="flex">
            <span className="font-semibold text-blue-600 dark:text-blue-400 w-32 flex-shrink-0">
              {key}:
            </span>
            <span className="text-muted-foreground break-all ml-2">
              {value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Request Details */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400">
          Request Details
        </h4>

        <div>
          <div className="font-semibold text-xs mb-1">URL:</div>
          <div className="text-muted-foreground break-all text-xs bg-background p-2 rounded border">
            {request.url}
          </div>
        </div>

        <div>
          <div className="font-semibold text-xs mb-1">Method & Status:</div>
          <div className="text-xs space-y-1">
            <div>
              Method: <span className="text-blue-500">{request.method}</span>
            </div>
            <div>
              Status:{" "}
              <span
                className={request.status ? "text-green-500" : "text-red-500"}
              >
                {request.status || "Error"} {request.statusText}
              </span>
            </div>
            <div>
              Type: <span className="text-purple-500">{request.type}</span>
            </div>
            {request.fromCache && (
              <div>
                Source: <span className="text-yellow-500">Cache</span>
              </div>
            )}
            {request.error && (
              <div>
                Error: <span className="text-red-500">{request.error}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="font-semibold text-xs mb-1">Timing:</div>
          <div className="text-xs space-y-1">
            <div>
              Duration:{" "}
              <span className="text-muted-foreground">
                {request.duration ? `${request.duration}ms` : "N/A"}
              </span>
            </div>
            <div>
              Timestamp:{" "}
              <span className="text-muted-foreground">
                {new Date(request.timestamp).toLocaleString()}
              </span>
            </div>
            {request.initiator && (
              <div>
                Initiator:{" "}
                <span className="text-muted-foreground break-all">
                  {request.initiator}
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="font-semibold text-xs mb-1">Request Headers:</div>
          {formatHeaders(request.requestHeaders)}
        </div>

        {request.requestBody && (
          <div>
            <div className="font-semibold text-xs mb-1">Request Body:</div>
            <div className="text-muted-foreground break-all text-xs bg-background p-2 rounded border max-h-32 overflow-y-auto">
              {request.requestBody}
            </div>
          </div>
        )}
      </div>

      {/* Response Details */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-green-600 dark:text-green-400">
          Response Details
        </h4>

        <div>
          <div className="font-semibold text-xs mb-1">Size & Performance:</div>
          <div className="text-xs space-y-1">
            <div>
              Size:{" "}
              <span className="text-muted-foreground">
                {request.size ? `${request.size} bytes` : "N/A"}
              </span>
            </div>
            <div>
              Duration:{" "}
              <span className="text-muted-foreground">
                {request.duration ? `${request.duration}ms` : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="font-semibold text-xs mb-1">Response Headers:</div>
          {formatHeaders(request.responseHeaders)}
        </div>

        {request.responseBody && (
          <div>
            <div className="font-semibold text-xs mb-1">Response Body:</div>
            <div className="text-muted-foreground break-all text-xs bg-background p-2 rounded border max-h-32 overflow-y-auto">
              {request.responseBody}
            </div>
          </div>
        )}
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
      return path.length > 50 ? `${path.substring(0, 50)}...` : path;
    } catch {
      return url.length > 50 ? `${url.substring(0, 50)}...` : url;
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

  return (
    <>
      {/* Main Row */}
      <div className="text-xs border-b hover:bg-accent/50">
        <div className="p-2 grid grid-cols-12 gap-2 items-center">
          <div className="col-span-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0 text-xs"
            >
              {isExpanded ? "−" : "+"}
            </Button>
          </div>
          <div
            className={`col-span-1 font-semibold ${getStatusColor(request.status)} cursor-pointer`}
            onClick={onCopyUrl}
            title={`Status: ${request.status || "Error"} - Click to copy URL`}
          >
            {request.status || "ERR"}
          </div>
          <div
            className={`col-span-1 font-semibold ${getMethodColor(request.method)} cursor-pointer`}
            onClick={onCopyUrl}
            title="Click to copy URL"
          >
            {request.method}
          </div>
          <div
            className="col-span-4 break-all text-muted-foreground cursor-pointer"
            onClick={onCopyUrl}
            title={`${request.url} - Click to copy`}
          >
            {formatUrl(request.url)}
          </div>
          <div
            className={`col-span-2 ${getTypeColor(request.type)} cursor-pointer text-xs`}
            onClick={onCopyUrl}
            title={`Type: ${request.type} - Click to copy URL`}
          >
            {request.type}
          </div>
          <div
            className="col-span-1 text-muted-foreground cursor-pointer text-xs"
            onClick={onCopyUrl}
            title={`Size: ${formatSize(request.size)} - Click to copy URL`}
          >
            {formatSize(request.size)}
          </div>
          <div
            className="col-span-1 text-muted-foreground cursor-pointer text-xs"
            onClick={onCopyUrl}
            title={`Duration: ${formatDuration(request.duration)} - Click to copy URL`}
          >
            {formatDuration(request.duration)}
          </div>
          <div
            className="col-span-1 text-muted-foreground cursor-pointer text-xs"
            onClick={onCopyUrl}
            title={`Age: ${formatAge(request.timestamp)} - Click to copy URL`}
          >
            {formatAge(request.timestamp)}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="p-4 bg-muted/30 border-t text-xs space-y-4">
            <RequestDetails request={request} />
          </div>
        )}
      </div>
    </>
  );
}
