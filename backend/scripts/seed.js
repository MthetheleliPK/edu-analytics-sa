const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const School = require('../models/School');
const User = require('../models/User');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Assessment = require('../models/Assessment');
const AssessmentResult = require('../models/AssessmentResult');

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edu-analytics');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await School.deleteMany({});
    await User.deleteMany({});
    await Class.deleteMany({});
    await Student.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentResult.deleteMany({});

    // Create sample school
    console.log('🏫 Creating sample school...');
    const school = new School({
      name: 'Springfield High School',
      emisNumber: '12345678',
      province: 'Gauteng',
      district: 'Johannesburg Central',
      address: {
        street: '123 Education Street',
        city: 'Johannesburg',
        postalCode: '2000'
      },
      contact: {
        phone: '+27111234567',
        email: 'admin@springfieldhigh.edu.za',
        principalName: 'Dr. Sarah Johnson'
      },
      subscription: {
        plan: 'trial',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        studentsLimit: 500
      },
      settings: {
        academicYear: 2024,
        terms: {
          term1: { start: new Date('2024-01-15'), end: new Date('2024-03-22') },
          term2: { start: new Date('2024-04-09'), end: new Date('2024-06-14') },
          term3: { start: new Date('2024-07-09'), end: new Date('2024-09-13') },
          term4: { start: new Date('2024-10-01'), end: new Date('2024-12-06') }
        }
      }
    });
    await school.save();

    // Create admin user - USE PLAIN TEXT PASSWORD (let User model hash it)
    console.log('👨‍💼 Creating admin user...');
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@springfieldhigh.edu.za',
      password: 'password123', // Plain text - will be hashed by User model's pre-save hook
      role: 'admin',
      schoolId: school._id
    });
    await admin.save();

    // Create teacher users - USE PLAIN TEXT PASSWORDS
    console.log('👩‍🏫 Creating teachers...');
    const teachers = [
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@springfieldhigh.edu.za', subjects: ['Mathematics', 'Physical Science'] },
      { firstName: 'Mary', lastName: 'Johnson', email: 'mary.johnson@springfieldhigh.edu.za', subjects: ['English', 'History'] },
      { firstName: 'David', lastName: 'Brown', email: 'david.brown@springfieldhigh.edu.za', subjects: ['Accounting', 'Business Studies'] },
      { firstName: 'Sarah', lastName: 'Wilson', email: 'sarah.wilson@springfieldhigh.edu.za', subjects: ['Life Sciences', 'Geography'] }
    ];

    const createdTeachers = [];
    for (const teacherData of teachers) {
      const teacher = new User({
        ...teacherData,
        password: 'teacher123', // Plain text - will be hashed by User model's pre-save hook
        role: 'teacher',
        schoolId: school._id
      });
      await teacher.save();
      createdTeachers.push(teacher);
    }

    // Create classes
    console.log('🏫 Creating classes...');
    const grades = ['8', '9', '10', '11', '12'];
    const classes = [];
    const subjects = ['Mathematics', 'English', 'Physical Science', 'Life Sciences', 'Geography', 'History', 'Accounting', 'Business Studies', 'Life Orientation'];

    for (const grade of grades) {
      for (let i = 1; i <= 3; i++) {
        const className = `${grade}${String.fromCharCode(64 + i)}`; // 8A, 8B, 8C, etc.
        
        const classObj = new Class({
          name: className,
          grade: grade,
          schoolId: school._id,
          teacherId: createdTeachers[i % createdTeachers.length]._id,
          subjects: subjects.map(subject => ({
            subject: subject,
            teacherId: createdTeachers[Math.floor(Math.random() * createdTeachers.length)]._id
          }))
        });
        await classObj.save();
        classes.push(classObj);
      }
    }

    // Create students
    console.log('👨‍🎓 Creating students...');
    const students = [];
    const firstNames = ['Liam', 'Noah', 'Oliver', 'Elijah', 'William', 'James', 'Benjamin', 'Lucas', 'Henry', 'Alexander', 'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia', 'Harper', 'Evelyn'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

    for (const classObj of classes) {
      for (let i = 1; i <= 15; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        const student = new Student({
          studentNumber: `S${classObj.grade}${classObj.name}${i.toString().padStart(3, '0')}`,
          firstName: firstName,
          lastName: lastName,
          dateOfBirth: new Date(2000 + parseInt(classObj.grade), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          grade: classObj.grade,
          class: classObj._id,
          schoolId: school._id,
          contact: {
            parentName: `Mr. & Mrs. ${lastName}`,
            parentPhone: `+2783${Math.random().toString().slice(2, 9)}`,
            parentEmail: `parent.${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`
          }
        });
        await student.save();
        students.push(student);
      }
    }

    // Create assessments and results
    console.log('📝 Creating assessments and marks...');
    const terms = [1, 2, 3, 4];
    const assessmentTypes = ['Test', 'Assignment', 'Project', 'Practical'];

    for (const classObj of classes) {
      for (const term of terms) {
        for (const subject of classObj.subjects.slice(0, 5)) { // First 5 subjects
          for (let i = 1; i <= 3; i++) {
            const assessment = new Assessment({
              title: `${subject.subject} Term ${term} Assessment ${i}`,
              subject: subject.subject,
              assessmentType: assessmentTypes[Math.floor(Math.random() * assessmentTypes.length)],
              term: term,
              maxMarks: [50, 100, 75, 60][Math.floor(Math.random() * 4)],
              date: new Date(2024, (term - 1) * 3 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 28) + 1),
              schoolId: school._id,
              classId: classObj._id,
              teacherId: subject.teacherId,
              createdBy: admin._id
            });
            await assessment.save();

            // Create assessment results for each student in the class
            const classStudents = students.filter(s => s.class.toString() === classObj._id.toString());
            const assessmentResults = [];

            for (const student of classStudents) {
              const marks = Math.floor(Math.random() * assessment.maxMarks * 0.8) + assessment.maxMarks * 0.2; // 20-100% of max marks
              const percentage = (marks / assessment.maxMarks * 100);

              assessmentResults.push({
                assessmentId: assessment._id,
                studentId: student._id,
                marks: marks,
                percentage: percentage,
                grade: percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : percentage >= 40 ? 'E' : 'F',
                schoolId: school._id,
                enteredBy: admin._id
              });
            }

            await AssessmentResult.insertMany(assessmentResults);
          }
        }
      }
    }

    // VERIFY THE ADMIN USER CAN LOGIN
    console.log('\n🔍 Verifying admin credentials...');
    const verifyAdmin = await User.findOne({ email: 'admin@springfieldhigh.edu.za' });
    if (verifyAdmin) {
      const passwordMatch = await bcrypt.compare('password123', verifyAdmin.password);
      console.log(`✅ Admin password verification: ${passwordMatch ? 'SUCCESS' : 'FAILED'}`);
      
      if (!passwordMatch) {
        console.log('❌ Password mismatch detected!');
      }
    }

    console.log('\n🎉 Seed data created successfully!');
    console.log(`📊 Created:
  - 1 School: ${school.name}
  - 1 Admin User
  - ${createdTeachers.length} Teachers
  - ${classes.length} Classes (${grades.join(', ')})
  - ${students.length} Students
  - Multiple assessments with marks for all students
    `);

    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@springfieldhigh.edu.za / password123');
    console.log('   Teachers: [email] / teacher123');
    
    console.log('\n🌐 Test the system:');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Health Check: http://localhost:5000/api/health');
    console.log('   Test DB: http://localhost:5000/api/test-db');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📋 Database connection closed');
  }
};

seedData();