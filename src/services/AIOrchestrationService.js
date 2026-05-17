const { AIJobRepository } = require('../repositories/AIJobRepository');
const { CaseRepository } = require('../repositories/CaseRepository');
const { AttachmentRepository } = require('../repositories/AttachmentRepository');
const { FieldServiceReportRepository } = require('../repositories/FieldServiceReportRepository');
const { AuditService } = require('./AuditService');
const { MessageService } = require('./MessageService');
const { OrganizationAccessService } = require('./OrganizationAccessService');
const { PlaceholderAIProvider } = require('../integrations/ai/PlaceholderAIProvider');
const { withTransaction } = require('../db/transaction');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { toAIJobDTO } = require('../mappers/aiJobMapper');

const OCR_ATTACHMENT_TYPES = new Set(['serial_photo', 'invoice_photo']);

class AIOrchestrationService {
  constructor({
    aiJobRepository = new AIJobRepository(),
    caseRepository = new CaseRepository(),
    attachmentRepository = new AttachmentRepository(),
    fieldServiceReportRepository = new FieldServiceReportRepository(),
    auditService = new AuditService(),
    messageService = new MessageService(),
    organizationAccessService = new OrganizationAccessService(),
    aiProvider = new PlaceholderAIProvider()
  } = {}) {
    this.aiJobRepository = aiJobRepository;
    this.caseRepository = caseRepository;
    this.attachmentRepository = attachmentRepository;
    this.fieldServiceReportRepository = fieldServiceReportRepository;
    this.auditService = auditService;
    this.messageService = messageService;
    this.organizationAccessService = organizationAccessService;
    this.aiProvider = aiProvider;
  }

  async ensureCase(caseId, client, actor = null) {
    const caseRow = await this.caseRepository.getCaseById(caseId, client);
    if (!caseRow) throw new NotFoundError('Case not found.');
    if (actor) await this.organizationAccessService.assertAccess(actor, caseRow.organization_id, client);
    return caseRow;
  }

  async ensureAttachment(attachmentId, client) {
    const attachment = await this.attachmentRepository.getAttachmentById(attachmentId, client);
    if (!attachment) throw new NotFoundError('Attachment not found.');
    return attachment;
  }

  async ensureAttachmentWithCase(attachmentId, client, actor = null) {
    const attachment = await this.ensureAttachment(attachmentId, client);
    const caseRow = await this.ensureCase(attachment.case_id, client, actor);
    return { attachment, caseRow };
  }

  async ensureServiceReport(reportId, client) {
    const report = await this.fieldServiceReportRepository.getServiceReportById(reportId, client);
    if (!report) throw new NotFoundError('Service report not found.');
    return report;
  }

  async ensureServiceReportWithCase(reportId, client, actor = null) {
    const report = await this.ensureServiceReport(reportId, client);
    const caseRow = await this.ensureCase(report.case_id, client, actor);
    return { report, caseRow };
  }

  async createJob({
    jobType,
    entityType,
    entityId,
    organizationId = null,
    lineChannelId = null,
    customerId = null,
    caseId = null,
    requestPayload = {},
    actor,
    client
  }) {
    return this.aiJobRepository.createAIJob({
      organizationId,
      lineChannelId,
      customerId,
      caseId,
      jobType,
      provider: this.aiProvider.providerName,
      entityType,
      entityId,
      status: 'pending',
      requestPayload: {
        ...requestPayload,
        safetyBoundary: {
          advisoryOnly: true,
          noWorkflowOverride: true,
          noAutomaticApproval: true
        }
      },
      requestedByUserId: actor?.id || null
    }, client);
  }

