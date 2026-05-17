const { z } = require('./index');

const uuidSchema = z.string().uuid();
const noteSchema = z.string().trim().min(1).max(1000);
const reasonSchema = z.string().trim().min(1).max(1000);

const caseIdParamsSchema = z.object({
  caseId: uuidSchema
});

const optionalNoteBodySchema = z.object({
  note: noteSchema.optional()
}).strict();

const requiredReasonBodySchema = z.object({
  reason: reasonSchema,
  note: noteSchema.optional()
}).strict();

const submitCaseValidator = {
  params: caseIdParamsSchema,
  body: optionalNoteBodySchema
};

const reviewCaseValidator = {
  params: caseIdParamsSchema,
  body: optionalNoteBodySchema
};

const acceptCaseValidator = {
  params: caseIdParamsSchema,
  body: optionalNoteBodySchema
};

const closeCaseValidator = {
  params: caseIdParamsSchema,
  body: optionalNoteBodySchema
};

const rejectCaseValidator = {
  params: caseIdParamsSchema,
  body: requiredReasonBodySchema
};

const cancelCaseValidator = {
  params: caseIdParamsSchema,
  body: requiredReasonBodySchema
};

module.exports = {
  submitCaseValidator,
  reviewCaseValidator,
  acceptCaseValidator,
  rejectCaseValidator,
  cancelCaseValidator,
  closeCaseValidator
};
