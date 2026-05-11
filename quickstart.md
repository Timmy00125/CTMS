# CTMS Quick Start Guide

## Prerequisites

- Node.js 20+
- pnpm
- Docker & Docker Compose (for PostgreSQL)

## 1. Start the Database

From the project root:

```bash
docker compose up -d
```

PostgreSQL will be available at `localhost:5432`.

## 2. Set Up the Backend

```bash
cd backend
pnpm install
npx prisma migrate dev
npx prisma db seed
pnpm run start:dev
```

The backend runs on `http://localhost:3001`.

## 3. Set Up the Frontend

Open a new terminal:

```bash
cd frontend
pnpm install
pnpm run dev
```

The frontend runs on `http://localhost:3000`.

## 4. Log In

Open `http://localhost:3000/login` in your browser.

### Seeded User Accounts

All seeded accounts use the same password: **`password123`**

| Role | Email | Department |
|------|-------|------------|
| **Admin** | `admin@ctms.edu` | — |
| **Admin** | `admin2@ctms.edu` | — |
| **Exam Officer** | `examofficer@ctms.edu` | CS |
| **Exam Officer** | `examofficer2@ctms.edu` | Math |
| **Exam Officer** | `examofficer3@ctms.edu` | Physics |
| **Exam Officer** | `examofficer4@ctms.edu` | Statistics |
| **Lecturer** | `lecturer1@ctms.edu` | CS |
| **Lecturer** | `lecturer2@ctms.edu` | CS |
| **Lecturer** | `lecturer3@ctms.edu` | CS |
| **Lecturer** | `lecturer4@ctms.edu` | CS |
| **Lecturer** | `lecturer5@ctms.edu` | CS |
| **Lecturer** | `lecturer6@ctms.edu` | Math |
| **Lecturer** | `lecturer7@ctms.edu` | Math |
| **Lecturer** | `lecturer8@ctms.edu` | Math |
| **Lecturer** | `lecturer9@ctms.edu` | Physics |
| **Lecturer** | `lecturer10@ctms.edu` | Physics |
| **Lecturer** | `lecturer11@ctms.edu` | Statistics |
| **Lecturer** | `lecturer12@ctms.edu` | Statistics |
| **Admin + Lecturer** | `multiadmin@ctms.edu` | CS |
| **Exam Officer + Lecturer** | `multiofficer@ctms.edu` | Math |
| **Student** | `student.cs@ctms.edu` | CS |
| **Student** | `student.math@ctms.edu` | Math |
| **Student** | `student.phy@ctms.edu` | Physics |
| **Student** | `student.stat@ctms.edu` | Statistics |

### Seeded Data Overview

Running `npx prisma db seed` creates the following demo data:

- **26 users** (3 admins, 5 exam officers, 14 lecturers, 4 students)
- **120 students** (30 per department)
- **38 courses** across 4 departments
- **4 academic sessions** (2021/2022 through 2024/2025)
- **8 semesters** (2 per session)
- **~2,600 grades** with realistic score distributions
- **Grade audit logs** for every grade submission and amendment
- **System audit logs** for logins, bulk uploads, role changes, etc.

### Departments

| Code | Name |
|------|------|
| `dept-cs-001` | Computer Science |
| `dept-math-002` | Mathematics |
| `dept-phy-003` | Physics |
| `dept-stat-004` | Statistics |

## 5. Common Commands

### Backend

```bash
cd backend
pnpm run start:dev     # Dev server with hot reload
pnpm run build         # Production build
pnpm run test          # Unit tests
pnpm run test:e2e      # E2E tests
pnpm run lint          # ESLint
pnpm run format        # Prettier
```

### Frontend

```bash
cd frontend
pnpm run dev           # Dev server
pnpm run build         # Production build
pnpm run lint          # ESLint
```

### Database

```bash
cd backend
npx prisma migrate dev    # Create and apply migrations
npx prisma db seed        # Re-run seed script
npx prisma generate       # Regenerate Prisma client
npx prisma studio         # Open Prisma Studio
```

## Notes

- **Port mapping:** The backend runs on `3001` and the frontend dev server runs on `3000`. The frontend's `next.config.ts` proxies API requests to the backend automatically.
- **CORS:** The backend is configured to accept requests from `http://localhost:3000` and `http://localhost:3001`.
- **Student login:** Students logging in with a `Student` role are redirected to `/dashboard/student` where they can view their grades, transcript, and profile.
- **New registrations:** Users created via `/register` have no roles assigned by default and cannot access admin/lecturer/exam-officer features. Use the seeded accounts above for full access.
- **Re-seeding:** `npx prisma db seed` wipes all existing data and recreates it from scratch.
