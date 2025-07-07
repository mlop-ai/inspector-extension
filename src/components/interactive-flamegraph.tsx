import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { WebRequest } from "~lib/browser-api";
import { Button } from "~components/ui/button";
import { Input } from "~components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~components/ui/dialog";

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
  request?: WebRequest;
  level: number;
  x: number;
  width: number;
  y: number;
  height: number;
}

interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
  selectedNode: FlameGraphNode | null;
}

interface InteractiveFlameGraphProps {
  requests: WebRequest[];
  width?: number;
  height?: number;
}

export function InteractiveFlameGraph({ 
  requests, 
  width,
  height = 600 
}: InteractiveFlameGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [viewState, setViewState] = useState<ViewState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    selectedNode: null
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredNode, setHoveredNode] = useState<FlameGraphNode | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: width || 1160, height });

  // Auto-resize based on container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const containerWidth = rect.width - 32; // Account for padding
        setDimensions({
          width: width || Math.max(800, containerWidth),
          height
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [width, height]);

  const data = useMemo(() => {
    if (!requests.length) return null;

    const sortedRequests = [...requests].sort((a, b) => a.timestamp - b.timestamp);
    const minTime = sortedRequests[0].timestamp;
    const maxTime = Math.max(...sortedRequests.map(r => r.timestamp + (r.duration || 0)));
    const totalDuration = maxTime - minTime;

    // Group by domain and create hierarchy
    const domains = new Map<string, FlameGraphNode>();
    const allNodes: FlameGraphNode[] = [];
    
    sortedRequests.forEach((request, index) => {
      try {
        const url = new URL(request.url);
        const domain = url.hostname;
        const duration = request.duration || 10;
        
        if (!domains.has(domain)) {
          const domainNode: FlameGraphNode = {
            id: domain,
            name: domain,
            value: 0,
            color: getColorForDomain(domain),
            children: [],
            startTime: request.timestamp,
            endTime: request.timestamp + duration,
            level: 0,
            x: 0,
            width: 0,
            y: 0,
            height: 30
          };
          domains.set(domain, domainNode);
          allNodes.push(domainNode);
        }

        const domainNode = domains.get(domain)!;
        domainNode.value += duration;
        domainNode.endTime = Math.max(domainNode.endTime, request.timestamp + duration);
        
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
          endTime: request.timestamp + duration,
          request: request,
          level: 1,
          x: 0,
          width: 0,
          y: 0,
          height: 20
        };

        domainNode.children!.push(requestNode);
        allNodes.push(requestNode);
      } catch (error) {
        // Skip invalid URLs
      }
    });

    // Calculate positions
    let currentY = 10;
    const domainNodes = Array.from(domains.values());
    
    domainNodes.forEach((domain, domainIndex) => {
      domain.y = currentY;
      domain.x = ((domain.startTime - minTime) / totalDuration) * dimensions.width;
      domain.width = ((domain.endTime - domain.startTime) / totalDuration) * dimensions.width;
      
      currentY += domain.height + 5;
      
      domain.children?.forEach((request, requestIndex) => {
        request.y = currentY;
        request.x = ((request.startTime - minTime) / totalDuration) * dimensions.width;
        request.width = Math.max(2, (request.value / totalDuration) * dimensions.width);
        
        currentY += request.height + 2;
      });
      
      currentY += 15; // Space between domains
    });

    return {
      nodes: allNodes,
      domainNodes,
      minTime,
      maxTime,
      totalDuration,
      totalHeight: currentY
    };
  }, [requests, dimensions.width]);

  const filteredNodes = useMemo(() => {
    if (!data || !searchTerm) return data?.nodes || [];
    
    return data.nodes.filter(node => 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // Zoom and pan handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(10, viewState.zoom * zoomFactor));
      
      // Zoom towards mouse position
      const zoomRatio = newZoom / viewState.zoom;
      const newPanX = mouseX - (mouseX - viewState.panX) * zoomRatio;
      const newPanY = mouseY - (mouseY - viewState.panY) * zoomRatio;
      
      setViewState(prev => ({
        ...prev,
        zoom: newZoom,
        panX: newPanX,
        panY: newPanY
      }));
    } else {
      // Pan
      setViewState(prev => ({
        ...prev,
        panX: prev.panX - e.deltaX,
        panY: prev.panY - e.deltaY
      }));
    }
  }, [viewState]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
      // Middle mouse or Ctrl+Click for panning
      e.preventDefault();
      setIsDragging(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setViewState(prev => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, lastPanPoint]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case '0':
          // Reset zoom and pan
          setViewState(prev => ({ ...prev, zoom: 1, panX: 0, panY: 0 }));
          break;
        case '+':
        case '=':
          setViewState(prev => ({ ...prev, zoom: Math.min(10, prev.zoom * 1.2) }));
          break;
        case '-':
          setViewState(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom * 0.8) }));
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
          }
          break;
        case 'Escape':
          setSearchTerm("");
          setViewState(prev => ({ ...prev, selectedNode: null }));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNodeClick = useCallback((node: FlameGraphNode) => {
    setViewState(prev => ({ ...prev, selectedNode: node }));
    setShowDetails(true);
  }, []);

  const handleNodeDoubleClick = useCallback((node: FlameGraphNode) => {
    // Zoom to fit the node
    const padding = 50;
    const targetZoom = Math.min(
      (dimensions.width - padding * 2) / node.width,
      (dimensions.height - padding * 2) / node.height
    );
    
    const newZoom = Math.max(0.1, Math.min(10, targetZoom));
    const newPanX = (dimensions.width / 2) - (node.x + node.width / 2) * newZoom;
    const newPanY = (dimensions.height / 2) - (node.y + node.height / 2) * newZoom;
    
    setViewState(prev => ({
      ...prev,
      zoom: newZoom,
      panX: newPanX,
      panY: newPanY,
      selectedNode: node
    }));
  }, [dimensions.width, dimensions.height]);

  if (!data || !data.nodes.length) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No web requests to display in flamegraph
      </div>
    );
  }

  const transform = `translate(${viewState.panX}, ${viewState.panY}) scale(${viewState.zoom})`;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-sm">Interactive Flamegraph</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewState(prev => ({ ...prev, zoom: Math.min(10, prev.zoom * 1.2) }))}
              className="text-xs h-7 px-2"
            >
              +
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewState(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom * 0.8) }))}
              className="text-xs h-7 px-2"
            >
              −
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewState(prev => ({ ...prev, zoom: 1, panX: 0, panY: 0 }))}
              className="text-xs h-7 px-2"
            >
              Reset
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search requests... (Ctrl+F)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs h-7 w-48"
          />
          <div className="text-xs text-muted-foreground">
            Zoom: {(viewState.zoom * 100).toFixed(0)}% | Total: {data.totalDuration.toFixed(0)}ms
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
        <strong>Controls:</strong> Scroll to pan • Ctrl+Scroll to zoom • Click to select • Double-click to zoom to fit • 
        Middle-click to drag • Ctrl+F to search • 0 to reset • +/- to zoom • Esc to clear selection
      </div>

      {/* Flamegraph */}
      <div 
        ref={containerRef}
        className="relative bg-background border rounded overflow-hidden cursor-grab w-full"
        style={{ height: dimensions.height }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg 
          ref={svgRef}
          width={dimensions.width} 
          height={dimensions.height} 
          className="block w-full"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <defs>
            <pattern id="highlight" patternUnits="userSpaceOnUse" width="4" height="4">
              <rect width="4" height="4" fill="rgba(59, 130, 246, 0.3)" />
              <rect width="2" height="2" fill="rgba(59, 130, 246, 0.6)" />
            </pattern>
          </defs>
          
          <g transform={transform}>
            {/* Render all nodes */}
            {(searchTerm ? filteredNodes : data.nodes).map((node) => (
              <g key={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  fill={viewState.selectedNode?.id === node.id ? "url(#highlight)" : node.color}
                  stroke={hoveredNode?.id === node.id ? "#fff" : "rgba(255,255,255,0.2)"}
                  strokeWidth={hoveredNode?.id === node.id ? 2 : 0.5}
                  opacity={searchTerm && !filteredNodes.includes(node) ? 0.3 : 0.9}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => handleNodeClick(node)}
                  onDoubleClick={() => handleNodeDoubleClick(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                />
                
                {/* Text labels */}
                {node.width > 30 && viewState.zoom > 0.5 && (
                  <text
                    x={node.x + 4}
                    y={node.y + node.height / 2 + 4}
                    fontSize={Math.max(8, 11 / viewState.zoom)}
                    fill="#fff"
                    fontWeight={node.level === 0 ? "bold" : "normal"}
                    textAnchor="start"
                    className="pointer-events-none select-none"
                  >
                    {node.name.substring(0, Math.floor(node.width / (6 / viewState.zoom)))}
                    {node.level === 0 && ` (${node.value.toFixed(0)}ms)`}
                  </text>
                )}
              </g>
            ))}
            
            {/* Hover tooltip */}
            {hoveredNode && (
              <g>
                <rect
                  x={hoveredNode.x}
                  y={hoveredNode.y - 30}
                  width={200}
                  height={25}
                  fill="rgba(0,0,0,0.9)"
                  rx={4}
                  className="pointer-events-none"
                />
                <text
                  x={hoveredNode.x + 5}
                  y={hoveredNode.y - 12}
                  fontSize="10"
                  fill="#fff"
                  className="pointer-events-none"
                >
                  {hoveredNode.name} - {hoveredNode.value.toFixed(0)}ms
                  {hoveredNode.method && ` - ${hoveredNode.method}`}
                  {hoveredNode.status && ` ${hoveredNode.status}`}
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* Detailed popup */}
      {viewState.selectedNode && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm">
                {viewState.selectedNode.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Duration:</strong> {viewState.selectedNode.value.toFixed(2)}ms
                </div>
                <div>
                  <strong>Type:</strong> {viewState.selectedNode.type || 'Domain'}
                </div>
                {viewState.selectedNode.method && (
                  <div>
                    <strong>Method:</strong> {viewState.selectedNode.method}
                  </div>
                )}
                {viewState.selectedNode.status && (
                  <div>
                    <strong>Status:</strong> {viewState.selectedNode.status}
                  </div>
                )}
              </div>
              
              {viewState.selectedNode.url && (
                <div>
                  <strong>URL:</strong>
                  <div className="mt-1 p-2 bg-muted rounded text-xs break-all">
                    {viewState.selectedNode.url}
                  </div>
                </div>
              )}
              
              {viewState.selectedNode.request && (
                <div className="space-y-2">
                  <strong>Request Details:</strong>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Timestamp: {new Date(viewState.selectedNode.request.timestamp).toLocaleTimeString()}</div>
                    <div>Size: {viewState.selectedNode.request.size ? `${viewState.selectedNode.request.size} bytes` : 'N/A'}</div>
                    {viewState.selectedNode.request.initiator && (
                      <div className="col-span-2">Initiator: {viewState.selectedNode.request.initiator}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <FlameGraphLegend />
    </div>
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