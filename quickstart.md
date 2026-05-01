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

PostgreSQL will be available at `localhost:5499`.

## 2. Set Up the Backend

```bash
cd backend
pnpm install
npx prisma migrate dev
npx prisma db seed
pnpm run start:dev
```

The backend runs on `http://localhost:3000`.

## 3. Set Up the Frontend

Open a new terminal:

```bash
cd frontend
pnpm install
PORT=3001 pnpm run dev
```

The frontend runs on `http://localhost:3001`.

## 4. Log In

Open `http://localhost:3001/login` in your browser.

### Seeded User Accounts

| Role             | Email                    | Password      |
|------------------|--------------------------|---------------|
| Admin            | `admin@ctms.edu`         | `admin123`    |
| Lecturer         | `lecturer@ctms.edu`      | `lecturer123` |
| Exam Officer     | `examofficer@ctms.edu`   | `officer123`  |

## 5. Common Commands

### Backend

```bash
cd backend
pnpm run start:dev     # Dev server with hot reload
pnpm run build         # Production build
pnpm run test          # Unit tests
pnpm run test:e2e      # E2E tests
pnpm run lint          # ESLint
```

### Frontend

```bash
cd frontend
pnpm run dev           # Dev server (use PORT=3001 to avoid conflict)
pnpm run build         # Production build
pnpm run lint          # ESLint
```

### Database

```bash
cd backend
npx prisma migrate dev    # Create and apply migrations
npx prisma db seed        # Re-run seed script
npx prisma studio         # Open Prisma Studio
```

## Notes

- **Port conflict:** Both backend and frontend default to port `3000`. Always run the frontend on a different port (e.g., `PORT=3001`).
- **CORS:** The backend is configured to accept requests from `http://localhost:3000` and `http://localhost:3001`.
- **New registrations:** Users created via `/register` have no roles assigned by default and cannot access admin/lecturer/exam-officer features. Use the seeded accounts above for full access.
