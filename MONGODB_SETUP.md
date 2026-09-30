# MentorConnect MongoDB setup

## Database
Database name: `alumni-mentor`

Collections:
- `users` - authentication/common account fields
- `students` - student profile fields
- `mentors` - mentor profile fields
- `administrators` - administrator/coordinator profile fields
- `mentorshipRequests`
- `meetings`
- `goals`
- `feedback`
- `notifications`
- `auditLogs`
- `platformSettings`

## Local development

### Backend
1. Copy `backend/alumni-mentor-backend/.env.example` to `.env`.
2. Add your MongoDB Atlas URI for `alumni-mentor`.
3. Run `npm install` and `npm run dev` from `backend/alumni-mentor-backend`.
4. Test `http://localhost:5000/api/health`.

### Frontend
1. Run `npm install` from the project root.
2. Run `npm run dev`.
3. Open `http://localhost:5173`.

The React application does not block startup on MongoDB hydration. API-backed features become available once the backend is reachable.
