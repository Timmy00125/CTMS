# CTMS Implementation Tasks (TDD Approach)

This document tracks the tasks for the CTMS project. Every functional requirement mapped here must be implemented using **Test-Driven Development (TDD)**:
1. **Red**: Write a failing unit/e2e test.
2. **Green**: Write the minimal code to pass the test.
3. **Refactor**: Clean up the code while ensuring tests still pass.

## Phase 1: Infrastructure & Database Setup
- [x] **TASK-1.1**: Initialize Next.js (App Router) frontend and NestJS backend repositories.
- [x] **TASK-1.2**: Set up PostgreSQL and Prisma ORM in the NestJS backend.
- [x] **TASK-1.3**: Design Prisma schema models (`User`, `Student`, `Course`, `Grade`, `GradeAuditLog`, `SystemAuditLog`, `AcademicSession`, `Semester`). Include `DepartmentID`, a `roles` array (Admin, Lecturer, ExamOfficer), and Grade `Status` enum. (Relates to: PRD Sec 2 - [ ] **TASK-1.3**: Design Prisma schema models (`User`, `Student`, `Course`, `Grade`, `GradeAuditLog`, `SystemAuditLog`, `AcademicSession`, `Semester`). Include `DepartmentID`, a `roles` array (Admin, Lecturer, ExamOfficer), and Grade `Status` enum. (Relates to: PRD Sec 2 & 5.1). 5.1).
- [x] **TASK-1.4**: Write automated database migration scripts and seed data for initial testing.

## Phase 2: Authentication & Authorization (PRD 4.1)
- [x] **TASK-2.1**: **TDD** - Create tests for User creation, password hashing (Argon2/bcrypt), and login route.
- [x] **TASK-2.2**: Implement short-lived JWT Access Tokens and Refresh Tokens. Set secure HTTP-only cookies. (F1.1, F1.2)
- [x] **TASK-2.3**: **TDD** - Write tests for NestJS Guards verifying array-based roles and `DepartmentID` payload claims against resources.
- [x] **TASK-2.4**: Implement RBAC and Tenant-Scoped Guards in NestJS. (F1.3)
- [x] **TASK-2.5**: Set up Next.js Middleware to intercept and redirect unauthenticated client-side navigation.

## Phase 3: Data Ingestion & Validation (PRD 4.2 & 5.1)
- [x] **TASK-3.1**: **TDD** - Write validation tests (valid/invalid data, partial success) for CSV payloads using Zod/class-validator.
- [x] **TASK-3.2**: Implement bulk upload endpoint for Students and Courses. (F2.1, F2.2)
- [x] **TASK-3.3**: **TDD** - Write tests for input sanitization (SQLi, XSS) and System Audit Logging.
- [x] **TASK-3.4**: Implement `SystemAuditLog` tracking for Admin actions (role changes, course assignments). (F2.3)
- [x] **TASK-3.5**: Integrate `@nestjs/throttler` for rate limiting. (NFR1.1)

## Phase 4: Grade Management & Auditing (PRD 4.3)
- [x] **TASK-4.1**: **TDD** - Write tests asserting raw scores are ints (0-100) and mapped to GradeLetters/Points. Ensure default status is `DRAFT`.
- [x] **TASK-4.2**: Implement the grade submission endpoint and mapping service. (F3.1, F3.2, F3.3)
- [x] **TASK-4.3**: **TDD** - Write tests simulating an Exam Officer transitioning grades to `PUBLISHED`.
- [x] **TASK-4.4**: **TDD** - Write tests simulating an Admin triggering an `AmendmentWindow` and Lecturer updating a grade, validating the `GradeAuditLog`.
- [x] **TASK-4.5**: Implement the Amendment workflow and automated `GradeAuditLog` writes. (F3.4, F3.5)
- [x] **TASK-4.6**: **TDD** - Write tests explicitly verifying Students cannot fetch `DRAFT` or `PENDING_APPROVAL` grades.

## Phase 5: The Computational Engine (PRD 4.4)
- [x] **TASK-5.1**: **TDD** - Write extensive unit tests for GPA/CGPA calculations, including edge cases (division by zero, no exams taken).
- [x] **TASK-5.2**: Implement the mathematical GPA/CGPA computation service in NestJS. (F4.1, F4.2)
- [x] **TASK-5.3**: Implement the Examination Officer trigger endpoint to execute batch calculations only on `PUBLISHED` grades. (F4.2)
- [x] **TASK-5.4**: Add error handling to gracefully return null/0.00 for edge cases without 500 errors. (F4.3)

## Phase 6: Transcript Generation & Frontend UI (PRD 4.5 & 5.3)
- [x] **TASK-6.1**: **TDD** - Write integration tests for API fetching aggregated student history (AcademicSession -> Semester). (F5.1)
- [x] **TASK-6.2**: Build high-density data tables in Next.js using Tailwind and Radix UI/shadcn. (NFR3.1)
- [x] **TASK-6.3**: Implement frontend caching (Next.js `revalidate` tags) for static institutional data. (NFR2.3)
- [x] **TASK-6.4**: Develop the print-ready CSS (`@media print`) layout for digital transcripts. (F5.2)

## Phase 7: Optimization & Error Handling (PRD 5.2 & 5.3)
- [ ] **TASK-7.1**: Configure Prisma connection pooling and add DB indexes (`StudentID`, `CourseID`, `Status`). (NFR2.1, NFR2.2)
- [ ] **TASK-7.2**: Standardize API error envelopes globally via a NestJS Exception Filter. (NFR3.2)
- [ ] **TASK-7.3**: Conduct final E2E testing encompassing the entire workflow.
