# Quality Assurance & Test Strategy Document

> **Capstone Project BCA-05**  
> **System:** Explainable Alumni-Mentor Matching Marketplace with Capacity-Aware Recommendations  
> **Frameworks:** Vitest (Frontend UI & Logic), Node.js Test Runner (Backend API & Services), Supertest, MongoMemoryServer

---

## 1. Test Architecture & Pyramidal Strategy

```
           / \
          /   \     E2E / Workflow Tests
         /  5  \    (Multi-role requests, meetings, feedback)
        /-------\
       /         \    Integration & API Tests (51 Tests)
      /    51     \   (Supertest + MongoMemoryServer + Concurrency)
     /-------------\
    /               \   Unit Tests (29 Vitest Tests)
   /       29        \  (Matching math, factor contributions, React UI)
  /-------------------\
```

---

## 2. Test Suites Overview

### 2.1 Frontend Test Suite (Vitest — 29 Tests)
- **Command:** `npm test`
- **Location:** `frontend/**/__tests__/*.test.{js,jsx}`
- **Coverage Areas:**
  - `matching.test.js` (6 tests): Verify factor math, weights summing to 1.0, normalization, capacity bonus/penalty.
  - `requests.test.js` (8 tests): Normalization of requests, optimistic updates, error propagation.
  - `auth.test.js` (9 tests): Client session storage, login validation, token management.
  - `AccountMenu.test.jsx` (4 tests): Accessible UI dropdowns, theme toggling, logout triggers.
  - `AppRoutes.test.jsx` (2 tests): Route protection, role-based redirects.

### 2.2 Backend Test Suite (Node:test + Supertest — 51 Tests)
- **Command:** `cd backend && npm test`
- **Location:** `backend/tests/*.test.js`
- **Coverage Areas:**
  - `auth.test.js` (11 tests): Setup admin, duplicate prevention, student/mentor registrations, deactivated account blocks, password changes.
  - `roles_and_users.test.js` (9 tests): Role boundaries, non-admin email redaction, inactive user invisibility, self-profile editing only, last admin protection.
  - `matching_and_requests.test.js` (5 tests): Server-side ranking, factor breakdowns, anti-tampering of snapshot, duplicate request rejection.
  - `capacity_race.test.js` (5 tests): Parallel concurrent accepts race condition verification (`$expr` atomic guard).
  - `meetings_and_conflicts.test.js` (7 tests): Availability slot enforcement, bidirectional student/mentor conflict prevention, cancelled slot re-use.
  - `feedback_and_audit.test.js` (5 tests): Participant authorization, SHA-256 hash chaining, database tampering detection.
  - `ai_and_metrics.test.js` (9 tests): Healthcheck, p50/p95 latency metrics, OpenAPI spec validity, AI fallback, prompt-injection immunity.

---

## 3. Concurrency & Stress Testing
- **Concurrency Test (`capacity_race.test.js`):** Simulates 6 to 50 concurrent HTTP PATCH requests attempting to accept students simultaneously against a mentor with capacity 1 or 2. Verified that exactly $N = \text{capacity}$ succeeds and all excess return 400.
- **Fault Injection (`eval/run_robustness_experiments.js`):** Tests behavior during simulated AI outages, token tampering, and database disconnects.
