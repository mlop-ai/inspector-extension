import { Button } from "~components/ui/button";

interface WebRequestTypeFiltersProps {
  activeFilters: Set<string>;
  onToggleFilter: (type: string) => void;
  onClearFilters: () => void;
  availableTypes: string[];
}

const TYPE_LABELS: { [key: string]: string } = {
  main_frame: "HTML",
  sub_frame: "Frame",
  stylesheet: "CSS",
  script: "JS",
  image: "IMG",
  font: "Font",
  xmlhttprequest: "XHR",
  fetch: "Fetch",
  websocket: "WS",
  media: "Media",
  object: "Object",
  ping: "Ping",
  csp_report: "CSP",
  other: "Other",
};

const TYPE_COLORS: { [key: string]: string } = {
  main_frame:
    "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300",
  sub_frame:
    "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-800 dark:text-blue-400",
  stylesheet:
    "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300",
  script:
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300",
  image:
    "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300",
  font: "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300",
  xmlhttprequest:
    "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300",
  fetch:
    "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-800 dark:text-red-400",
  websocket:
    "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300",
  media:
    "bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-900 dark:text-pink-300",
  object:
    "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300",
  ping: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-300",
  csp_report:
    "bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900 dark:text-violet-300",
  other:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300",
};

export function WebRequestTypeFilters({
  activeFilters,
  onToggleFilter,
  onClearFilters,
  availableTypes,
}: WebRequestTypeFiltersProps) {
  if (availableTypes.length === 0) {
    return null;
  }

  const sortedTypes = availableTypes.sort((a, b) => {
    const aLabel = TYPE_LABELS[a] || a;
    const bLabel = TYPE_LABELS[b] || b;
    return aLabel.localeCompare(bLabel);
  });

  return (
    <div className="mb-3 p-3 bg-muted/30 rounded border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Filter by Type:
        </span>
        {activeFilters.size > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
          >
            Clear All ({activeFilters.size})
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {sortedTypes.map((type) => {
          const isActive = activeFilters.has(type);
          const label = TYPE_LABELS[type] || type;
          const colorClasses = TYPE_COLORS[type] || TYPE_COLORS.other;

          return (
            <Button
              key={type}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleFilter(type)}
              className={`text-xs h-6 px-2 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : `${colorClasses} border-transparent`
              }`}
              title={`${type} requests`}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
