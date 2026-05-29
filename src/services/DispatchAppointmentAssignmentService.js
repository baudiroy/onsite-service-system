'use strict';

const DISPATCH_APPOINTMENT_ASSIGNMENT_SERVICE_KIND = 'admin_dispatch.dispatch_appointment_assignment_service';
const DISPATCH_MANAGE_PERMISSION = 'dispatch.manage';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function optionalString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return stringValue(value) || null;
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function firstString(...values) {
  return values.map(stringValue).find(Boolean);
}

function actorIdFrom(input) {
  const actor = isObject(input.actor) ? input.actor : {};
  const user = isObject(input.user) ? input.user : {};

  return firstString(input.actorId, actor.id, actor.userId, actor.sub, user.id, user.userId, user.sub);
}

function organizationIdFrom(input) {
  const actor = isObject(input.actor) ? input.actor : {};
  const user = isObject(input.user) ? input.user : {};
  const context = isObject(input.context) ? input.context : {};

  return firstString(input.organizationId, actor.organizationId, user.organizationId, context.organizationId);
}

function permissionContextFrom(input) {
  const context = isObject(input.context) ? input.context : {};
  const bodyPermissionContext = isObject(input.permissionContext) ? input.permissionContext : {};
  const contextPermissionContext = isObject(context.permissionContext) ? context.permissionContext : {};

  return {
    ...contextPermissionContext,
    ...bodyPermissionContext,
  };
}

function hasDispatchManagePermission(input) {
  const permissionContext = permissionContextFrom(input);

  if (permissionContext.canManageDispatch === true) {
    return true;
  }

  if (permissionContext.permission === DISPATCH_MANAGE_PERMISSION) {
    return true;
  }

  if (Array.isArray(permissionContext.permissions)) {
    return permissionContext.permissions.includes(DISPATCH_MANAGE_PERMISSION);
  }

  return false;
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    assigned: false,
    serviceKind: DISPATCH_APPOINTMENT_ASSIGNMENT_SERVICE_KIND,
    reasonCode,
    requestId: stringValue(context.requestId),
  });
}

function success(assignment, context = {}) {
  return compactRecord({
    ok: true,
    assigned: true,
    serviceKind: DISPATCH_APPOINTMENT_ASSIGNMENT_SERVICE_KIND,
    reasonCode: 'dispatch_assignment_intent_accepted',
    requestId: stringValue(context.requestId),
    assignment,
    auditContext: {
      actorId: context.actorId,
      organizationId: context.organizationId,
      permission: DISPATCH_MANAGE_PERMISSION,
      requestId: stringValue(context.requestId) || null,
    },
  });
}

function normalizeAssignment(assignment) {
  if (!isObject(assignment)) {
    return undefined;
  }

  return {
    dispatchAssignmentId: stringValue(assignment.dispatchAssignmentId),
    caseId: stringValue(assignment.caseId),
    organizationId: stringValue(assignment.organizationId),
    dispatchUnitId: stringValue(assignment.dispatchUnitId),
    assignedEngineerId: stringValue(assignment.assignedEngineerId) || null,
    dispatchStatus: stringValue(assignment.dispatchStatus) || null,
    assignmentNote: stringValue(assignment.assignmentNote) || null,
    assignedAt: stringValue(assignment.assignedAt) || null,
    assignedByUserId: stringValue(assignment.assignedByUserId) || null,
    reassignedByUserId: stringValue(assignment.reassignedByUserId) || null,
    reassignedAt: stringValue(assignment.reassignedAt) || null,
    updatedAt: stringValue(assignment.updatedAt) || null,
  };
}

function assignmentFromResult(result) {
  return isObject(result) ? normalizeAssignment(result.assignment) : undefined;
}

function readResultFailed(result) {
  if (!isObject(result)) {
    return true;
  }

  return result.ok !== true || result.found !== true;
}

function writeResultFailed(result) {
  if (!isObject(result)) {
    return true;
  }

  return result.ok !== true || result.written !== true;
}

