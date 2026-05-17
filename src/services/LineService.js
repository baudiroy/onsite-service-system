const crypto = require('node:crypto');

const { LineChannelRepository } = require('../repositories/LineChannelRepository');
const { OrganizationRepository } = require('../repositories/OrganizationRepository');
const { CustomerLineIdentityRepository } = require('../repositories/CustomerLineIdentityRepository');
const { LineEventRepository } = require('../repositories/LineEventRepository');
const { CaseRepository } = require('../repositories/CaseRepository');
const { CustomerRepository } = require('../repositories/CustomerRepository');
const { MessageService } = require('./MessageService');
const { AuditService } = require('./AuditService');
const { OrganizationAccessService } = require('./OrganizationAccessService');
const { withTransaction } = require('../db/transaction');
const { AuthError, NotFoundError, PermissionError, ValidationError } = require('../utils/errors');
const { toLineChannelDTO, toLineEventDTO } = require('../mappers/lineMapper');

function verifyLineSignature({ channelSecret, signature, rawBody }) {
  if (!signature) {
    throw new AuthError('Missing LINE signature.');
  }

  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ''), 'utf8');
  const expected = crypto
    .createHmac('sha256', channelSecret)
    .update(bodyBuffer)
    .digest('base64');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new AuthError('Invalid LINE signature.');
  }
}

function getLineUserId(event) {
  return event?.source?.userId || null;
}

function getExternalEventId(event) {
  return event?.webhookEventId || event?.message?.id || event?.postback?.data || null;
}

function buildMinimalRawPayload(event) {
  return {
    type: event.type,
    mode: event.mode || null,
    timestamp: event.timestamp || null,
    sourceType: event.source?.type || null,
    messageType: event.message?.type || null,
    messageId: event.message?.id || null,
    postbackDataPresent: Boolean(event.postback?.data),
    hasText: Boolean(event.message?.text)
  };
}

class LineService {
  constructor({
    lineChannelRepository = new LineChannelRepository(),
    organizationRepository = new OrganizationRepository(),
    customerLineIdentityRepository = new CustomerLineIdentityRepository(),
    lineEventRepository = new LineEventRepository(),
    caseRepository = new CaseRepository(),
    customerRepository = new CustomerRepository(),
    messageService = new MessageService(),
    auditService = new AuditService(),
    organizationAccessService = new OrganizationAccessService()
  } = {}) {
    this.lineChannelRepository = lineChannelRepository;
    this.organizationRepository = organizationRepository;
    this.customerLineIdentityRepository = customerLineIdentityRepository;
    this.lineEventRepository = lineEventRepository;
    this.caseRepository = caseRepository;
    this.customerRepository = customerRepository;
    this.messageService = messageService;
    this.auditService = auditService;
    this.organizationAccessService = organizationAccessService;
  }

  async ensureCustomerBelongsToOrganization(customerId, organizationId, client) {
    if (!customerId) return null;

    const customer = await this.customerRepository.getCustomerById(customerId, client);
    if (!customer) {
      throw new ValidationError('customerId must reference an existing customer.', [
        { field: 'customerId', message: 'customerId must reference an existing customer.', code: 'invalid_reference' }
      ]);
    }

    if ((customer.organization_id || null) !== (organizationId || null)) {
      throw new ValidationError('customerId must belong to the same organization as the LINE channel.', [
        { field: 'customerId', message: 'customerId must belong to the same organization as the LINE channel.', code: 'organization_mismatch' }
      ]);
    }

    return customer;
  }

  async getChannelForWebhook(channelCode, client) {
    const channel = await this.lineChannelRepository.getLineChannelByCode(channelCode, client);

    if (!channel) throw new NotFoundError('LINE channel not found.');
    if (!channel.enabled) throw new PermissionError('LINE channel is disabled.');

    const organization = await this.organizationRepository.getOrganizationById(channel.organization_id, client);
    if (!organization || organization.status !== 'active') {
      throw new PermissionError('Organization is disabled or not found.');
    }

    return { channel, organization };
  }

  async handleWebhook({ channelCode, signature, rawBody, body, req = null }) {
    if (!signature) {
      throw new AuthError('Missing LINE signature.');
    }

    return withTransaction(async (client) => {
      const { channel, organization } = await this.getChannelForWebhook(channelCode, client);
      verifyLineSignature({ channelSecret: channel.channel_secret, signature, rawBody });

      const events = Array.isArray(body?.events) ? body.events : [];
      const results = [];

      for (const event of events) {
        results.push(await this.handleWebhookEvent({ event, channel, organization, req, client }));
      }

      return {
        organizationId: organization.id,
        lineChannelId: channel.id,
        processedEvents: results.length,
        results: results.map(toLineEventDTO)
      };
    });
  }

