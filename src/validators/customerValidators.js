const { z } = require('./index');

const uuidSchema = z.string().uuid();
const nonBlankString = z.string().trim().min(1);
const optionalNullableString = z.string().trim().min(1).nullable().optional();

const sourceEnum = z.enum([
  'line',
  'website',
  'admin',
  'api',
  'migration',
  'phone',
  'whatsapp',
  'facebook',
  'instagram',
  'email'
]);

const createCustomerValidator = {
  body: z.object({
    organizationId: uuidSchema.optional(),
    customerName: nonBlankString,
    mobile: nonBlankString,
    tel: nonBlankString.optional(),
    lineUserId: nonBlankString.optional(),
    city: nonBlankString,
    address: nonBlankString,
    source: sourceEnum.default('admin')
  }).strict()
};

const updateCustomerValidator = {
  params: z.object({
    customerId: uuidSchema
  }),
  body: z.object({
    organizationId: uuidSchema.optional(),
    customerName: nonBlankString.optional(),
    mobile: nonBlankString.optional(),
    tel: optionalNullableString,
    lineUserId: optionalNullableString,
    city: nonBlankString.optional(),
    address: nonBlankString.optional(),
    source: sourceEnum.optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const listCustomersValidator = {
  query: z.object({
    organizationId: uuidSchema.optional(),
    q: nonBlankString.optional(),
    mobile: nonBlankString.optional(),
    lineUserId: nonBlankString.optional(),
    city: nonBlankString.optional(),
    source: sourceEnum.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    sort: z.enum(['createdAtDesc', 'createdAtAsc', 'updatedAtDesc', 'nameAsc']).default('createdAtDesc')
  }).strict()
};

const getCustomerByIdValidator = {
  params: z.object({
    customerId: uuidSchema
  })
};

const getCustomerCasesValidator = {
  params: z.object({
    customerId: uuidSchema
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    sort: z.enum(['createdAtDesc', 'createdAtAsc', 'submittedAtDesc']).default('createdAtDesc')
  }).strict()
};

module.exports = {
  createCustomerValidator,
  updateCustomerValidator,
  listCustomersValidator,
  getCustomerByIdValidator,
  getCustomerCasesValidator
};
