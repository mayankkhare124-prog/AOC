# AOC — Art of Conversation

A full-stack club website for AOC (Art of Conversation), built for MITS Gwalior. It includes a cinematic public-facing website, event management, photo/video gallery, join form, contact form, registrations, testimonials, leadership profiles, and an admin dashboard to manage content without writing code.

## Overview

This project combines a Node.js + Express backend with a static frontend built using HTML, CSS, and JavaScript. The app serves the public website and admin panel from the same Express server, and uses MongoDB for persistent data storage.

### Key features
- Public landing page with cinematic branding and sections for events, sessions, gallery, testimonials, and leadership
- Event and session listing with dynamic data loading
- Registration system for events
- Join request form and contact form
- Admin login with JWT authentication
- Content management dashboard for events, gallery, team, settings, and more
- Seed script to generate demo content and admin account
- CSV export for registrations data
- Responsive layout and mobile-friendly design

## Tech stack
- Node.js 18+
- Express.js
- MongoDB with Mongoose
- JWT-based admin authentication
- Vanilla HTML, CSS, and JavaScript for frontend
- Nodemon for development auto-reload

## Project structure

```bash
aoc/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── optionalAuth.js
│   ├── models/
│   │   ├── Admin.js
│   │   ├── ContactMessage.js
│   │   ├── Event.js
│   │   ├── GalleryItem.js
│   │   ├── JoinRequest.js
│   │   ├── Registration.js
│   │   ├── Session.js
│   │   ├── SiteSettings.js
│   │   ├── TeamMember.js
│   │   └── Testimonial.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── contact.js
│   │   ├── events.js
│   │   ├── gallery.js
│   │   ├── join.js
│   │   ├── overview.js
│   │   ├── registrations.js
│   │   ├── sessions.js
│   │   ├── settings.js
│   │   ├── team.js
│   │   └── testimonials.js
│   ├── scripts/
│   │   └── seed.js
│   ├── utils/
│   │   ├── asyncHandler.js
│   │   ├── crudFactory.js
│   │   └── sanitize.js
│   └── server.js
├── public/
│   ├── admin/
│   │   ├── admin.css
│   │   ├── admin.js
│   │   └── index.html
│   ├── css/
│   │   └── extra.css
│   ├── js/
│   │   ├── api.js
│   │   └── app.js
│   ├── event.html
│   ├── index.html
│   ├── robots.txt
│   └── sitemap.xml
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── package-lock.json
```

## Prerequisites

Before running the project, make sure you have:
- Node.js 18 or newer
- npm
- MongoDB installed locally or a MongoDB Atlas cluster

Check your versions:

```bash
node -v
npm -v
```

## Quick start

1. Open a terminal in the project root:

```bash
cd aoc
```

2. Install dependencies:

```bash
npm install
```

3. Create your environment file:

```bash
copy .env.example .env
```

On Linux/macOS:

```bash
cp .env.example .env
```

4. Update the values in `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/aoc
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@aoc-mits.com
ADMIN_PASSWORD=change_this_password_before_seeding
CLIENT_URL=http://localhost:5000
```

## MongoDB setup

### Option 1: Local MongoDB

Install MongoDB Community Server and start it:

```bash
mongod --dbpath "C:\data\db"
```

Then keep that terminal running. The app will connect to:

```text
mongodb://127.0.0.1:27017/aoc
```

### Option 2: MongoDB Compass

1. Open MongoDB Compass
2. Create a new connection using:

```text
mongodb://127.0.0.1:27017
```

3. Connect to the server
4. Create or use the database named `aoc`

### Option 3: MongoDB Atlas

If you prefer MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/aoc
```

## Seed the database

This creates the default admin user and demo content:

```bash
npm run seed
```

After seeding, log in to the admin panel using the credentials from `.env`:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Run the app

### Development mode

```bash
npm run dev
```

### Production mode

```bash
npm start
```

Then open:
- Public site: http://localhost:5000
- Admin panel: http://localhost:5000/admin

## Admin dashboard

The admin panel allows you to manage:
- Events
- Sessions and videos
- Gallery images
- Testimonials
- Team members
- Registrations
- Join requests
- Contact messages
- Site settings

All updates reflect on the public site after refresh.

## API overview

All main routes are under `/api`.

### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`

