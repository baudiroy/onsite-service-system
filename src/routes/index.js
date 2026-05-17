const express = require('express');
const { authRouter } = require('./auth.routes');
const { casesRouter } = require('./cases.routes');
const { customersRouter } = require('./customers.routes');
const { attachmentsRouter } = require('./attachments.routes');
const { caseAttachmentsRouter } = require('./caseAttachments.routes');
const { caseMessagesRouter } = require('./caseMessages.routes');
const { messagesRouter } = require('./messages.routes');
const { publicRouter } = require('./public.routes');
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

const router = express.Router();

router.use('/api/v1/auth', authRouter);
router.use('/api/v1/public', publicRouter);
router.use('/api/v1/line', lineWebhookRouter);
router.use('/api/v1/admin/cases', casesRouter);
router.use('/api/v1/admin/customers/:customerId/line-identities', customerLineIdentitiesRouter);
router.use('/api/v1/admin/customers', customersRouter);
router.use('/api/v1/admin/organizations', organizationsRouter);
router.use('/api/v1/admin/users/:userId/organizations', userOrganizationsRouter);
router.use('/api/v1/admin/users', usersRouter);
router.use('/api/v1/admin/cases/:caseId/attachments', caseAttachmentsRouter);
router.use('/api/v1/admin/cases/:caseId/messages', caseMessagesRouter);
router.use('/api/v1/admin/cases/:caseId/dispatch', dispatchRouter);
router.use('/api/v1/admin/cases/:caseId/appointments', caseAppointmentsRouter);
router.use('/api/v1/admin/cases/:caseId/service-report', caseServiceReportRouter);
router.use('/api/v1/admin/cases/:caseId/billing', caseBillingRouter);
router.use('/api/v1/admin/cases/:caseId/ai', caseAIRouter);
router.use('/api/v1/admin/attachments', attachmentsRouter);
router.use('/api/v1/admin/messages', messagesRouter);
router.use('/api/v1/admin/appointments', appointmentsRouter);
router.use('/api/v1/admin/service-reports', serviceReportsRouter);
router.use('/api/v1/admin/service-parts', servicePartsRouter);
router.use('/api/v1/admin/billing', billingRouter);
router.use('/api/v1/admin/settlements', settlementsRouter);
router.use('/api/v1/admin/dispatch-units', dispatchUnitsRouter);
router.use('/api/v1/admin/notification-preferences', notificationPreferencesRouter);
router.use('/api/v1/admin/notification-templates', notificationTemplatesRouter);
router.use('/api/v1/admin/notification-logs', notificationLogsRouter);
router.use('/api/v1/admin/ai-jobs', aiJobsRouter);
router.use('/api/v1/admin/line-channels', lineChannelsRouter);
router.use('/api/v1/admin/audit-logs', auditLogsRouter);

router.get('/healthz', (req, res) => {
  res.json({
    ok: true,
    service: 'onsite-service-api',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

module.exports = {
  router
};
