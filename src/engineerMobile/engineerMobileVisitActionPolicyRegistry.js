'use strict';

const {
  ENGINEER_MOBILE_START_TRAVEL_ACTION,
  evaluateEngineerMobileStartTravelAction,
} = require('./engineerMobileStartTravelActionPolicy');
const {
  ENGINEER_MOBILE_ARRIVE_ACTION,
  evaluateEngineerMobileArriveAction,
} = require('./engineerMobileArriveActionPolicy');
const {
  ENGINEER_MOBILE_START_WORK_ACTION,
  evaluateEngineerMobileStartWorkAction,
} = require('./engineerMobileStartWorkActionPolicy');
const {
  ENGINEER_MOBILE_FINISH_WORK_ACTION,
  evaluateEngineerMobileFinishWorkAction,
} = require('./engineerMobileFinishWorkActionPolicy');
const {
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
  evaluateEngineerMobileRecordVisitResultAction,
} = require('./engineerMobileRecordVisitResultActionPolicy');

const ENGINEER_MOBILE_SUPPORTED_VISIT_ACTIONS = Object.freeze([
  ENGINEER_MOBILE_START_TRAVEL_ACTION,
  ENGINEER_MOBILE_ARRIVE_ACTION,
  ENGINEER_MOBILE_START_WORK_ACTION,
  ENGINEER_MOBILE_FINISH_WORK_ACTION,
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
]);

const ENGINEER_MOBILE_VISIT_ACTION_POLICY_REGISTRY = Object.freeze({
  [ENGINEER_MOBILE_START_TRAVEL_ACTION]: evaluateEngineerMobileStartTravelAction,
  [ENGINEER_MOBILE_ARRIVE_ACTION]: evaluateEngineerMobileArriveAction,
  [ENGINEER_MOBILE_START_WORK_ACTION]: evaluateEngineerMobileStartWorkAction,
  [ENGINEER_MOBILE_FINISH_WORK_ACTION]: evaluateEngineerMobileFinishWorkAction,
  [ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION]: evaluateEngineerMobileRecordVisitResultAction,
});

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

  return undefined;
}

function normalizeAction(value) {
  return stringValue(value);
}

function unsupportedActionDecision(action) {
  const safeAction = normalizeAction(action);

  return {
    ok: false,
    allowed: false,
    action: safeAction,
    reasonCode: 'unsupported_action',
    supportedActions: ENGINEER_MOBILE_SUPPORTED_VISIT_ACTIONS,
    auditIntent: {
      type: 'engineer_mobile.action_policy_decision',
      action: safeAction,
      allowed: false,
      reasonCode: 'unsupported_action',
    },
  };
}

function evaluateEngineerMobileVisitAction(options = {}) {
  const source = isObject(options) ? options : {};
  const action = normalizeAction(source.action);
  const evaluator = ENGINEER_MOBILE_VISIT_ACTION_POLICY_REGISTRY[action];

  if (!evaluator) {
    return unsupportedActionDecision(source.action);
  }

  const evaluatorInput = {
    actor: source.actor,
    appointment: source.appointment,
    now: source.now,
  };

  if (action === ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION) {
    evaluatorInput.visitResult = source.visitResult;
  }

  return evaluator(evaluatorInput);
}

module.exports = {
  ENGINEER_MOBILE_VISIT_ACTION_POLICY_REGISTRY,
  ENGINEER_MOBILE_SUPPORTED_VISIT_ACTIONS,
  evaluateEngineerMobileVisitAction,
};
