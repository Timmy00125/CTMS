# CTMS Backend

NestJS 11 backend for the CTMS (Course / Transcript Management System) project.

This service provides authentication, role-based access control, tenant-aware access rules, data ingestion, grade management, GPA/CGPA calculation, transcript retrieval, and audit logging on top of PostgreSQL via Prisma.

## Stack

- NestJS 11
- Prisma ORM
- PostgreSQL
- JWT authentication with HTTP-only cookies
- Argon2 password hashing
- Jest unit and e2e tests
- ESLint + Prettier

## Features

- User registration and login
- JWT access and refresh token flow
- Role-based authorization for `Admin`, `Lecturer`, `ExamOfficer`, and `Student`
- Department-scoped access checks via tenant guard
- Bulk ingestion for students and courses
- Grade submission, approval, publication, and amendment workflow
- GPA and CGPA calculation endpoints
- Transcript aggregation endpoints
- Grade and system audit logging
- Global error envelope and request validation
- Rate limiting with `@nestjs/throttler`

## Project Structure

```text
backend/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── auth/
│   ├── audit/
│   ├── common/
│   ├── config/
│   ├── course/
│   ├── gpa/
│   ├── grade/
│   ├── ingestion/
│   ├── prisma/
│   ├── student/
│   ├── transcript/
│   ├── user/
│   └── academic-session/
└── test/
```

## Prerequisites

- Node.js 20+
- pnpm
- Docker and Docker Compose

## Setup

From the repository root, start PostgreSQL:

```bash
docker compose up -d
```

Then install backend dependencies:

```bash
cd backend
pnpm install
```

## Environment

Current local configuration lives in `backend/.env`.

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ctms?schema=public"
PORT=3001
```

### Important note

Keep the database port in `docker-compose.yml` and `backend/.env` aligned before running the app. If you change one, update the other.

## Database

Generate the Prisma client:

```bash
cd backend
npx prisma generate
```

Apply migrations:

```bash
cd backend
npx prisma migrate dev
```

Seed demo data:

```bash
cd backend
npx prisma db seed
```

Open Prisma Studio:

```bash
cd backend
npx prisma studio
```

## Running the App

Development:

```bash
cd backend
pnpm run start:dev
```

Production build:

```bash
cd backend
pnpm run build
pnpm run start:prod
```

The API listens on `http://localhost:3001` by default.

## Scripts

```bash
pnpm run build        # Build Nest app
pnpm run start        # Start app
pnpm run start:dev    # Start with watch mode
pnpm run start:debug  # Start with debug + watch
pnpm run start:prod   # Run compiled output
pnpm run lint         # Run ESLint with fixes
pnpm run format       # Run Prettier on src/ and test/
pnpm run test         # Run unit tests
pnpm run test:watch   # Run tests in watch mode
pnpm run test:cov     # Run tests with coverage
pnpm run test:debug   # Run tests with debugger
pnpm run test:e2e     # Run end-to-end tests
```

## Authentication Model

- Access and refresh tokens are stored in HTTP-only cookies
- Cookie names: `access_token` and `refresh_token`
- Access token lifetime: 15 minutes
- Refresh token lifetime: 7 days
- Password hashing uses Argon2

## Authorization Model

- `RolesGuard` enforces role-based access rules
- `TenantGuard` restricts department-scoped resources
- Admin users can bypass department restrictions where allowed
- Roles are stored as an array on the `User` model

## Core Domain Models

Key Prisma models in `backend/prisma/schema.prisma`:

- `User`
- `Student`
- `Course`
- `AcademicSession`
- `Semester`
- `Grade`
- `GradeAuditLog`
- `SystemAuditLog`

Important grade rule:

- `GradeStatus` values are `DRAFT`, `PENDING_APPROVAL`, and `PUBLISHED`
- Grades are unique per `studentId + courseId + semesterId`

## Tests

Unit tests are colocated in `src/**/*.spec.ts`.

End-to-end tests live in `backend/test/` and cover flows including:

- auth
- ingestion
- grade workflow
- GPA
- transcript retrieval
- throttling
- permissions and guards
- global exception behavior

Run all unit tests:

```bash
cd backend
pnpm run test
```

Run e2e tests:

```bash
cd backend
pnpm run test:e2e
```

## Development Notes

- TypeScript is configured with `module: "nodenext"`
- ESLint uses flat config via `backend/eslint.config.mjs`
- Prettier rules are defined in `backend/.prettierrc`
- Request validation is enabled globally with `ValidationPipe`
- Security headers are added with `helmet`
- CORS is enabled for the frontend origin

## Related Packages

- Frontend app: `../frontend`
- Root task plan: `../TASKS.md`
- Quick start notes: `../quickstart.md`
