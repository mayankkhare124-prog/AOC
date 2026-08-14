// Wraps async route handlers so thrown errors reach errorHandler via next()
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
