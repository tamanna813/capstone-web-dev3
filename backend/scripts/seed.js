require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Question = require('../src/models/Question');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({ email: { $in: ['admin@example.com', 'faculty@example.com', 'student@example.com'] } });
  const [admin, faculty, student] = await User.create([
    { name: 'System Admin', email: 'admin@example.com', password: 'Admin@12345', role: 'admin' },
    { name: 'Demo Faculty', email: 'faculty@example.com', password: 'Faculty@12345', role: 'faculty' },
    { name: 'Demo Student', email: 'student@example.com', password: 'Student@12345', role: 'student' }
  ]);
  await Question.deleteMany({ createdBy: faculty._id });
  await Question.create([
    { createdBy: faculty._id, text: 'Which language runs natively in a web browser?', options: ['Python', 'JavaScript', 'C++', 'Java'], correctOption: 1, subject: 'Web Development', topic: 'JavaScript', difficulty: 'easy', marks: 2 },
    { createdBy: faculty._id, text: 'Which HTTP method is commonly used to retrieve data?', options: ['POST', 'PUT', 'GET', 'DELETE'], correctOption: 2, subject: 'Backend Development', topic: 'REST API', difficulty: 'easy', marks: 2 },
    { createdBy: faculty._id, text: 'MongoDB primarily stores records as which format?', options: ['Rows', 'BSON documents', 'CSV files', 'XML pages'], correctOption: 1, subject: 'Database', topic: 'MongoDB', difficulty: 'medium', marks: 3 }
  ]);
  console.log('Seed complete. Demo accounts:');
  console.log('Admin: admin@example.com / Admin@12345');
  console.log('Faculty: faculty@example.com / Faculty@12345');
  console.log('Student: student@example.com / Student@12345');
  await mongoose.disconnect();
}
seed().catch(err => { console.error(err); process.exit(1); });