### Public content
- `GET /api/events`
- `GET /api/events/slug/:slug`
- `GET /api/sessions`
- `GET /api/gallery`
- `GET /api/testimonials`
- `GET /api/team`
- `GET /api/settings`

### Forms and registrations
- `POST /api/registrations`
- `POST /api/join`
- `POST /api/contact`

### Admin-only routes
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`
- `GET /api/registrations`
- `GET /api/registrations/export`
- `GET /api/overview`

## Troubleshooting

### MongoDB connection failed
- Check whether MongoDB is running
- Verify `MONGODB_URI` in `.env`
- Ensure your MongoDB service is accessible on port 27017

### Admin login fails
- Run `npm run seed` again after setting valid credentials in `.env`
- Make sure JWT secret is set

### Port already in use
- Change the `PORT` value in `.env`

### Blank homepage content
- Ensure the backend is running and MongoDB is connected
- Check browser console and server logs for API or CORS errors

## Notes

This project is designed to be a self-hostable version of the club website and keeps the frontend simple and efficient without a heavy frontend framework. Media content is managed through URLs rather than direct uploads, which makes setup easier while still supporting the site’s content workflow.

## License

This project is for personal or educational use unless otherwise specified by the owner.

## Contributing

Pull requests and improvements are welcome. If you are extending the project, keep the admin workflow and public-facing content consistent with the current database schema.

- `credentials: 'include'` added to the shared fetch helper so the cookie is
  sent automatically.
- CSP is now enabled (via `helmet`) in production with an explicit allowlist
  (self, Google Fonts, cdnjs for GSAP, YouTube/Vimeo frames); left relaxed in
  development. CORS no longer falls back to an unrestricted origin in
  production — it requires `CLIENT_URL` to be set.

No changes were made to the MongoDB schema shapes, the admin CRUD flows, or
the CSS/JS files' existing public function names — this was an additive pass.

---

## Changelog — Refinement & Hardening Pass (P0 security + a11y + UX)

A second pass, strictly refining the existing design/architecture per a
production-readiness review. No visual redesign — same palette, type,
GSAP/ScrollTrigger language, layout order. Verified with `node --check` on
every edited file, a require-time load of the full backend module graph, a
live smoke test of the assembled Express app (all 11 routers mount; `/`,
`/api/health` serve; unauthenticated admin routes correctly 401), and
targeted `assert`-based unit tests of the new sanitize/escape helpers
(including live XSS-payload and prototype-pollution-style inputs). No
MongoDB instance was available in this environment, so DB-dependent behavior
(the atomic capacity check, duplicate-registration rejection, unpublished-ID
filtering) is implemented and code-reviewed but not integration-tested —
worth exercising against a real Mongo instance before shipping.

**Auth — cookie-only, single mechanism**
- Login no longer returns a JWT in the response body (`{ success, admin }`
  only). The bearer-header path was removed entirely from `protect` /
  `optionalAuth` — the httpOnly, `SameSite=Lax` (`Secure` in production)
  cookie is now the *only* auth mechanism, server and client.
- `js/api.js` and `admin/admin.js` no longer touch `localStorage` at all.
  The admin panel now bootstraps by calling `/auth/me` (letting the cookie
  answer "am I logged in") instead of checking for a stored token.

**Unpublished content**
- `crudFactory.getOne` now applies the same `publicFilter` (e.g.
  `{ published: true }`) the list endpoint uses, so a draft event/session/
  gallery item/testimonial/team member can no longer be fetched by ID. All
  five `/:id` GET routes now run through `optionalAuth` so admins still see
  everything.

**Stored-XSS hardening**
- Added `escapeHTML`/`safeURL` helpers to `js/app.js` and `event.html` and
  applied them to every DB-sourced value injected via `innerHTML` — event/
  session/gallery/testimonial/team-member fields, footer social links, video
  embed URLs (which are additionally protocol-checked before being placed in
  an `<iframe src>`), and the JSON-LD block (escaped `<` to guard against a
  breakout string). Fixed an unescaped `src` attribute in the admin table's
  thumbnail column. Verified with unit tests against real `<script>`/
  `<img onerror>` payloads.

**Whitelisted writes**
- Added `backend/utils/sanitize.js` (`pickFields`, format validators,
  honeypot check). `crudFactory` now takes an `allowedFields` list and every
  resource route (events, sessions, gallery, testimonials, team) passes one
  — arbitrary/internal fields in `req.body` (`_id`, `__v`, prototype-pollution
  attempts, etc.) are dropped before ever reaching Mongoose.

**Public forms: validation, limits, honeypot**
- `join.js` and `contact.js` rewritten: server-side required/format/max-length
  checks (independent of whatever the frontend enforces), a `website`
  honeypot field (silently accepted-but-dropped if filled), and status-only
  whitelisted admin `PUT`s (an admin can change moderation status but not
  rewrite the applicant's submitted content).
- `registrations.js` gets the same validation + honeypot treatment.
- Matching honeypot fields (visually hidden via `.hp-field`, off the tab
  order via `tabindex="-1"`) and `maxlength` attributes added to the
  register/join/contact forms in `index.html` and `event.html`.

**Registration capacity — race condition fixed**
- `Event` gained a `seatsTaken` counter. Registration now does a single
  atomic `findOneAndUpdate` that only matches (and only then increments)
  when `seatsTaken < registrationLimit`, so two concurrent submissions can't
  both pass a capacity check and both succeed. If the subsequent
  `Registration.create` fails on the duplicate-email unique index, the
  reserved seat is released. Cancelling/deleting a registration (admin) now
  keeps `seatsTaken` in sync by releasing/reserving accordingly.
- Admin registration `PUT` is now whitelisted to `status` only.
- Registrations, join requests, and contact messages all gained
  search + status filter + pagination on their admin `GET` endpoints.

**Accessibility**
- Register modal, join modal, and the lightbox all now carry
  `role="dialog"` / `aria-modal="true"` / a labelling attribute.
- Added a shared `trapFocus` implementation: `Tab`/`Shift+Tab` now cycle
  within the open modal instead of escaping into the page behind it; opening
  a modal moves focus to its first field/control; closing (via ✕, overlay
  click, Escape, or successful submit) returns focus to whatever triggered
  it. Applied to both `index.html`'s and `event.html`'s modal scripts.
- Register/join form labels now wrap their inputs (implicit label
  association) instead of being unassociated sibling text.
- Form status/error regions got `role="alert" aria-live="polite"` so screen
  readers announce validation errors and success states.
- Added the required "No prior speaking experience is required" line to the
  Join modal per the content brief.

**Content**
- Homepage testimonial count already capped at 4 from the previous pass —
  confirmed still correct here, no bloat re-crept in.

No changes were made to the CSS visual system, layout order, color palette,
typography, or the GSAP animation tiers introduced in the previous pass —
this was an additive security/accessibility/reliability pass only, per the
"refine, don't redesign" brief.

---

## Changelog — Admin UX Pass (quick actions, activity, capacity, search/pagination)

Continuation of the refinement pass — admin-panel usability items from the
brief that hadn't been addressed yet. No visual redesign; extends the
existing config-driven admin table/form engine in place.

- **Overview dashboard**: added a *Quick Actions* row (Create Event / Add
  Session jump straight to the create form; View Registrations / View Join
  Requests jump to those lists) and a *Recent Activity* feed merging the
  3 most recent registrations, join requests, and contact messages
  (sorted by time, capped at 8) below the existing stat cards.
- **Event list — capacity column**: the admin Events table now shows a
  `47 / 60 · 13 left` row with a small fill bar (or just "N registered" for
  uncapped events), reusing the `registeredCount`/`registrationLimit` the
  API already returns — no new endpoint needed.
- **Search**: added a client-side search box to the Events/Sessions/Gallery/
  Testimonials/Team admin tables (small, already-fully-fetched lists — a
  network round trip per keystroke isn't warranted at this scale). Added
  server-side search + status filter + pagination controls to the
  Registrations/Join Requests/Contact Messages inbox views, backed by the
  `search`/`status`/`page`/`limit` query params added to those routes in the
  previous pass.

Verified with `node --check` on every edited file and a live smoke test
(server boots, mounts routes, `/admin` serves 200, validation/honeypot
behavior on `/api/join` and `/api/contact` confirmed correct). As before, no
MongoDB instance was available in this sandbox, so the new admin views were
verified for correct request shape and route wiring rather than against
live data — worth a quick click-through against a real database before
shipping.
