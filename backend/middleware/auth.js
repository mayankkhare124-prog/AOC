const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Cookie-only authentication: the httpOnly `aoc_token` cookie set at login is
// the single source of truth for admin identity. There is no bearer-header
// fallback — a JWT is never expected to live in page JS or localStorage.
async function protect(req, res, next) {
  const token = req.cookies && req.cookies.aoc_token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — no token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Not authorized — admin no longer exists.' });
    }
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized — invalid or expired token.' });
  }
}

module.exports = { protect };
