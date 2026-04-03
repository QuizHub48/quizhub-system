# QuizHub - Online Quiz System

Group 07 | KDU | BSc IT Intake 41 | IT3052 Programming Frameworks

## Tech Stack
- Frontend: React
- Backend: Node.js + Express.js
- Database: MongoDB
- Auth: JWT

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed and running (or use MongoDB Atlas)

### 1. Backend Setup
```bash
cd backend
npm install
# Edit .env if needed (MONGO_URI, JWT_SECRET)
npm run dev
```
Backend runs on: http://localhost:5000

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend runs on: http://localhost:3000

## Default Roles
- Register as **Student** or **Lecturer**
- Create an **Admin** user by manually setting role in MongoDB, or register then update via admin panel

## API Endpoints
| Method | Route | Role |
|--------|-------|------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/quizzes | Student/Lecturer |
| POST | /api/quizzes | Lecturer |
| POST | /api/quizzes/:id/submit | Student |
| GET | /api/results/my | Student |
| GET | /api/results/leaderboard/:quizId | All |
| GET | /api/admin/stats | Admin |

## Design Patterns Used
1. **Singleton** - DatabaseConnection (config/db.js)
2. **Factory** - QuestionFactory (patterns/factory)
3. **Observer** - NotificationService (patterns/observer)
4. **Strategy** - ScoringContext (patterns/strategy)
