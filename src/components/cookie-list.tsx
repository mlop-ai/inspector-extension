import type { BrowserCookie } from "~lib/browser-api";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~components/ui/tooltip";
import { Button } from "~components/ui/button";

interface CookieListProps {
  cookies: BrowserCookie[];
  onCookieClick: (value: string, name: string) => void;
  onCookieDelete: (cookie: BrowserCookie) => void;
}

export function CookieList({
  cookies,
  onCookieClick,
  onCookieDelete,
}: CookieListProps) {
  if (cookies.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-xs">
        No cookies detected
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="sticky top-0 bg-muted p-2 text-xs font-bold border-b grid grid-cols-12 gap-2">
        <div className="col-span-3">Name</div>
        <div className="col-span-4">Value</div>
        <div className="col-span-2">Domain</div>
        <div className="col-span-2">Flags</div>
        <div className="col-span-1">Actions</div>
      </div>

      {/* Cookie Rows */}
      {cookies.map((cookie, index) => (
        <CookieRow
          key={`${cookie.name}-${cookie.domain}-${index}`}
          cookie={cookie}
          onClick={() => onCookieClick(cookie.value, cookie.name)}
          onDelete={() => onCookieDelete(cookie)}
        />
      ))}
    </div>
  );
}

interface CookieRowProps {
  cookie: BrowserCookie;
  onClick: () => void;
  onDelete: () => void;
}

function CookieRow({ cookie, onClick, onDelete }: CookieRowProps) {
  return (
    <div className="p-2 text-xs border-b hover:bg-accent/50 grid grid-cols-12 gap-2 items-center">
      <div
        className="col-span-3 font-semibold text-blue-600 dark:text-blue-400 break-all cursor-pointer"
        onClick={onClick}
        title="Click to copy value"
      >
        {cookie.name}
      </div>
      <div
        className="col-span-4 break-all text-muted-foreground cursor-pointer"
        onClick={onClick}
        title="Click to copy value"
      >
        {cookie.value.length > 60
          ? `${cookie.value.substring(0, 60)}...`
          : cookie.value || "(empty)"}
      </div>
      <div
        className="col-span-2 text-muted-foreground truncate cursor-pointer"
        onClick={onClick}
        title={`${cookie.domain} - Click to copy value`}
      >
        {cookie.domain}
      </div>
      <div className="col-span-2 space-x-1">
        <CookieFlags cookie={cookie} />
      </div>
      <div className="col-span-1">
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
            <p>Delete cookie</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

interface CookieFlagsProps {
  cookie: BrowserCookie;
}

function CookieFlags({ cookie }: CookieFlagsProps) {
  return (
    <>
      {cookie.secure && (
        <Tooltip>
          <TooltipTrigger>
            <span className="text-green-500 dark:text-green-400">S</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Secure - Only sent over HTTPS</p>
          </TooltipContent>
        </Tooltip>
      )}
      {cookie.httpOnly && (
        <Tooltip>
          <TooltipTrigger>
            <span className="text-yellow-500 dark:text-yellow-400">H</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>HttpOnly - Not accessible via JavaScript</p>
          </TooltipContent>
        </Tooltip>
      )}
      {cookie.sameSite && (
        <Tooltip>
          <TooltipTrigger>
            <span className="text-purple-500 dark:text-purple-400">SS</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>SameSite - {cookie.sameSite}</p>
          </TooltipContent>
        </Tooltip>
      )}
      {cookie.session && (
        <Tooltip>
          <TooltipTrigger>
            <span className="text-blue-500 dark:text-blue-400">T</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Session - Temporary cookie</p>
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
}
