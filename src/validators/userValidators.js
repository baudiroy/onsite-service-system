const { z } = require('./index');

const uuidSchema = z.string().uuid();
const nonBlankString = z.string().trim().min(1);
const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase());
const statusEnum = z.enum(['active', 'disabled']);
const userTypeEnum = z.enum(['admin', 'customer_service', 'dispatch_manager', 'engineer', 'auditor', 'system']);
const sortEnum = z.enum(['createdAtDesc', 'createdAtAsc', 'emailAsc']);

const userIdParam = z.object({ userId: uuidSchema });

const createUserValidator = {
  body: z.object({
    email: emailSchema,
    password: z.string().min(8).max(200),
    displayName: nonBlankString,
    status: statusEnum.default('active'),
    userType: userTypeEnum.default('customer_service')
  }).strict()
};

const updateUserValidator = {
  params: userIdParam,
  body: z.object({
    displayName: nonBlankString.optional(),
    status: statusEnum.optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const listUsersValidator = {
  query: z.object({
    q: nonBlankString.optional(),
    email: emailSchema.optional(),
    status: statusEnum.optional(),
    roleId: uuidSchema.optional(),
    organizationId: uuidSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    sort: sortEnum.default('createdAtDesc')
  }).strict()
};

const getUserValidator = {
  params: userIdParam
};

const assignUserRoleValidator = {
  params: userIdParam,
  body: z.object({
    roleId: uuidSchema
  }).strict()
};

const removeUserRoleValidator = {
  params: z.object({
    userId: uuidSchema,
    roleId: uuidSchema
  })
};

module.exports = {
  createUserValidator,
  updateUserValidator,
  listUsersValidator,
  getUserValidator,
  assignUserRoleValidator,
  removeUserRoleValidator
};
