import { useMemo } from "react";
import type { WebRequest } from "~lib/browser-api";

interface FlameGraphNode {
  id: string;
  name: string;
  value: number;
  color: string;
  children?: FlameGraphNode[];
  url?: string;
  type?: string;
  method?: string;
  status?: number;
  startTime: number;
  endTime: number;
}

interface FlameGraphProps {
  requests: WebRequest[];
  width?: number;
  height?: number;
}

export function FlameGraph({ requests, width = 800, height = 400 }: FlameGraphProps) {
  const data = useMemo(() => {
    if (!requests.length) return null;

    // Sort requests by timestamp
    const sortedRequests = [...requests].sort((a, b) => a.timestamp - b.timestamp);
    
    // Find the time range
    const minTime = sortedRequests[0].timestamp;
    const maxTime = Math.max(...sortedRequests.map(r => r.timestamp + (r.duration || 0)));
    const totalDuration = maxTime - minTime;

    // Group requests by domain and create hierarchy
    const domains = new Map<string, FlameGraphNode>();
    
    sortedRequests.forEach((request, index) => {
      try {
        const url = new URL(request.url);
        const domain = url.hostname;
        const duration = request.duration || 10; // Default 10ms if no duration
        
        if (!domains.has(domain)) {
          domains.set(domain, {
            id: domain,
            name: domain,
            value: 0,
            color: getColorForDomain(domain),
            children: [],
            startTime: request.timestamp,
            endTime: request.timestamp + duration
          });
        }

        const domainNode = domains.get(domain)!;
        domainNode.value += duration;
        domainNode.endTime = Math.max(domainNode.endTime, request.timestamp + duration);
        
        // Create request node
        const requestNode: FlameGraphNode = {
          id: request.id,
          name: getRequestName(request.url),
          value: duration,
          color: getColorForType(request.type),
          url: request.url,
          type: request.type,
          method: request.method,
          status: request.status,
          startTime: request.timestamp,
          endTime: request.timestamp + duration
        };

        domainNode.children!.push(requestNode);
      } catch (error) {
        // Skip invalid URLs
      }
    });

    return {
      nodes: Array.from(domains.values()),
      minTime,
      maxTime,
      totalDuration
    };
  }, [requests]);

  if (!data || !data.nodes.length) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No web requests to display in flamegraph
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Performance Flamegraph</h3>
        <div className="text-xs text-muted-foreground">
          Total time: {data.totalDuration.toFixed(0)}ms
        </div>
      </div>
      
      <div className="relative bg-background border rounded overflow-hidden">
        <svg width={width} height={height} className="block">
          {/* Render domain rows */}
          {data.nodes.map((domain, domainIndex) => (
            <g key={domain.id}>
              {/* Domain row */}
              <DomainRow
                domain={domain}
                y={domainIndex * 60}
                width={width}
                totalDuration={data.totalDuration}
                minTime={data.minTime}
              />
              
              {/* Request rows */}
              {domain.children?.map((request, requestIndex) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  y={domainIndex * 60 + 20 + requestIndex * 8}
                  width={width}
                  totalDuration={data.totalDuration}
                  minTime={data.minTime}
                />
              ))}
            </g>
          ))}
        </svg>
      </div>
      
      <FlameGraphLegend />
    </div>
  );
}

interface DomainRowProps {
  domain: FlameGraphNode;
  y: number;
  width: number;
  totalDuration: number;
  minTime: number;
}

function DomainRow({ domain, y, width, totalDuration, minTime }: DomainRowProps) {
  const startX = ((domain.startTime - minTime) / totalDuration) * width;
  const barWidth = ((domain.endTime - domain.startTime) / totalDuration) * width;
  
  return (
    <g>
      <rect
        x={startX}
        y={y}
        width={barWidth}
        height={18}
        fill={domain.color}
        stroke="#fff"
        strokeWidth={0.5}
        opacity={0.8}
      />
      <text
        x={startX + 4}
        y={y + 13}
        fontSize="11"
        fill="#fff"
        fontWeight="bold"
        textAnchor="start"
      >
        {domain.name} ({domain.value.toFixed(0)}ms)
      </text>
    </g>
  );
}

interface RequestRowProps {
  request: FlameGraphNode;
  y: number;
  width: number;
  totalDuration: number;
  minTime: number;
}

function RequestRow({ request, y, width, totalDuration, minTime }: RequestRowProps) {
  const startX = ((request.startTime - minTime) / totalDuration) * width;
  const barWidth = Math.max(2, (request.value / totalDuration) * width);
  
  return (
    <g>
      <rect
        x={startX}
        y={y}
        width={barWidth}
        height={6}
        fill={request.color}
        stroke="#fff"
        strokeWidth={0.3}
        opacity={0.9}
      >
        <title>
          {request.name} - {request.method} {request.status} - {request.value.toFixed(0)}ms
        </title>
      </rect>
      {barWidth > 30 && (
        <text
          x={startX + 2}
          y={y + 4}
          fontSize="9"
          fill="#fff"
          textAnchor="start"
        >
          {request.name.substring(0, Math.floor(barWidth / 6))}
        </text>
      )}
    </g>
  );
}

function FlameGraphLegend() {
  const legendItems = [
    { type: "main_frame", color: "#3b82f6", label: "Document" },
    { type: "stylesheet", color: "#8b5cf6", label: "Stylesheet" },
    { type: "script", color: "#f59e0b", label: "Script" },
    { type: "image", color: "#10b981", label: "Image" },
    { type: "xmlhttprequest", color: "#ef4444", label: "XHR" },
    { type: "fetch", color: "#dc2626", label: "Fetch" },
    { type: "other", color: "#6b7280", label: "Other" }
  ];

  return (
    <div className="flex flex-wrap gap-4 text-xs">
      {legendItems.map((item) => (
        <div key={item.type} className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function getRequestName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || pathname;
    return filename.length > 20 ? filename.substring(0, 20) + '...' : filename;
  } catch {
    return url.substring(0, 20) + '...';
  }
}

function getColorForDomain(domain: string): string {
  const colors = [
    "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", 
    "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1"
  ];
  
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

function getColorForType(type: string): string {
  const typeColors: { [key: string]: string } = {
    "main_frame": "#3b82f6",
    "sub_frame": "#3b82f6",
    "stylesheet": "#8b5cf6",
    "script": "#f59e0b",
    "image": "#10b981",
    "font": "#f97316",
    "xmlhttprequest": "#ef4444",
    "fetch": "#dc2626",
    "websocket": "#06b6d4",
    "other": "#6b7280"
  };
  
  return typeColors[type] || typeColors["other"];
}