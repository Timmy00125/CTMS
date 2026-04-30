# Product Requirements Document (PRD): CTMS

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Target Users & Access Control (RBAC)](#3-target-users--access-control-rbac)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements (NFRs)](#5-non-functional-requirements-nfrs)
6. [Out of Scope](#6-out-of-scope)

---

## 1. Project Overview
**CTMS** is a secure institutional registry designed to automate academic grading workflows, compute CGPAs deterministically, and generate cryptographic digital transcripts. The system transitions the institution from manual, error-prone spreadsheet processes to a strongly typed, RBAC-enforced centralized platform.

## 2. Technical Architecture
*   **Presentation Tier (Frontend):** Next.js (App Router). Utilizing React Server Components (RSC) for optimized data fetching and reduced client-side JavaScript. UI built with Tailwind CSS and Radix UI/shadcn for high-density data tables.
*   **Application Tier (Backend):** NestJS. Chosen for its strict modularity, dependency injection, and native TypeScript support.
*   **Data Access Layer (ORM):** Prisma. For type-safe database queries, automated schema migrations, and strict relation enforcement.
*   **Database:** PostgreSQL. Normalized to 3NF.

## 3. Target Users & Access Control (RBAC)
Access control will be handled at the backend via NestJS Guards using JWT payload claims. The system supports multi-role assignment (e.g., `roles: ["LECTURER", "EXAM_OFFICER"]`) to accommodate dual-hat staff.

*   **System Administrator:** Global IT oversight. Manages bulk data ingestion (CSV uploads) and user provisioning. *Constraints: Zero write-access to the Grades table. Can temporarily unlock grading windows for specific courses to allow Lecturer amendments.*
*   **Lecturer:** Departmental data-entry agent. Write-access restricted to inputting raw exam scores for explicitly assigned `CourseID`s within an active `GradingWindow`. *Tenant Scope: Guard must enforce a match between User `DepartmentID` and Course `DepartmentID`.*
*   **Examination Officer:** Departmental verification agent. Read-only access to module grades. Exclusive authorization to trigger the GPA computation engine, transition grades from `DRAFT` to `PUBLISHED`, and approve departmental transcripts. *Tenant Scope: Enforced `DepartmentID` matching.*
*   **Student:** End-user with the principle of least privilege. Read-only access to personal longitudinal grades, strictly restricted to grades marked as `PUBLISHED`.

## 4. Functional Requirements

### 4.1 Authentication & Authorization
*   **F1.1 Session Management:** The system must use HTTP-only, secure cookies for session management.
*   **F1.2 Token Architecture:** To allow immediate revocation of suspended accounts, implement short-lived Access Tokens (e.g., 15 minutes) paired with Refresh Tokens stored in the database.
*   **F1.3 Route Protection:** Next.js Middleware must intercept unauthenticated client-side navigation. NestJS Guards must protect API endpoints checking both Role arrays and Departmental scopes.
*   **F1.4 Password Hashing:** User passwords must be hashed using Argon2 or bcrypt before Prisma commits them.

### 4.2 Data Ingestion & Onboarding
*   **F2.1 Bulk Upload:** The Admin dashboard must accept CSV files for batch-creating Students and Courses.
*   **F2.2 Payload Validation:** NestJS Pipes (using Zod or class-validator) must validate the CSV payload. Malformed rows must be rejected, returning a detailed error array (partial success allowed).
*   **F2.3 System Audit Trail:** Any Admin modifications to user roles, department assignments, or `CourseID` lecturer reassignments must be logged in a `SystemAuditLog` to prevent proxy-abuse.

### 4.3 Grade Management & Input
*   **F3.1 Input Constraints:** Raw scores must be validated as integers between 0 and 100.
*   **F3.2 Grade Lifecycle:** Grades must have a status state machine (`DRAFT` -> `PENDING_APPROVAL` -> `PUBLISHED`).
*   **F3.3 Automated Grade Mapping:** The NestJS service layer must map raw scores to GradeLetter (A-F) and GradePoint values based on a predefined university grading schema.
*   **F3.4 Grade Amendments (Post-Window):** Admins can create a temporary `AmendmentWindow` for a specific `CourseID`, allowing the assigned Lecturer to correct errors after the global window closes.
*   **F3.5 Grade Audit Trail (Crucial):** Any modification to an existing grade by a Lecturer must trigger a write to a `GradeAuditLog` table, capturing the `LecturerID`, `PreviousScore`, `NewScore`, and `Timestamp`.

### 4.4 The Computational Engine
*   **F4.1 Server-Side Execution:** All mathematical operations for GPA/CGPA must occur in the NestJS application tier.
*   **F4.2 Calculation Trigger:** The Exam Officer initiates the computation batch for published grades. The system calculates GPA: sum(CreditUnits * GradePoints) / sum(CreditUnits).
*   **F4.3 Edge-Case Handling:** The algorithm must gracefully return null or 0.00 for division-by-zero scenarios (e.g., student registered but took no exams).

### 4.5 Transcript Generation
*   **F5.1 Data Aggregation:** The system must use Prisma include relations to fetch a students history, grouping records hierarchically by AcademicSession and Semester.
*   **F5.2 Document Export:** The frontend must generate a print-ready layout utilizing `@media print` CSS rules, stripping all navigational UI.

## 5. Non-Functional Requirements (NFRs)

### 5.1 Security
*   **NFR1.1 Rate Limiting:** Implement `@nestjs/throttler` to prevent brute-force attacks.
*   **NFR1.2 Data Integrity:** Prisma schema must utilize strict Foreign Key constraints and `ON DELETE RESTRICT`.
*   **NFR1.3 Input Sanitization:** All text inputs must be sanitized against SQL Injection and XSS.

### 5.2 Performance & Reliability
*   **NFR2.1 Query Optimization:** Prisma queries involving the Grades table must utilize database indexes on `StudentID`, `CourseID`, and `Status`.
*   **NFR2.2 Connection Pooling:** Prisma must be configured with connection pooling (e.g., PgBouncer).
*   **NFR2.3 Frontend Caching:** Next.js Route Handlers must heavily cache static institutional data using `revalidate` tags.

### 5.3 Usability
*   **NFR3.1 Information Density:** The UI must prioritize data density. Tables should support sticky headers, pagination, and multi-column sorting natively.
*   **NFR3.2 Error Handling:** All API failures must return standardized JSON error envelopes.

## 6. Out of Scope
*   Integration with legacy university ERP/Bursary systems.
*   Native mobile applications (iOS/Android).
*   Cloud-based load balancing and distributed deployment configurations.
*   Student course registration workflows (this system strictly handles grading post-registration).
