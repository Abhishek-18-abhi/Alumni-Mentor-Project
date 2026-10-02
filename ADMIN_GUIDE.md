# Administrator Operations & Governance Guide

> **Capstone Project BCA-05: MentorConnect**  
> Operational manual for College Faculty, Placement Coordinators, and System Administrators

---

## 1. Initial Setup & Access Control

1. **Bootstrap Administrator:** On initial system boot, visit `/setup-admin` to configure the root administrator. Once created, duplicate setup is automatically blocked by the backend.
2. **Managing Administrators:** Access `/admin/administrators` to invite faculty coordinators or departmental leads.
3. **Safety Guard:** The system enforces an integrity constraint preventing deletion of the last remaining administrator.

---

## 2. Server-Side Platform Analytics (`/admin/analytics`)

The Administrator Analytics dashboard is computed directly from MongoDB aggregations:
- **Request-to-Acceptance Funnel:** Tracks total applications, pending queue length, accepted pairs, declined requests, and global conversion percentage.
- **Capacity Load & Fairness Balancing:**
  - **Gini Coefficient of Load Distribution:** Measures equality of mentee allocations across alumni. A lower Gini indicates healthy, distributed load.
  - **Standard Deviation of Load Ratio:** Identifies variance between mentor capacities.
  - **Overloaded Mentors Watchlist:** Automatically flags mentors operating at 100% capacity ($M \ge C$).
- **Scheduling Conflicts Prevented:** Tracks real-time collision attempts blocked by the server.
- **Student Satisfaction Index:** Average rating across session micro-surveys.
- **Feedback Synthesis via AI:** Click **"Synthesize Feedback Themes"** to generate an anonymous, PII-scrubbed summary of student comments and overall programme sentiment.

---

## 3. Cryptographic Audit Ledger & Chain Verification (`/admin/audit`)

MentorConnect implements a tamper-evident SHA-256 chained audit ledger:
1. Every state alteration (registration, profile edit, request submission, response, meeting booking, feedback) records an immutable entry containing:
   - `timestamp`, `userId`, `ip`, `action`, `resource`, `prevHash`, `hash`
2. **Chain Verification:** Click **"Verify Hash Chain"** in the Audit Logs panel.
   - The backend reads every audit entry in chronological sequence.
   - It recalculates the SHA-256 hash and verifies that $\text{prevHash}_i = \text{hash}_{i-1}$.
   - Displays a green verified confirmation banner or highlights the exact tampered entry ID if an attacker modified database records directly.

---

## 4. Operational Health & System Metrics (`/api/metrics`)

Inspect real-time telemetry at `/api/metrics`:
- **Latency Percentiles:** Live p50, p95, and p99 response times.
- **Error Rates:** Monitored across HTTP 4xx and 5xx responses.
- **AI Health:** Displays active provider (Anthropic Claude), configuration status, total AI invocations, fallback count, and fallback rate percentage.

---

## 5. API Documentation (Swagger / OpenAPI 3)

The interactive OpenAPI 3.0 specification is available at:
`http://localhost:5000/api/docs`
Raw JSON specification: `http://localhost:5000/api/docs/spec.json`
