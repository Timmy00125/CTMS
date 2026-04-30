<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend (Next.js 16)

## Quick Start

```bash
pnpm install
pnpm run dev        # http://localhost:3000
pnpm run lint       # ESLint only (no typecheck script)
pnpm run build      # Production build
```

## Architecture

- App Router (`src/app/`)
- Middleware (`src/middleware.ts`) handles auth redirects
- Auth tokens: `accessToken` and `refreshToken` cookies (HTTP-only)
- Public routes: `/login`, `/register` only

## Stack

- Next.js 16, React 19, Tailwind CSS 4
- No state management library yet
- No API client configured yet

## Current State

Scaffolded only. Auth middleware is wired but no pages beyond the default landing page exist yet.
