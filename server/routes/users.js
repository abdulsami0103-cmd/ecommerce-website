const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  getAddresses,
} = require('../controllers/userController');

router.use(protect); // All routes require authentication

router.route('/profile').get(getProfile).put(updateProfile);

router.route('/addresses').get(getAddresses).post(addAddress);

router.route('/addresses/:addressId').put(updateAddress).delete(deleteAddress);

module.exports = router;
