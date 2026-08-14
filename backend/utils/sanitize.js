/**
 * Small, dependency-free validation/sanitization helpers shared by the
 * public form routes (registrations, join, contact) and the admin CRUD
 * whitelist. Kept intentionally simple — this is a club site, not a
 * framework: no external validation library needed for this surface area.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s\-()]{7,20}$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;

/** Trims a string and caps it at `max` characters. Non-strings become ''. */
function clean(value, max = 500) {
  if (value == null) return '';
  return String(value).trim().slice(0, max);
}

function isValidEmail(value) {
  return EMAIL_RE.test(String(value || '').trim());
}

function isValidPhone(value) {
  return PHONE_RE.test(String(value || '').trim());
}

/** Empty string is treated as "not provided" and considered valid — most of
 *  these social/URL fields are optional. */
function isValidURLOrEmpty(value) {
  const v = String(value || '').trim();
  return v === '' || URL_RE.test(v);
}

/**
 * Returns a new object containing only the keys in `allowedFields` that are
 * present on `source`. Used on every admin create/update route so a client
 * can never smuggle in fields like `_id`, `__v`, or anything not in the
 * resource's own schema-facing field list.
 */
function pickFields(source, allowedFields) {
  const out = {};
  if (!source || typeof source !== 'object') return out;
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      out[key] = source[key];
    }
  }
  return out;
}

/**
 * Honeypot check for public forms: a hidden field ("website" by convention)
 * that real users never fill in but simple bots often do. Returns true if
 * the submission looks like spam and should be silently dropped.
 */
function isHoneypotTripped(body) {
  return !!(body && body.website && String(body.website).trim().length > 0);
}

module.exports = {
  clean,
  isValidEmail,
  isValidPhone,
  isValidURLOrEmpty,
  pickFields,
  isHoneypotTripped,
};
