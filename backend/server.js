require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();

const cors = require("cors");

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://rainbow-buttercream-c7218c.netlify.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// Connect DB (Singleton)
db.connect();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quizzes', require('./routes/quiz'));
app.use('/api/results', require('./routes/result'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/modules', require('./routes/module'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/faculties', require('./routes/faculties'));

app.get('/', (req, res) => res.json({ message: 'QuizHub API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
