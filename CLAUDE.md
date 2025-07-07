# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production extension bundle
- `npm run package` - Package extension for distribution
- `pnpm dlx shadcn@latest add <component>` - Add new shadcn/ui components

## Project Architecture

This is a Chrome extension built with:
- **Plasmo** - Modern extension framework with TypeScript support
- **React** - UI components and state management
- **shadcn/ui** - Component library with Tailwind CSS
- **Zustand** - Global state management
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first styling

### Extension Structure

The extension has four main contexts:
1. **Popup** (`src/popup.tsx`) - Main UI interface, 800x600px window
2. **Background** (`src/background.ts`) - Service worker handling web requests and cross-context messaging
3. **Content Script** (`src/contents/localStorage.ts`) - Runs in web pages to access DOM localStorage
4. **Components** (`src/components/`) - Reusable UI components

### Key Files

- `src/popup.tsx` - Main popup interface with tabbed view for cookies/localStorage/web requests
- `src/background.ts` - Captures web requests and handles cross-extension communication
- `src/lib/browser-api.ts` - Cross-browser API wrapper for Chrome/Firefox compatibility
- `src/hooks/use-storage.ts` - React Query hooks for data fetching and mutations
- `src/store/cookie-store.ts` - Zustand store for UI state management
- `src/components/ui/` - shadcn/ui components (button, card, dialog, etc.)

### Data Flow

1. **Cookies** - Retrieved via Chrome extension API from background script
2. **LocalStorage** - Accessed via content script injection into active tab
3. **Web Requests** - Captured by background script web request listeners
4. **State Management** - Zustand for UI state, React Query for server state

### Component Patterns

- Use `~` prefix for all imports (`~components/ui/button`)
- Import shadcn/ui components from `~components/ui/`
- Use `cn()` utility from `~lib/utils.ts` for conditional classes
- Components should be TypeScript with proper interfaces
- Follow existing patterns in `src/components/` for new components

### Key Development Guidelines

From `.cursor/rules/chrome-extension-development.mdc`:
- Extension has cookies, activeTab, tabs, scripting, and webRequest permissions
- Use Plasmo abstractions when available (`@plasmohq/storage`, `@plasmohq/messaging`)
- Always sanitize user input and data from web pages
- Prefer HTTPS APIs and resources
- Handle different extension contexts properly (popup vs background vs content script)

From `.cursor/rules/component-architecture.mdc`:
- Use composition over complex prop drilling
- Create feature-specific components in `src/components/`
- Design for popup constraints (350-400px width, variable height)
- Use Lucide React icons consistently
- Use `react-hook-form` for complex forms

### Extension Permissions

Configured in `package.json` manifest:
- `cookies` - Read/write cookies for all domains
- `activeTab` - Access current tab information
- `tabs` - Query and message tabs
- `scripting` - Inject content scripts
- `webRequest` - Monitor network requests
- Host permissions for all HTTP/HTTPS sites

### Testing & Development

- Extension loads into Chrome via `chrome://extensions/` in developer mode
- Use Chrome DevTools for debugging different contexts
- Background script logs appear in extension's background page console
- Content script logs appear in the web page's console
- Popup logs appear in the popup's DevTools

### Common Tasks

- Adding new shadcn/ui components: `pnpm dlx shadcn@latest add <component>`
- Modifying permissions: Update `package.json` manifest section
- Adding new API endpoints: Extend `src/lib/browser-api.ts`
- Creating new components: Follow patterns in `src/components/`
- State management: Use Zustand for UI state, React Query for data fetching