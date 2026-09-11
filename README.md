# AgencyDash — Real-Time Client Project Dashboard

A full-stack internal agency tool for managing client projects, tracking task progress, and monitoring team activity in real time.

---

## Live Demo

- **Frontend**: [Deployed on Vercel]  
- **Backend API**: [Deployed on Render]

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (or a connection string from Neon/Supabase)

### 1. Clone and install

```bash
git clone https://github.com/your-username/client-dash.git
cd client-dash
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # fill in your DB URL and JWT secrets
npx prisma migrate dev
npx prisma db seed
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:3000
npm run dev
```

### Environment Variables

**Backend `.env`:**
```
DATABASE_URL="postgresql://user:pass@host/db"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:3000
```

---

## Seeded Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@agency.com | password123 |
| PM | pm1@agency.com | password123 |
| PM | pm2@agency.com | password123 |
| Dev | dev1@agency.com | password123 |
| Dev | dev2@agency.com | password123 |
| Dev | dev3@agency.com | password123 |
| Dev | dev4@agency.com | password123 |

---

## Database Schema

```
User ─── managedProjects ──> Project ──> Task
User ─── assignedTasks ────> Task ──────> ActivityLog
User ─── notifications ────> Notification
Project ──────────────────> ActivityLog
Client ──────────────────── Project
```

### Models
- **User** – id, email, passwordHash, role (ADMIN|PM|DEV), name
- **Client** – id, name
- **Project** – id, name, clientId, pmId
- **Task** – id, title, description, status, priority, dueDate, projectId, developerId
- **ActivityLog** – id, action, previousValue, newValue, taskId, projectId, userId, createdAt
- **Notification** – id, message, isRead, userId, createdAt

### Indexes (via Prisma)
- `Task.projectId` — frequent JOIN in project task queries
- `Task.developerId` — frequent filter for DEV role queries
- `Task.status` — used in overdue cron + filter queries
- `ActivityLog.projectId` — activity feed pagination
- `Notification.userId` — per-user notification fetch

---

## Architectural Decisions

### WebSocket Library: Socket.io
Chose Socket.io over native WebSockets because:
- Built-in room support allows us to isolate activity feeds per-project (PM gets only their project events)
- Automatic reconnection handles intermittent connection drops gracefully
- The namespace/room model maps perfectly to our role-filtered feed requirement

### Background Jobs: node-cron
Chose node-cron over Bull queue because:
- The overdue task check is a simple scheduled scan — it does not need distributed job retry logic
- No Redis dependency keeps the deployment simpler (Render free tier)
- node-cron runs in-process which is fine for a single-instance API

### Token Storage
- **Access token** stored in React state (in-memory) — never in localStorage to prevent XSS
- **Refresh token** stored in an HttpOnly, SameSite=Strict cookie — inaccessible to JavaScript
- On page load, a silent `/auth/refresh` call restores the session automatically

### ORM: Prisma
- Type-safe queries eliminate a class of runtime errors
- Migration history gives auditability
- The generated client is used exclusively — no raw SQL mixed into controllers

---

## Known Limitations

- No Docker Compose file (manual setup required)
- Socket.io presence count is in-memory — resets on server restart (acceptable for single-instance)
- Activity log is append-only with no cleanup/pagination beyond last 20 entries per role
- No email notifications — only in-app

---

## Submission Notes

**Hardest problem**: Role-filtered real-time feed. The challenge was ensuring that a Developer only sees Socket.io events for tasks assigned to them, not all project events. Solved by combining server-side room logic (each user joins a personal `user_<id>` room and their project rooms) with activity log queries that filter by `developerId` for catchup on reconnect.

**One thing I'd do differently**: Replace node-cron with a proper Bull queue backed by Redis. The cron job currently runs inside the Express process, which means scaling to multiple instances would cause duplicate overdue updates. Bull's distributed locking would prevent that.