  async runProviderJob({ job, providerCall, actor, req, timeline, client }) {
    await this.aiJobRepository.updateAIJobStatus(job.id, {
      status: 'processing',
      startedAt: new Date().toISOString()
    }, client);

    try {
      const responsePayload = await providerCall();
      const updated = await this.aiJobRepository.updateAIJobStatus(job.id, {
        status: 'completed',
        responsePayload,
        completedAt: new Date().toISOString()
      }, client);

      if (timeline?.caseId && timeline?.bodyText) {
        await this.messageService.createMessage(
          timeline.caseId,
          {
            messageType: 'workflow_event',
            bodyText: timeline.bodyText,
            senderType: 'system',
            timelineSource: 'ai'
          },
          actor,
          req,
          client
        );
      }

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'ai.job_completed',
        entityType: 'ai_job',
        entityId: job.id,
        afterData: {
          jobType: updated.job_type,
          provider: updated.provider,
          entityType: updated.entity_type,
          entityId: updated.entity_id,
          status: updated.status
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return updated;
    } catch (error) {
      const failed = await this.aiJobRepository.updateAIJobStatus(job.id, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date().toISOString()
      }, client);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'ai.job_failed',
        entityType: 'ai_job',
        entityId: job.id,
        afterData: {
          jobType: failed.job_type,
          provider: failed.provider,
          status: failed.status,
          errorMessage: failed.error_message
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return failed;
    }
  }

  async requestCaseSummary(caseId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const caseRow = await this.ensureCase(caseId, client, actor);
      const job = await this.createJob({
        jobType: 'case_summary',
        entityType: 'case',
        entityId: caseId,
        organizationId: caseRow.organization_id,
        customerId: caseRow.customer_id,
        caseId,
        requestPayload: { caseNo: caseRow.case_no, note: input.note || null },
        actor,
        client
      });

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'ai.job_requested',
        entityType: 'ai_job',
        entityId: job.id,
        afterData: { jobType: job.job_type, provider: job.provider, entityType: job.entity_type, entityId: job.entity_id },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      const updated = await this.runProviderJob({
        job,
        providerCall: () => this.aiProvider.summarizeCase({ caseId, case: caseRow }),
        actor,
        req,
        timeline: { caseId, bodyText: 'AI 已產生案件摘要' },
        client
      });

      return toAIJobDTO(updated);
    });
  }

  async requestCaseClassification(caseId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const caseRow = await this.ensureCase(caseId, client, actor);
      const job = await this.createJob({
        jobType: 'case_classification',
        entityType: 'case',
        entityId: caseId,
        organizationId: caseRow.organization_id,
        customerId: caseRow.customer_id,
        caseId,
        requestPayload: { caseNo: caseRow.case_no, note: input.note || null },
        actor,
        client
      });

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'ai.job_requested',
        entityType: 'ai_job',
        entityId: job.id,
        afterData: { jobType: job.job_type, provider: job.provider, entityType: job.entity_type, entityId: job.entity_id },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      const updated = await this.runProviderJob({
        job,
        providerCall: () => this.aiProvider.classifyCase({ caseId, case: caseRow }),
        actor,
        req,
        timeline: { caseId, bodyText: 'AI 已產生案件分類' },
        client
      });

      return toAIJobDTO(updated);
    });
  }

  async requestDispatchSuggestion(caseId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const caseRow = await this.ensureCase(caseId, client, actor);
      const job = await this.createJob({
        jobType: 'dispatch_suggestion',
        entityType: 'case',
        entityId: caseId,
        organizationId: caseRow.organization_id,
        customerId: caseRow.customer_id,
        caseId,
        requestPayload: { caseNo: caseRow.case_no, note: input.note || null },
        actor,
        client
      });

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'ai.job_requested',
        entityType: 'ai_job',
        entityId: job.id,
        afterData: { jobType: job.job_type, provider: job.provider, entityType: job.entity_type, entityId: job.entity_id },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      const updated = await this.runProviderJob({
        job,
        providerCall: () => this.aiProvider.suggestDispatch({ caseId, case: caseRow }),
        actor,
        req,
        timeline: { caseId, bodyText: 'AI 建議派工' },
        client
      });

      return toAIJobDTO(updated);
    });
  }

  async requestOCR(attachmentId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const { attachment, caseRow } = await this.ensureAttachmentWithCase(attachmentId, client, actor);

      if (!OCR_ATTACHMENT_TYPES.has(attachment.attachment_type)) {
        throw new ValidationError('OCR is only supported for serial_photo and invoice_photo.', [
          { field: 'attachmentType', message: 'OCR is only supported for serial_photo and invoice_photo.', code: 'unsupported_attachment_type' }
        ]);
      }

      const updatedAttachment = await this.attachmentRepository.updateAttachmentStatus(
        attachmentId,
        { ocrStatus: 'processing' },
        client
      );

      const job = await this.createJob({
        jobType: 'ocr',
        entityType: 'attachment',
        entityId: attachmentId,
        organizationId: caseRow.organization_id,
        customerId: caseRow.customer_id,
        caseId: caseRow.id,
        requestPayload: {
          attachmentType: attachment.attachment_type,
          caseId: attachment.case_id,
          note: input.note || null
        },
        actor,
        client
      });

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'attachment.ocr_requested',
        entityType: 'attachment',
        entityId: attachmentId,
        beforeData: { ocrStatus: attachment.ocr_status },
        afterData: { ocrStatus: updatedAttachment.ocr_status, aiJobId: job.id },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'ai.job_requested',
        entityType: 'ai_job',
        entityId: job.id,
        afterData: { jobType: job.job_type, provider: job.provider, entityType: job.entity_type, entityId: job.entity_id },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      const completedJob = await this.runProviderJob({
        job,
        providerCall: () => this.aiProvider.runOCR({ attachmentId, attachment }),
        actor,
        req,
        timeline: { caseId: attachment.case_id, bodyText: 'OCR 完成' },
        client
      });

      await this.attachmentRepository.updateAttachmentOcrResult(
        attachmentId,
        {
          ocrStatus: 'manual_review',
          ocrResult: completedJob.response_payload,
          ocrConfidence: null
        },
        client
      );

      return toAIJobDTO(completedJob);
    });
  }

  async requestServiceReportAnalysis(serviceReportId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const { report, caseRow } = await this.ensureServiceReportWithCase(serviceReportId, client, actor);
      const job = await this.createJob({
        jobType: 'service_report_analysis',
        entityType: 'service_report',
        entityId: serviceReportId,
        organizationId: caseRow.organization_id,
        customerId: caseRow.customer_id,
        caseId: caseRow.id,
        requestPayload: { caseId: report.case_id, note: input.note || null },
        actor,
        client
      });

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'ai.job_requested',
        entityType: 'ai_job',
        entityId: job.id,
        afterData: { jobType: job.job_type, provider: job.provider, entityType: job.entity_type, entityId: job.entity_id },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      const updated = await this.runProviderJob({
        job,
        providerCall: () => this.aiProvider.analyzeServiceReport({ serviceReportId, report }),
        actor,
        req,
        timeline: { caseId: report.case_id, bodyText: 'AI 已產生服務報告分析' },
        client
      });

      return toAIJobDTO(updated);
    });
  }

  async listAIJobs(query = {}, actor = null) {
    const scopedFilter = await this.organizationAccessService.buildScopedFilter(
      actor,
      query.organizationId || null
    );

    const result = await this.aiJobRepository.listAIJobs({
      filters: {
        ...scopedFilter,
        caseId: query.caseId,
        customerId: query.customerId,
        lineChannelId: query.lineChannelId,
        jobType: query.jobType,
        provider: query.provider,
        entityType: query.entityType,
        entityId: query.entityId,
        status: query.status,
        requestedByUserId: query.requestedByUserId
      },
      pagination: { limit: query.limit, offset: query.offset }
    });

    return {
      data: result.rows.map(toAIJobDTO),
      pagination: result.pagination
    };
  }

  async getAIJobById(jobId, actor = null) {
    const job = await this.aiJobRepository.getAIJobById(jobId);
    if (!job) throw new NotFoundError('AI job not found.');
    if (actor) await this.organizationAccessService.assertAccess(actor, job.organization_id);
    return toAIJobDTO(job);
  }
}

module.exports = {
  AIOrchestrationService
};
