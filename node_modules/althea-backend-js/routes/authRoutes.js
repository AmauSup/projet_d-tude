const express = require('express');
const { forgotPassword, login, logout, register, confirmEmail, requestResetPassword, resetPassword } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/requireAuth');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();


router.post('/login', asyncHandler(login));
router.post('/register', asyncHandler(register));
router.get('/confirm-email', asyncHandler(confirmEmail));
router.post('/request-reset-password', asyncHandler(requestResetPassword));
router.post('/reset-password', asyncHandler(resetPassword));
router.post('/forgot-password', forgotPassword); // legacy
router.post('/logout', requireAuth, asyncHandler(logout));

module.exports = router;
