const { z } = require('./index');

const uuidSchema = z.string().uuid();
const nonBlankString = z.string().trim().min(1);

const messageTypeEnum = z.enum([
  'internal_note',
  'system_event',
  'customer_note',
  'workflow_event'
]);

const createMessageValidator = {
  params: z.object({ caseId: uuidSchema }),
  body: z.object({
    messageType: messageTypeEnum.default('internal_note'),
    bodyText: nonBlankString,
    attachmentId: uuidSchema.optional()
  }).strict()
};

const listMessagesValidator = {
  params: z.object({ caseId: uuidSchema }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    sort: z.enum(['createdAtAsc', 'createdAtDesc']).default('createdAtAsc')
  }).strict()
};

const deleteMessageValidator = {
  params: z.object({ messageId: uuidSchema })
};

module.exports = {
  createMessageValidator,
  listMessagesValidator,
  deleteMessageValidator
};
