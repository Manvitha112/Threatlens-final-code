const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const JWT_EXPIRY = '7d';

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} { token, user: { id, email } }
 */
const registerUser = async (email, password) => {
  try {
    // Validation
    if (!email || !password) {
      throw {
        status: 400,
        message: 'Email and password are required'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw {
        status: 400,
        message: 'Invalid email format'
      };
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      throw {
        status: 400,
        message: 'Password must be at least 6 characters long'
      };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw {
        status: 409,
        message: 'User with this email already exists'
      };
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      }
    });

    // Sign JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} { token, user: { id, email } }
 */
const loginUser = async (email, password) => {
  try {
    // Validation
    if (!email || !password) {
      throw {
        status: 400,
        message: 'Email and password are required'
      };
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // User not found
    if (!user) {
      throw {
        status: 401,
        message: 'Invalid email or password'
      };
    }

    // Compare password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Invalid password
    if (!isPasswordValid) {
      throw {
        status: 401,
        message: 'Invalid email or password'
      };
    }

    // Sign JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email
      }
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser
};
