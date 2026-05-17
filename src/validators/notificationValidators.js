const { z } = require('./index');

const uuidSchema = z.string().uuid();
const nonBlankString = z.string().trim().min(1);
const targetTypeEnum = z.enum(['customer', 'user', 'role', 'dispatch_unit', 'system']);
const channelEnum = z.enum(['line', 'sms', 'email', 'in_app']);
const logStatusEnum = z.enum(['pending', 'skipped', 'sent', 'failed']);

const createPreferenceValidator = {
  body: z.object({
    targetType: targetTypeEnum,
    targetId: uuidSchema.optional(),
    eventKey: nonBlankString,
    channel: channelEnum,
    enabled: z.boolean().default(true)
  }).strict().refine((value) => (value.targetType === 'system' ? !value.targetId : Boolean(value.targetId)), {
    message: 'targetId is required unless targetType is system.',
    path: ['targetId']
  })
};

const updatePreferenceValidator = {
  params: z.object({ preferenceId: uuidSchema }),
  body: z.object({
    eventKey: nonBlankString.optional(),
    channel: channelEnum.optional(),
    enabled: z.boolean().optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const listPreferencesValidator = {
  query: z.object({
    targetType: targetTypeEnum.optional(),
    targetId: uuidSchema.optional(),
    eventKey: nonBlankString.optional(),
    channel: channelEnum.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  }).strict()
};

const createTemplateValidator = {
  body: z.object({
    eventKey: nonBlankString,
    channel: channelEnum,
    templateName: nonBlankString,
    subject: nonBlankString.optional(),
    bodyTemplate: nonBlankString,
    enabled: z.boolean().default(true),
    version: z.coerce.number().int().min(1).default(1)
  }).strict()
};

const updateTemplateValidator = {
  params: z.object({ templateId: uuidSchema }),
  body: z.object({
    templateName: nonBlankString.optional(),
    subject: nonBlankString.optional(),
    bodyTemplate: nonBlankString.optional(),
    enabled: z.boolean().optional(),
    version: z.coerce.number().int().min(1).optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const listTemplatesValidator = {
  query: z.object({
    eventKey: nonBlankString.optional(),
    channel: channelEnum.optional(),
    enabled: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  }).strict()
};

const listLogsValidator = {
  query: z.object({
    eventKey: nonBlankString.optional(),
    channel: channelEnum.optional(),
    targetType: targetTypeEnum.optional(),
    targetId: uuidSchema.optional(),
    status: logStatusEnum.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  }).strict()
};

module.exports = {
  createPreferenceValidator,
  updatePreferenceValidator,
  listPreferencesValidator,
  createTemplateValidator,
  updateTemplateValidator,
  listTemplatesValidator,
  listLogsValidator
};
