const { z } = require('./index');

const uuidSchema = z.string().uuid();
const nonBlankString = z.string().trim().min(1);
const dateTimeSchema = z.string().datetime({ offset: true });

const dispatchStatusEnum = z.enum(['pending', 'assigned', 'accepted', 'rejected', 'cancelled', 'completed']);
const appointmentStatusEnum = z.enum(['scheduled', 'rescheduled', 'cancelled', 'completed', 'no_show']);
const visitTypeEnum = z.enum(['repair', 'installation', 'inspection']);
const visitResultEnum = z.enum([
  'completed',
  'pending_parts',
  'pending_quote',
  'need_second_visit',
  'customer_not_home',
  'customer_cancelled',
  'unable_to_repair',
  'rescheduled',
  'no_show'
]);
const nextActionEnum = z.enum([
  'close_case',
  'schedule_follow_up',
  'wait_for_parts',
  'wait_for_quote_approval',
  'contact_customer',
  'manager_review',
  'no_action'
]);

const caseIdParam = z.object({ caseId: uuidSchema });

const createDispatchValidator = {
  params: caseIdParam,
  body: z.object({
    dispatchUnitId: uuidSchema,
    assignedEngineerId: uuidSchema.optional(),
    assignmentNote: nonBlankString.optional()
  }).strict()
};

const updateDispatchValidator = {
  params: caseIdParam,
  body: z.object({
    dispatchUnitId: uuidSchema.optional(),
    assignedEngineerId: uuidSchema.optional(),
    dispatchStatus: dispatchStatusEnum.optional(),
    assignmentNote: nonBlankString.optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const createAppointmentValidator = {
  params: caseIdParam,
  body: z.object({
    dispatchAssignmentId: uuidSchema.optional(),
    scheduledStartAt: dateTimeSchema,
    scheduledEndAt: dateTimeSchema,
    visitType: visitTypeEnum,
    timezone: nonBlankString.default('Asia/Taipei'),
    note: nonBlankString.optional(),
    visitSequence: z.number().int().min(1).optional(),
    visitResult: visitResultEnum.optional(),
    incompleteReason: nonBlankString.optional(),
    nextAction: nextActionEnum.optional(),
    actualArrivalAt: dateTimeSchema.optional(),
    actualFinishedAt: dateTimeSchema.optional()
  }).strict()
};

const updateAppointmentValidator = {
  params: z.object({ appointmentId: uuidSchema }),
  body: z.object({
    scheduledStartAt: dateTimeSchema.optional(),
    scheduledEndAt: dateTimeSchema.optional(),
    appointmentStatus: appointmentStatusEnum.optional(),
    visitType: visitTypeEnum.optional(),
    timezone: nonBlankString.optional(),
    rescheduleReason: nonBlankString.optional(),
    note: nonBlankString.optional(),
    visitSequence: z.number().int().min(1).optional(),
    visitResult: visitResultEnum.optional(),
    incompleteReason: nonBlankString.optional(),
    nextAction: nextActionEnum.optional(),
    actualArrivalAt: dateTimeSchema.optional(),
    actualFinishedAt: dateTimeSchema.optional()
  }).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  })
};

const listAppointmentsValidator = {
  params: caseIdParam,
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  }).strict()
};

module.exports = {
  createDispatchValidator,
  updateDispatchValidator,
  createAppointmentValidator,
  updateAppointmentValidator,
  listAppointmentsValidator
};
