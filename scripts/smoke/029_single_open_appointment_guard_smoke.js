#!/usr/bin/env node

const API_BASE_URL = (process.env.API_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
const { createSmokeMarker } = require('./helpers/smokeMarker');

const smokeMarker = createSmokeMarker({
  taskCode: 'Task061',
  smokeName: 'smoke029',
  runId: process.env.SMOKE_RUN_ID
});
const { smokeRunId, shortSmokeRunId, smokePrefix } = smokeMarker;
const fixture = {
  organizationCode: `task061-smoke029-org-${smokeRunId}`,
  organizationName: `Task061 Smoke029 Single Open Appointment Guard Organization ${smokeRunId}`,
  dispatchUnitCode: `task061-smoke029-du-${smokeRunId}`,
  dispatchUnitName: `Task061 Smoke029 Dispatch Unit ${smokeRunId}`,
  customerName: `Task061 Smoke029 Guard Customer ${smokeRunId}`,
  customerMobile: `090061${Date.now().toString().slice(-6)}`,
  otherCustomerName: `Task061 Smoke029 Cross Case Customer ${smokeRunId}`,
  otherCustomerMobile: `090161${Date.now().toString().slice(-6)}`,
  dispatchMismatchCustomerName: `Task061 Smoke029 Dispatch Mismatch Customer ${smokeRunId}`,
  dispatchMismatchCustomerMobile: `090361${Date.now().toString().slice(-6)}`,
  actualTimeCustomerName: `Task061 Smoke029 Actual Time Customer ${smokeRunId}`,
  actualTimeCustomerMobile: `090461${Date.now().toString().slice(-6)}`,
  reopenCustomerName: `Task061 Smoke029 Reopen Guard Customer ${smokeRunId}`,
  reopenCustomerMobile: `090261${Date.now().toString().slice(-6)}`,
  caseModelNoPrefix: `T061-${shortSmokeRunId}`,
  caseProblemDescription: (marker) => `${smokePrefix} single open appointment guard ${marker}`,
  dispatchNote: (marker) => `${smokePrefix} dispatch ${marker}`,
  appointmentNote: (sequence) => `${smokePrefix} appointment ${sequence}`,
  workflowNote: (action) => `${smokePrefix} ${action}`,
  rescheduleReason: `${smokePrefix} reschedule same appointment`,
  pendingPartsReason: `${smokePrefix} pending parts`,
  diagnosisResult: `${smokePrefix} diagnosis`,
  repairAction: `${smokePrefix} repair action`,
  engineerNote: `${smokePrefix} engineer note`,
  repairResult: `${smokePrefix} final repair result`
};

const state = {
  organizationId: null,
  dispatchUnitId: null,
  dispatchAssignmentId: null,
  caseId: null,
  caseNo: null,
  otherCaseId: null,
  dispatchMismatchCaseId: null,
  dispatchMismatchAssignmentId: null,
  actualTimeCaseId: null,
  actualTimeAppointmentId: null,
  appointmentOneId: null,
  appointmentTwoId: null,
  otherAppointmentId: null,
  reopenCaseId: null,
  reopenAppointmentOneId: null,
  reopenAppointmentTwoId: null,
  serviceReportId: null
};

const results = [];

function redact(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact);

  const redacted = {};
  for (const [key, item] of Object.entries(value)) {
    if (/password|token|secret|mobile/i.test(key)) {
      redacted[key] = '[REDACTED]';
    } else if (item && typeof item === 'object') {
      redacted[key] = redact(item);
    } else {
      redacted[key] = item;
    }
  }
  return redacted;
}

function hasSensitiveKey(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasSensitiveKey);

  return Object.entries(value).some(([key, item]) => {
    if (/password|token|secret|mobile|lineUserId/i.test(key)) return true;
    return item && typeof item === 'object' && hasSensitiveKey(item);
  });
}

function pass(name, details = {}) {
  results.push({ name, status: 'PASS', details });
  console.log(`PASS ${name}`, details);
}

