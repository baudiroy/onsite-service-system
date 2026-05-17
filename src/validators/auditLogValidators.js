const { z } = require('./index');

const uuidSchema = z.string().uuid();
const nonBlankString = z.string().trim().min(1);
const dateTimeSchema = z.string().datetime({ offset: true });
const sortEnum = z.enum(['createdAtDesc', 'createdAtAsc']);

const listAuditLogsValidator = {
  query: z.object({
    actorUserId: uuidSchema.optional(),
    action: nonBlankString.optional(),
    entityType: nonBlankString.optional(),
    entityId: uuidSchema.optional(),
    organizationId: uuidSchema.optional(),
    requestId: nonBlankString.optional(),
    createdFrom: dateTimeSchema.optional(),
    createdTo: dateTimeSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    sort: sortEnum.default('createdAtDesc')
  }).strict()
};

const getAuditLogValidator = {
  params: z.object({ auditLogId: uuidSchema })
};

module.exports = {
  listAuditLogsValidator,
  getAuditLogValidator
};
