# CTMS Frontend

Next.js 16 frontend for the CTMS (Course / Transcript Management System) project.

This application provides the web interface for authentication, dashboards, student records, courses, grades, transcript viewing, and student self-service pages.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Base UI / shadcn-style components
- ESLint

## Features

- Login and registration pages
- Auth-aware middleware redirects
- Dashboard overview
- Student listing and student detail views
- Course listing with search
- Grade management pages
- Transcript list and transcript detail pages
- Student self-service pages for profile, grades, and transcript
- Route-level error and loading UI
- Reusable UI components for tables, badges, stats, and search

## Project Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── register/
│   │   └── ...
│   ├── components/
│   │   ├── layout/
│   │   ├── transcript/
│   │   └── ui/
│   ├── lib/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── api.ts
│   │   └── cache.ts
│   └── types/
└── public/
```

## Prerequisites

- Node.js 20+
- pnpm
- Backend API running locally

## Setup

Install dependencies:

```bash
cd frontend
pnpm install
```

Start the dev server:

```bash
cd frontend
pnpm run dev
```

The frontend runs on `http://localhost:3000`.

## Backend Dependency

This app expects the backend API to be available locally, typically at `http://localhost:3001`.

On the server side, API calls in `frontend/src/lib/api.ts` default to:

```text
http://localhost:3001
```

If needed, override that with the `API_BASE_URL` environment variable.

## Routes

Main routes currently present in `src/app/`:

- `/login`
- `/register`
- `/dashboard`
- `/dashboard/students`
- `/dashboard/students/[id]`
- `/dashboard/courses`
- `/dashboard/grades`
- `/dashboard/transcripts`
- `/dashboard/transcripts/[studentId]`
- `/dashboard/student`
- `/dashboard/student/profile`
- `/dashboard/student/grades`
- `/dashboard/student/transcript`

## Authentication Flow

- Auth uses HTTP-only cookies set by the backend
- Middleware protects private routes and redirects unauthenticated users
- Public routes include `/login` and `/register`
- Current user state is managed through auth context

## Key Frontend Modules

- `frontend/src/lib/api.ts` - typed API client for backend calls
- `frontend/src/lib/cache.ts` - frontend caching helpers
- `frontend/src/lib/contexts/auth-context.tsx` - auth state provider
- `frontend/src/lib/contexts/toast-context.tsx` - toast notifications
- `frontend/src/lib/hooks/use-data.ts` - reusable data fetching hooks
- `frontend/src/components/layout/app-shell.tsx` - dashboard shell
- `frontend/src/components/transcript/transcript-view.tsx` - transcript rendering UI

## Scripts

```bash
pnpm run dev      # Start development server
pnpm run build    # Build production bundle
pnpm run start    # Start production server
pnpm run lint     # Run ESLint
```

## Development Notes

- This project uses Next.js 16 with App Router conventions
- Frontend instructions for this repo require checking `node_modules/next/dist/docs/` before making framework-specific code changes
- ESLint uses flat config via `frontend/eslint.config.mjs`
- There is currently no dedicated `typecheck` script in `package.json`

## Local Workflow

Recommended local startup order:

1. Start PostgreSQL from the repository root
2. Start the backend in `backend/`
3. Start the frontend in `frontend/`

Example:

```bash
docker compose up -d

cd backend
pnpm install
npx prisma migrate dev
npx prisma db seed
pnpm run start:dev

# new terminal
cd frontend
pnpm install
pnpm run dev
```

## Related Packages

- Backend API: `../backend`
- Root task plan: `../TASKS.md`
- Quick start notes: `../quickstart.md`
