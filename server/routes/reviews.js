const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const { updateReview, deleteReview } = require('../controllers/reviewController');

router.use(protect);

router.route('/:id').put(updateReview).delete(deleteReview);

module.exports = router;
