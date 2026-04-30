# CTMS - Agent Instructions

## Project Structure

Monorepo with two independent packages (no shared workspace root `package.json`):
- `frontend/` - Next.js 16 (App Router), React 19, Tailwind CSS 4, pnpm
- `backend/` - NestJS 11, Prisma ORM, PostgreSQL, pnpm

All commands run from within each package directory.

## Commands

### Backend (`cd backend`)

```bash
pnpm install              # Install dependencies
pnpm run start:dev        # Dev server with hot reload
pnpm run build            # Production build
pnpm run test             # Unit tests (Jest, *.spec.ts in src/)
pnpm run test:e2e         # E2E tests (supertest, test/*.e2e-spec.ts)
pnpm run test:cov         # Coverage
pnpm run lint             # ESLint with --fix
pnpm run format           # Prettier (src/**/*.ts, test/**/*.ts)
```

### Frontend (`cd frontend`)

```bash
pnpm install              # Install dependencies
pnpm run dev              # Dev server (default port 3000)
pnpm run build            # Production build
pnpm run lint             # ESLint (no typecheck script exists)
```

### Database

```bash
cd backend
docker compose up -d      # Start PostgreSQL (from repo root, uses docker-compose.yml)
npx prisma generate       # Regenerate Prisma client after schema changes
npx prisma migrate dev    # Create and apply migrations
npx prisma db seed        # Run seed script (prisma/seed.ts)
```

**PORT MISMATCH**: `docker-compose.yml` maps port `5499:5499` but `backend/.env` uses `localhost:5433`. Fix one before running.

## Architecture

### Backend Entry Points
- `src/main.ts` - Bootstrap (cookie-parser, port 3000)
- `src/app.module.ts` - Root module (imports PrismaModule, UserModule, AuthModule)
- `src/prisma/prisma.service.ts` - Uses `@prisma/adapter-pg` with raw `pg.Pool` (not default adapter)

### Auth Flow
- JWT tokens stored in HTTP-only cookies (`access_token`, `refresh_token`)
- `access_token`: 15min expiry; `refresh_token`: 7d expiry
- Password hashing: Argon2
- Guards: `RolesGuard` (array-based RBAC), `TenantGuard` (departmentId scoping, Admin bypasses)
- Decorator: `@Roles(Role.Admin, Role.Lecturer)` from `src/auth/decorators/roles.decorator.ts`
- Frontend middleware (`src/middleware.ts`) redirects unauthenticated users to `/login`

### Prisma Schema Key Models
- `User` (roles: `Role[]` enum - Admin, Lecturer, ExamOfficer)
- `Student`, `Course`, `AcademicSession`, `Semester`, `Grade`
- `GradeStatus` enum: DRAFT, PENDING_APPROVAL, PUBLISHED
- `GradeAuditLog`, `SystemAuditLog` for audit trails
- Unique constraint: `@@unique([studentId, courseId, semesterId])` on Grade

## Conventions

- **TDD is mandatory** per TASKS.md: Red (failing test) -> Green (minimal code) -> Refactor
- Backend tests: `*.spec.ts` co-located in `src/`, e2e in `test/`
- Backend uses `module: "nodenext"` and `moduleResolution: "nodenext"` in tsconfig
- ESLint config uses flat config format (`eslint.config.mjs`) in both packages
- Prettier: single quotes, trailing commas (backend `.prettierrc`)
- `@typescript-eslint/no-explicit-any` is OFF in backend eslint
- Frontend uses Next.js 16 - check `node_modules/next/dist/docs/` for breaking changes before writing code

## Current Implementation Status

Phase 1-2 complete (infrastructure, auth). Phase 3+ pending (see `TASKS.md` for full task list).
