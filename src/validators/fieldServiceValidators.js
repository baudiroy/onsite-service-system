const { z } = require('./index');

const uuidSchema = z.string().uuid();
const nonBlankString = z.string().trim().min(1);
const dateTimeSchema = z.string().datetime({ offset: true });
const serviceStatusEnum = z.enum(['in_progress', 'pending_parts', 'completed', 'cancelled']);
const partStatusEnum = z.enum(['planned', 'used', 'replaced', 'returned', 'cancelled']);

const caseIdParam = z.object({ caseId: uuidSchema });
const reportIdParam = z.object({ reportId: uuidSchema });
const partIdParam = z.object({ partId: uuidSchema });

const createServiceReportValidator = {
  params: caseIdParam,
  body: z.object({
    diagnosisResult: nonBlankString.optional(),
    repairAction: nonBlankString.optional(),
    repairResult: nonBlankString.optional(),
    engineerNote: nonBlankString.optional(),
    customerNote: nonBlankString.optional(),
    installationChecklist: z.record(z.any()).optional(),
    onsiteStartedAt: dateTimeSchema.optional(),
    finalAppointmentId: uuidSchema.nullable().optional()
  }).strict()
};

const updateServiceReportValidator = {
  params: reportIdParam,
  body: z.object({
    diagnosisResult: nonBlankString.optional(),
    repairAction: nonBlankString.optional(),
    repairResult: nonBlankString.optional(),
    serviceStatus: serviceStatusEnum.optional(),
    engineerNote: nonBlankString.optional(),
    customerNote: nonBlankString.optional(),
    installationChecklist: z.record(z.any()).optional(),
    onsiteStartedAt: dateTimeSchema.optional(),
    onsiteCompletedAt: dateTimeSchema.optional(),
    finalAppointmentId: uuidSchema.nullable().optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const createServicePartValidator = {
  params: reportIdParam,
  body: z.object({
    partName: nonBlankString,
    partNo: nonBlankString.optional(),
    quantity: z.coerce.number().int().min(1).default(1),
    oldSerialNo: nonBlankString.optional(),
    newSerialNo: nonBlankString.optional(),
    partStatus: partStatusEnum.default('planned'),
    replacedAt: dateTimeSchema.optional()
  }).strict()
};

const updateServicePartValidator = {
  params: partIdParam,
  body: z.object({
    partName: nonBlankString.optional(),
    partNo: nonBlankString.optional(),
    quantity: z.coerce.number().int().min(1).optional(),
    oldSerialNo: nonBlankString.optional(),
    newSerialNo: nonBlankString.optional(),
    partStatus: partStatusEnum.optional(),
    replacedAt: dateTimeSchema.optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const listServicePartsValidator = {
  params: reportIdParam,
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  }).strict()
};

module.exports = {
  createServiceReportValidator,
  updateServiceReportValidator,
  createServicePartValidator,
  updateServicePartValidator,
  listServicePartsValidator
};
