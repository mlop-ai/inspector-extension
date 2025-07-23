# Inspector

A browser extension for inspecting and managing web storage data (cookies, localStorage, web requests) with export capabilities.

![Extension Screenshot](assets/icon.png)

## Features

- **Cookie Management**: View, copy, delete, and export cookies
- **LocalStorage**: Inspect and manage localStorage items with size info
- **Web Requests**: Real-time HTTP/HTTPS request monitoring with filtering
- **Export Options**: Download files, send to APIs, copy to clipboard
- **Cross-Browser**: Works on Chrome and Firefox (Manifest V3)
- **Modern UI**: Dark/light mode, responsive design, toast notifications

## Installation

### Development

```bash
# Install dependencies
pnpm install

# Build for Chrome
pnpm build

# Build for Firefox  
pnpm build:firefox

# Development with hot reload
pnpm dev           # Chrome
pnpm dev:firefox   # Firefox
```

### Load Extension

- **Chrome**: `chrome://extensions/` → Load unpacked → `build/chrome-mv3-prod/`
- **Firefox**: `about:debugging` → Load Temporary Add-on → `build/firefox-mv3-prod/manifest.json`

## Tech Stack

- [Plasmo](https://docs.plasmo.com/) - Extension framework
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand + React Query

## Permissions

- `cookies` - Read/write cookies
- `activeTab` - Current tab access
- `webRequest` - Monitor network requests
- `scripting` - LocalStorage access via content scripts

## Use Cases

- **Developers**: Debug sessions, API testing, storage inspection
- **Security**: Cookie analysis, request monitoring
- **QA**: State management, cross-browser testing

