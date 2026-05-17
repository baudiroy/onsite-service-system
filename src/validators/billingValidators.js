const { z } = require('./index');

const uuidSchema = z.string().uuid();
const nonBlankString = z.string().trim().min(1);
const moneySchema = z.coerce.number().min(0);
const dateTimeSchema = z.string().datetime({ offset: true });
const billingStatusEnum = z.enum(['draft', 'pending_review', 'approved', 'submitted', 'settled', 'cancelled']);
const settlementTargetTypeEnum = z.enum(['engineer', 'manufacturer', 'internal', 'vendor', 'distributor', 'partner', 'subcontractor']);
const settlementStatusEnum = z.enum(['pending', 'submitted', 'completed', 'rejected']);

const amountFields = {
  laborAmount: moneySchema.default(0),
  partsAmount: moneySchema.default(0),
  transportAmount: moneySchema.default(0),
  additionalAmount: moneySchema.default(0),
  warrantyAmount: moneySchema.default(0),
  customerChargeAmount: moneySchema.default(0),
  manufacturerClaimAmount: moneySchema.default(0)
};

const createBillingValidator = {
  params: z.object({ caseId: uuidSchema }),
  body: z.object({
    fieldServiceReportId: uuidSchema.optional(),
    ...amountFields,
    totalAmount: moneySchema.optional(),
    billingStatus: billingStatusEnum.default('draft'),
    billingNote: nonBlankString.optional()
  }).strict()
};

const updateBillingValidator = {
  params: z.object({ billingId: uuidSchema }),
  body: z.object({
    laborAmount: moneySchema.optional(),
    partsAmount: moneySchema.optional(),
    transportAmount: moneySchema.optional(),
    additionalAmount: moneySchema.optional(),
    totalAmount: moneySchema.optional(),
    warrantyAmount: moneySchema.optional(),
    customerChargeAmount: moneySchema.optional(),
    manufacturerClaimAmount: moneySchema.optional(),
    billingStatus: billingStatusEnum.optional(),
    billingNote: nonBlankString.optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const createSettlementValidator = {
  params: z.object({ billingId: uuidSchema }),
  body: z.object({
    settlementTargetType: settlementTargetTypeEnum,
    settlementTargetId: uuidSchema.optional(),
    settlementAmount: moneySchema,
    settlementStatus: settlementStatusEnum.default('submitted'),
    settlementRuleCode: nonBlankString.optional(),
    settlementPolicyVersion: nonBlankString.optional(),
    settlementMetadata: z.record(z.any()).optional(),
    settlementNote: nonBlankString.optional(),
    settledAt: dateTimeSchema.optional()
  }).strict()
};

const updateSettlementValidator = {
  params: z.object({ settlementId: uuidSchema }),
  body: z.object({
    settlementTargetType: settlementTargetTypeEnum.optional(),
    settlementTargetId: uuidSchema.optional(),
    settlementAmount: moneySchema.optional(),
    settlementStatus: settlementStatusEnum.optional(),
    settlementRuleCode: nonBlankString.optional(),
    settlementPolicyVersion: nonBlankString.optional(),
    settlementMetadata: z.record(z.any()).optional(),
    settlementNote: nonBlankString.optional(),
    settledAt: dateTimeSchema.optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const listSettlementsValidator = {
  params: z.object({ billingId: uuidSchema }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  }).strict()
};

module.exports = {
  createBillingValidator,
  updateBillingValidator,
  createSettlementValidator,
  updateSettlementValidator,
  listSettlementsValidator
};
