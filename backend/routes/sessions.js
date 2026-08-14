const express = require('express');
const Session = require('../models/Session');
const crudFactory = require('../utils/crudFactory');
const { protect } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();
const SESSION_ALLOWED_FIELDS = [
  'title', 'description', 'date', 'speaker', 'category', 'thumbnail', 'videoUrl',
  'duration', 'resources', 'featured', 'published',
];
const h = crudFactory(Session, {
  publicFilter: { published: true },
  defaultSort: '-date',
  allowedFields: SESSION_ALLOWED_FIELDS,
});

router.get('/', optionalAuth, (req, res, next) => {
  // reuse getAll but honor optionalAuth's req.admin
  h.getAll(req, res, next);
});
router.get('/:id', optionalAuth, h.getOne);
router.post('/', protect, h.create);
router.put('/:id', protect, h.update);
router.delete('/:id', protect, h.remove);

module.exports = router;
