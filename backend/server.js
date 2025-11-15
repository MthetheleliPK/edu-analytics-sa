const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
require('dotenv').config();

const app = express();

// Use config throughout your app
mongoose.connect(config.database.uri);

// Middleware
app.use(cors());
app.use(express.json());

// Database connection with better error handling
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edu-analytics', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('💡 Tips:');
    console.log('   - Make sure MongoDB is running: net start MongoDB');
    console.log('   - Check your connection string in .env file');
    console.log('   - Try: mongodb://127.0.0.1:27017/edu-analytics');
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Database connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
  console.log('🗄️  Database ready for operations');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

// Basic routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/schools', require('./routes/schools'));

// Enhanced health check
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusText = {
    0: 'disconnected',
    1: 'connected', 
    2: 'connecting',
    3: 'disconnecting'
  }[dbStatus];
  
  try {
    // Test database operation
    const adminDb = mongoose.connection.db.admin();
    const serverStatus = await adminDb.ping();
    
    res.json({ 
      status: 'OK', 
      message: 'EduAnalytics SA API is running',
      database: {
        status: statusText,
        readyState: dbStatus,
        ping: serverStatus.ok === 1 ? 'success' : 'failed',
        name: mongoose.connection.name,
        host: mongoose.connection.host
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'API is running but database has issues',
      database: {
        status: statusText,
        readyState: dbStatus,
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Test database operations
app.get('/api/test-db', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // List all databases (from admin)
    const adminDb = mongoose.connection.db.admin();
    const databaseList = await adminDb.listDatabases();
    
    // List collections in current database
    const collections = await db.listCollections().toArray();
    
    res.json({
      status: 'success',
      message: 'Database operations working correctly',
      database: {
        name: db.databaseName,
        collections: collections.map(c => c.name),
        totalDatabases: databaseList.databases.length,
        totalSize: databaseList.totalSize
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database operations failed',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Test DB: http://localhost:${PORT}/api/test-db`);
  console.log(`⏰ Server started at: ${new Date().toLocaleString()}`);
});

// Debug routes for testing authentication
app.get('/api/debug/users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find({}).populate('schoolId', 'name emisNumber');
    
    res.json({
      totalUsers: users.length,
      users: users.map(u => ({
        id: u._id,
        email: u.email,
        role: u.role,
        school: u.schoolId?.name,
        isActive: u.isActive,
        hasPassword: !!u.password,
        passwordLength: u.password?.length
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/debug/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const User = require('./models/User');

    console.log('Testing login for:', email);

    const user = await User.findOne({ email: email.toLowerCase() }).populate('schoolId', 'name');
    
    if (!user) {
      return res.json({ 
        success: false, 
        error: 'User not found',
        userExists: false 
      });
    }

    const passwordMatch = await user.comparePassword(password);

    res.json({
      success: true,
      userExists: true,
      email: user.email,
      role: user.role,
      school: user.schoolId?.name,
      isActive: user.isActive,
      passwordMatch: passwordMatch,
      canLogin: passwordMatch && user.isActive
    });
  } catch (error) {
    res.json({ 
      success: false,
      error: error.message 
    });
  }
});