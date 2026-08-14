const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');

const router = express.Router();

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/login
// Auth is cookie-only: the JWT is set as an httpOnly cookie and is never
// included in the JSON response body, so it's never reachable from page JS
// (no localStorage, no in-memory variable an XSS payload could read).
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const token = signToken(admin._id);

    res.cookie('aoc_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  })
);

// POST /api/auth/logout — clears the auth cookie
router.post('/logout', (req, res) => {
  res.clearCookie('aoc_token');
  res.json({ success: true });
});

// GET /api/auth/me — verify token / get current admin
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json({ success: true, admin: { id: req.admin._id, name: req.admin.name, email: req.admin.email } });
  })
);

module.exports = router;