function fail(name, error, details = {}) {
  const message = error instanceof Error ? error.message : String(error);
  results.push({ name, status: 'FAIL', error: message, details });
  console.error(`FAIL ${name}`, { error: message, ...details });
}

async function test(name, fn) {
  try {
    const details = await fn();
    pass(name, details);
  } catch (error) {
    fail(name, error);
  }
}

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { status: res.status, ok: res.ok, json };
}

function responseSummary(response) {
  return {
    status: response.status,
    body: redact(response.json)
  };
}

function requireOk(response, label) {
  if (!response.ok) {
    throw new Error(`${label} failed: ${JSON.stringify(responseSummary(response))}`);
  }
  return response.json?.data;
}

function requireFailure(response, label, expectedStatuses = [400, 409]) {
  if (response.ok) {
    throw new Error(`${label} unexpectedly succeeded: ${JSON.stringify(redact(response.json?.data))}`);
  }

  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${label} failed with unexpected status: ${JSON.stringify(responseSummary(response))}`);
  }

  if (hasSensitiveKey(response.json)) {
    throw new Error(`${label} error response included a sensitive key.`);
  }

  return {
    status: response.status,
    code: response.json?.error?.code || response.json?.code || null,
    message: response.json?.error?.message || response.json?.message || null
  };
}

async function login() {
  const response = await api('/api/v1/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  });

  if (!response.ok || !response.json?.data?.accessToken) {
    throw new Error(`Admin login failed: ${JSON.stringify(responseSummary(response))}`);
  }

  return response.json.data.accessToken;
}

function isoMinutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

async function transitionCase(token, caseId, action) {
  return requireOk(await api(`/api/v1/admin/cases/${caseId}/${action}`, {
    method: 'POST',
    token,
    body: { note: fixture.workflowNote(action) }
  }), `${action} case`);
}

async function prepareCaseForDispatch(token, marker, customerName, customerMobile) {
  const adminCase = requireOk(await api('/api/v1/admin/cases', {
    method: 'POST',
    token,
    body: {
      organizationId: state.organizationId,
      customer: {
        customerName,
        mobile: customerMobile,
        city: 'Taipei',
        address: `Task061 Test Address ${marker}`,
        source: 'admin'
      },
      case: {
        source: 'admin',
        brand: 'Task061 Brand',
        caseType: 'repair',
        productType: 'TV',
        modelNo: `${fixture.caseModelNoPrefix}-${marker}`,
        problemDescription: fixture.caseProblemDescription(marker),
        priority: 'normal',
        warrantyStatus: 'unknown',
        serviceRegion: 'north'
      }
    }
  }), `create case ${marker}`);

  await transitionCase(token, adminCase.id, 'submit');
  await transitionCase(token, adminCase.id, 'review');
  await transitionCase(token, adminCase.id, 'accept');

  const dispatchAssignment = requireOk(await api(`/api/v1/admin/cases/${adminCase.id}/dispatch`, {
    method: 'POST',
    token,
    body: {
      dispatchUnitId: state.dispatchUnitId,
      assignmentNote: fixture.dispatchNote(marker)
    }
  }), `create dispatch ${marker}`);

  return {
    ...adminCase,
    dispatchAssignmentId: dispatchAssignment.id
  };
}

async function createAppointmentResponse(token, caseId, sequence, startOffsetMinutes, overrides = {}) {
  return api(`/api/v1/admin/cases/${caseId}/appointments`, {
    method: 'POST',
    token,
    body: {
      scheduledStartAt: isoMinutesFromNow(startOffsetMinutes),
      scheduledEndAt: isoMinutesFromNow(startOffsetMinutes + 60),
      visitType: 'repair',
      timezone: 'Asia/Taipei',
      visitSequence: sequence,
      note: fixture.appointmentNote(sequence),
      ...overrides
    }
  });
}

async function createAppointment(token, caseId, sequence, startOffsetMinutes) {
  return requireOk(
    await createAppointmentResponse(token, caseId, sequence, startOffsetMinutes),
    `create appointment ${sequence}`
  );
}

async function updateAppointment(token, appointmentId, payload, label) {
  return requireOk(await api(`/api/v1/admin/appointments/${appointmentId}`, {
    method: 'PATCH',
    token,
    body: payload
  }), label);
}

async function getCase(token, caseId) {
  return requireOk(await api(`/api/v1/admin/cases/${caseId}`, { token }), 'get case');
}

async function main() {
  console.log('Task 061 single open appointment guard smoke config', {
    taskCode: 'Task061',
    smokeName: 'smoke029',
    smokeRunId,
    apiBaseUrl: API_BASE_URL,
    adminEmail: ADMIN_EMAIL
  });

  let adminToken;

  await test('admin login', async () => {
    adminToken = await login();
    return { tokenReceived: true };
  });

  await test('create organization and dispatch unit', async () => {
    if (!adminToken) throw new Error('Admin token is required.');
    const organization = requireOk(await api('/api/v1/admin/organizations', {
      method: 'POST',
      token: adminToken,
      body: {
        organizationCode: fixture.organizationCode,
        organizationName: fixture.organizationName,
        status: 'active'
      }
    }), 'create organization');

    state.organizationId = organization.id;

    const dispatchUnit = requireOk(await api('/api/v1/admin/dispatch-units', {
      method: 'POST',
      token: adminToken,
      body: {
        organizationId: state.organizationId,
        name: fixture.dispatchUnitName,
        code: fixture.dispatchUnitCode,
        serviceRegion: 'north',
        status: 'active'
      }
    }), 'create dispatch unit');

    state.dispatchUnitId = dispatchUnit.id;
    return { organizationId: state.organizationId, dispatchUnitId: state.dispatchUnitId };
  });

  await test('create primary case and move to dispatch ready state', async () => {
    if (!adminToken || !state.organizationId || !state.dispatchUnitId) {
      throw new Error('Admin token, organization, and dispatch unit are required.');
    }
    const adminCase = await prepareCaseForDispatch(
      adminToken,
      'primary',
      fixture.customerName,
      fixture.customerMobile
    );
    state.caseId = adminCase.id;
    state.caseNo = adminCase.caseNo;
    state.dispatchAssignmentId = adminCase.dispatchAssignmentId;
    return { caseId: state.caseId, caseNo: state.caseNo, dispatchAssignmentId: state.dispatchAssignmentId };
  });

  await test('cross-case dispatchAssignmentId is rejected during appointment creation', async () => {
    if (!adminToken || !state.caseId) throw new Error('Admin token and primary case are required.');
    const dispatchMismatchCase = await prepareCaseForDispatch(
      adminToken,
      'dispatch-mismatch',
      fixture.dispatchMismatchCustomerName,
      fixture.dispatchMismatchCustomerMobile
    );
    state.dispatchMismatchCaseId = dispatchMismatchCase.id;
    state.dispatchMismatchAssignmentId = dispatchMismatchCase.dispatchAssignmentId;

    const response = await createAppointmentResponse(adminToken, state.caseId, 1, 60, {
      dispatchAssignmentId: state.dispatchMismatchAssignmentId
    });
    const failure = requireFailure(response, 'create appointment with cross-case dispatch assignment', [400]);
    if (!failure.message || !failure.message.includes('dispatchAssignmentId')) {
      throw new Error(`unexpected dispatch assignment validation message: ${failure.message}`);
    }

    return {
      caseId: state.caseId,
      dispatchMismatchCaseId: state.dispatchMismatchCaseId,
      failure
    };
  });

  await test('create first appointment succeeds', async () => {
    if (!adminToken || !state.caseId) throw new Error('Admin token and primary case are required.');
    const appointment = await createAppointment(adminToken, state.caseId, 1, 60);
    state.appointmentOneId = appointment.id;
    if (appointment.appointmentStatus !== 'scheduled') {
      throw new Error(`expected scheduled appointment, got ${appointment.appointmentStatus}`);
    }
    return { appointmentId: state.appointmentOneId, appointmentStatus: appointment.appointmentStatus };
  });

  await test('appointment status completed without completed visitResult is rejected', async () => {
    if (!adminToken || !state.appointmentOneId) throw new Error('Admin token and appointment 1 are required.');
    const response = await api(`/api/v1/admin/appointments/${state.appointmentOneId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        appointmentStatus: 'completed'
      }
    });

    const failure = requireFailure(response, 'complete appointment without visitResult', [400]);
    if (!failure.message || !failure.message.includes('visitResult')) {
      throw new Error(`unexpected completed appointment validation message: ${failure.message}`);
    }

    return failure;
  });

  await test('second open appointment for same case is rejected', async () => {
    if (!adminToken || !state.caseId) throw new Error('Admin token and primary case are required.');
    const response = await createAppointmentResponse(adminToken, state.caseId, 2, 180);
    const failure = requireFailure(response, 'create second open appointment', [409]);
    if (!failure.message || !failure.message.includes('尚未結束的到府預約')) {
      throw new Error(`unexpected conflict message: ${failure.message}`);
    }
    return failure;
  });

  await test('appointment scheduledEndAt before scheduledStartAt is rejected', async () => {
    if (!adminToken || !state.appointmentOneId) throw new Error('Admin token and appointment 1 are required.');
    const response = await api(`/api/v1/admin/appointments/${state.appointmentOneId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        scheduledStartAt: isoMinutesFromNow(180),
        scheduledEndAt: isoMinutesFromNow(120),
        rescheduleReason: fixture.rescheduleReason
      }
    });

    const failure = requireFailure(response, 'update appointment with invalid scheduled time range', [400]);
    if (!failure.message || !failure.message.includes('scheduledEndAt')) {
      throw new Error(`unexpected scheduled time validation message: ${failure.message}`);
    }

    return failure;
  });

  await test('appointment scheduled time partial update is rejected', async () => {
    if (!adminToken || !state.appointmentOneId) throw new Error('Admin token and appointment 1 are required.');
    const response = await api(`/api/v1/admin/appointments/${state.appointmentOneId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        scheduledEndAt: isoMinutesFromNow(90),
        rescheduleReason: fixture.rescheduleReason
      }
    });

    const failure = requireFailure(response, 'partial update scheduled end without start', [400]);
    if (!failure.message || !failure.message.includes('scheduledStartAt')) {
      throw new Error(`unexpected scheduled partial validation message: ${failure.message}`);
    }

    return failure;
  });

  await test('appointment actualFinishedAt before actualArrivalAt is rejected', async () => {
    if (!adminToken) throw new Error('Admin token is required.');
    const actualTimeCase = await prepareCaseForDispatch(
      adminToken,
      'actual-time',
      fixture.actualTimeCustomerName,
      fixture.actualTimeCustomerMobile
    );
    state.actualTimeCaseId = actualTimeCase.id;

    const appointment = await createAppointment(adminToken, state.actualTimeCaseId, 1, 300);
    state.actualTimeAppointmentId = appointment.id;

    const response = await api(`/api/v1/admin/appointments/${state.actualTimeAppointmentId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        actualArrivalAt: isoMinutesFromNow(360),
        actualFinishedAt: isoMinutesFromNow(330)
      }
    });

    const failure = requireFailure(response, 'update appointment with invalid actual time range', [400]);
    if (!failure.message || !failure.message.includes('actualFinishedAt')) {
      throw new Error(`unexpected actual time validation message: ${failure.message}`);
    }

    return failure;
  });

  await test('appointment actual time partial update validates resulting range', async () => {
    if (!adminToken || !state.actualTimeAppointmentId) {
      throw new Error('Admin token and actual-time appointment are required.');
    }

    const arrival = await updateAppointment(adminToken, state.actualTimeAppointmentId, {
      actualArrivalAt: isoMinutesFromNow(360)
    }, 'set actual arrival only');
    if (!arrival.actualArrivalAt) throw new Error('actualArrivalAt was not set.');

    const invalidFinished = await api(`/api/v1/admin/appointments/${state.actualTimeAppointmentId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        actualFinishedAt: isoMinutesFromNow(330)
      }
    });
    const failure = requireFailure(invalidFinished, 'partial update invalid actual finish', [400]);

    const finished = await updateAppointment(adminToken, state.actualTimeAppointmentId, {
      actualFinishedAt: isoMinutesFromNow(390)
    }, 'set valid actual finish');
    if (!finished.actualFinishedAt) throw new Error('actualFinishedAt was not set.');

    return {
      invalidStatus: failure.status,
      validArrivalAtSet: Boolean(finished.actualArrivalAt),
      validFinishedAtSet: Boolean(finished.actualFinishedAt)
    };
  });

  await test('reschedule first appointment succeeds', async () => {
    if (!adminToken || !state.appointmentOneId) throw new Error('Admin token and appointment 1 are required.');
    const appointment = await updateAppointment(adminToken, state.appointmentOneId, {
      scheduledStartAt: isoMinutesFromNow(90),
      scheduledEndAt: isoMinutesFromNow(150),
      rescheduleReason: fixture.rescheduleReason
    }, 'reschedule first appointment');

    if (appointment.appointmentStatus !== 'rescheduled') {
      throw new Error(`expected rescheduled appointment, got ${appointment.appointmentStatus}`);
    }
    return { appointmentId: appointment.id, appointmentStatus: appointment.appointmentStatus };
  });

  await test('mark first appointment pending parts terminal result', async () => {
    if (!adminToken || !state.appointmentOneId) throw new Error('Admin token and appointment 1 are required.');
    const appointment = await updateAppointment(adminToken, state.appointmentOneId, {
      visitResult: 'pending_parts',
      nextAction: 'wait_for_parts',
      incompleteReason: fixture.pendingPartsReason
    }, 'update first appointment pending parts');

    if (appointment.visitResult !== 'pending_parts') throw new Error('appointment 1 visitResult was not pending_parts.');
    if (appointment.nextAction !== 'wait_for_parts') throw new Error('appointment 1 nextAction was not wait_for_parts.');
    return { appointmentId: appointment.id, visitResult: appointment.visitResult, nextAction: appointment.nextAction };
  });

  await test('second appointment succeeds after first terminal result', async () => {
    if (!adminToken || !state.caseId) throw new Error('Admin token and primary case are required.');
    const appointment = await createAppointment(adminToken, state.caseId, 2, 240);
    state.appointmentTwoId = appointment.id;
    return { appointmentId: state.appointmentTwoId, appointmentStatus: appointment.appointmentStatus };
  });

  await test('cross-case open appointment is independent', async () => {
    if (!adminToken) throw new Error('Admin token is required.');
    const otherCase = await prepareCaseForDispatch(
      adminToken,
      'cross',
      fixture.otherCustomerName,
      fixture.otherCustomerMobile
    );
    state.otherCaseId = otherCase.id;
    const appointment = await createAppointment(adminToken, state.otherCaseId, 1, 360);
    state.otherAppointmentId = appointment.id;
    return { otherCaseId: state.otherCaseId, otherAppointmentId: state.otherAppointmentId };
  });

  await test('reopening a completed appointment is rejected by status/result consistency guard', async () => {
    if (!adminToken) throw new Error('Admin token is required.');
    const reopenCase = await prepareCaseForDispatch(
      adminToken,
      'reopen-guard',
      fixture.reopenCustomerName,
      fixture.reopenCustomerMobile
    );
    state.reopenCaseId = reopenCase.id;

    const first = await createAppointment(adminToken, state.reopenCaseId, 1, 420);
    state.reopenAppointmentOneId = first.id;

    const completed = await updateAppointment(adminToken, state.reopenAppointmentOneId, {
      appointmentStatus: 'completed',
      visitResult: 'completed',
      nextAction: 'no_action'
    }, 'mark reopen guard appointment completed');
    if (completed.appointmentStatus !== 'completed') {
      throw new Error(`expected completed appointment status, got ${completed.appointmentStatus}`);
    }
    if (completed.visitResult !== 'completed') {
      throw new Error(`expected completed visitResult, got ${completed.visitResult}`);
    }

    const second = await createAppointment(adminToken, state.reopenCaseId, 2, 540);
    state.reopenAppointmentTwoId = second.id;

    const response = await api(`/api/v1/admin/appointments/${state.reopenAppointmentOneId}`, {
      method: 'PATCH',
      token: adminToken,
      body: { appointmentStatus: 'scheduled' }
    });
    const failure = requireFailure(response, 'reopen completed appointment with completed visit result', [400]);
    if (!failure.message || !failure.message.includes('appointmentStatus')) {
      throw new Error(`unexpected reopen conflict message: ${failure.message}`);
    }

    const reopenedCase = await getCase(adminToken, state.reopenCaseId);
    if (reopenedCase.status === 'completed' || reopenedCase.status === 'closed') {
      throw new Error(`reopen guard unexpectedly changed case status: ${reopenedCase.status}`);
    }

    return {
      caseId: state.reopenCaseId,
      terminalAppointmentId: state.reopenAppointmentOneId,
      activeAppointmentId: state.reopenAppointmentTwoId,
      failure
    };
  });

  await test('mark second appointment completed', async () => {
    if (!adminToken || !state.appointmentTwoId) throw new Error('Admin token and appointment 2 are required.');
    const appointment = await updateAppointment(adminToken, state.appointmentTwoId, {
      appointmentStatus: 'completed',
      visitResult: 'completed',
      nextAction: 'close_case',
      actualArrivalAt: isoMinutesFromNow(240),
      actualFinishedAt: isoMinutesFromNow(285)
    }, 'update second appointment completed');

    if (appointment.visitResult !== 'completed') throw new Error('appointment 2 visitResult was not completed.');
    return {
      appointmentId: appointment.id,
      appointmentStatus: appointment.appointmentStatus,
      visitResult: appointment.visitResult
    };
  });

  await test('create one service report for primary case', async () => {
    if (!adminToken || !state.caseId) throw new Error('Admin token and primary case are required.');
    const report = requireOk(await api(`/api/v1/admin/cases/${state.caseId}/service-report`, {
      method: 'POST',
      token: adminToken,
      body: {
        diagnosisResult: fixture.diagnosisResult,
        repairAction: fixture.repairAction,
        engineerNote: fixture.engineerNote
      }
    }), 'create service report');

    state.serviceReportId = report.id;
    if (report.serviceStatus !== 'in_progress') throw new Error(`expected in_progress report, got ${report.serviceStatus}`);
    return { serviceReportId: state.serviceReportId, serviceStatus: report.serviceStatus };
  });

  await test('complete service report with second appointment finalAppointmentId', async () => {
    if (!adminToken || !state.serviceReportId || !state.caseId || !state.appointmentTwoId) {
      throw new Error('Admin token, service report, primary case, and appointment 2 are required.');
    }
    const report = requireOk(await api(`/api/v1/admin/service-reports/${state.serviceReportId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        serviceStatus: 'completed',
        finalAppointmentId: state.appointmentTwoId,
        repairResult: fixture.repairResult
      }
    }), 'complete service report with final appointment');

    if (report.serviceStatus !== 'completed') throw new Error(`expected completed report, got ${report.serviceStatus}`);
    if (report.finalAppointmentId !== state.appointmentTwoId) {
      throw new Error(`expected finalAppointmentId ${state.appointmentTwoId}, got ${report.finalAppointmentId}`);
    }

    const adminCase = await getCase(adminToken, state.caseId);
    if (adminCase.status !== 'completed') throw new Error(`expected case completed, got ${adminCase.status}`);
    if (!adminCase.completedAt) throw new Error('case completedAt was not set.');

    return {
      serviceReportId: report.id,
      serviceStatus: report.serviceStatus,
      finalAppointmentId: report.finalAppointmentId,
      caseStatus: adminCase.status,
      completedAtSet: Boolean(adminCase.completedAt)
    };
  });

  const failed = results.filter((result) => result.status === 'FAIL');
  console.log('Task 061 smoke summary', {
    smokeRunId,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length
  });

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  fail('unhandled smoke error', error);
  process.exitCode = 1;
});
