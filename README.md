# TPC Flow — Training & Placement Cell Platform

A full-stack web platform for managing campus placements end-to-end: drives, companies,
student eligibility, applications, offers, placements, policies, and auditable reporting.
Built with a **React** frontend (the "Command Center" UI) and an **Express + MongoDB** backend
with JWT auth, an eligibility engine, audit logging, and real-time notifications.

---

## Roles

| Role | Access |
|------|--------|
| **ADMIN** | Full control across all modules + audit logs. |
| **TPC_OFFICER** | Placement operations (students, companies, drives, applications, offers, placements, policies, reports). |
| **STUDENT** | View open drives, check eligibility, apply, track applications/offers, manage own tech stack & profile. |

---

## Tech Stack

- **Frontend:** React 18, Vite, React Router, plain CSS design system (`src/styles/global.css` + shared primitives in `src/components/dashboard/primitives.jsx`), Lucide icons.
- **Backend:** Node.js, Express, MongoDB (Mongoose), JSON Web Tokens, express-validator, helmet, cors, express-rate-limit, morgan.
- **Realtime:** 15s polling for notifications (no websocket dependency).

---

## Prerequisites

- Node.js 18+
- MongoDB (local `mongod`, or a MongoDB Atlas connection string)

---

## Environment Variables

Create `server/.env` (a `.env` already exists in the repo; values shown below are the keys used):

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/tpcflow
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
BCRYPT_ROUNDS=12
```

The frontend talks to the backend through Vite's dev proxy — `client/vite.config.js` already
forwards `/api` → `http://localhost:5000`, so no frontend env vars are required for local dev.

---

## Installation

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

---

## Running (Development)

Start the backend and frontend in two terminals:

```bash
# Terminal 1 — API server (http://localhost:5000)
cd server
npm run dev        # nodemon (auto-restart)
# or: npm start    # plain node

# Terminal 2 — Web app (http://localhost:5173)
cd client
npm run dev
```

Open **http://localhost:5173** and log in with a seeded account (see below).

---

## Seeding Demo Data

```bash
cd server
npm run seed
```

This creates users, students, companies, drives, applications, offers, placements, and policies.

### Demo Logins

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@tpcflow.local` | `Admin@123` |
| TPC Officer | `officer@tpcflow.local` | `Student@123` |
| Student | `rahul@tpcflow.local` | `Student@123` |
| Student | `priya@tpcflow.local` | `Student@123` |

> Student passwords default to `Student@123` for all seeded students (`student5@tpcflow.local` … `studentN@tpcflow.local`).

---

## Build (Production)

```bash
cd client
npm run build      # outputs to client/dist
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
└── client/                 # React SPA
    ├── src/
    │   ├── pages/tpc/      # TPC officer + admin screens
    │   ├── pages/student/  # student screens
    │   ├── components/     # layout, common UI, dashboard primitives, drives, eligibility
    │   ├── context/        # Auth, Theme, Notification providers
    │   ├── services/       # axios API clients (one per domain)
    │   ├── hooks/          # useApi, useDebounce, useLocalStorage
    │   ├── constants/      # APPLICATION_FLOW, policy types, etc.
    │   └── styles/         # global.css design system
```

---

## API Overview

Base path: `/api`. All responses follow `{ success, message, data, pagination? }`.

**Auth**
- `POST /auth/login` · `GET /auth/me`

**Students**
- `GET /students` (officer/admin) · `GET /students/:id`
- `POST /students` · `PUT /students/:id` (officer/admin)
- `GET /students/me` · `PUT /students/me` (student — editable profile incl. academic details + tech stack)

**Companies**
- `GET /companies` · `GET /companies/:id` · `POST /companies` · `PUT /companies/:id`

**Drives**
- `GET /drives` · `GET /drives/:id` · `POST /drives` · `PUT /drives/:id` · `DELETE /drives/:id`
- `POST /drives/:id/publish` · `POST /drives/:id/close`
- `GET /drives/:id/eligibility` (student — backend eligibility evaluation)

**Applications**
- `GET /applications` · `GET /applications/:id`
- `POST /drives/:id/apply` (student; duplicate-apply blocked, eligibility enforced)
- `PATCH /applications/:id/status` (officer/admin)

**Offers** (policy-enforced)
- `GET /offers` · `GET /offers/:id` · `POST /offers` (officer/admin)
- `POST /offers/:id/accept` · `POST /offers/:id/decline` (student/officer)
- `POST /offers/:id/withdraw` · `POST /offers/:id/revoke` (officer/admin)

**Placements**
- `GET /placements` · `GET /placements/:id` · `POST /placements`

**Policies**
- `GET /policies` · `POST /policies` · `PUT /policies/:id`
- `POST /policies/:id/activate` · `POST /policies/:id/deactivate`
- `POST /policies/evaluate` (pre-check before creating an offer)

**Reports**
- `GET /reports/overview` · `GET /reports/branch-wise` · `GET /reports/company-wise`
- `GET /reports/package-distribution` · `GET /reports/year-wise` · `GET /reports/export`

**Notifications**
- `GET /notifications` · `PATCH /notifications/:id/read` · `PATCH /notifications/read-all`

**Audit Logs** (admin only)
- `GET /audit-logs/stats` · `GET /audit-logs`

---

## Key Features

- **Eligibility Engine** — drives carry declarative rules; a student's eligibility is evaluated
  server-side (`GET /drives/:id/eligibility`) and again at apply time.
- **Offer Lifecycle & Policies** — accepts/declines create/clear placement records; withdraw/revoke
  are audited; duplicate offers and policy limits are enforced before an offer is created.
- **Audit Trail** — important mutations (logins, applications, offers, profile/tech-stack edits,
  policy changes) are recorded and viewable in the Audit Logs screen (admin).
- **Student-Owned Tech Stack** — students manage their own `skills`; when applying they can
  highlight a subset of skills for a specific role (persisted to the application).
- **Notifications** — a live drawer with category filters and "mark all read"; polls every 15s.
- **Command Center UI** — KPI tiles, glass panels, segmented filters, live countdown rings,
  animated numbers, custom animated modals (no native `alert()`).

---

## Testing / Verification

The backend was smoke-tested end-to-end (admin + student) against the live API: auth, drives,
eligibility, applications, profile update (incl. the tech-stack + academic fields), notifications
(mark-all-read), audit logs/stats, and all TPC list endpoints — **all green**. The one expected
non-2xx is `POST /drives/:id/apply` returning `400 DUPLICATE_APPLICATION` when a student reapplies
to an already-applied drive (intended enforcement).

To re-run a similar check, start both servers and execute a scripted set of `fetch` calls against
`http://localhost:5000/api`.

---

## Notes & Troubleshooting

- **Local MongoDB + transactions:** if you run a local `mongod` and use offer/placement operations
  that rely on transactions, start a replica set first via `server/src/scripts/init-replset.js`
  (not needed on MongoDB Atlas).
- **CORS:** `CLIENT_URL` must match the frontend origin in development (`http://localhost:5173`).
- **Port conflicts:** the API defaults to `PORT` (5000); the Vite dev server uses 5173 and proxies
  `/api` to 5000.
- **Build artifacts / logs:** `client/dist`, `*.log`, and the legacy scaffolders
  (`build-all.cjs`, `scaffold.cjs`) are not part of the app and have been removed.
