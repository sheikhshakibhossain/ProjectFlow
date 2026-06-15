# ProjectFlow
## Manage your academic projects seamlessly

A web platform that helps students manage and monitor project progress and record feedback from teachers. Team leads can create projects, break them down into tasks, and assign responsibilities to individual members while members can update their task progress.

The app has two parts:
- **Frontend** — React + Vite (in the project root)
- **Backend** — Node + Express + SQLite (in `backend/`)

## Requirements
- Node.js 20+

## Setup

### Quick start (both servers)

```bash
./start.sh
```

This installs nothing by itself — run `npm install` in both the project root and `backend/` first (see below). Once both are installed, `./start.sh` starts the backend and frontend together and prints their URLs. Press `Ctrl+C` to stop both.

### 1. Backend

```bash
cd backend
npm install
npm start
```

This starts the API server on `http://localhost:4001`. A SQLite database (`backend/data.sqlite`) is created and seeded automatically on first run with demo users, teams, projects, and tasks.

### 2. Frontend

In a separate terminal, from the project root:

```bash
npm install
npm run dev
```

Open: http://localhost:5173

The dev server proxies `/api` requests to the backend, so make sure the backend is running first.

## Demo accounts

All demo accounts use the password `password123`.

| Role | Email |
| --- | --- |
| Student | shakib@gmail.com |
| Team Lead | shaif@gmail.com |
| Teacher | tasmia@gmail.com |

You can also sign up as a new user from the Signup page.

## Build for production

```bash
npm run build
# output is in the `dist/` folder
```

## Resetting the database

To start over with fresh seed data, stop the backend and delete the database files, then restart:

```bash
cd backend
rm -f data.sqlite data.sqlite-journal data.sqlite-shm data.sqlite-wal
npm start
```

## Troubleshooting

- **Frontend can't reach the API / network errors**: make sure the backend is running on port 4001 before starting the frontend.
- **Dev server fails to start**: run `rm -rf node_modules package-lock.json` and reinstall.
- **Port already in use**: the backend listens on port 4001 by default — set `PORT=<number>` to use a different port (and update the proxy target in `vite.config.ts` to match).
