# Online Examination and Assessment Management System

## 1. Cover Page
**Project Title:** Online Examination and Assessment Management System  
**Subject:** Backend Development  
**Technology Stack:** Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.IO  
**Submitted by:** [Enter team member names and roll numbers]  
**Submitted to:** [Enter faculty name]  
**Institution:** [Enter university/college name]

## 2. Abstract
The Online Examination and Assessment Management System is a backend application designed to support the creation, scheduling, delivery and evaluation of objective-type examinations. It provides separate access for administrators, faculty members and students. Faculty can maintain a question bank, prepare examinations and publish results. Students can attempt assigned examinations within a server-enforced time window and view marks after results are released. The backend uses Node.js and Express.js for REST APIs, MongoDB and Mongoose for data persistence, bcrypt for password hashing, JWT for authentication and Socket.IO for real-time updates.

## 3. Problem Statement
Manual examination workflows require considerable effort to distribute questions, collect responses, evaluate objective answers and prepare performance summaries. The project addresses these tasks through a centralized backend with role-specific permissions, scheduled examinations, automatic objective evaluation and analytics.

## 4. Objectives
- Develop RESTful APIs for examination workflows.
- Implement secure authentication and role-based authorization.
- Maintain reusable MCQ question records.
- Schedule examinations and restrict access by assignment and time.
- Evaluate objective answers on the server.
- Generate examination performance reports using MongoDB aggregation.
- Provide real-time examination and result notifications.

## 5. Scope and Limitations
The implementation supports administrator, faculty and student roles; MCQ questions; scheduled examinations; one attempt per student per examination; automatic evaluation; result release; analytics; and real-time events. Descriptive-answer evaluation, proctoring, file uploads, payment processing and a production frontend are outside the current scope. Socket.IO demonstrates authenticated real-time server events; a separate frontend client is required to display them visually.

## 6. Functional and Non-Functional Requirements
**Functional:** registration/login, user management, question CRUD, exam CRUD, publishing, assignment, attempt start, answer submission, automatic marking, result release and reporting.  
**Non-functional:** security, maintainability, input validation, reliable persistence, clear error responses, pagination and reasonable API rate limits.

## 7. System Architecture and Modules
The application follows a layered MVC architecture. Routes map HTTP endpoints to controllers. Authentication/authorization middleware validates access tokens and roles. Controllers execute business rules and use Mongoose models to interact with MongoDB. Socket.IO handles authenticated real-time connections. EventEmitter decouples internal events from the request handlers.

**Request flow:** Client → Express Route → Middleware → Controller → Mongoose Model → MongoDB → JSON Response.

## 8. Database Design
- **User:** name, email, password hash, role, active status and refresh-token hash.
- **Question:** creator, question text, options, correct option index, subject, topic, difficulty and marks.
- **Exam:** title, instructions, creator, question references, assigned student references, duration, start/end times, status and result-release flag.
- **Attempt:** exam, student, selected answers, score, total marks, start/submission times and status.

**Relationships:** One faculty user can create many questions and exams. An exam references many questions and can be assigned to many students. Each student can have one attempt per exam. Attempts reference the exam and student.

**Indexes:** unique User email; Question creator/subject; Exam status/start/end; Attempt exam/student compound unique index. The compound index prevents duplicate attempts for the same student and exam.

## 9. REST API Documentation
The API base path is `/api`. Main route groups are `/auth`, `/users`, `/questions`, `/exams` and `/reports`. Detailed endpoint methods, sample JSON payloads, Socket.IO events and response status codes are provided in `docs/API_DOCUMENTATION.md`.

## 10. Authentication and Authorization
Passwords are hashed using bcrypt before storage. Login issues a short-lived JWT access token and a refresh token. Protected routes verify the access token. Role middleware restricts operations to admin, faculty or student users. Refresh tokens are stored as bcrypt hashes and rotated on refresh. Student registration always creates a student role; privileged roles are created through the administrator endpoint. Student APIs omit correct-answer fields.

## 11. Implementation Details
Node.js provides the runtime and Express.js exposes REST endpoints. Mongoose schemas define validation and relationships. The exam attempt workflow verifies assignment and schedule, creates a unique attempt, returns safe question data and enforces the deadline during submission. The server compares selected option indexes against stored correct option indexes to calculate marks. Result APIs suppress marks until faculty releases them.

Two aggregation approaches are implemented: grouping attempt records to calculate exam averages/highest/lowest scores, and grouping results by score percentage bands using `$bucket`. Indexes support unique identity, common filters and duplicate-attempt prevention.

EventEmitter emits `exam:published` and `exam:submitted` internal events. Socket.IO authenticates connections using JWT and emits exam publication, submission and result-release events.

## 12. Testing Strategy and Test Cases
The Postman collection is in `postman/Online_Exam_System.postman_collection.json`. Test cases include successful requests, missing fields, duplicate email, invalid credentials, missing tokens, insufficient roles, invalid IDs, out-of-window exams, duplicate attempts, duplicate submissions and unreleased results. Full expected outcomes are listed in `docs/TEST_CASES.md`.

## 13. Screenshots / Demonstration Evidence
Insert screenshots after running the application:
1. MongoDB database and collections.
2. Server running and health endpoint response.
3. Faculty login and question creation in Postman.
4. Exam creation and publication.
5. Student exam start and safe question response.
6. Exam submission and calculated result.
7. Faculty analytics and result release.
8. Socket.IO event output.

## 14. Conclusion and Future Enhancements
The project demonstrates a backend-driven examination workflow with secure role-based access, persistent data, server-side evaluation and reporting. Future enhancements may include descriptive questions, negative marking, randomized question sets per student, retakes, proctoring integration, audit logs, downloadable reports and a responsive frontend.

## 15. References
- Node.js documentation: https://nodejs.org/docs/
- Express.js documentation: https://expressjs.com/
- MongoDB documentation: https://www.mongodb.com/docs/
- Mongoose documentation: https://mongoosejs.com/docs/
- Socket.IO documentation: https://socket.io/docs/v4/
- JSON Web Token introduction: https://jwt.io/introduction
