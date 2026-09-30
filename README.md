# MentorConnect — Local-First Working Prototype

This version is intentionally **localStorage-first**. It does not require PostgreSQL or the Node backend to run the user workflow.

## Run

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Important

This is a prototype. Passwords and application records are stored in browser localStorage, so this is **not production authentication/security**. The later production phase should move the same domain model to PostgreSQL + secure server-side authentication.

## Real local data

No demo student/mentor/KPI dataset is injected. Records are created by actions in the UI and stored in localStorage keys:

- `mc_users`
- `mc_session`
- `mc_notifications`
- `mc_requests`
- `mc_meetings`
- `mc_goals`
- `mc_feedback`
- `mc_audit`
- `mc_availability`

## Main workflow

1. First-time administrator setup creates the first admin.
2. Register Student or Alumni Mentor.
3. Complete onboarding.
4. Student selects skills, interests, goals, languages and availability.
5. Mentor selects skills/expertise, interests, goals, languages, availability and capacity.
6. Student opens **Find Mentor** or **My Matches**.
7. Matching calculates an explainable score from profile overlap and mentor capacity.
8. Student sends a real mentorship request.
9. Mentor accepts/declines it.
10. Accepted mentorships can be used to schedule meetings.
11. Meeting logs, goals, feedback and notifications are stored locally.
12. Admin can see registered users, manage administrators and send notifications.

## Reset all local data

Open browser DevTools Console and run:

```js
localStorage.clear(); location.reload();
```

## Next production phase

Once the UI/workflow is verified, replace the storage/auth layer with the already-prepared PostgreSQL + Node/Express API. Keep the same screens and domain objects, but move passwords, authorization, matching persistence and audit records to the backend.
