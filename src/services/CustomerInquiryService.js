const { CaseRepository } = require('../repositories/CaseRepository');
const { MessageRepository } = require('../repositories/MessageRepository');
const { LineChannelRepository } = require('../repositories/LineChannelRepository');
const { CustomerLineIdentityRepository } = require('../repositories/CustomerLineIdentityRepository');
const { AuditService } = require('./AuditService');
const { toCustomerVisibleCaseDTO } = require('../mappers/customerVisibleCaseMapper');

const GENERIC_FAILURE_MESSAGE = 'Unable to verify the case with the provided information.';

function maskMobile(mobile = '') {
  if (!mobile) return null;
  if (mobile.length <= 4) return '****';
  return `${mobile.slice(0, 3)}****${mobile.slice(-3)}`;
}

function maskLineUserId(lineUserId = '') {
  if (!lineUserId) return null;
  if (lineUserId.length <= 8) return '***';
  return `${lineUserId.slice(0, 4)}***${lineUserId.slice(-4)}`;
}

class CustomerInquiryService {
  constructor({
    caseRepository = new CaseRepository(),
    messageRepository = new MessageRepository(),
    lineChannelRepository = new LineChannelRepository(),
    customerLineIdentityRepository = new CustomerLineIdentityRepository(),
    auditService = new AuditService()
  } = {}) {
    this.caseRepository = caseRepository;
    this.messageRepository = messageRepository;
    this.lineChannelRepository = lineChannelRepository;
    this.customerLineIdentityRepository = customerLineIdentityRepository;
    this.auditService = auditService;
  }

  failureResponse() {
    return {
      verified: false,
      message: GENERIC_FAILURE_MESSAGE
    };
  }

  successResponse(caseRow, latestMessage) {
    return {
      verified: true,
      case: this.buildCustomerVisibleCaseDTO(caseRow, latestMessage)
    };
  }

  buildCustomerVisibleCaseDTO(caseRow, latestMessage = null) {
    return toCustomerVisibleCaseDTO(caseRow, latestMessage);
  }

  async auditInquiry({
    source,
    success,
    caseNo,
    mobile = null,
    lineUserId = null,
    channelCode = null,
    caseId = null,
    req = null
  }) {
    await this.auditService.record({
      actorType: 'customer',
      actorId: null,
      actorDisplayName: null,
      action: success ? 'customer_inquiry.success' : 'customer_inquiry.failed',
      entityType: caseId ? 'case' : 'system',
      entityId: caseId || undefined,
      afterData: {
        source,
        success,
        caseNo
      },
      ipAddress: req?.ip || null,
      userAgent: req?.get?.('user-agent') || null,
      metadata: {
        requestId: req?.requestId || null,
        source,
        channelCode,
        maskedMobile: mobile ? maskMobile(mobile) : null,
        maskedLineUserId: lineUserId ? maskLineUserId(lineUserId) : null,
        futureRateLimit: 'IP/mobile throttling and abuse detection should be added later.'
      }
    });
  }

  async inquiryByCaseNoAndMobile({ caseNo, mobile }, req = null) {
    const caseRow = await this.caseRepository.getCaseByCaseNoAndMobile(caseNo, mobile);

    if (!caseRow) {
      await this.auditInquiry({
        source: 'website',
        success: false,
        caseNo,
        mobile,
        req
      });
      return this.failureResponse();
    }

    const latestMessage = await this.messageRepository.getLatestCustomerVisibleMessage(caseRow.id);
    await this.auditInquiry({
      source: 'website',
      success: true,
      caseNo,
      mobile,
      caseId: caseRow.id,
      req
    });

    return this.successResponse(caseRow, latestMessage);
  }

  async inquiryByLineUserIdAndCaseNo({ channelCode, caseNo, lineUserId }, req = null) {
    const channel = await this.lineChannelRepository.getLineChannelByCode(channelCode);

    if (!channel || !channel.enabled) {
      await this.auditInquiry({
        source: 'line',
        success: false,
        caseNo,
        lineUserId,
        channelCode,
        req
      });
      return this.failureResponse();
    }

    const identity = await this.customerLineIdentityRepository.findByLineIdentity({
      organizationId: channel.organization_id,
      lineChannelId: channel.id,
      lineUserId
    });

    const caseRow = identity?.customer_id
      ? await this.caseRepository.getCaseByCaseNoAndCustomerId(caseNo, identity.customer_id)
      : null;

    if (!caseRow || caseRow.organization_id !== channel.organization_id) {
      await this.auditInquiry({
        source: 'line',
        success: false,
        caseNo,
        lineUserId,
        channelCode,
        req
      });
      return this.failureResponse();
    }

    const latestMessage = await this.messageRepository.getLatestCustomerVisibleMessage(caseRow.id);
    await this.auditInquiry({
      source: 'line',
      success: true,
      caseNo,
      lineUserId,
      channelCode,
      caseId: caseRow.id,
      req
    });

    return this.successResponse(caseRow, latestMessage);
  }
}

module.exports = {
  CustomerInquiryService,
  GENERIC_FAILURE_MESSAGE,
  maskMobile,
  maskLineUserId
};
