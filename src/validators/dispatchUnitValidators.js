const { z } = require('./index');

const uuidSchema = z.string().uuid();
const nonBlankString = z.string().trim().min(1);
const statusEnum = z.enum(['active', 'disabled']);
const sortEnum = z.enum(['createdAtDesc', 'createdAtAsc', 'nameAsc']);

const dispatchUnitIdParam = z.object({ dispatchUnitId: uuidSchema });

const createDispatchUnitValidator = {
  body: z.object({
    organizationId: uuidSchema,
    name: nonBlankString,
    code: nonBlankString,
    serviceRegion: nonBlankString.optional(),
    status: statusEnum.default('active'),
    city: nonBlankString.optional(),
    productTypes: z.array(nonBlankString).default([]),
    priority: z.coerce.number().int().min(0).default(100),
    routingRules: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional()
  }).strict()
};

const updateDispatchUnitValidator = {
  params: dispatchUnitIdParam,
  body: z.object({
    name: nonBlankString.optional(),
    code: nonBlankString.optional(),
    serviceRegion: nonBlankString.optional(),
    status: statusEnum.optional(),
    city: nonBlankString.optional(),
    productTypes: z.array(nonBlankString).optional(),
    priority: z.coerce.number().int().min(0).optional(),
    routingRules: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const listDispatchUnitsValidator = {
  query: z.object({
    organizationId: uuidSchema.optional(),
    q: nonBlankString.optional(),
    status: statusEnum.optional(),
    serviceRegion: nonBlankString.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    sort: sortEnum.default('createdAtDesc')
  }).strict()
};

const getDispatchUnitValidator = {
  params: dispatchUnitIdParam
};

module.exports = {
  createDispatchUnitValidator,
  updateDispatchUnitValidator,
  listDispatchUnitsValidator,
  getDispatchUnitValidator
};
