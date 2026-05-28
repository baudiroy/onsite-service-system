const express = require('express');
const { authRouter } = require('./auth.routes');
const { casesRouter } = require('./cases.routes');
const { customersRouter } = require('./customers.routes');
const { attachmentsRouter } = require('./attachments.routes');
const { caseAttachmentsRouter } = require('./caseAttachments.routes');
const { caseMessagesRouter } = require('./caseMessages.routes');
const { messagesRouter } = require('./messages.routes');
const { createPublicRouter } = require('./public.routes');
const { dispatchRouter } = require('./dispatch.routes');
const { caseAppointmentsRouter, appointmentsRouter } = require('./appointments.routes');
const { caseServiceReportRouter, serviceReportsRouter, servicePartsRouter } = require('./fieldService.routes');
const { caseBillingRouter, billingRouter, settlementsRouter } = require('./billing.routes');
const { notificationPreferencesRouter, notificationTemplatesRouter, notificationLogsRouter } = require('./notifications.routes');
const { caseAIRouter, aiJobsRouter } = require('./ai.routes');
const { lineWebhookRouter, lineChannelsRouter, customerLineIdentitiesRouter } = require('./line.routes');
const { organizationsRouter, userOrganizationsRouter } = require('./organizations.routes');
const { auditLogsRouter } = require('./auditLogs.routes');
const { dispatchUnitsRouter } = require('./dispatchUnits.routes');
const { usersRouter } = require('./users.routes');
const { createEngineerMobileWorkbenchRouter } = require('./engineerMobileWorkbench.routes');
const { registerEngineerMobileRoutes } = require('./engineerMobileRoutes');
const { registerEngineerMobileTaskDetailRoutes } = require('./engineerMobileTaskDetailRoutes');
const { registerEngineerMobileVisitActionRoutes } = require('./engineerMobileVisitActionRoutes');
const { registerCustomerAccessRoutes } = require('./customerAccessRoutes');
const { registerCustomerAccessModuleRoutes } = require('../customerAccess/customerAccessRouteRegistry');
const { registerDataCorrectionRoutes } = require('./dataCorrectionRoutes');
const { registerRepairIntakeDraftToCaseAdminRoutes } = require('./repairIntakeDraftToCase.routes');

function registerCustomerAccessRoutesWithOptions(appRouter, customerAccessOptions) {
  if (customerAccessOptions === undefined) {
    return registerCustomerAccessModuleRoutes(appRouter);
  }

  return registerCustomerAccessRoutes(appRouter, customerAccessOptions);
}

function createAppRouter(options = {}) {
  const originalOptions = options;
  const appRouter = express.Router();
  const repairIntakeDraftToCaseAdminRoutesEnabled = options.repairIntakeDraftToCaseRoutesEnabled === true
    || (
      options.repairIntakeDraftToCase
      && options.repairIntakeDraftToCase.routesEnabled === true
    );
  options = repairIntakeDraftToCaseAdminRoutesEnabled
    ? {
      ...options,
      repairIntakeDraftToCaseRuntimePorts: undefined,
      repairIntakeDraftToCase: undefined,
    }
    : options;
  const publicRouter = createPublicRouter({
    repairIntakeDraftToCaseRuntimePorts: options.repairIntakeDraftToCaseRuntimePorts,
    repairIntakeDraftToCase: options.repairIntakeDraftToCase
  });

  appRouter.use('/api/v1/auth', authRouter);
  appRouter.use('/api/v1/public', publicRouter);
  appRouter.use('/api/v1/line', lineWebhookRouter);
  appRouter.use('/api/v1/admin/cases', casesRouter);
  appRouter.use('/api/v1/admin/customers/:customerId/line-identities', customerLineIdentitiesRouter);
  appRouter.use('/api/v1/admin/customers', customersRouter);
  appRouter.use('/api/v1/admin/organizations', organizationsRouter);
  appRouter.use('/api/v1/admin/users/:userId/organizations', userOrganizationsRouter);
  appRouter.use('/api/v1/admin/users', usersRouter);
  appRouter.use('/api/v1/admin/cases/:caseId/attachments', caseAttachmentsRouter);
  appRouter.use('/api/v1/admin/cases/:caseId/messages', caseMessagesRouter);
  appRouter.use('/api/v1/admin/cases/:caseId/dispatch', dispatchRouter);
  appRouter.use('/api/v1/admin/cases/:caseId/appointments', caseAppointmentsRouter);
  appRouter.use('/api/v1/admin/cases/:caseId/service-report', caseServiceReportRouter);
  appRouter.use('/api/v1/admin/cases/:caseId/billing', caseBillingRouter);
  appRouter.use('/api/v1/admin/cases/:caseId/ai', caseAIRouter);
  appRouter.use('/api/v1/admin/attachments', attachmentsRouter);
  appRouter.use('/api/v1/admin/messages', messagesRouter);
  appRouter.use('/api/v1/admin/appointments', appointmentsRouter);
  appRouter.use('/api/v1/admin/service-reports', serviceReportsRouter);
  appRouter.use('/api/v1/admin/service-parts', servicePartsRouter);
  appRouter.use('/api/v1/admin/billing', billingRouter);
  appRouter.use('/api/v1/admin/settlements', settlementsRouter);
  appRouter.use('/api/v1/admin/dispatch-units', dispatchUnitsRouter);
  appRouter.use('/api/v1/admin/notification-preferences', notificationPreferencesRouter);
  appRouter.use('/api/v1/admin/notification-templates', notificationTemplatesRouter);
  appRouter.use('/api/v1/admin/notification-logs', notificationLogsRouter);
  appRouter.use('/api/v1/admin/ai-jobs', aiJobsRouter);
  appRouter.use('/api/v1/admin/line-channels', lineChannelsRouter);
  appRouter.use('/api/v1/admin/audit-logs', auditLogsRouter);
  appRouter.use(
    '/api/v1/engineer/mobile-workbench',
    createEngineerMobileWorkbenchRouter(options.engineerMobileWorkbench || options.engineerMobile || {})
  );
  registerEngineerMobileRoutes(appRouter, options.engineerMobile);
  registerEngineerMobileTaskDetailRoutes(appRouter, options.engineerMobile);
  registerEngineerMobileVisitActionRoutes(appRouter, options.engineerMobile);
  registerCustomerAccessRoutesWithOptions(appRouter, options.customerAccess);
  registerDataCorrectionRoutes(appRouter, options.dataCorrection);
  registerRepairIntakeDraftToCaseAdminRoutes(appRouter, {
    ...originalOptions,
    routesEnabled: repairIntakeDraftToCaseAdminRoutesEnabled,
  });

  appRouter.get('/healthz', (req, res) => {
    res.json({
      ok: true,
      service: 'onsite-service-api',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  });

  return appRouter;
}

const router = createAppRouter();

module.exports = {
  createAppRouter,
  router
};
