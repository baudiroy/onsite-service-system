const { z } = require('./index');

const uuidSchema = z.string().uuid();
const nonBlankString = z.string().trim().min(1);
const checksumSchema = z.string().regex(/^[a-fA-F0-9]{64}$/);

const attachmentTypeEnum = z.enum([
  'fault_photo',
  'serial_photo',
  'invoice_photo',
  'product_photo',
  'issue_photo',
  'completion_photo',
  'signature',
  'other'
]);

const sourceChannelEnum = z.enum([
  'line',
  'website',
  'admin',
  'api',
  'phone',
  'whatsapp',
  'facebook',
  'instagram',
  'email'
]);

const uploadUrlValidator = {
  params: z.object({ caseId: uuidSchema }),
  body: z.object({
    attachmentType: attachmentTypeEnum,
    originalFilename: nonBlankString,
    contentType: nonBlankString,
    byteSize: z.number().int().min(0).optional(),
    checksumSha256: checksumSchema.optional(),
    sourceChannel: sourceChannelEnum.default('admin'),
    ttlSeconds: z.number().int().min(60).max(3600).optional()
  }).strict()
};

const completeUploadValidator = {
  params: z.object({ caseId: uuidSchema }),
  body: z.object({
    attachmentId: uuidSchema,
    byteSize: z.number().int().min(0).optional(),
    checksumSha256: checksumSchema.optional(),
    objectVersion: nonBlankString.optional()
  }).strict()
};

const listCaseAttachmentsValidator = {
  params: z.object({ caseId: uuidSchema })
};

const attachmentIdValidator = {
  params: z.object({ attachmentId: uuidSchema })
};

const downloadUrlValidator = {
  params: z.object({ attachmentId: uuidSchema }),
  body: z.object({
    ttlSeconds: z.number().int().min(60).max(3600).optional()
  }).strict()
};

const requestOcrValidator = {
  params: z.object({ attachmentId: uuidSchema }),
  body: z.object({}).strict()
};

module.exports = {
  uploadUrlValidator,
  completeUploadValidator,
  listCaseAttachmentsValidator,
  attachmentIdValidator,
  downloadUrlValidator,
  requestOcrValidator
};
