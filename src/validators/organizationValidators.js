const { z } = require('./index');

const uuidSchema = z.string().uuid();
const nonBlankString = z.string().trim().min(1);
const statusEnum = z.enum(['active', 'disabled']);

const createOrganizationValidator = {
  body: z.object({
    organizationCode: nonBlankString,
    organizationName: nonBlankString,
    status: statusEnum.default('active')
  }).strict()
};

const updateOrganizationValidator = {
  params: z.object({
    organizationId: uuidSchema
  }),
  body: z.object({
    organizationName: nonBlankString.optional(),
    status: statusEnum.optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const listOrganizationsValidator = {
  query: z.object({
    q: nonBlankString.optional(),
    organizationId: uuidSchema.optional(),
    organizationCode: nonBlankString.optional(),
    status: statusEnum.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    sort: z.enum(['createdAtDesc', 'createdAtAsc', 'codeAsc', 'nameAsc']).default('createdAtDesc')
  }).strict()
};

const getOrganizationValidator = {
  params: z.object({
    organizationId: uuidSchema
  })
};

const listUserOrganizationsValidator = {
  params: z.object({
    userId: uuidSchema
  })
};

const assignUserOrganizationValidator = {
  params: z.object({
    userId: uuidSchema
  }),
  body: z.object({
    organizationId: uuidSchema,
    roleNote: nonBlankString.optional()
  }).strict()
};

const removeUserOrganizationValidator = {
  params: z.object({
    userId: uuidSchema,
    organizationId: uuidSchema
  })
};

module.exports = {
  createOrganizationValidator,
  updateOrganizationValidator,
  listOrganizationsValidator,
  getOrganizationValidator,
  listUserOrganizationsValidator,
  assignUserOrganizationValidator,
  removeUserOrganizationValidator
};
