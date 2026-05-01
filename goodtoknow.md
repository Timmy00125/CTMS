# CTMS Quick Start

## Setup

```bash
# Start database
docker compose up -d

# Backend
cd backend
pnpm install
npx prisma migrate dev
npx prisma generate
npx tsx prisma/seed.ts
pnpm run start:dev

# Frontend (separate terminal)
cd frontend
pnpm install
pnpm run dev
```

## Seed Data Summary

| Entity | Count |
|---|---|
| Users | 20 |
| Students | 120 |
| Courses | 38 |
| Academic Sessions | 4 (2021/2022 - 2024/2025) |
| Semesters | 8 |
| Grades | ~2,668 |
| Grade Audit Logs | ~3,024 |
| System Audit Logs | 126 |

## Login Credentials

All passwords: `password123`

| Email | Role | Department |
|---|---|---|
| admin@ctms.edu | Admin | All |
| admin2@ctms.edu | Admin | All |
| examofficer@ctms.edu | ExamOfficer | CS |
| examofficer2@ctms.edu | ExamOfficer | Math |
| examofficer3@ctms.edu | ExamOfficer | Physics |
| examofficer4@ctms.edu | ExamOfficer | Stats |
| lecturer1@ctms.edu | Lecturer | CS |
| lecturer2@ctms.edu | Lecturer | CS |
| lecturer3@ctms.edu | Lecturer | CS |
| lecturer4@ctms.edu | Lecturer | CS |
| lecturer5@ctms.edu | Lecturer | CS |
| lecturer6@ctms.edu | Lecturer | Math |
| lecturer7@ctms.edu | Lecturer | Math |
| lecturer8@ctms.edu | Lecturer | Math |
| lecturer9@ctms.edu | Lecturer | Physics |
| lecturer10@ctms.edu | Lecturer | Physics |
| lecturer11@ctms.edu | Lecturer | Stats |
| lecturer12@ctms.edu | Lecturer | Stats |
| multiadmin@ctms.edu | Admin + Lecturer | CS |
| multiofficer@ctms.edu | ExamOfficer + Lecturer | Math |

## Departments

| ID | Name |
|---|---|
| dept-cs-001 | Computer Science |
| dept-math-002 | Mathematics |
| dept-phy-003 | Physics |
| dept-stat-004 | Statistics |

## Grade Statuses

| Status | ~Count | Location |
|---|---|---|
| DRAFT | 83 | Active semester (2024/2025 First) |
| PENDING_APPROVAL | 208 | Active + recent semesters |
| PUBLISHED | 2,377 | All older semesters |

## Grade Scale

| Score | Letter | Points |
|---|---|---|
| 70-100 | A | 5.0 |
| 60-69 | B | 4.0 |
| 50-59 | C | 3.0 |
| 45-49 | D | 2.0 |
| 40-49 | E | 1.0 |
| 0-39 | F | 0.0 |

## Academic Sessions

| Session | Semesters | Status |
|---|---|---|
| 2021/2022 | First + Second | Inactive (all grades PUBLISHED) |
| 2022/2023 | First + Second | Inactive (all grades PUBLISHED) |
| 2023/2024 | First + Second | Inactive (mostly PUBLISHED) |
| 2024/2025 | First (active) + Second | Active (DRAFT + PENDING_APPROVAL) |

## Reseed

```bash
cd backend && npx tsx prisma/seed.ts
```

Cleans all existing data before inserting.
