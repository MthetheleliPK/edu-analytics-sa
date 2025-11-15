const mongoose = require('mongoose');
const School = require('../models/School');
const User = require('../models/User');
const Class = require('../models/Class');
const Student = require('../models/Student');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Clear existing data
    await School.deleteMany({});
    await User.deleteMany({});
    await Class.deleteMany({});
    await Student.deleteMany({});

    // Create sample school
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
      }
    });
    await school.save();

    // Create admin user
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@springfieldhigh.edu.za',
      password: 'password123',
      role: 'admin',
      schoolId: school._id
    });
    await admin.save();

    // Create sample classes
    const grades = ['8', '9', '10', '11', '12'];
    const classes = [];
    
    for (const grade of grades) {
      for (let i = 1; i <= 3; i++) {
        const className = `${grade}${String.fromCharCode(64 + i)}`; // 8A, 8B, etc.
        const newClass = new Class({
          name: className,
          grade: grade,
          schoolId: school._id,
          subjects: ['Mathematics', 'English', 'Physical Science'].map(subject => ({
            subject,
            teacherId: admin._id
          }))
        });
        classes.push(await newClass.save());
      }
    }

    // Create sample students
    const students = [];
    for (const classObj of classes) {
      for (let i = 1; i <= 10; i++) {
        const student = new Student({
          studentNumber: `S${classObj.grade}${classObj.name}${i.toString().padStart(3, '0')}`,
          firstName: `Student${i}`,
          lastName: `Grade${classObj.grade}`,
          dateOfBirth: new Date(2000 + parseInt(classObj.grade), 0, 1),
          gender: i % 2 === 0 ? 'Male' : 'Female',
          grade: classObj.grade,
          class: classObj._id,
          schoolId: school._id,
          contact: {
            parentName: `Parent${i} Grade${classObj.grade}`,
            parentPhone: `+2783${i.toString().padStart(7, '0')}`,
            parentEmail: `parent${i}@gmail.com`
          }
        });
        students.push(await student.save());
      }
    }

    console.log('Seed data created successfully!');
    console.log(`Created:
      - 1 School
      - 1 Admin User
      - ${classes.length} Classes
      - ${students.length} Students
    `);
    
    console.log('Admin login: admin@springfieldhigh.edu.za / password123');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
  }
};

seedData();