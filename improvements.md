# CTMS Improvements

Comprehensive analysis of the CTMS codebase covering backend, frontend, security, testing, and architecture. Items are categorized by severity and prioritized.

---

## Backend Critical Issues

| # | Category | Issue | Location |
|---|----------|-------|----------|
| 1 | **Security** | `.env` file committed with DB credentials (`postgresql://postgres:password@localhost:5432/ctms`) | `backend/.env` |
| 2 | **Security** | Hardcoded JWT secret fallback `'super_secret_key_for_dev'` in two places | `auth.module.ts`, `jwt.strategy.ts` |
| 3 | **Security** | Open registration — `POST /auth/register` has no guards, anyone can create an account | `auth.controller.ts` |
| 4 | **Security** | TenantGuard exists and is tested but never applied to any controller | `guards/tenant.guard.ts` |
| 5 | **Security** | No refresh token revocation — stolen refresh tokens valid for 7 days with no way to invalidate | `auth.service.ts` |
| 6 | **Security** | No helmet middleware for HTTP security headers | `main.ts` |
| 7 | **Bug** | Prisma adapter-pg v7.8 vs @prisma/client v6.19 version mismatch — potential runtime incompatibility | `package.json` |
| 8 | **Bug** | SanitizationService escapes single quotes (`'` → `''`) corrupting data like "O'Brien" — Prisma already parameterizes queries | `sanitization.service.ts` |
| 9 | **Bug** | `GET /gpa/semester/:semesterId/students` passes empty `[]` to `calculateBatchGpa`, always returns empty results | `gpa.controller.ts` |
| 10 | **Bug** | `GET /gpa/student/:studentId` uses `@Body('semesterId')` on a GET request — violates REST conventions | `gpa.controller.ts` |
| 11 | **Performance** | N+1 queries in `publishGrades` — loops through grades calling `update()` individually instead of `updateMany()` | `grade.service.ts` |
| 12 | **Design** | `PENDING_APPROVAL` status exists in schema but is never used — `publishGrades` transitions DRAFT → PUBLISHED directly | `grade.service.ts` |
| 13 | **Design** | No Department model — `departmentId` is a plain string with no referential integrity | `schema.prisma` |
| 14 | **Design** | `AuditLogService` exists but `GradeService` and `IngestionService` call `this.prisma.systemAuditLog.create()` directly | `grade.service.ts`, `ingestion.service.ts` |
| 15 | **Design** | No pagination on any list endpoint — `findAll()` returns all records, won't scale | all `findAll()` methods |
| 16 | **Design** | Inconsistent `findOne` — `StudentService` throws `NotFoundException`, `CourseService` returns `null` | `student.service.ts`, `course.service.ts` |
| 17 | **Code** | Duplicated `mapScoreToGrade` function in 3 places | `grade.service.ts`, `seed.ts`, `test-utils.ts` |
| 18 | **Code** | Duplicated `BulkUploadResult` interface in two services | `ingestion.service.ts`, `grade.service.ts` |
| 19 | **Code** | Unused dependencies: `csv-parser`, `multer`, `passport-local` installed but never imported | `package.json` |
| 20 | **Code** | `@types/*` packages in `dependencies` instead of `devDependencies` | `package.json` |
| 21 | **Code** | No structured logging — uses `console.log`/`console.error` throughout | entire backend |
| 22 | **Code** | No user management endpoints — no way to update roles, list users, or manage accounts via API | missing |
| 23 | **Code** | No create/update/delete for students, courses, academic sessions — only read endpoints exist | missing |
| 24 | **Code** | Empty `transcript/dto/` directory — dead code | `transcript/dto/` |
| 25 | **Code** | DTOs defined inline in controller file instead of separate `dto/` directory | `auth.controller.ts` |

---

## Backend Test Gaps

| # | Gap | Detail |
|---|-----|--------|
| 1 | Throttler tests are empty | Just checks `app` is defined — no actual rate limit testing |
| 2 | PrismaService spec is a stub | Only `toBeDefined()`, no pool initialization or connection tests |
| 3 | AuthController spec minimal | 1 test — register, login, refresh, logout, me only tested in e2e |
| 4 | No `GET /auth/me` test | Missing in both unit and e2e tests |
| 5 | TenantGuard never applied | Good unit tests but zero integration/e2e coverage since it's unused |
| 6 | Controller specs pass unused arguments | `transcript.controller.spec.ts` and `gpa.controller.spec.ts` pass mock request objects to methods that don't accept them — tests pass only because JS ignores extra args |
| 7 | No pagination tests | All list endpoints return unbounded results, no tests for pagination behavior |

---

## Frontend Critical Issues

