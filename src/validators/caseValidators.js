const { z } = require('./index');

const uuidSchema = z.string().uuid();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const dateTimeSchema = z.string().datetime({ offset: true });
const nonBlankString = z.string().trim().min(1);

const statusEnum = z.enum([
  'draft',
  'pending_customer',
  'submitted',
  'reviewing',
  'accepted',
  'rejected',
  'cancelled',
  'dispatch_pending',
  'assigned',
  'scheduled',
  'on_site',
  'completed',
  'closed'
]);

const priorityEnum = z.enum(['low', 'normal', 'high', 'urgent', 'vip']);
const warrantyStatusEnum = z.enum([
  'unknown',
  'pending_review',
  'in_warranty',
  'out_of_warranty'
]);
const caseTypeEnum = z.enum([
  'repair',
  'installation',
  'maintenance',
  'inspection',
  'return',
  'warranty',
  'other'
]);
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

const createCaseCustomerSchema = z.object({
  customerId: uuidSchema.optional(),
  customerName: nonBlankString.optional(),
  mobile: nonBlankString.optional(),
  tel: nonBlankString.optional(),
  lineUserId: nonBlankString.optional(),
  city: nonBlankString.optional(),
  address: nonBlankString.optional(),
  source: sourceEnum.default('admin')
}).strict().superRefine((value, ctx) => {
  if (value.customerId) {
    return;
  }

  for (const field of ['customerName', 'mobile', 'city', 'address']) {
    if (!value[field]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${field} is required when customerId is not provided.`
      });
    }
  }
});

const createCaseDetailSchema = z.object({
  source: sourceEnum.default('admin'),
  brand: nonBlankString,
  caseType: caseTypeEnum.default('repair'),
  productType: nonBlankString,
  modelNo: nonBlankString,
  serialNo: nonBlankString.optional(),
  invoiceDate: dateSchema.optional(),
  problemDescription: nonBlankString,
  preferredVisitTime: dateTimeSchema.optional(),
  priority: priorityEnum.default('normal'),
  warrantyStatus: warrantyStatusEnum.default('unknown'),
  serviceRegion: nonBlankString.optional(),
  organizationId: uuidSchema.optional(),
  intakeLineChannelId: uuidSchema.optional()
}).strict();

const createCaseValidator = {
  body: z.object({
    organizationId: uuidSchema.optional(),
    customer: createCaseCustomerSchema,
    case: createCaseDetailSchema
  }).strict()
};

const updateCaseValidator = {
  params: z.object({
    caseId: uuidSchema
  }),
  body: z.object({
    priority: priorityEnum.optional(),
    warrantyStatus: warrantyStatusEnum.optional(),
    brand: nonBlankString.optional(),
    caseType: caseTypeEnum.optional(),
    productType: nonBlankString.optional(),
    modelNo: nonBlankString.optional(),
    serialNo: nonBlankString.nullable().optional(),
    invoiceDate: dateSchema.nullable().optional(),
    problemDescription: nonBlankString.optional(),
    preferredVisitTime: dateTimeSchema.nullable().optional(),
    serviceRegion: nonBlankString.nullable().optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const listCasesValidator = {
  query: z.object({
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    caseType: caseTypeEnum.optional(),
    source: sourceEnum.optional(),
    customerId: uuidSchema.optional(),
    caseNo: nonBlankString.optional(),
    organizationId: uuidSchema.optional(),
    createdFrom: dateTimeSchema.optional(),
    createdTo: dateTimeSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    sort: z.enum([
      'createdAtDesc',
      'createdAtAsc',
      'submittedAtDesc',
      'prioritySubmittedAt',
      'lastCustomerMessageAtDesc',
      'lastInternalActivityAtDesc',
      'scheduledAtAsc'
    ]).default('createdAtDesc')
  }).strict()
};

const getCaseByIdValidator = {
  params: z.object({
    caseId: uuidSchema
  })
};

module.exports = {
  createCaseValidator,
  updateCaseValidator,
  listCasesValidator,
  getCaseByIdValidator
};
