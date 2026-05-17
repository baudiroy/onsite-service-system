const express = require('express');

const { UserController } = require('../controllers/UserController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createUserValidator,
  updateUserValidator,
  listUsersValidator,
  getUserValidator,
  assignUserRoleValidator,
  removeUserRoleValidator
} = require('../validators/userValidators');

const usersRouter = express.Router();
const userController = new UserController();

usersRouter.get(
  '/',
  requirePermission('users.read'),
  validateRequest(listUsersValidator),
  asyncHandler(userController.listUsers)
);

usersRouter.post(
  '/',
  requirePermission('users.manage'),
  validateRequest(createUserValidator),
  asyncHandler(userController.createUser)
);

usersRouter.get(
  '/:userId',
  requirePermission('users.read'),
  validateRequest(getUserValidator),
  asyncHandler(userController.getUser)
);

usersRouter.patch(
  '/:userId',
  requirePermission('users.manage'),
  validateRequest(updateUserValidator),
  asyncHandler(userController.updateUser)
);

usersRouter.delete(
  '/:userId',
  requirePermission('users.manage'),
  validateRequest(getUserValidator),
  asyncHandler(userController.disableUser)
);

usersRouter.get(
  '/:userId/roles',
  requirePermission('users.read'),
  validateRequest(getUserValidator),
  asyncHandler(userController.listUserRoles)
);

usersRouter.post(
  '/:userId/roles',
  requirePermission('users.manage'),
  validateRequest(assignUserRoleValidator),
  asyncHandler(userController.assignRoleToUser)
);

usersRouter.delete(
  '/:userId/roles/:roleId',
  requirePermission('users.manage'),
  validateRequest(removeUserRoleValidator),
  asyncHandler(userController.removeRoleFromUser)
);

module.exports = {
  usersRouter
};
