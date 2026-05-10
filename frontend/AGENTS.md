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
- Auth tokens: `access_token` and `refresh_token` cookies (HTTP-only)
- Public routes: `/login`, `/register` only
- Auth context (`src/lib/contexts/auth-context.tsx`) provides user state
- Toast notifications (`src/lib/contexts/toast-context.tsx`) for user feedback
- Custom hooks (`src/lib/hooks/use-data.ts`) for data fetching

## Stack

- Next.js 16, React 19, Tailwind CSS 4
- No state management library (using React Context for auth/toast)
- Typed API client (`src/lib/api.ts`)

## Current State

### Implemented
- Auth: Login, Register, Logout with HTTP-only cookies
- Dashboard with real stats from API
- Students: List, Detail (with grades/CGPA from API)
- Courses: List with search
- Transcripts: Student list, Full transcript view (server-rendered)
- Grades: Management page with status filters
- Error boundaries and loading states
- Toast notification system
- Auth context with role info

### Pages
- `/login` - Login form
- `/register` - Registration form
- `/dashboard` - Overview with stats and quick actions
- `/dashboard/students` - Student list with search
- `/dashboard/students/[id]` - Student detail with academic summary
- `/dashboard/courses` - Course list with search
- `/dashboard/grades` - Grade management with status filters
- `/dashboard/transcripts` - Student list for transcript viewing
- `/dashboard/transcripts/[studentId]` - Full transcript (SSR)

### Components
- `AppShell` - Layout with sidebar
- `Sidebar` - Navigation with user info
- `DataTable` - Reusable table component
- `StatusBadge` - Status indicator
- `SearchInput` - Search input with debounce
- `StatCard` - Statistics display card
- `SectionHeader` - Page header with actions
- `TranscriptView` - Full transcript display
