const { z } = require('./index');

const uuidSchema = z.string().uuid();
const nonBlankString = z.string().trim().min(1);

const createLineChannelValidator = {
  body: z.object({
    organizationId: uuidSchema,
    channelCode: nonBlankString.regex(/^[a-zA-Z0-9_-]+$/),
    channelName: nonBlankString,
    channelId: nonBlankString.optional(),
    channelSecret: nonBlankString,
    channelAccessToken: nonBlankString.optional(),
    webhookPath: nonBlankString.optional(),
    enabled: z.boolean().default(true)
  }).strict()
};

const updateLineChannelValidator = {
  params: z.object({ channelId: uuidSchema }),
  body: z.object({
    channelName: nonBlankString.optional(),
    channelId: nonBlankString.optional(),
    channelSecret: nonBlankString.optional(),
    channelAccessToken: nonBlankString.optional(),
    webhookPath: nonBlankString.optional(),
    enabled: z.boolean().optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const listCustomerLineIdentitiesValidator = {
  params: z.object({
    customerId: uuidSchema
  })
};

const linkCustomerLineIdentityValidator = {
  params: z.object({
    customerId: uuidSchema
  }),
  body: z.object({
    lineChannelId: uuidSchema,
    lineUserId: nonBlankString,
    displayName: nonBlankString.optional()
  }).strict()
};

const unlinkCustomerLineIdentityValidator = {
  params: z.object({
    customerId: uuidSchema,
    identityId: uuidSchema
  })
};

const listLineChannelsValidator = {
  query: z.object({
    organizationId: uuidSchema.optional(),
    channelCode: nonBlankString.optional(),
    enabled: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  }).strict()
};

const lineWebhookValidator = {
  params: z.object({ channelCode: nonBlankString })
};

module.exports = {
  createLineChannelValidator,
  updateLineChannelValidator,
  listLineChannelsValidator,
  listCustomerLineIdentitiesValidator,
  linkCustomerLineIdentityValidator,
  unlinkCustomerLineIdentityValidator,
  lineWebhookValidator
};
