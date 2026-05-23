'use strict';

const PLAN_ROUTE = {
  method: 'POST',
  path: '/repair-intake/drafts/:draftId/case/plan',
};

const SUBMIT_ROUTE = {
  method: 'POST',
  path: '/repair-intake/drafts/:draftId/case/submit',
};

class RepairIntakeDraftCaseRouteFactoryError extends Error {
  constructor(reasonCode, requiredActions = ['configure_controller']) {
    super(reasonCode);
    this.name = 'RepairIntakeDraftCaseRouteFactoryError';
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeFailure(reasonCode, requiredActions = ['retry_or_manual_review']) {
  return {
    ok: false,
    statusCode: 500,
    body: {
      ok: false,
      action: null,
      draftId: null,
      organizationId: null,
      reasonCode,
      requiredActions,
      caseRef: null,
      auditEvent: null,
    },
  };
}

function assertController(controller) {
  if (!isObject(controller)) {
    throw new RepairIntakeDraftCaseRouteFactoryError(
      'REPAIR_INTAKE_DRAFT_CASE_ROUTE_FACTORY_CONTROLLER_REQUIRED',
      ['configure_controller'],
    );
  }
}

async function callController(method, requestLike) {
  if (typeof method !== 'function') {
    return safeFailure(
      'REPAIR_INTAKE_DRAFT_CASE_ROUTE_HANDLER_NOT_CONFIGURED',
      ['configure_controller_method'],
    );
  }

  try {
    return await method(requestLike);
  } catch (error) {
    return safeFailure(
      'REPAIR_INTAKE_DRAFT_CASE_ROUTE_HANDLER_FAILED',
      ['retry_or_manual_review'],
    );
  }
}

function createRepairIntakeDraftCaseRoutes(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const controller = safeOptions.controller;

  assertController(controller);

  return [
    {
      ...PLAN_ROUTE,
      handler: async (requestLike = {}) => callController(controller.planDraftToCase, requestLike),
    },
    {
      ...SUBMIT_ROUTE,
      handler: async (requestLike = {}) => callController(controller.submitDraftToCase, requestLike),
    },
  ];
}

module.exports = {
  RepairIntakeDraftCaseRouteFactoryError,
  createRepairIntakeDraftCaseRoutes,
};