  async handleWebhookEvent({ event, channel, organization, req = null, client }) {
    const eventType = event.type || 'unknown';

    if (eventType === 'follow') return this.handleFollow({ event, channel, organization, req, client });
    if (eventType === 'unfollow') return this.handleUnfollow({ event, channel, organization, req, client });
    if (eventType === 'message') {
      if (event.message?.type === 'text') return this.handleTextMessage({ event, channel, organization, req, client });
      return this.recordLineEvent({ event, channel, organization, processedStatus: 'ignored', client });
    }
    if (eventType === 'postback') return this.handlePostback({ event, channel, organization, client });

    return this.recordLineEvent({ event, channel, organization, processedStatus: 'ignored', client });
  }

  async linkCustomerByLineIdentity({ organization, channel, lineUserId, displayName = null, customerId = null, req = null, client }) {
    if (!lineUserId) return null;

    await this.ensureCustomerBelongsToOrganization(customerId, organization.id, client);

    const existing = await this.customerLineIdentityRepository.findByLineIdentity({
      organizationId: organization.id,
      lineChannelId: channel.id,
      lineUserId
    }, client);

    if (existing) {
      await this.ensureCustomerBelongsToOrganization(existing.customer_id, organization.id, client);
      return existing;
    }

    const identity = await this.customerLineIdentityRepository.createPendingIdentity({
      organizationId: organization.id,
      lineChannelId: channel.id,
      lineUserId,
      displayName,
      customerId
    }, client);

    if (identity.customer_id) {
      await this.auditService.record({
        actorType: 'system',
        action: 'line.customer_linked',
        entityType: 'customer',
        entityId: identity.customer_id,
        afterData: {
          organizationId: organization.id,
          lineChannelId: channel.id,
          lineIdentityId: identity.id
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);
    }

    return identity;
  }

  async recordLineEvent({ event, channel, organization, linkedCustomerId = null, linkedCaseId = null, processedStatus = 'received', client }) {
    return this.lineEventRepository.createLineEvent({
      organizationId: organization.id,
      lineChannelId: channel.id,
      lineUserId: getLineUserId(event),
      eventType: event.type || 'unknown',
      messageType: event.message?.type || null,
      externalEventId: getExternalEventId(event),
      rawPayload: buildMinimalRawPayload(event),
      linkedCustomerId,
      linkedCaseId,
      processedStatus
    }, client);
  }

  async handleFollow({ event, channel, organization, req = null, client }) {
    const lineUserId = getLineUserId(event);
    const identity = await this.linkCustomerByLineIdentity({ organization, channel, lineUserId, req, client });
    const lineEvent = await this.recordLineEvent({
      event,
      channel,
      organization,
      linkedCustomerId: identity?.customer_id || null,
      processedStatus: 'processed',
      client
    });

    await this.auditService.record({
      actorType: 'system',
      action: 'line.follow',
      entityType: 'line_event',
      entityId: lineEvent.id,
      afterData: {
        organizationId: organization.id,
        lineChannelId: channel.id,
        hasLinkedCustomer: Boolean(identity?.customer_id)
      },
      ipAddress: req?.ip || null,
      userAgent: req?.get?.('user-agent') || null,
      metadata: { requestId: req?.requestId || null }
    }, client);

    return lineEvent;
  }

  async handleUnfollow({ event, channel, organization, req = null, client }) {
    const lineUserId = getLineUserId(event);
    const identity = lineUserId
      ? await this.customerLineIdentityRepository.findByLineIdentity({
        organizationId: organization.id,
        lineChannelId: channel.id,
        lineUserId
      }, client)
      : null;

    if (identity) {
      await this.customerLineIdentityRepository.unlinkIdentity(identity.id, client);
    }

    const lineEvent = await this.recordLineEvent({
      event,
      channel,
      organization,
      linkedCustomerId: identity?.customer_id || null,
      processedStatus: 'processed',
      client
    });

    await this.auditService.record({
      actorType: 'system',
      action: 'line.unfollow',
      entityType: 'line_event',
      entityId: lineEvent.id,
      afterData: {
        organizationId: organization.id,
        lineChannelId: channel.id,
        hadLinkedCustomer: Boolean(identity?.customer_id)
      },
      ipAddress: req?.ip || null,
      userAgent: req?.get?.('user-agent') || null,
      metadata: { requestId: req?.requestId || null }
    }, client);

    return lineEvent;
  }

  async handleTextMessage({ event, channel, organization, req = null, client }) {
    const lineUserId = getLineUserId(event);
    const identity = await this.linkCustomerByLineIdentity({ organization, channel, lineUserId, req, client });
    const linkedCustomerId = identity?.customer_id || null;
    let linkedCaseId = null;
    let processedStatus = 'ignored';

    if (linkedCustomerId) {
      const openCase = await this.caseRepository.getLatestOpenCaseByCustomerId(linkedCustomerId, client);
      linkedCaseId = openCase?.id || null;

      if (openCase) {
        await this.recordLineMessage({
          caseId: openCase.id,
          event,
          identity,
          req,
          client
        });
        processedStatus = 'processed';
      }
    }

    return this.recordLineEvent({
      event,
      channel,
      organization,
      linkedCustomerId,
      linkedCaseId,
      processedStatus,
      client
    });
  }

  async handlePostback({ event, channel, organization, client }) {
    return this.recordLineEvent({ event, channel, organization, processedStatus: 'ignored', client });
  }

  async recordLineMessage({ caseId, event, identity, req = null, client }) {
    return this.messageService.createMessage(
      caseId,
      {
        senderType: 'customer',
        channel: 'line',
        messageType: 'text',
        bodyText: event.message?.text || '',
        externalMessageId: event.message?.id || null,
        rawPayload: buildMinimalRawPayload(event),
        metadata: {
          visibility: 'customer_possible',
          timelineSource: 'line',
          lineIdentityId: identity.id
        }
      },
      {
        id: identity.customer_id || null,
        userType: 'customer',
        displayName: identity.display_name || 'LINE customer'
      },
      req,
      client,
      { trustedCustomerIngress: true }
    );
  }

  async listLineChannels(query = {}, actor = null) {
    const scopedFilter = await this.organizationAccessService.buildScopedFilter(
      actor,
      query.organizationId || null
    );

    const result = await this.lineChannelRepository.listLineChannels({
      filters: {
        ...scopedFilter,
        channelCode: query.channelCode,
        enabled: query.enabled
      },
      pagination: { limit: query.limit, offset: query.offset }
    });

    return {
      data: result.rows.map(toLineChannelDTO),
      pagination: result.pagination
    };
  }

  async createLineChannel(input, actor, req = null) {
    return withTransaction(async (client) => {
      await this.organizationAccessService.assertAccess(actor, input.organizationId, client);

      const organization = await this.organizationRepository.getOrganizationById(input.organizationId, client);
      if (!organization) throw new ValidationError('organizationId must reference an existing organization.', [
        { field: 'organizationId', message: 'organizationId must reference an existing organization.', code: 'invalid_reference' }
      ]);

      const webhookPath = input.webhookPath || `/api/v1/line/webhook/${input.channelCode}`;
      const channel = await this.lineChannelRepository.createLineChannel({
        ...input,
        webhookPath,
        actorId: actor?.id || null
      }, client);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'line.channel_created',
        entityType: 'line_channel',
        entityId: channel.id,
        afterData: {
          organizationId: channel.organization_id,
          channelCode: channel.channel_code,
          channelName: channel.channel_name,
          enabled: channel.enabled,
          hasSecret: Boolean(channel.channel_secret),
          hasAccessToken: Boolean(channel.channel_access_token)
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toLineChannelDTO(channel);
    });
  }

  async updateLineChannel(channelId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.lineChannelRepository.getLineChannelById(channelId, client);
      if (!existing) throw new NotFoundError('LINE channel not found.');

      await this.organizationAccessService.assertAccess(actor, existing.organization_id, client);

      const updated = await this.lineChannelRepository.updateLineChannel(channelId, {
        ...input,
        actorId: actor?.id || null
      }, client);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'line.channel_updated',
        entityType: 'line_channel',
        entityId: channelId,
        beforeData: {
          channelName: existing.channel_name,
          webhookPath: existing.webhook_path,
          enabled: existing.enabled,
          hasSecret: Boolean(existing.channel_secret),
          hasAccessToken: Boolean(existing.channel_access_token)
        },
        afterData: {
          channelName: updated.channel_name,
          webhookPath: updated.webhook_path,
          enabled: updated.enabled,
          hasSecret: Boolean(updated.channel_secret),
          hasAccessToken: Boolean(updated.channel_access_token)
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toLineChannelDTO(updated);
    });
  }
}

module.exports = {
  LineService,
  verifyLineSignature,
  buildMinimalRawPayload
};
