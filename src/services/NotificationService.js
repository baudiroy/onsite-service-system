const { NotificationPreferenceRepository } = require('../repositories/NotificationPreferenceRepository');
const { NotificationTemplateRepository } = require('../repositories/NotificationTemplateRepository');
const { NotificationLogRepository } = require('../repositories/NotificationLogRepository');
const { AuditService } = require('./AuditService');
const { withTransaction } = require('../db/transaction');
const { NotFoundError } = require('../utils/errors');
const {
  toNotificationPreferenceDTO,
  toNotificationTemplateDTO,
  toNotificationLogDTO
} = require('../mappers/notificationMapper');

class NotificationService {
  constructor({
    preferenceRepository = new NotificationPreferenceRepository(),
    templateRepository = new NotificationTemplateRepository(),
    logRepository = new NotificationLogRepository(),
    auditService = new AuditService()
  } = {}) {
    this.preferenceRepository = preferenceRepository;
    this.templateRepository = templateRepository;
    this.logRepository = logRepository;
    this.auditService = auditService;
  }

  async shouldNotify(target, eventKey, channel, client) {
    const systemPreference = await this.preferenceRepository.findPreference({
      targetType: 'system',
      targetId: null,
      eventKey,
      channel
    }, client);

    if (systemPreference && systemPreference.enabled === false) return false;

    if (!target?.targetType) return true;

    const targetPreference = await this.preferenceRepository.findPreference({
      targetType: target.targetType,
      targetId: target.targetId || null,
      eventKey,
      channel
    }, client);

    if (targetPreference) return targetPreference.enabled;

    return true;
  }

  renderTemplate(template, variables = {}) {
    if (!template) return null;

    function replaceVariables(value) {
      if (!value) return value;
      return value.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
        const replacement = key.split('.').reduce((current, part) => current?.[part], variables);
        return replacement === undefined || replacement === null ? '' : String(replacement);
      });
    }

    return {
      subject: replaceVariables(template.subject),
      body: replaceVariables(template.body_template)
    };
  }

  async createNotificationLog(input, client) {
    const log = await this.logRepository.createNotificationLog(input, client);
    return toNotificationLogDTO(log);
  }

  async skipNotification(input, reason, actor = null, req = null, client) {
    const log = await this.logRepository.createNotificationLog({
      ...input,
      status: 'skipped',
      errorMessage: reason,
      payload: {
        ...(input.payload || {}),
        skipReason: reason
      }
    }, client);

    await this.auditService.record({
      actorType: actor?.userType || 'system',
      actorId: actor?.id || null,
      actorDisplayName: actor?.displayName || null,
      action: 'notification.skipped',
      entityType: 'notification_log',
      entityId: log.id,
      afterData: {
        eventKey: log.event_key,
        channel: log.channel,
        targetType: log.target_type,
        targetId: log.target_id,
        reason
      },
      ipAddress: req?.ip || null,
      userAgent: req?.get?.('user-agent') || null,
      metadata: { requestId: req?.requestId || null }
    }, client);

    return toNotificationLogDTO(log);
  }

  async markNotificationSent(logId, providerResponse = null, client) {
    const log = await this.logRepository.updateNotificationLog(logId, {
      status: 'sent',
      providerResponse,
      sentAt: new Date().toISOString()
    }, client);

    if (!log) throw new NotFoundError('Notification log not found.');
    return toNotificationLogDTO(log);
  }

  async markNotificationFailed(logId, errorMessage, providerResponse = null, client) {
    const log = await this.logRepository.updateNotificationLog(logId, {
      status: 'failed',
      providerResponse,
      errorMessage
    }, client);

    if (!log) throw new NotFoundError('Notification log not found.');
    return toNotificationLogDTO(log);
  }

  async createPreference(input, actor, req = null) {
    return withTransaction(async (client) => {
      const preference = await this.preferenceRepository.createPreference({
        ...input,
        actorId: actor?.id || null
      }, client);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'notification.preference_changed',
        entityType: 'notification_preference',
        entityId: preference.id,
        afterData: {
          targetType: preference.target_type,
          targetId: preference.target_id,
          eventKey: preference.event_key,
          channel: preference.channel,
          enabled: preference.enabled
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toNotificationPreferenceDTO(preference);
    });
  }

  async updatePreference(preferenceId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.preferenceRepository.getPreferenceById(preferenceId, client);
      if (!existing) throw new NotFoundError('Notification preference not found.');

      const updated = await this.preferenceRepository.updatePreference(
        preferenceId,
        {
          ...input,
          actorId: actor?.id || null
        },
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'notification.preference_changed',
        entityType: 'notification_preference',
        entityId: preferenceId,
        beforeData: {
          eventKey: existing.event_key,
          channel: existing.channel,
          enabled: existing.enabled
        },
        afterData: {
          eventKey: updated.event_key,
          channel: updated.channel,
          enabled: updated.enabled
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toNotificationPreferenceDTO(updated);
    });
  }

  async listPreferences(query = {}) {
    const result = await this.preferenceRepository.listPreferences({
      filters: {
        targetType: query.targetType,
        targetId: query.targetId,
        eventKey: query.eventKey,
        channel: query.channel
      },
      pagination: { limit: query.limit, offset: query.offset }
    });

    return {
      data: result.rows.map(toNotificationPreferenceDTO),
      pagination: result.pagination
    };
  }

  async createTemplate(input, actor, req = null) {
    return withTransaction(async (client) => {
      const template = await this.templateRepository.createTemplate({
        ...input,
        actorId: actor?.id || null
      }, client);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'notification.template_changed',
        entityType: 'notification_template',
        entityId: template.id,
        afterData: {
          eventKey: template.event_key,
          channel: template.channel,
          templateName: template.template_name,
          enabled: template.enabled,
          version: template.version
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toNotificationTemplateDTO(template);
    });
  }

  async updateTemplate(templateId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.templateRepository.getTemplateById(templateId, client);
      if (!existing) throw new NotFoundError('Notification template not found.');

      const updated = await this.templateRepository.updateTemplate(
        templateId,
        {
          ...input,
          actorId: actor?.id || null
        },
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'notification.template_changed',
        entityType: 'notification_template',
        entityId: templateId,
        beforeData: {
          templateName: existing.template_name,
          enabled: existing.enabled,
          version: existing.version
        },
        afterData: {
          templateName: updated.template_name,
          enabled: updated.enabled,
          version: updated.version
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toNotificationTemplateDTO(updated);
    });
  }

  async listTemplates(query = {}) {
    const result = await this.templateRepository.listTemplates({
      filters: {
        eventKey: query.eventKey,
        channel: query.channel,
        enabled: query.enabled
      },
      pagination: { limit: query.limit, offset: query.offset }
    });

    return {
      data: result.rows.map(toNotificationTemplateDTO),
      pagination: result.pagination
    };
  }

  async listNotificationLogs(query = {}) {
    const result = await this.logRepository.listNotificationLogs({
      filters: {
        eventKey: query.eventKey,
        channel: query.channel,
        targetType: query.targetType,
        targetId: query.targetId,
        status: query.status
      },
      pagination: { limit: query.limit, offset: query.offset }
    });

    return {
      data: result.rows.map(toNotificationLogDTO),
      pagination: result.pagination
    };
  }
}

module.exports = {
  NotificationService
};
