const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Attaches req.admin if a valid token is present, but never blocks the request.
// Used on public GET routes so admins can see unpublished/draft content too.
// Cookie-only: mirrors protect()'s auth source so public routes see the same
// identity a protected route would, without ever looking at a bearer header.
async function optionalAuth(req, res, next) {
  const token = req.cookies && req.cookies.aoc_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await Admin.findById(decoded.id);
      if (admin) req.admin = admin;
    } catch (err) {
      // invalid/expired token on a public route — just proceed as anonymous
    }
  }
  next();
}

module.exports = optionalAuth;
