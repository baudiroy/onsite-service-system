const express = require('express');

const { OrganizationController } = require('../controllers/OrganizationController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createOrganizationValidator,
  updateOrganizationValidator,
  listOrganizationsValidator,
  getOrganizationValidator,
  listUserOrganizationsValidator,
  assignUserOrganizationValidator,
  removeUserOrganizationValidator
} = require('../validators/organizationValidators');

const organizationsRouter = express.Router();
const userOrganizationsRouter = express.Router({ mergeParams: true });
const organizationController = new OrganizationController();

organizationsRouter.get(
  '/',
  requirePermission('organizations.read'),
  validateRequest(listOrganizationsValidator),
  asyncHandler(organizationController.listOrganizations)
);

organizationsRouter.post(
  '/',
  requirePermission('organizations.manage'),
  validateRequest(createOrganizationValidator),
  asyncHandler(organizationController.createOrganization)
);

organizationsRouter.get(
  '/:organizationId',
  requirePermission('organizations.read'),
  validateRequest(getOrganizationValidator),
  asyncHandler(organizationController.getOrganization)
);

organizationsRouter.patch(
  '/:organizationId',
  requirePermission('organizations.manage'),
  validateRequest(updateOrganizationValidator),
  asyncHandler(organizationController.updateOrganization)
);

userOrganizationsRouter.get(
  '/',
  requirePermission('organizations.read'),
  validateRequest(listUserOrganizationsValidator),
  asyncHandler(organizationController.listUserOrganizations)
);

userOrganizationsRouter.post(
  '/',
  requirePermission('organizations.manage'),
  validateRequest(assignUserOrganizationValidator),
  asyncHandler(organizationController.assignUserToOrganization)
);

userOrganizationsRouter.delete(
  '/:organizationId',
  requirePermission('organizations.manage'),
  validateRequest(removeUserOrganizationValidator),
  asyncHandler(organizationController.removeUserFromOrganization)
);

module.exports = {
  organizationsRouter,
  userOrganizationsRouter
};
