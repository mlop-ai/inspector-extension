import type { LocalStorageItem } from "~lib/browser-api";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~components/ui/tooltip";
import { Button } from "~components/ui/button";

interface LocalStorageListProps {
  items: LocalStorageItem[];
  onItemClick: (value: string, key: string) => void;
  onItemDelete: (key: string) => void;
}

export function LocalStorageList({
  items,
  onItemClick,
  onItemDelete,
}: LocalStorageListProps) {
  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-xs">
        No localStorage items detected
      </div>
    );
  }

  return (
    <div className="space-y-0 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-muted p-2 text-xs font-bold border-b grid grid-cols-12 gap-2 min-w-0">
        <div className="col-span-3 truncate">Key</div>
        <div className="col-span-6 truncate">Value</div>
        <div className="col-span-2 truncate">Size</div>
        <div className="col-span-1 truncate">Actions</div>
      </div>

      {/* LocalStorage Item Rows */}
      {items.map((item, index) => (
        <LocalStorageRow
          key={`${item.key}-${index}`}
          item={item}
          onClick={() => onItemClick(item.value, item.key)}
          onDelete={() => onItemDelete(item.key)}
        />
      ))}
    </div>
  );
}

interface LocalStorageRowProps {
  item: LocalStorageItem;
  onClick: () => void;
  onDelete: () => void;
}

function LocalStorageRow({ item, onClick, onDelete }: LocalStorageRowProps) {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on the delete button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick();
  };

  return (
    <div 
      className="p-2 text-xs border-b hover:bg-accent/50 grid grid-cols-12 gap-2 items-center cursor-pointer transition-colors min-w-0"
      onClick={handleRowClick}
    >
      <div
        className="col-span-3 font-semibold text-blue-600 dark:text-blue-400 break-all"
        title="Click to copy value"
      >
        {item.key}
      </div>
      <div
        className="col-span-6 break-all text-muted-foreground"
        title="Click to copy value"
      >
        {item.value.length > 80
          ? `${item.value.substring(0, 80)}...`
          : item.value || "(empty)"}
      </div>
      <div
        className="col-span-2 text-muted-foreground"
        title={`${item.size} bytes - Click to copy value`}
      >
        {formatSize(item.size)}
      </div>
      <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              ×
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete localStorage item</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
