# Alumni Mentor Backend

Node.js + Express + Mongoose API for MentorConnect.

## Role-separated profile model
`users` stores authentication and shared account data only. Role-specific fields live in:
- `students`
- `mentors`
- `administrators`

Existing legacy profile fields are migrated automatically when the server starts.

## Run
```
npm install
npm run dev
```

Create `.env` from `.env.example` and set `MONGODB_URI` to your Atlas `alumni-mentor` database.
