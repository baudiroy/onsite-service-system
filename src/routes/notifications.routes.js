const express = require('express');

const { NotificationController } = require('../controllers/NotificationController');
const { requirePermission } = require('../middlewares/requirePermission');
const { requireSystemOrSuperAdmin } = require('../middlewares/requireSystemOrSuperAdmin');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createPreferenceValidator,
  updatePreferenceValidator,
  listPreferencesValidator,
  createTemplateValidator,
  updateTemplateValidator,
  listTemplatesValidator,
  listLogsValidator
} = require('../validators/notificationValidators');

const notificationPreferencesRouter = express.Router();
const notificationTemplatesRouter = express.Router();
const notificationLogsRouter = express.Router();
const notificationController = new NotificationController();

notificationPreferencesRouter.get(
  '/',
  requirePermission('notifications.read'),
  requireSystemOrSuperAdmin,
  validateRequest(listPreferencesValidator),
  asyncHandler(notificationController.listPreferences)
);

notificationPreferencesRouter.post(
  '/',
  requirePermission('notifications.manage'),
  requireSystemOrSuperAdmin,
  validateRequest(createPreferenceValidator),
  asyncHandler(notificationController.createPreference)
);

notificationPreferencesRouter.patch(
  '/:preferenceId',
  requirePermission('notifications.manage'),
  requireSystemOrSuperAdmin,
  validateRequest(updatePreferenceValidator),
  asyncHandler(notificationController.updatePreference)
);

notificationTemplatesRouter.get(
  '/',
  requirePermission('notifications.read'),
  requireSystemOrSuperAdmin,
  validateRequest(listTemplatesValidator),
  asyncHandler(notificationController.listTemplates)
);

notificationTemplatesRouter.post(
  '/',
  requirePermission('notifications.manage'),
  requireSystemOrSuperAdmin,
  validateRequest(createTemplateValidator),
  asyncHandler(notificationController.createTemplate)
);

notificationTemplatesRouter.patch(
  '/:templateId',
  requirePermission('notifications.manage'),
  requireSystemOrSuperAdmin,
  validateRequest(updateTemplateValidator),
  asyncHandler(notificationController.updateTemplate)
);

notificationLogsRouter.get(
  '/',
  requirePermission('notifications.read'),
  requireSystemOrSuperAdmin,
  validateRequest(listLogsValidator),
  asyncHandler(notificationController.listLogs)
);

module.exports = {
  notificationPreferencesRouter,
  notificationTemplatesRouter,
  notificationLogsRouter
};
