require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Course = require('./models/Course');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Clear existing data
    await User.deleteMany();
    await Course.deleteMany();
    console.log('Cleared existing users & courses');

    // Create users
    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@quizhub.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin'
      },
      {
        name: 'Dr. Lecturer',
        email: 'lecturer@quizhub.com',
        password: await bcrypt.hash('lecturer123', 10),
        role: 'lecturer',
        department: 'Information Technology'
      },
      {
        name: 'Student User',
        email: 'student@quizhub.com',
        password: await bcrypt.hash('student123', 10),
        role: 'student',
        studentId: 'D/BIT/24/0001',
        department: 'Information Technology'
      }
    ]);

    // Create a sample course
    await Course.create({
      name: 'Programming Frameworks',
      code: 'IT3052',
      description: 'Advanced programming frameworks and design patterns',
      lecturer: users[1]._id,
      department: 'Information Technology',
      students: [users[2]._id]  // Enroll the student
    });

    console.log('\n✅ Seed data created successfully!\n');
    console.log('=== Login Credentials ===');
    console.log('👑 Admin    → admin@quizhub.com    / admin123');
    console.log('👨‍🏫 Lecturer → lecturer@quizhub.com / lecturer123');
    console.log('🎓 Student  → student@quizhub.com  / student123');
    console.log('=========================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeder error:', err.message);
    process.exit(1);
  }
};

seedData();
