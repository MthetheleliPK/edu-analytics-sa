const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Config {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.loadEnvironment();
    this.setupJWT();
  }

  loadEnvironment() {
    // Load .env file if exists
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      require('dotenv').config();
    }
  }

  setupJWT() {
    if (process.env.JWT_SECRET) {
      this.jwtSecret = process.env.JWT_SECRET;
      return;
    }

    if (this.env === 'production') {
      throw new Error('❌ JWT_SECRET must be set in production environment');
    }

    // Development/Staging: Generate or load from file
    this.jwtSecret = this.getOrCreateDevSecret();
  }

  getOrCreateDevSecret() {
    const secretPath = path.join(process.cwd(), '.jwt-secret');
    
    try {
      if (fs.existsSync(secretPath)) {
        return fs.readFileSync(secretPath, 'utf8').trim();
      }
      
      const newSecret = crypto.randomBytes(64).toString('hex');
      fs.writeFileSync(secretPath, newSecret);
      console.log('🔑 Auto-generated JWT secret for development');
      return newSecret;
    } catch (error) {
      console.warn('⚠️  Could not persist JWT secret, using in-memory one');
      return crypto.randomBytes(64).toString('hex');
    }
  }

  get jwt() {
    return {
      secret: this.jwtSecret,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: process.env.JWT_ISSUER || 'edu-analytics-sa'
    };
  }

  get database() {
    return {
      uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edu-analytics'
    };
  }

  get server() {
    return {
      port: process.env.PORT || 5000,
      env: this.env
    };
  }
}

module.exports = new Config();