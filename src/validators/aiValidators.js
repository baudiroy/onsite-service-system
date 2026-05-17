const { z } = require('./index');

const uuidSchema = z.string().uuid();
const nonBlankString = z.string().trim().min(1);
const jobTypeEnum = z.enum(['case_summary', 'case_classification', 'dispatch_suggestion', 'ocr', 'service_report_analysis', 'billing_analysis']);
const entityTypeEnum = z.enum(['case', 'attachment', 'service_report', 'billing_record']);
const jobStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']);

const caseAIRequestValidator = {
  params: z.object({ caseId: uuidSchema }),
  body: z.object({
    note: nonBlankString.optional()
  }).strict()
};

const ocrRequestValidator = {
  params: z.object({ attachmentId: uuidSchema }),
  body: z.object({
    note: nonBlankString.optional()
  }).strict()
};

const listAIJobsValidator = {
  query: z.object({
    jobType: jobTypeEnum.optional(),
    provider: nonBlankString.optional(),
    entityType: entityTypeEnum.optional(),
    entityId: uuidSchema.optional(),
    organizationId: uuidSchema.optional(),
    caseId: uuidSchema.optional(),
    customerId: uuidSchema.optional(),
    lineChannelId: uuidSchema.optional(),
    status: jobStatusEnum.optional(),
    requestedByUserId: uuidSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  }).strict()
};

const getAIJobValidator = {
  params: z.object({ jobId: uuidSchema })
};

module.exports = {
  caseAIRequestValidator,
  ocrRequestValidator,
  listAIJobsValidator,
  getAIJobValidator
};
