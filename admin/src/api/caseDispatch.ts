import { apiRequest, apiRequestEnvelope } from '../lib/apiClient';

export type DispatchStatus = 'pending' | 'assigned' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
export type AppointmentStatus = 'scheduled' | 'rescheduled' | 'cancelled' | 'completed' | 'no_show';
export type VisitType = 'repair' | 'installation' | 'inspection';

export type DispatchAssignment = {
  id: string;
  caseId: string;
  dispatchUnitId: string;
  assignedEngineerId?: string | null;
  dispatchStatus: DispatchStatus | string;
  assignmentNote?: string | null;
  assignedAt?: string | null;
  assignedByUserId?: string | null;
  reassignedByUserId?: string | null;
  reassignedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Appointment = {
  id: string;
  caseId: string;
  dispatchAssignmentId?: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string;
  appointmentStatus: AppointmentStatus | string;
  visitType: VisitType | string;
  timezone?: string | null;
  rescheduleReason?: string | null;
  note?: string | null;
  visitSequence?: number | null;
  visitResult?: string | null;
  incompleteReason?: string | null;
  nextAction?: string | null;
  actualArrivalAt?: string | null;
  actualFinishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type RawAppointment = Appointment & {
  visit_sequence?: number | null;
  visit_result?: string | null;
  incomplete_reason?: string | null;
  next_action?: string | null;
  actual_arrival_at?: string | null;
  actual_finished_at?: string | null;
};

export type CreateDispatchAssignmentPayload = {
  dispatchUnitId: string;
  assignedEngineerId?: string;
  assignmentNote?: string;
};

export type UpdateDispatchAssignmentPayload = {
  dispatchUnitId?: string;
  assignedEngineerId?: string;
  assignmentNote?: string;
};

export type ListCaseAppointmentsParams = {
  limit?: number;
  offset?: number;
};

export type PaginatedAppointments = {
  data: Appointment[];
  pagination: {
    limit: number;
    offset: number;
    total?: number;
  };
};

export type CreateCaseAppointmentPayload = {
  scheduledStartAt: string;
  scheduledEndAt: string;
  visitType: VisitType;
  timezone?: string;
  note?: string;
  visitSequence?: number | null;
  visitResult?: string | null;
  incompleteReason?: string | null;
  nextAction?: string | null;
  actualArrivalAt?: string | null;
  actualFinishedAt?: string | null;
};

export type UpdateAppointmentPayload = {
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  appointmentStatus?: AppointmentStatus;
  visitType?: VisitType;
  timezone?: string;
  rescheduleReason?: string;
  note?: string;
  visitSequence?: number | null;
  visitResult?: string | null;
  incompleteReason?: string | null;
  nextAction?: string | null;
  actualArrivalAt?: string | null;
  actualFinishedAt?: string | null;
};

const SENSITIVE_KEYS = [
  'password',
  'password_hash',
  'passwordHash',
  'token',
  'accessToken',
  'channelSecret',
  'channelAccessToken',
  'secret',
  'apiKey',
  'DATABASE_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'R2_SECRET_ACCESS_KEY'
];

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function assertNoSensitiveFields(entity: Record<string, unknown>, label: string) {
  const foundKeys = SENSITIVE_KEYS.filter((key) => key in entity);

  if (foundKeys.length > 0 && import.meta.env.DEV) {
    console.warn(`${label} API response included sensitive field keys. The frontend ignored them.`);
  }
}

function sanitizeDispatchAssignment(assignment: DispatchAssignment): DispatchAssignment {
  assertNoSensitiveFields(assignment as unknown as Record<string, unknown>, 'Dispatch assignment');

  return {
    id: assignment.id,
    caseId: assignment.caseId,
    dispatchUnitId: assignment.dispatchUnitId,
    assignedEngineerId: assignment.assignedEngineerId,
    dispatchStatus: assignment.dispatchStatus,
    assignmentNote: assignment.assignmentNote,
    assignedAt: assignment.assignedAt,
    assignedByUserId: assignment.assignedByUserId,
    reassignedByUserId: assignment.reassignedByUserId,
    reassignedAt: assignment.reassignedAt,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt
  };
}

function sanitizeAppointment(appointment: Appointment): Appointment {
  assertNoSensitiveFields(appointment as unknown as Record<string, unknown>, 'Appointment');
  const rawAppointment = appointment as RawAppointment;

  return {
    id: appointment.id,
    caseId: appointment.caseId,
    dispatchAssignmentId: appointment.dispatchAssignmentId,
    scheduledStartAt: appointment.scheduledStartAt,
    scheduledEndAt: appointment.scheduledEndAt,
    appointmentStatus: appointment.appointmentStatus,
    visitType: appointment.visitType,
    timezone: appointment.timezone,
    rescheduleReason: appointment.rescheduleReason,
    note: appointment.note,
    visitSequence: appointment.visitSequence ?? rawAppointment.visit_sequence,
    visitResult: appointment.visitResult ?? rawAppointment.visit_result,
    incompleteReason: appointment.incompleteReason ?? rawAppointment.incomplete_reason,
    nextAction: appointment.nextAction ?? rawAppointment.next_action,
    actualArrivalAt: appointment.actualArrivalAt ?? rawAppointment.actual_arrival_at,
    actualFinishedAt: appointment.actualFinishedAt ?? rawAppointment.actual_finished_at,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt
  };
}

export async function createDispatchAssignment(caseId: string, payload: CreateDispatchAssignmentPayload) {
  const assignment = await apiRequest<DispatchAssignment>(`/api/v1/admin/cases/${caseId}/dispatch`, {
    method: 'POST',
    body: payload
  });
  return sanitizeDispatchAssignment(assignment);
}

export async function updateDispatchAssignment(caseId: string, payload: UpdateDispatchAssignmentPayload) {
  const assignment = await apiRequest<DispatchAssignment>(`/api/v1/admin/cases/${caseId}/dispatch`, {
    method: 'PATCH',
    body: payload
  });
  return sanitizeDispatchAssignment(assignment);
}

export async function listCaseAppointments(
  caseId: string,
  params: ListCaseAppointmentsParams = {}
): Promise<PaginatedAppointments> {
  const query = buildQuery({
    limit: params.limit ?? 50,
    offset: params.offset ?? 0
  });
  const envelope = await apiRequestEnvelope<Appointment[]>(`/api/v1/admin/cases/${caseId}/appointments${query}`);

  return {
    data: (envelope.data || []).map(sanitizeAppointment),
    pagination: {
      limit: envelope.pagination?.limit ?? params.limit ?? 50,
      offset: envelope.pagination?.offset ?? params.offset ?? 0,
      total: envelope.pagination?.total
    }
  };
}

export async function createCaseAppointment(caseId: string, payload: CreateCaseAppointmentPayload) {
  const appointment = await apiRequest<Appointment>(`/api/v1/admin/cases/${caseId}/appointments`, {
    method: 'POST',
    body: payload
  });
  return sanitizeAppointment(appointment);
}

export async function updateAppointment(appointmentId: string, payload: UpdateAppointmentPayload) {
  const appointment = await apiRequest<Appointment>(`/api/v1/admin/appointments/${appointmentId}`, {
    method: 'PATCH',
    body: payload
  });
  return sanitizeAppointment(appointment);
}
