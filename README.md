# TPC Flow — Training & Placement Cell Platform

**TPC Flow** is a full-stack web platform that manages campus placements end-to-end — drives,
companies, student eligibility, applications, offers, placements, policies, and auditable reporting.
It pairs a **React** frontend (the "Command Center" UI) with an **Express + MongoDB** backend
featuring JWT authentication, an eligibility engine, audit logging, and real-time notifications.

---

## Features

- **Role-based access** — Admin, TPC Officer, and Student workspaces with scoped permissions.
- **Eligibility Engine** — drives carry declarative rules; eligibility is evaluated server-side and
  re-checked at application time.
- **Recruitment Funnel** — a backend-enforced application workflow
  (`APPLIED → SHORTLISTED → INTERVIEW → SELECTED`, with `REJECTED`/`WITHDRAWN` terminal states).
  Invalid transitions are rejected by the server. A live funnel with an auto-computed selection rate
  updates instantly as candidates move.
- **Offer Lifecycle & Policies** — accepts/declines create and clear placement records; withdraw/
  revoke actions are audited; duplicate offers and policy limits are enforced before an offer is made.
- **Student-Owned Tech Stack** — students manage their own skills and highlight a subset per role when
  applying; officers can correct them (changes are audited).
- **Audit Trail** — key mutations (logins, applications, offers, profile/tech-stack edits, policy
  changes) are recorded and viewable by admins.
- **Notifications** — a live drawer with category filters and "mark all read" (15s polling).
- **Reports** — overview, branch-wise, company-wise, package distribution, year-wise, and export.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router, plain CSS design system, Lucide icons |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT, express-validator |
| Security | helmet, cors, express-rate-limit, bcrypt |
| Realtime | 15s polling for notifications (no websocket dependency) |

---

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full control across all modules + audit logs |
| **TPC Officer** | Placement operations: students, companies, drives, applications, offers, placements, policies, reports |
| **Student** | View open drives, check eligibility, apply, track applications/offers, manage own tech stack & profile |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local `mongod`, or a MongoDB Atlas connection string)

### Environment
Create `server/.env` (a working `.env` is already included in the repo):

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/tpcflow
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
BCRYPT_ROUNDS=12
```

The frontend talks to the backend through Vite's dev proxy (`client/vite.config.js` forwards
`/api` → `http://localhost:5000`), so no frontend env vars are required for local development.

### Installation

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### Run (Development)

```bash
# Terminal 1 — API server (http://localhost:5000)
cd server && npm run dev      # nodemon (auto-restart)
# or: npm start               # plain node

# Terminal 2 — Web app (http://localhost:5173)
cd client && npm run dev
```

Open http://localhost:5173 and sign in with a seeded account (below).

### Seed Demo Data

```bash
cd server && npm run seed
```

This populates users, students, companies, drives, applications, offers, placements, and policies.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@tpcflow.local` | `Admin@123` |
| TPC Officer | `officer@tpcflow.local` | `Officer@123` |
| Student | `rahul@tpcflow.local` | `Student@123` |
| Student | `priya@tpcflow.local` | `Student@123` |

> All seeded students use `Student@123` (`student5@tpcflow.local` … `student14@tpcflow.local`).

---

## Build (Production)

```bash
cd client && npm run build    # outputs to client/dist
```

The backend is a standard Node/Express app and can be served as-is (e.g. behind nginx/PM2).

---

## Project Structure

```
tpc-platform/
├── server/                 # Express API
│   ├── server.js           # entrypoint
│   ├── app.js              # express app (middleware, routes)
│   ├── src/
│   │   ├── controllers/    # auth, student, company, drive, application,
│   │   │                   #   offer, placement, policy, report, notification, audit
│   │   ├── routes/         # express routers (mounted under /api)
│   │   ├── models/         # mongoose schemas
│   │   ├── middleware/     # auth, role, validate, errorHandler, upload
│   │   ├── validators/     # express-validator rule sets
│   │   ├── utils/          # responseHelper, auditLogger, AppError, eligibility engine
│   │   ├── config/         # db, etc.
│   │   └── seed/           # database seeder
│   └── .env
=======
│   ├── .env
│   └── src/
│       ├── controllers/    # auth, student, company, drive, application,
│       │                   #   offer, placement, policy, report, notification, audit
│       ├── routes/         # express routers (mounted under /api)
│       ├── models/         # mongoose schemas
│       ├── middleware/     # auth, role, validate, errorHandler, upload
│       ├── validators/     # express-validator rule sets
│       ├── utils/          # responseHelper, auditLogger, AppError, eligibility engine
│       ├── config/         # db, etc.
│       └── seed/           # database seeder
>>>>>>> af9467f (download button ,ui , readme ,)
└── client/                 # React SPA
    └── src/
        ├── pages/tpc/      # TPC officer + admin screens
        ├── pages/student/  # student screens
        ├── components/     # layout, common UI, dashboard primitives, drives, eligibility
        ├── context/        # Auth, Theme, Notification providers
        ├── services/       # axios API clients (one per domain)
        ├── hooks/          # useApi, useDebounce, useLocalStorage
        ├── constants/      # APPLICATION_FLOW, policy types, etc.
        └── styles/         # global.css design system
```

---

## API Overview

Base path: `/api`. All responses follow `{ success, message, data, pagination? }`.

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/login` · `GET /auth/me` |
| Students | `GET /students` · `GET /students/:id` · `POST /students` · `PUT /students/:id` · `GET /students/me` · `PUT /students/me` |
| Companies | `GET /companies` · `GET /companies/:id` · `POST /companies` · `PUT /companies/:id` |
| Drives | `GET /drives` · `POST /drives` · `PUT /drives/:id` · `DELETE /drives/:id` · `POST /drives/:id/publish` · `POST /drives/:id/close` · `GET /drives/:id/eligibility` |
| Applications | `GET /applications` · `POST /drives/:id/apply` · `PATCH /applications/:id/status` |
| Offers | `GET /offers` · `POST /offers` · `POST /offers/:id/accept` · `POST /offers/:id/decline` · `POST /offers/:id/withdraw` · `POST /offers/:id/revoke` |
| Placements | `GET /placements` · `POST /placements` |
| Policies | `GET /policies` · `POST /policies` · `PUT /policies/:id` · `POST /policies/:id/activate` · `POST /policies/:id/deactivate` · `POST /policies/evaluate` |
| Reports | `GET /reports/overview` · `/branch-wise` · `/company-wise` · `/package-distribution` · `/year-wise` · `/export` |
| Notifications | `GET /notifications` · `PATCH /notifications/:id/read` · `PATCH /notifications/read-all` |
| Audit Logs (admin) | `GET /audit-logs` · `GET /audit-logs/stats` |

---

## Notes
- **CORS:** `CLIENT_URL` must match the frontend origin (`http://localhost:5173` in development).
- **Duplicate applications** are blocked server-side; re-applying returns `400 DUPLICATE_APPLICATION`.
