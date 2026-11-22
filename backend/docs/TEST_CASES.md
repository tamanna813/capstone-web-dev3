# API Test Cases

| ID | Scenario | Request / Setup | Expected result |
|---|---|---|---|
| TC01 | Health check | GET `/api/health` | 200, API running |
| TC02 | Student registration | POST `/api/auth/register` with valid fields | 201, role is student |
| TC03 | Missing registration field | POST register without email | 400 |
| TC04 | Duplicate email | Register same email twice | 409 |
| TC05 | Valid login | POST login with seeded faculty credentials | 200, tokens returned |
| TC06 | Wrong password | POST login with incorrect password | 401 |
| TC07 | Protected route without token | GET `/api/auth/me` | 401 |
| TC08 | Role restriction | Student calls POST `/api/questions` | 403 |
| TC09 | Create question | Faculty creates valid MCQ | 201 |
| TC10 | Invalid correct option | correctOption outside options array | 400 validation error |
| TC11 | Create draft exam | Faculty sends valid question and student IDs | 201, status draft |
| TC12 | Publish without assigned students | Publish draft with empty assignedStudents | 400 |
| TC13 | Unassigned student access | Student requests an exam not assigned to them | 403 |
| TC14 | Exam outside schedule | Student starts before startTime or after endTime | 403 |
| TC15 | Valid attempt | Assigned student starts during exam window | 201, no answer key in response |
| TC16 | Duplicate attempt | Same student starts same exam again | 409 |
| TC17 | Valid submission | Submit valid question IDs and selected options | 200, server-calculated score |
| TC18 | Submit twice | Submit same attempt again | 409 |
| TC19 | Hidden results | Student checks result before release | score not returned |
| TC20 | Released results | Faculty releases; student checks result | score and percentage returned |
| TC21 | Analytics | Faculty requests exam analytics | 200, aggregate statistics |
| TC22 | Invalid ID | Request `/api/exams/not-an-id` | 400 |

## Suggested Postman test sequence
1. Login as faculty; copy `accessToken` to `facultyToken`.
2. Login as student; copy token to `studentToken`.
3. Create question(s), record each `_id`.
4. Create exam with a startTime in the past and endTime in the future for a quick local test. Record exam `_id`.
5. Publish exam.
6. Start attempt as student; record `attemptId`.
7. Submit answers; test duplicate submission.
8. Release results as faculty and request results as student.
9. Call analytics and report endpoints as faculty.

For a clean demonstration, use a fresh exam for each full attempt test because each student can attempt an exam only once.
