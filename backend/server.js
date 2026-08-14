require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const sessionRoutes = require('./routes/sessions');
const galleryRoutes = require('./routes/gallery');
const testimonialRoutes = require('./routes/testimonials');
const teamRoutes = require('./routes/team');
const registrationRoutes = require('./routes/registrations');
const joinRoutes = require('./routes/join');
const contactRoutes = require('./routes/contact');
const settingsRoutes = require('./routes/settings');
const overviewRoutes = require('./routes/overview');

const app = express();

// ── Security & core middleware ─────────────────────────────
// CSP is enabled in production and matches the concrete asset origins the
// site actually loads (Google Fonts, GSAP/cdnjs, Unsplash for dev imagery,
// and self for the API/admin panel). Left relaxed in development so local
// iteration on the design isn't blocked by a strict allowlist.
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  imgSrc: ["'self'", 'data:', 'https:'], // https: kept broad for admin-pasted image URLs (Unsplash, Cloudinary, etc.)
  connectSrc: ["'self'"],
  frameSrc: ['https://www.youtube.com', 'https://player.vimeo.com'],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
};

app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production' ? { directives: cspDirectives } : false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    // In production, only the configured CLIENT_URL origin is allowed — no unrestricted fallback.
    // In development, `true` (reflect request origin) keeps local setups (different ports) simple.
    origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Rate limit write-heavy public endpoints (forms) to deter abuse
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many submissions. Please try again later.' },
});
app.use('/api/registrations', formLimiter);
app.use('/api/join', formLimiter);
app.use('/api/contact', formLimiter);

// General API rate limit
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
  })
);

// ── API routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/join', joinRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/overview', overviewRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'AOC API is live.' }));

// ── Static frontend (public site + admin panel) ─────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});
app.get('/events/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'event.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 404 + error handling — must be last
app.use('/api', notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  AOC server running → http://localhost:${PORT}`);
    console.log(`  Admin panel        → http://localhost:${PORT}/admin\n`);
  });
});

module.exports = app;
