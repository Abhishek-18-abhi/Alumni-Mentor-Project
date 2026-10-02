# System Architecture & Technical Design Document

> **Capstone Project BCA-05**  
> **System:** Explainable Alumni-Mentor Matching Marketplace with Capacity-Aware Recommendations  
> **Standard:** C4 Model & UML Sequence Workflows

---

## 1. C4 Context Diagram (Level 1)

```mermaid
flowchart TD
    StudentUser["Student\n(BCA Student seeking mentorship)"]
    MentorUser["Alumni Mentor\n(Industry professional)"]
    AdminUser["Administrator\n(College faculty / placement cell)"]

    System["MentorConnect Platform (BCA-05)\nProvides explainable matching, capacity-aware workflows,\nscheduling, and AI assistance"]

    ClaudeService["Anthropic Claude API\n(Provides grounded match rationale & SMART goals)"]
    MongoAtlas["MongoDB Atlas\n(Document database with transactions and audit ledger)"]

    StudentUser -->|Searches mentors, schedules meetings, tracks goals| System
    MentorUser -->|Sets capacity, publishes availability, responds to requests| System
    AdminUser -->|Monitors load balance, verifies audit chain, views analytics| System

    System -->|Queries profiles, records tamper-evident logs| MongoAtlas
    System -->|Sends sanitized prompts, receives natural language summaries| ClaudeService
```

---

## 2. C4 Container Diagram (Level 2)

```mermaid
flowchart TD
    subgraph ClientContainer ["Frontend Container (React 19 + Vite)"]
        SPA["Single Page Application\n(Port 5173 / Port 3000)\nReact 19, React Router 6, Lucide Icons, Modern CSS"]
        LocalCache["Client Storage Cache\n(mc_session, mc_users, mc_api_token)"]
        SPA <--> LocalCache
    end

    subgraph APIContainer ["Backend API Container (Node.js 22 + Express 5)"]
        Router["Express REST Router\n(/api/auth, /api/users, /api/matches,\n/api/mentorship-requests, /api/meetings, /api/ai)"]
        AuthMiddleware["JWT Authentication Guard"]
        MatchingEngine["Matching Engine\n(backend/services/matching.js)"]
        AIService["AI Advisory Service\n(backend/services/aiService.js)"]
        AuditService["Audit Ledger Service\n(backend/services/auditService.js)"]
        AvailabilityService["Availability Verification\n(backend/services/meetingAvailability.js)"]
        
        Router --> AuthMiddleware
        Router --> MatchingEngine
        Router --> AIService
        Router --> AuditService
        Router --> AvailabilityService
    end

    subgraph DatabaseContainer ["Data Persistence Layer"]
        MongooseODM["Mongoose 8 ODM"]
        MongoDB[(MongoDB Atlas / Local Mongo)]
        MongooseODM <--> MongoDB
    end

    SPA -->|HTTPS / JSON REST API with JWT| Router
    APIContainer --> MongooseODM
```

---

## 3. Core Lifecycle Sequence Diagram (Request $\rightarrow$ Accept $\rightarrow$ Meeting)

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant API as Express API
    participant Engine as Matching Engine
    participant DB as MongoDB Atlas
    actor Mentor as Alumni Mentor

    %% Step 1: Matching
    Student->>API: GET /api/matches/:studentId
    API->>DB: Query active mentors with capacity
    API->>Engine: scoreMatch(studentProfile, mentorProfile)
    Engine-->>API: Return factor breakdown (Skills 45%, Interests 20%, ...)
    API-->>Student: Ranked mentors with explainable factor cards

    %% Step 2: Request Submission
    Student->>API: POST /api/mentorship-requests (mentorId, message)
    API->>DB: Check for existing pending/accepted request
    API->>Engine: Server-side compute snapshot (No client trust)
    API->>DB: Insert MentorshipRequest (status: 'pending')
    API->>DB: Append SHA-256 Audit Log Entry
    API-->>Mentor: Dispatch notification alert
    API-->>Student: 201 Created (Request pending)

    %% Step 3: Atomic Acceptance
    Mentor->>API: PATCH /api/mentorship-requests/:id/respond (status: 'accepted')
    API->>DB: Mentor.findOneAndUpdate($expr: currentMentees < capacity, currentMentees += 1)
    alt Capacity Full
        DB-->>API: Returns null (Guard triggered)
        API-->>Mentor: 400 Bad Request ("Capacity is full")
    else Capacity Available
        DB-->>API: Returns updated mentor profile
        API->>DB: Update MentorshipRequest status -> 'accepted'
        API->>DB: Append SHA-256 Audit Log Entry
        API-->>Student: Dispatch acceptance notification
        API-->>Mentor: 200 OK (Pairing established)
    end

    %% Step 4: Meeting Booking
    Student->>API: POST /api/meetings (mentorId, date, time)
    API->>API: Verify slot falls in mentor.availability
    API->>DB: Check for non-cancelled conflicts (for student OR mentor)
    alt Conflict or Invalid Slot
        API-->>Student: 400/409 Conflict ("Slot unavailable / Conflict detected")
    else Valid & Conflict-Free
        API->>DB: Insert Meeting (status: 'scheduled')
        API->>DB: Append SHA-256 Audit Log Entry
        API-->>Student: 201 Created (Meeting scheduled)
        API-->>Mentor: Meeting notification alert
    end
```

---

## 4. Mathematical Definition of Match Scoring

$$S(u, m) = \min\left(100, \sum_{k \in \mathcal{F}} w_k \cdot R_k(u, m)\right)$$

Where:
- $\mathcal{F} = \{\text{skills}, \text{interests}, \text{goals}, \text{languages}, \text{availability}, \text{capacity}\}$
- $\sum_{k} w_k = 0.45 + 0.20 + 0.15 + 0.10 + 0.05 + 0.05 = 1.00$
- $R_k(u, m) = \frac{|\mathcal{S}_k(u) \cap \mathcal{M}_k(m)|}{\max(|\mathcal{S}_k(u)|, 1)} \times 100$ for overlap factors
- $R_{\text{capacity}}(u, m) = 100$ if $\text{currentMentees} < \text{capacity}$, else $0$
