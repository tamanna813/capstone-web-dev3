# Online Examination & Assessment System

This ZIP has one clean project root with two sibling applications: `backend/` (Node.js + Express + MongoDB) and `frontend/` (React + Vite). There is no duplicate/default Vite frontend folder.

## Folder structure

```text
Online_Examination_Assessment_System/
├── backend/
│   ├── src/
│   ├── scripts/
│   ├── docs/
│   ├── postman/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── PROJECT_REPORT.md
└── .gitignore
```

## Requirements
- Node.js 18 or newer and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## 1. Start the backend (Terminal 1)
Open the extracted `Online_Examination_Assessment_System` folder in VS Code, then run:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` if needed. Set your MongoDB connection string and replace both JWT secrets. Ensure MongoDB is running, then optionally seed the demo accounts and sample questions:

```powershell
npm run seed
npm run dev
```

Backend health check: http://localhost:5000/api/health

## 2. Start the frontend (Terminal 2)
Open a second VS Code terminal from the project root:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open **http://localhost:5174/**. Keep both terminals running. If port 5174 is occupied, stop the other Vite process instead of starting another copy on 5175.

## Demo accounts
After running `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | Admin@12345 |
| Faculty | faculty@example.com | Faculty@12345 |
| Student | student@example.com | Student@12345 |

These are local demo credentials. Change them and the JWT secrets before any public deployment.

## Features
- Student registration and role-based admin/faculty/student workspaces
- Question bank and exam creation/publishing
- Assigned-student exam access and timed attempts
- Server-side answer evaluation and results release
- Reports and performance analytics
- JWT authentication, MongoDB persistence, and Socket.IO events

Detailed API notes and test cases are in `backend/docs/`. The Postman collection is in `backend/postman/`.