| # | Category | Issue | Location |
|---|----------|-------|----------|
| 1 | **Anti-pattern** | Mock data as production fallback — if backend is down, users see fake data with no indication | `students/page.tsx`, `courses/page.tsx`, `transcripts/page.tsx` |
| 2 | **Anti-pattern** | Dashboard entirely hardcoded — stats, activity, system status, grade distribution all mock | `dashboard/page.tsx` |
| 3 | **Anti-pattern** | Student detail academic summary hardcoded (CGPA 3.72, credits 96, courses 24, "Good Standing") | `students/[id]/page.tsx` |
| 4 | **Anti-pattern** | Grades page — pure mock data, action buttons (Submit/Publish) have no click handlers | `grades/page.tsx` |
| 5 | **Bug** | `fetchDashboardStats` hardcodes all grade counts to 0 | `lib/api.ts` |
| 6 | **Bug** | `Suspense` wrapping a `Client Component` — provides no streaming benefit | `transcripts/page.tsx` |
| 7 | **Code** | Dead code: `src/proxy.ts` is a duplicate of middleware logic, never imported | `src/proxy.ts` |
| 8 | **Code** | Unused API functions: `loginUser`, `registerUser`, `logoutUser`, `fetchDashboardStats` never called | `lib/api.ts` |
| 9 | **Code** | Unused cache functions (`invalidateTranscriptCache`, etc.) never called | `lib/cache.ts` |
| 10 | **Code** | Inconsistent API usage — some pages use `api.ts` functions, others use raw `fetch()` | throughout |
| 11 | **Code** | Same mock student list duplicated in 3 files | `students/page.tsx`, `transcripts/page.tsx`, `students/[id]/page.tsx` |
| 12 | **Code** | `String concatenation for class names in some components instead of using the available `cn()` utility | multiple components |
| 13 | **Design** | No auth context/provider — current user never loaded, no role-based UI | missing |
| 14 | **Design** | No token refresh mechanism — frontend never calls `/auth/refresh` | `middleware.ts` |
| 15 | **Design** | No error boundaries — no `error.tsx` or `global-error.tsx` files | missing |
| 16 | **Design** | No loading states — no `loading.tsx` files for route-level Suspense | missing |
| 17 | **Design** | No not-found page — no `not-found.tsx` | missing |
| 18 | **Design** | No form validation — only basic HTML `required` attribute, no zod/react-hook-form | `login/page.tsx`, `register/page.tsx` |
| 19 | **Design** | No toast/notification system for success/error feedback on mutations | missing |
| 20 | **Design** | No pagination on any list page | all list pages |
| 21 | **Design** | No role-based UI — sidebar shows same nav to Admin, Lecturer, and ExamOfficer | `sidebar.tsx` |
| 22 | **Design** | Sidebar shows "Lecturer" label hardcoded for all users | `sidebar.tsx` |
| 23 | **Performance** | Almost entirely client-rendered (6 of 7 pages) — no SSR/streaming benefits | all pages |
| 24 | **Performance** | No data caching — every page navigation re-fetches from scratch | all pages |
| 25 | **Performance** | No prefetching on links | all pages |
| 26 | **Performance** | Hard navigation on logout (`window.location.href`) instead of `router.push()` | `sidebar.tsx` |
| 27 | **Testing** | Zero test files in entire frontend | missing |
| 28 | **Design** | AGENTS.md is outdated — claims "scaffolded only" but codebase has substantial UI | `AGENTS.md` |

---

## Recommended Improvements (Priority Order)

### P0 — Security & Bugs (Do First)

1. **Add `.env` to `.gitignore`** and rotate all credentials. Create `.env.example` with placeholder values.
2. **Remove hardcoded JWT fallback** — throw an error at startup if `JWT_SECRET` env var is missing.
3. **Gate registration** — require admin authentication or an invite code for new accounts.
4. **Apply TenantGuard** to all department-scoped endpoints (students, courses, grades).
5. **Fix Prisma version mismatch** — align `@prisma/adapter-pg` with `@prisma/client` (both v6.19).
6. **Remove single-quote escaping** from SanitizationService — Prisma handles parameterization natively.
7. **Fix `@Body()` on GET** in GpaController — use `@Query()` for semesterId.
8. **Fix empty batch GPA endpoint** — pass actual student IDs to `calculateBatchGpa`.
9. **Add helmet** — `app.use(helmet())` in `main.ts` for HTTP security headers.

### P1 — Architecture & Design

10. **Implement PENDING_APPROVAL workflow** — add transition: DRAFT → PENDING_APPROVAL → PUBLISHED with ExamOfficer approval step.
11. **Add Department model** to Prisma schema with proper foreign keys and CRUD endpoints.
12. **Add pagination** to all list endpoints (students, courses, grades, audit logs). Use cursor-based or offset pagination with configurable page size.
13. **Extract shared utilities** — move `mapScoreToGrade` to `common/utils/grade-mapping.ts` and `BulkUploadResult` to `common/dto/`.
14. **Use AuditLogService** in GradeService and IngestionService instead of direct Prisma calls.
15. **Add refresh token rotation** — invalidate old refresh tokens on use, store token family in DB for detection of stolen tokens.
16. **Structured logging** — replace `console.log` with NestJS built-in `Logger` or `nestjs-pino` for structured, leveled logging.
17. **Standardize findOne behavior** — all services should throw `NotFoundException` (not return null).
18. **Add CRUD endpoints** for students (create/update/delete), courses (create/update/delete), and academic sessions (create/update).
19. **Add user management endpoints** — list users, update roles, deactivate accounts.
20. **Clean up unused dependencies** — remove `csv-parser`, `multer`, `passport-local` from `package.json`.
21. **Move `@types/*` to devDependencies** — `@types/cookie-parser`, `@types/passport-jwt`, `@types/passport-local`, `@types/pg`.
22. **Remove empty `transcript/dto/` directory**.
23. **Move auth DTOs** from inline in controller to `auth/dto/` directory.

### P2 — Frontend Overhaul

24. **Create AuthContext/Provider** — load current user on app init via `GET /auth/me`, expose user and role info for UI gating.
25. **Replace mock data with real API calls** — dashboard stats, grades page, student detail academic summary.
26. **Remove mock data fallback pattern** — show proper error states (error cards, retry buttons) and loading skeletons instead of fake data.
27. **Standardize API usage** — all pages should use typed functions from `api.ts`, not raw `fetch()`.
28. **Extract data fetching into custom hooks** — `useStudents()`, `useCourses()`, `useGrades()`, `useCurrentUser()`, etc.
29. **Add error boundaries** — `error.tsx` at each route segment, `global-error.tsx` at root.
30. **Add loading states** — `loading.tsx` files for each dashboard route with skeleton UI.
31. **Add not-found page** — `not-found.tsx` at dashboard level with back navigation.
32. **Add form validation** — use `zod` + `react-hook-form` for login, register, and grade submission forms.
33. **Add toast notifications** — use sonner or react-hot-toast for success/error feedback on all mutations.
34. **Role-based UI** — show/hide nav items and action buttons based on user role (Admin sees everything, Lecturer sees their courses, ExamOfficer sees grade management).
35. **Fix sidebar user label** — fetch and display actual user name/role instead of hardcoded "Lecturer".
36. **Token refresh interceptor** — intercept 401 responses, call `/auth/refresh`, retry the original request.
37. **Remove dead code** — delete `proxy.ts`, unused API functions, unused cache utilities.
38. **Update AGENTS.md** — reflect actual implementation status.

### P3 — Performance & Testing

39. **Convert eligible pages to Server Components** — students list, courses list, academic sessions can be server-rendered with client islands for search/filter.
40. **Add data caching** — use Next.js `revalidateTag`/`revalidatePath` or React Query for client-side cache management.
41. **Add link prefetching** — `<Link prefetch>` for predictable navigation paths (dashboard → students, courses, grades).
42. **Replace `window.location.href`** on logout with `router.push('/login')` + `router.refresh()`.
43. **Add frontend tests** — at minimum:
    - Component tests for `DataTable`, `TranscriptView`, `StatusBadge`
    - Integration tests for auth flow (login → dashboard → logout)
    - Hook tests for custom data fetching hooks
44. **Fix backend throttler e2e tests** — actually test rate limiting behavior (send requests until 429).
45. **Add pagination to frontend** — virtual scrolling or page-based navigation for student/course/grade lists.
46. **Add backend unit tests for edge cases** — empty database queries, concurrent grade submissions, invalid UUIDs.

### P4 — Nice-to-Have Enhancements

47. **CSV file upload** — implement actual file upload with `multer` for bulk student/course ingestion (currently only JSON arrays).
48. **Transcript PDF export** — server-side PDF generation using `puppeteer` or `@react-pdf/renderer` for downloadable transcripts.
49. **Batch operations UI** — frontend page for bulk student/course upload with file drag-and-drop, progress indicator, and error display.
50. **Dashboard analytics** — real stats from API: grade distributions (bar chart), pass rates, enrollment trends over time.
51. **Search/filter/sort on backend** — add query params to all list endpoints (`?search=`, `?sort=`, `?status=`).
52. **Audit log UI** — frontend page to view and filter system audit logs with date range, action type, and user filters.
53. **i18n** — internationalization for multi-language support if needed.
54. **WebSocket notifications** — real-time notifications for grade publication, approval requests.
55. **API documentation** — add `@nestjs/swagger` to generate OpenAPI docs for all endpoints.
56. **Docker Compose for full stack** — single `docker-compose.yml` that starts frontend, backend, and PostgreSQL together.
57. **CI/CD pipeline** — GitHub Actions for lint, test, build on PR; deploy on merge to main.
