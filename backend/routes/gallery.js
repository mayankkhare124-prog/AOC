const express = require('express');
const GalleryItem = require('../models/GalleryItem');
const crudFactory = require('../utils/crudFactory');
const { protect } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();
const GALLERY_ALLOWED_FIELDS = [
  'title', 'imageUrl', 'category', 'eventId', 'caption', 'featured', 'published',
];
const h = crudFactory(GalleryItem, {
  publicFilter: { published: true },
  defaultSort: '-createdAt',
  allowedFields: GALLERY_ALLOWED_FIELDS,
});

router.get('/', optionalAuth, (req, res, next) => h.getAll(req, res, next));
router.get('/:id', optionalAuth, h.getOne);
router.post('/', protect, h.create);
router.put('/:id', protect, h.update);
router.delete('/:id', protect, h.remove);

module.exports = router;
