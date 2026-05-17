const { MessageRepository } = require('../repositories/MessageRepository');
const { CaseRepository } = require('../repositories/CaseRepository');
const { AttachmentRepository } = require('../repositories/AttachmentRepository');
const { AuditService } = require('./AuditService');
const { OrganizationAccessService } = require('./OrganizationAccessService');
const { withTransaction } = require('../db/transaction');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { toMessageDTO } = require('../mappers/messageMapper');

const VISIBILITY_BY_TYPE = Object.freeze({
  internal_note: 'admin',
  workflow_event: 'admin',
  customer_note: 'customer_possible',
  system_event: 'admin'
});

function isCustomerVisibleFuture(messageType) {
  return messageType === 'customer_note';
}

class MessageService {
  constructor({
    messageRepository = new MessageRepository(),
    caseRepository = new CaseRepository(),
    attachmentRepository = new AttachmentRepository(),
    auditService = new AuditService(),
    organizationAccessService = new OrganizationAccessService()
  } = {}) {
    this.messageRepository = messageRepository;
    this.caseRepository = caseRepository;
    this.attachmentRepository = attachmentRepository;
    this.auditService = auditService;
    this.organizationAccessService = organizationAccessService;
  }

  async ensureCaseExists(caseId, client, actor = null, options = {}) {
    const caseRow = await this.caseRepository.getCaseById(caseId, client);

    if (!caseRow) {
      throw new NotFoundError('Case not found.');
    }

    const isTrustedCustomerIngress = actor?.userType === 'customer' && options.trustedCustomerIngress === true;

    if (actor && !isTrustedCustomerIngress) {
      await this.organizationAccessService.assertAccess(actor, caseRow.organization_id, client);
    }

    return caseRow;
  }

  async ensureAttachmentBelongsToCase(caseId, attachmentId, client) {
    if (!attachmentId) return null;

    const attachment = await this.attachmentRepository.getAttachmentById(attachmentId, client);

    if (!attachment || attachment.case_id !== caseId) {
      throw new ValidationError('Attachment does not belong to this case.', [
        {
          field: 'attachmentId',
          message: 'Attachment does not belong to this case.',
          code: 'invalid_reference'
        }
      ]);
    }

    return attachment;
  }

  async createMessage(caseId, input, actor, req = null, client, options = {}) {
    await this.ensureCaseExists(caseId, client, actor, options);
    await this.ensureAttachmentBelongsToCase(caseId, input.attachmentId, client);

    const visibility = VISIBILITY_BY_TYPE[input.messageType] || 'admin';
    const senderType = input.senderType || (input.messageType === 'system_event' ? 'system' : 'admin');
    const message = await this.messageRepository.createMessage({
      caseId,
      attachmentId: input.attachmentId,
      senderType,
      senderId: actor?.id || null,
      senderDisplayName: actor?.displayName || null,
      channel: input.channel || 'admin',
      messageType: input.messageType,
      bodyText: input.bodyText,
      externalMessageId: input.externalMessageId || null,
      rawPayload: input.rawPayload || null,
      metadata: {
        ...(input.metadata || {}),
        visibility,
        futureCustomerVisible: isCustomerVisibleFuture(input.messageType),
        timelineSource: input.timelineSource || input.metadata?.timelineSource || 'admin'
      }
    }, client);

    if (senderType === 'customer') {
      await this.caseRepository.touchCustomerMessage(caseId, actor?.id || null, client);
    } else {
      await this.caseRepository.touchInternalActivity(caseId, actor?.id || null, client);
    }

    await this.auditService.record({
      actorType: actor?.userType || senderType || 'admin',
      actorId: actor?.id || null,
      actorDisplayName: actor?.displayName || null,
      action: 'message.created',
      entityType: 'message',
      entityId: message.id,
      afterData: {
        caseId: message.case_id,
        attachmentId: message.attachment_id,
        senderType: message.sender_type,
        messageType: message.message_type,
        visibility
      },
      ipAddress: req?.ip || null,
      userAgent: req?.get?.('user-agent') || null,
      metadata: {
        requestId: req?.requestId || null
      }
    }, client);

    return message;
  }

  async createInternalMessage(caseId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const message = await this.createMessage(
        caseId,
        {
          ...input,
          messageType: input.messageType || 'internal_note',
          senderType: 'admin',
          timelineSource: 'internal_message'
        },
        actor,
        req,
        client
      );

      return toMessageDTO(message);
    });
  }

  async createSystemMessage(caseId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const message = await this.createMessage(
        caseId,
        {
          ...input,
          messageType: input.messageType || 'system_event',
          senderType: 'system',
          timelineSource: 'system_message'
        },
        actor,
        req,
        client
      );

      return toMessageDTO(message);
    });
  }

  async listCaseMessages(caseId, query, actor) {
    await this.ensureCaseExists(caseId, undefined, actor);
    const result = await this.messageRepository.listCaseMessages(caseId, {
      pagination: {
        limit: query.limit,
        offset: query.offset
      },
      sort: query.sort
    });

    return {
      data: result.rows.map(toMessageDTO),
      pagination: result.pagination
    };
  }

  async softDeleteMessage(messageId, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.messageRepository.getMessageById(messageId, client);

      if (!existing) {
        throw new NotFoundError('Message not found.');
      }

      await this.ensureCaseExists(existing.case_id, client, actor);
      const deleted = await this.messageRepository.softDeleteMessage(messageId, client);
      await this.caseRepository.touchInternalActivity(existing.case_id, actor?.id || null, client);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'message.deleted',
        entityType: 'message',
        entityId: messageId,
        beforeData: {
          caseId: existing.case_id,
          attachmentId: existing.attachment_id,
          senderType: existing.sender_type,
          messageType: existing.message_type,
          visibility: existing.metadata?.visibility || 'admin'
        },
        afterData: {
          deletedAt: deleted.deleted_at
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: {
          requestId: req?.requestId || null
        }
      }, client);

      return toMessageDTO(deleted);
    });
  }
}

module.exports = {
  MessageService,
  VISIBILITY_BY_TYPE
};