function resolveAssignmentRepository(source) {
  if (!isObject(source)) {
    return undefined;
  }

  return source.assignmentRepository || source.dispatchAssignmentRepository || source.repository;
}

function validateAssignmentCommand(input) {
  const source = isObject(input) ? input : {};
  const requestId = firstString(source.requestId, source.context && source.context.requestId);
  const assignmentId = firstString(source.assignmentId, source.dispatchAssignmentId);
  const organizationId = organizationIdFrom(source);
  const actorId = actorIdFrom(source);
  const dispatchUnitId = stringValue(source.dispatchUnitId);
  const assignedEngineerId = stringValue(source.assignedEngineerId);
  const dispatchStatus = stringValue(source.dispatchStatus);
  const assignmentNote = optionalString(source.assignmentNote);

  if (!assignmentId) {
    return { ok: false, reasonCode: 'dispatch_assignment_id_required', requestId };
  }

  if (!organizationId) {
    return { ok: false, reasonCode: 'organization_id_required', requestId };
  }

  if (!actorId) {
    return { ok: false, reasonCode: 'admin_actor_required', requestId };
  }

  if (!hasDispatchManagePermission(source)) {
    return { ok: false, reasonCode: 'dispatch_permission_context_required', requestId };
  }

  if (!dispatchUnitId && !assignedEngineerId && !dispatchStatus && assignmentNote === undefined) {
    return { ok: false, reasonCode: 'dispatch_assignment_intent_required', requestId };
  }

  return {
    ok: true,
    assignmentId,
    organizationId,
    actorId,
    dispatchUnitId,
    assignedEngineerId,
    dispatchStatus,
    assignmentNote,
    occurredAt: stringValue(source.occurredAt),
    requestId,
  };
}

function createDispatchAppointmentAssignmentService(options = {}) {
  const assignmentRepository = resolveAssignmentRepository(options);

  return {
    kind: DISPATCH_APPOINTMENT_ASSIGNMENT_SERVICE_KIND,

    async assignAppointment(input = {}) {
      if (
        !assignmentRepository
        || typeof assignmentRepository.findAssignmentState !== 'function'
        || typeof assignmentRepository.recordAssignmentIntent !== 'function'
      ) {
        return failure('assignment_repository_required', input);
      }

      const validation = validateAssignmentCommand(input);

      if (!validation.ok) {
        return failure(validation.reasonCode, validation);
      }

      try {
        const readResult = await assignmentRepository.findAssignmentState({
          assignmentId: validation.assignmentId,
          organizationId: validation.organizationId,
          requestId: validation.requestId,
        });

        if (readResultFailed(readResult)) {
          return failure('dispatch_assignment_not_found_or_denied', validation);
        }

        const visibleAssignment = assignmentFromResult(readResult);

        if (!visibleAssignment || visibleAssignment.organizationId !== validation.organizationId) {
          return failure('dispatch_assignment_not_found_or_denied', validation);
        }

        const writeResult = await assignmentRepository.recordAssignmentIntent({
          assignmentId: validation.assignmentId,
          organizationId: validation.organizationId,
          dispatchUnitId: validation.dispatchUnitId,
          assignedEngineerId: validation.assignedEngineerId,
          dispatchStatus: validation.dispatchStatus,
          assignmentNote: validation.assignmentNote,
          actorId: validation.actorId,
          occurredAt: validation.occurredAt,
          requestId: validation.requestId,
        });

        if (writeResultFailed(writeResult)) {
          return failure('dispatch_assignment_write_denied', validation);
        }

        const updatedAssignment = assignmentFromResult(writeResult);

        if (!updatedAssignment || updatedAssignment.organizationId !== validation.organizationId) {
          return failure('dispatch_assignment_write_denied', validation);
        }

        return success(updatedAssignment, validation);
      } catch (caught) {
        return failure('dispatch_assignment_service_failed', validation);
      }
    },
  };
}

module.exports = {
  DISPATCH_APPOINTMENT_ASSIGNMENT_SERVICE_KIND,
  DISPATCH_MANAGE_PERMISSION,
  createDispatchAppointmentAssignmentService,
};
