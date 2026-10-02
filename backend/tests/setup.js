import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import Administrator from '../models/Administrator.js';

let mongod = null;
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-12345678901234567890';
process.env.JWT_SECRET = JWT_SECRET;
process.env.NODE_ENV = 'test';

export async function setupTestDB() {
  if (!mongod) {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri);
  }
}

export async function teardownTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

export async function clearTestDB() {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

export function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

export async function createTestUser({
  name = 'Test User',
  email = 'test@example.com',
  password = 'Password@123',
  role = 'student',
  isActive = true,
  profile = {},
}) {
  const passwordHash = await bcrypt.hash(password, 8);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    isActive,
    settings: { profileVisible: true, notifications: true },
  });

  if (role === 'student') {
    await Student.create({
      userId: user._id,
      college: profile.college || 'BCA College',
      course: profile.course || 'BCA',
      year: profile.year || '3rd Year',
      skills: profile.skills || ['JavaScript', 'React'],
      interests: profile.interests || ['Web Development'],
      goals: profile.goals || ['Career guidance'],
      languages: profile.languages || ['English'],
      availability: profile.availability || ['Monday 17:00-20:00'],
      profileComplete: profile.profileComplete !== undefined ? profile.profileComplete : true,
    });
  } else if (role === 'mentor') {
    await Mentor.create({
      userId: user._id,
      company: profile.company || 'TechCorp',
      jobTitle: profile.jobTitle || 'Senior Engineer',
      domain: profile.domain || 'Web Development',
      skills: profile.skills || ['JavaScript', 'React', 'Node.js'],
      interests: profile.interests || ['Web Development'],
      goals: profile.goals || ['Career guidance'],
      languages: profile.languages || ['English'],
      availability: profile.availability || ['Monday 17:00-20:00'],
      capacity: profile.capacity !== undefined ? profile.capacity : 2,
      currentMentees: profile.currentMentees || 0,
      profileComplete: profile.profileComplete !== undefined ? profile.profileComplete : true,
    });
  } else if (role === 'admin') {
    await Administrator.create({
      userId: user._id,
      title: profile.title || 'Dean',
      department: profile.department || 'Computer Science',
      adminType: 'admin',
    });
  }

  const token = generateToken(user);
  return { user, token };
}
