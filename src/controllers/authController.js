// Authentication Controller - Registration, Login, JWT Token Issuance
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const VALID_ROLES = ['trader', 'inspector', 'admin'];

/**
 * Register a new user with hashed password
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, entity, role, email, password, phone, license_no } = req.body;

    if (!name || !entity || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, entity, email, and password are required.'
      });
    }

    const assignedRole = (role || 'trader').toLowerCase();
    if (!VALID_ROLES.includes(assignedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role '${role}'. Valid roles are: ${VALID_ROLES.join(', ')}`
      });
    }

    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // Hash password using bcrypt
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const userId = `usr_${Date.now()}`;
    const insertQuery = `
      INSERT INTO users (id, name, entity, role, email, password_hash, phone, license_no)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, entity, role, email, phone, license_no, created_at
    `;

    const result = await db.query(insertQuery, [
      userId,
      name.trim(),
      entity.trim(),
      assignedRole,
      email.toLowerCase().trim(),
      password_hash,
      phone || null,
      license_no || null
    ]);

    const newUser = result.rows[0];

    // Generate JWT Token
    const secret = process.env.JWT_SECRET || 'measurex_legal_metrology_jwt_secret_key_2026_secure';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jwt.sign(
      {
        id: newUser.id,
        role: newUser.role,
        email: newUser.email,
        name: newUser.name,
        entity: newUser.entity
      },
      secret,
      { expiresIn }
    );

    res.status(201).json({
      success: true,
      message: `User '${newUser.name}' registered successfully as ${newUser.role.toUpperCase()}.`,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        entity: newUser.entity,
        role: newUser.role,
        email: newUser.email,
        phone: newUser.phone,
        license_no: newUser.license_no
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Authenticate user and issue JWT token
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find user by email
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = result.rows[0];

    // Verify password against bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT Token
    const secret = process.env.JWT_SECRET || 'measurex_legal_metrology_jwt_secret_key_2026_secure';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        entity: user.entity
      },
      secret,
      { expiresIn }
    );

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        entity: user.entity,
        role: user.role,
        email: user.email,
        phone: user.phone,
        license_no: user.license_no
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user details
 * GET /api/auth/me
 */
async function getProfile(req, res, next) {
  try {
    const result = await db.query(
      'SELECT id, name, entity, role, email, phone, license_no, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all registered users
 * GET /api/auth/users
 */
async function getUsers(req, res, next) {
  try {
    const result = await db.query(
      'SELECT id, name, entity, role, email, phone, license_no, created_at FROM users ORDER BY created_at ASC'
    );
    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getProfile,
  getUsers
};
