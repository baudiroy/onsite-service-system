'use strict';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function blocked(reasonCode, requiredActions, sanitizedCommand = null) {
  return {
    ok: false,
    reasonCode,
    requiredActions,
    sanitizedCommand,
  };
}

function approvalAccepted(input) {
  const approvalContext = isObject(input.approvalContext) ? input.approvalContext : {};

  return approvalContext.accepted === true || input.humanApproved === true || input.platformAccepted === true;
}

function permissionAccepted(input) {
  const permissionContext = isObject(input.permissionContext) ? input.permissionContext : {};

  return permissionContext.canCreateCaseFromRepairIntakeDraft === true;
}

function sanitizedCommand(input) {
  const approvalContext = isObject(input.approvalContext) ? input.approvalContext : {};
  const permissionContext = isObject(input.permissionContext) ? input.permissionContext : {};

  return {
    draftId: stringValue(input.draftId),
    organizationId: stringValue(input.organizationId),
    actorId: stringValue(input.actorId),
    requestId: stringValue(input.requestId),
    idempotencyKey: stringValue(input.idempotencyKey),
    approvalContext: {
      accepted: approvalAccepted(input),
      approvalId: stringValue(approvalContext.approvalId),
      acceptedByActorId: stringValue(approvalContext.acceptedByActorId),
    },
    permissionContext: {
      canCreateCaseFromRepairIntakeDraft: permissionAccepted(input),
      permissionSource: stringValue(permissionContext.permissionSource),
    },
  };
}

function validateRepairIntakeDraftCaseSubmissionCommand(input = {}) {
  if (!isObject(input)) {
    return blocked('SUBMISSION_COMMAND_MISSING', ['provide_submission_command']);
  }

  const command = sanitizedCommand(input);

  if (!command.draftId) {
    return blocked('SUBMISSION_COMMAND_DRAFT_ID_MISSING', ['provide_draft_id'], command);
  }

  if (!command.organizationId) {
    return blocked('SUBMISSION_COMMAND_ORGANIZATION_MISSING', ['provide_organization_scope'], command);
  }

  if (!command.actorId) {
    return blocked('SUBMISSION_COMMAND_ACTOR_MISSING', ['provide_actor_id'], command);
  }

  if (!command.idempotencyKey) {
    return blocked('SUBMISSION_COMMAND_IDEMPOTENCY_KEY_MISSING', ['provide_idempotency_key'], command);
  }

  if (command.approvalContext.accepted !== true) {
    return blocked('SUBMISSION_COMMAND_APPROVAL_MISSING', ['record_human_or_platform_approval'], command);
  }

  if (command.permissionContext.canCreateCaseFromRepairIntakeDraft !== true) {
    return blocked('SUBMISSION_COMMAND_PERMISSION_MISSING', ['confirm_case_creation_permission'], command);
  }

  return {
    ok: true,
    reasonCode: 'SUBMISSION_COMMAND_ACCEPTED',
    requiredActions: [],
    sanitizedCommand: command,
  };
}

module.exports = {
  validateRepairIntakeDraftCaseSubmissionCommand,
};
