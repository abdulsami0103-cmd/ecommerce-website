const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAttributes,
  getAttribute,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  addOption,
  updateOption,
  deleteOption,
} = require('../controllers/attributeController');

// All routes require admin access
router.use(protect, authorize('admin'));

// Attribute CRUD
router.route('/')
  .get(getAttributes)
  .post(createAttribute);

router.route('/:id')
  .get(getAttribute)
  .put(updateAttribute)
  .delete(deleteAttribute);

// Attribute options
router.route('/:id/options')
  .post(addOption);

router.route('/:id/options/:optionId')
  .put(updateOption)
  .delete(deleteOption);

module.exports = router;
