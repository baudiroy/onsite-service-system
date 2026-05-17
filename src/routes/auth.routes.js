const express = require('express');

const { AuthController } = require('../controllers/AuthController');
const { requireAuth } = require('../middlewares/requireAuth');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const { loginSchema } = require('../validators/authValidators');

const router = express.Router();
const authController = new AuthController();

router.post('/login', validateRequest(loginSchema), asyncHandler(authController.login));
router.get('/me', requireAuth, asyncHandler(authController.me));
router.post('/logout', requireAuth, asyncHandler(authController.logout));

module.exports = {
  authRouter: router
};
