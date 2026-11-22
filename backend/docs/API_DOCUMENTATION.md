# API Documentation

Base URL: `http://localhost:5000/api`. Send `Authorization: Bearer <accessToken>` on protected endpoints. All bodies are JSON.

## Authentication
### POST `/auth/register`
```json
{ "name": "A Student", "email": "student2@example.com", "password": "Student@123" }
```
Creates a student account. Public role escalation is intentionally blocked.

### POST `/auth/login`
```json
{ "email": "faculty@example.com", "password": "Faculty@12345" }
```
Returns `accessToken`, `refreshToken` and user profile.

### POST `/auth/refresh`
```json
{ "refreshToken": "<refresh-token>" }
```
Rotates the refresh token and returns a new token pair.

### POST `/auth/logout` and GET `/auth/me`
Logout requires access token and invalidates the stored refresh token. `/me` returns the current user's public profile.

## Users (admin only)
- `GET /users?page=1&limit=10&role=student`
- `POST /users` body: `{ "name":"Faculty One", "email":"faculty2@example.com", "password":"Faculty@123", "role":"faculty" }`
- `PATCH /users/:id` body may contain `name`, `role`, `isActive`.
- `DELETE /users/:id`

## Question bank (faculty/admin)
### POST `/questions`
```json
{
  "text": "What does API stand for?",
  "options": ["Application Programming Interface", "Applied Program Internet", "Automatic Process Input", "Application Page Index"],
  "correctOption": 0,
  "subject": "Backend Development",
  "topic": "REST",
  "difficulty": "easy",
  "marks": 2
}
```
`correctOption` is a zero-based option index. Other endpoints: `GET /questions?subject=Backend%20Development&difficulty=easy&page=1&limit=10`, `PATCH /questions/:id`, `DELETE /questions/:id`.

## Examinations
### POST `/exams` (faculty/admin)
```json
{
  "title": "Backend Fundamentals Test",
  "instructions": "Choose one correct option for each question.",
  "questions": ["<questionObjectId>"],
  "assignedStudents": ["<studentObjectId>"],
  "durationMinutes": 30,
  "startTime": "2026-11-14T10:00:00.000Z",
  "endTime": "2026-11-14T11:00:00.000Z",
  "shuffleQuestions": true
}
```
Exam is created as draft. Use `POST /exams/:id/publish` to publish. Only assigned students can list/start it. `GET /exams/:id` returns question text/options to an eligible student but never correct answers.

### Student attempt
1. `GET /exams` lists assigned published exams.
2. `POST /exams/:id/start` starts a single attempt and returns `attemptId`, deadline and safe questions.
3. `POST /exams/attempts/:attemptId/submit` body:
```json
{ "answers": [ { "question": "<questionObjectId>", "selectedOption": 0 } ] }
```
The server calculates marks; any client-supplied score is ignored. Submissions after the deadline are marked expired. A unique `(exam, student)` index prevents a second attempt.

### Results and analytics
- `POST /exams/:id/release-results` (faculty/admin)
- `GET /exams/results/me` (student; marks appear only after release)
- `GET /exams/:id/analytics` (exam owner/admin)
- `GET /reports/performance` (faculty/admin): average, highest and lowest score grouped by exam.
- `GET /reports/exam/:id/score-distribution` (faculty/admin): score bands using `$bucket`.

## HTTP status conventions
- `200`: successful read/update/action
- `201`: resource created
- `400`: invalid input or business rule
- `401`: missing/invalid/expired authentication
- `403`: authenticated but not permitted / exam unavailable
- `404`: resource not found
- `409`: duplicate attempt or unique conflict
- `500`: unexpected server error

## Socket.IO
Connect to `http://localhost:5000` with:
```js
const socket = io('http://localhost:5000', { auth: { token: accessToken } });
```
The access token is verified during the socket handshake. Events emitted by the server:
- `connection:ready` — `{ userId, role }`
- `exam:published` — `{ examId, title }`
- `attempt:submitted` — `{ attemptId, examId, studentId }` to the owning faculty room
- `results:released` — `{ examId, title }`

## EventEmitter
`src/utils/appEvents.js` listens for `exam:published` and `exam:submitted` internal application events. It is used for decoupled server-side event logging and can be extended for audit logs/email notifications.
