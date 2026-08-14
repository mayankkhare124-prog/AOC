const express = require('express');
const Testimonial = require('../models/Testimonial');
const crudFactory = require('../utils/crudFactory');
const { protect } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();
const TESTIMONIAL_ALLOWED_FIELDS = [
  'name', 'role', 'course', 'quote', 'imageUrl', 'featured', 'order', 'published',
];
const h = crudFactory(Testimonial, {
  publicFilter: { published: true },
  defaultSort: 'order -createdAt',
  allowedFields: TESTIMONIAL_ALLOWED_FIELDS,
});

router.get('/', optionalAuth, (req, res, next) => h.getAll(req, res, next));
router.get('/:id', optionalAuth, h.getOne);
router.post('/', protect, h.create);
router.put('/:id', protect, h.update);
router.delete('/:id', protect, h.remove);

module.exports = router;
