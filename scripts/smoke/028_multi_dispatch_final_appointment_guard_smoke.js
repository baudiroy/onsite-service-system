#!/usr/bin/env node

const API_BASE_URL = (process.env.API_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
const { createSmokeMarker } = require('./helpers/smokeMarker');

const smokeMarker = createSmokeMarker({
  taskCode: 'Task028',
  smokeName: 'smoke',
  runId: process.env.SMOKE_RUN_ID
});
const { smokeRunId, shortSmokeRunId, smokePrefix } = smokeMarker;
const fixture = {
  organizationCode: `task028-smoke-org-${smokeRunId}`,
  organizationName: `Task028 Multi Dispatch Guard Organization ${smokeRunId}`,
  dispatchUnitCode: `task028-smoke-du-${smokeRunId}`,
  dispatchUnitName: `Task028 Dispatch Unit ${smokeRunId}`,
  customerName: `Task028 Multi Dispatch Customer ${smokeRunId}`,
  customerMobile: `090028${Date.now().toString().slice(-6)}`,
  otherCustomerName: `Task028 Cross Case Customer ${smokeRunId}`,
  otherCustomerMobile: `090128${Date.now().toString().slice(-6)}`,
  suppliedCustomerName: `Task028 Supplied Final Appointment Customer ${smokeRunId}`,
  suppliedCustomerMobile: `090228${Date.now().toString().slice(-6)}`,
  deterministicCustomerName: `Task028 Deterministic Final Appointment Customer ${smokeRunId}`,
  deterministicCustomerMobile: `090328${Date.now().toString().slice(-6)}`,
  concurrentCustomerName: `Task028 Concurrent Completion Customer ${smokeRunId}`,
  concurrentCustomerMobile: `090428${Date.now().toString().slice(-6)}`,
  caseModelNoPrefix: `T028-${shortSmokeRunId}`,
  caseProblemDescription: (marker) => `${smokePrefix} multi dispatch guard ${marker}`,
  dispatchNote: (marker) => `${smokePrefix} dispatch ${marker}`,
  appointmentNote: (sequence) => `${smokePrefix} appointment ${sequence}`,
  workflowNote: (action) => `${smokePrefix} ${action}`,
  pendingPartsReason: `${smokePrefix} pending parts`,
  diagnosisResult: `${smokePrefix} diagnosis`,
  repairAction: `${smokePrefix} repair action`,
  engineerNote: `${smokePrefix} engineer note`,
  pendingFinalDiagnosisResult: `${smokePrefix} should not create with non-completed final appointment`,
  duplicateDiagnosisResult: `${smokePrefix} duplicate report`,
  missingFinalRepairResult: `${smokePrefix} should not complete without final appointment`,
  pendingPartsRepairResult: `${smokePrefix} should not complete with pending parts appointment`,
  crossCaseRepairResult: `${smokePrefix} should not complete with cross-case appointment`,
  repairResult: `${smokePrefix} repair result`,
  repeatCompletionRepairResult: `${smokePrefix} repeat completion must not mutate`,
  suppliedRepairResult: `${smokePrefix} supplied final appointment accepted`,
  deterministicRepairResult: `${smokePrefix} deterministic final appointment inferred`,
  concurrentRepairResult: `${smokePrefix} concurrent completion winner`,
  concurrentDuplicateRepairResult: `${smokePrefix} concurrent completion loser`,
  servicePartName: `${smokePrefix} draft service part`,
  blockedServicePartName: `${smokePrefix} blocked completed service part`,
  blockedServicePartUpdateName: `${smokePrefix} blocked completed service part update`
};

const state = {
  organizationId: null,
  dispatchUnitId: null,
  caseId: null,
  caseNo: null,
  otherCaseId: null,
  suppliedCaseId: null,
  deterministicCaseId: null,
  concurrentCaseId: null,
  appointmentOneId: null,
  appointmentTwoId: null,
  otherAppointmentId: null,
  suppliedAppointmentId: null,
  deterministicAppointmentOneId: null,
  deterministicAppointmentTwoId: null,
  concurrentAppointmentId: null,
  serviceReportId: null,
  servicePartId: null,
  deterministicServiceReportId: null,
  concurrentServiceReportId: null
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
        address: `Task028 Test Address ${marker}`,
        source: 'admin'
      },
      case: {
        source: 'admin',
        brand: 'Task028 Brand',
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

  requireOk(await api(`/api/v1/admin/cases/${adminCase.id}/dispatch`, {
    method: 'POST',
    token,
    body: {
      dispatchUnitId: state.dispatchUnitId,
      assignmentNote: fixture.dispatchNote(marker)
    }
  }), `create dispatch ${marker}`);

  return adminCase;
}

async function createAppointment(token, caseId, sequence, startOffsetMinutes) {
  return requireOk(await api(`/api/v1/admin/cases/${caseId}/appointments`, {
    method: 'POST',
    token,
    body: {
      scheduledStartAt: isoMinutesFromNow(startOffsetMinutes),
      scheduledEndAt: isoMinutesFromNow(startOffsetMinutes + 60),
      visitType: 'repair',
      timezone: 'Asia/Taipei',
      visitSequence: sequence,
      note: fixture.appointmentNote(sequence)
    }
  }), `create appointment ${sequence}`);
}

async function updateAppointment(token, appointmentId, payload, label) {
  return requireOk(await api(`/api/v1/admin/appointments/${appointmentId}`, {
    method: 'PATCH',
    token,
    body: payload
  }), label);
}

async function createServicePart(token, reportId, payload, label) {
  return requireOk(await api(`/api/v1/admin/service-reports/${reportId}/parts`, {
    method: 'POST',
    token,
    body: payload
  }), label);
}

async function listServiceParts(token, reportId) {
  const response = await api(`/api/v1/admin/service-reports/${reportId}/parts?limit=50&offset=0`, { token });
  if (!response.ok) {
    throw new Error(`list service parts failed: ${JSON.stringify(responseSummary(response))}`);
  }
  return response.json?.data || [];
}

function findServicePart(parts, partId) {
  return parts.find((part) => part.id === partId) || null;
}

async function getCase(token, caseId) {
  return requireOk(await api(`/api/v1/admin/cases/${caseId}`, { token }), 'get case');
}

async function getServiceReportByCase(token, caseId) {
  return requireOk(await api(`/api/v1/admin/cases/${caseId}/service-report`, { token }), 'get service report');
}

async function getCaseMessageCount(token, caseId) {
  const response = await api(`/api/v1/admin/cases/${caseId}/messages?limit=1&offset=0&sort=createdAtAsc`, { token });
  if (!response.ok) {
    throw new Error(`get case message count failed: ${JSON.stringify(responseSummary(response))}`);
  }
  return response.json?.pagination?.total ?? response.json?.data?.length ?? 0;
}

function assertCaseNotCompleted(adminCase, label) {
  if (adminCase.status === 'completed') {
    throw new Error(`${label}: case status unexpectedly completed.`);
  }
  if (adminCase.completedAt) {
    throw new Error(`${label}: case completedAt was unexpectedly set.`);
  }
}

async function main() {
  console.log('Task 028 multi-dispatch final appointment guard smoke config', {
    taskCode: 'Task028',
    smokeName: 'smoke',
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
    return { caseId: state.caseId, caseNo: state.caseNo };
  });

  await test('create first appointment for primary case', async () => {
    if (!adminToken || !state.caseId) throw new Error('Admin token and primary case are required.');
    const appointmentOne = await createAppointment(adminToken, state.caseId, 1, 60);
    state.appointmentOneId = appointmentOne.id;
    return { appointmentOneId: state.appointmentOneId };
  });

  await test('mark first appointment pending parts', async () => {
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

  await test('service report create with non-completed finalAppointmentId is rejected', async () => {
    if (!adminToken || !state.caseId || !state.appointmentOneId) {
      throw new Error('Admin token, primary case, and appointment 1 are required.');
    }
    const response = await api(`/api/v1/admin/cases/${state.caseId}/service-report`, {
      method: 'POST',
      token: adminToken,
      body: {
        diagnosisResult: fixture.pendingFinalDiagnosisResult,
        finalAppointmentId: state.appointmentOneId
      }
    });

    const failure = requireFailure(response, 'create service report with non-completed finalAppointmentId', [400]);
    return failure;
  });

  await test('create second appointment after first terminal result', async () => {
    if (!adminToken || !state.caseId) throw new Error('Admin token and primary case are required.');
    const appointmentTwo = await createAppointment(adminToken, state.caseId, 2, 180);
    state.appointmentTwoId = appointmentTwo.id;
    return { appointmentTwoId: state.appointmentTwoId };
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

  await test('second service report creation is rejected', async () => {
    if (!adminToken || !state.caseId || !state.serviceReportId) {
      throw new Error('Admin token, primary case, and service report are required.');
    }
    const response = await api(`/api/v1/admin/cases/${state.caseId}/service-report`, {
      method: 'POST',
      token: adminToken,
      body: {
        diagnosisResult: fixture.duplicateDiagnosisResult
      }
    });
    const failure = requireFailure(response, 'duplicate service report', [409]);
    return failure;
  });

  await test('create draft service part before report completion', async () => {
    if (!adminToken || !state.serviceReportId) {
      throw new Error('Admin token and service report are required.');
    }

    const part = await createServicePart(adminToken, state.serviceReportId, {
      partName: fixture.servicePartName,
      partNo: `T028-PART-${shortSmokeRunId}`,
      quantity: 1,
      partStatus: 'planned'
    }, 'create draft service part');

    state.servicePartId = part.id;

    if (part.serviceReportId !== state.serviceReportId) {
      throw new Error('service part was not linked to the primary service report.');
    }

    return {
      servicePartId: state.servicePartId,
      partStatus: part.partStatus
    };
  });

  await test('completion without finalAppointmentId is rejected and case remains open', async () => {
    if (!adminToken || !state.serviceReportId || !state.caseId) {
      throw new Error('Admin token, service report, and primary case are required.');
    }
    const response = await api(`/api/v1/admin/service-reports/${state.serviceReportId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        serviceStatus: 'completed',
        repairResult: fixture.missingFinalRepairResult
      }
    });

    const failure = requireFailure(response, 'complete without finalAppointmentId');
    const adminCase = await getCase(adminToken, state.caseId);
    assertCaseNotCompleted(adminCase, 'complete without finalAppointmentId');
    return { ...failure, caseStatus: adminCase.status, completedAt: adminCase.completedAt || null };
  });

  await test('completion with pending-parts appointment is rejected and case remains open', async () => {
    if (!adminToken || !state.serviceReportId || !state.caseId || !state.appointmentOneId) {
      throw new Error('Admin token, service report, primary case, and appointment 1 are required.');
    }
    const response = await api(`/api/v1/admin/service-reports/${state.serviceReportId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        serviceStatus: 'completed',
        finalAppointmentId: state.appointmentOneId,
        repairResult: fixture.pendingPartsRepairResult
      }
    });

    const failure = requireFailure(response, 'complete with pending-parts appointment');
    const adminCase = await getCase(adminToken, state.caseId);
    assertCaseNotCompleted(adminCase, 'complete with pending-parts appointment');
    return { ...failure, caseStatus: adminCase.status, completedAt: adminCase.completedAt || null };
  });

  await test('cross-case finalAppointmentId is rejected', async () => {
    if (!adminToken || !state.serviceReportId || !state.caseId) {
      throw new Error('Admin token, service report, and primary case are required.');
    }
    const otherCase = await prepareCaseForDispatch(
      adminToken,
      'cross',
      fixture.otherCustomerName,
      fixture.otherCustomerMobile
    );
    state.otherCaseId = otherCase.id;

    const otherAppointment = await createAppointment(adminToken, state.otherCaseId, 1, 300);
    const completedOtherAppointment = await updateAppointment(adminToken, otherAppointment.id, {
      appointmentStatus: 'completed',
      visitResult: 'completed',
      nextAction: 'no_action',
      actualArrivalAt: isoMinutesFromNow(300),
      actualFinishedAt: isoMinutesFromNow(330)
    }, 'update other appointment completed');
    state.otherAppointmentId = completedOtherAppointment.id;

    const response = await api(`/api/v1/admin/service-reports/${state.serviceReportId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        serviceStatus: 'completed',
        finalAppointmentId: state.otherAppointmentId,
        repairResult: fixture.crossCaseRepairResult
      }
    });

    const failure = requireFailure(response, 'complete with cross-case appointment');
    const adminCase = await getCase(adminToken, state.caseId);
    assertCaseNotCompleted(adminCase, 'complete with cross-case appointment');
    return { ...failure, caseStatus: adminCase.status };
  });

  await test('mark second appointment completed', async () => {
    if (!adminToken || !state.appointmentTwoId) throw new Error('Admin token and appointment 2 are required.');
    const appointment = await updateAppointment(adminToken, state.appointmentTwoId, {
      appointmentStatus: 'completed',
      visitResult: 'completed',
      nextAction: 'close_case',
      actualArrivalAt: isoMinutesFromNow(180),
      actualFinishedAt: isoMinutesFromNow(225)
    }, 'update second appointment completed');

    if (appointment.visitResult !== 'completed') throw new Error('appointment 2 visitResult was not completed.');
    if (appointment.nextAction !== 'close_case') throw new Error('appointment 2 nextAction was not close_case.');
    return {
      appointmentId: appointment.id,
      visitResult: appointment.visitResult,
      actualArrivalAt: appointment.actualArrivalAt,
      actualFinishedAt: appointment.actualFinishedAt
    };
  });

  await test('completion without finalAppointmentId infers final completed appointment', async () => {
    if (!adminToken || !state.serviceReportId || !state.caseId || !state.appointmentTwoId) {
      throw new Error('Admin token, service report, primary case, and appointment 2 are required.');
    }
    const report = requireOk(await api(`/api/v1/admin/service-reports/${state.serviceReportId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        serviceStatus: 'completed',
        repairResult: fixture.repairResult
      }
    }), 'complete service report with inferred final appointment');

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

  await test('completed report finalAppointmentId cannot be cleared', async () => {
    if (!adminToken || !state.serviceReportId || !state.caseId || !state.appointmentTwoId) {
      throw new Error('Admin token, service report, primary case, and appointment 2 are required.');
    }

    const reportBefore = await getServiceReportByCase(adminToken, state.caseId);
    const response = await api(`/api/v1/admin/service-reports/${state.serviceReportId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        finalAppointmentId: null
      }
    });

    const failure = requireFailure(response, 'clear finalAppointmentId on completed report', [409]);
    const reportAfter = await getServiceReportByCase(adminToken, state.caseId);

    if (reportAfter.finalAppointmentId !== reportBefore.finalAppointmentId) {
      throw new Error('completed report finalAppointmentId was cleared or changed.');
    }
    if (reportAfter.onsiteCompletedAt !== reportBefore.onsiteCompletedAt) {
      throw new Error('clear finalAppointmentId changed report onsiteCompletedAt.');
    }

    return {
      ...failure,
      finalAppointmentIdStable: reportAfter.finalAppointmentId === reportBefore.finalAppointmentId,
      reportCompletedAtStable: reportAfter.onsiteCompletedAt === reportBefore.onsiteCompletedAt
    };
  });

  await test('completed report cannot add service part', async () => {
    if (!adminToken || !state.serviceReportId) {
      throw new Error('Admin token and service report are required.');
    }

    const response = await api(`/api/v1/admin/service-reports/${state.serviceReportId}/parts`, {
      method: 'POST',
      token: adminToken,
      body: {
        partName: fixture.blockedServicePartName,
        quantity: 1,
        partStatus: 'used'
      }
    });

    const failure = requireFailure(response, 'add service part to completed report', [409]);
    const partsAfter = await listServiceParts(adminToken, state.serviceReportId);
    const blockedPart = partsAfter.find((part) => part.partName === fixture.blockedServicePartName);
    if (blockedPart) {
      throw new Error('completed report accepted a new service part.');
    }

    return {
      ...failure,
      blockedPartCreated: false
    };
  });

  await test('completed report cannot update existing service part', async () => {
    if (!adminToken || !state.serviceReportId || !state.servicePartId) {
      throw new Error('Admin token, service report, and service part are required.');
    }

    const partsBefore = await listServiceParts(adminToken, state.serviceReportId);
    const partBefore = findServicePart(partsBefore, state.servicePartId);
    if (!partBefore) throw new Error('draft service part was not found before update rejection test.');

    const response = await api(`/api/v1/admin/service-parts/${state.servicePartId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        partName: fixture.blockedServicePartUpdateName,
        quantity: 2
      }
    });

    const failure = requireFailure(response, 'update service part on completed report', [409]);
    const partsAfter = await listServiceParts(adminToken, state.serviceReportId);
    const partAfter = findServicePart(partsAfter, state.servicePartId);
    if (!partAfter) throw new Error('service part disappeared after rejected update.');
    if (partAfter.partName !== partBefore.partName) {
      throw new Error('rejected completed-report service part update changed partName.');
    }
    if (partAfter.quantity !== partBefore.quantity) {
      throw new Error('rejected completed-report service part update changed quantity.');
    }

    return {
      ...failure,
      partNameStable: partAfter.partName === partBefore.partName,
      quantityStable: partAfter.quantity === partBefore.quantity
    };
  });

  await test('completed report cannot delete existing service part', async () => {
    if (!adminToken || !state.serviceReportId || !state.servicePartId) {
      throw new Error('Admin token, service report, and service part are required.');
    }

    const response = await api(`/api/v1/admin/service-parts/${state.servicePartId}`, {
      method: 'DELETE',
      token: adminToken
    });

    const failure = requireFailure(response, 'delete service part on completed report', [409]);
    const partsAfter = await listServiceParts(adminToken, state.serviceReportId);
    const partAfter = findServicePart(partsAfter, state.servicePartId);
    if (!partAfter) {
      throw new Error('rejected completed-report service part delete removed the part.');
    }

    return {
      ...failure,
      servicePartStillPresent: true
    };
  });

  await test('repeat completion is rejected without mutating completed report or case', async () => {
    if (!adminToken || !state.serviceReportId || !state.caseId || !state.appointmentTwoId) {
      throw new Error('Admin token, service report, primary case, and appointment 2 are required.');
    }

    const reportBefore = await getServiceReportByCase(adminToken, state.caseId);
    const caseBefore = await getCase(adminToken, state.caseId);
    const messagesBefore = await getCaseMessageCount(adminToken, state.caseId);

    const response = await api(`/api/v1/admin/service-reports/${state.serviceReportId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        serviceStatus: 'completed',
        repairResult: fixture.repeatCompletionRepairResult
      }
    });

    const failure = requireFailure(response, 'repeat complete completed report', [409]);
    const reportAfter = await getServiceReportByCase(adminToken, state.caseId);
    const caseAfter = await getCase(adminToken, state.caseId);
    const messagesAfter = await getCaseMessageCount(adminToken, state.caseId);

    if (reportAfter.finalAppointmentId !== reportBefore.finalAppointmentId) {
      throw new Error('repeat completion changed finalAppointmentId.');
    }
    if (reportAfter.onsiteCompletedAt !== reportBefore.onsiteCompletedAt) {
      throw new Error('repeat completion changed report onsiteCompletedAt.');
    }
    if (reportAfter.repairResult !== reportBefore.repairResult) {
      throw new Error('repeat completion changed completed report repairResult.');
    }
    if (caseAfter.completedAt !== caseBefore.completedAt) {
      throw new Error('repeat completion changed case completedAt.');
    }
    if (caseAfter.status !== caseBefore.status) {
      throw new Error('repeat completion changed case status.');
    }
    if (messagesAfter !== messagesBefore) {
      throw new Error('repeat completion created duplicate timeline message.');
    }

    return {
      ...failure,
      finalAppointmentIdStable: reportAfter.finalAppointmentId === reportBefore.finalAppointmentId,
      reportCompletedAtStable: reportAfter.onsiteCompletedAt === reportBefore.onsiteCompletedAt,
      caseCompletedAtStable: caseAfter.completedAt === caseBefore.completedAt,
      timelineMessageCountStable: messagesAfter === messagesBefore
    };
  });

  await test('completed report cannot be reopened through normal update', async () => {
    if (!adminToken || !state.serviceReportId || !state.caseId) {
      throw new Error('Admin token, service report, and primary case are required.');
    }

    const reportBefore = await getServiceReportByCase(adminToken, state.caseId);
    const caseBefore = await getCase(adminToken, state.caseId);
    const messagesBefore = await getCaseMessageCount(adminToken, state.caseId);

    const response = await api(`/api/v1/admin/service-reports/${state.serviceReportId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        serviceStatus: 'in_progress',
        repairResult: fixture.repeatCompletionRepairResult
      }
    });

    const failure = requireFailure(response, 'reopen completed report', [409]);
    const reportAfter = await getServiceReportByCase(adminToken, state.caseId);
    const caseAfter = await getCase(adminToken, state.caseId);
    const messagesAfter = await getCaseMessageCount(adminToken, state.caseId);

    if (reportAfter.serviceStatus !== 'completed') {
      throw new Error(`completed report was reopened to ${reportAfter.serviceStatus}.`);
    }
    if (reportAfter.finalAppointmentId !== reportBefore.finalAppointmentId) {
      throw new Error('reopen attempt changed finalAppointmentId.');
    }
    if (reportAfter.onsiteCompletedAt !== reportBefore.onsiteCompletedAt) {
      throw new Error('reopen attempt changed report onsiteCompletedAt.');
    }
    if (caseAfter.status !== caseBefore.status) {
      throw new Error('reopen attempt changed case status.');
    }
    if (caseAfter.completedAt !== caseBefore.completedAt) {
      throw new Error('reopen attempt changed case completedAt.');
    }
    if (messagesAfter !== messagesBefore) {
      throw new Error('reopen attempt created duplicate timeline message.');
    }

    return {
      ...failure,
      serviceStatusStable: reportAfter.serviceStatus === 'completed',
      finalAppointmentIdStable: reportAfter.finalAppointmentId === reportBefore.finalAppointmentId,
      reportCompletedAtStable: reportAfter.onsiteCompletedAt === reportBefore.onsiteCompletedAt,
      caseCompletedAtStable: caseAfter.completedAt === caseBefore.completedAt,
      timelineMessageCountStable: messagesAfter === messagesBefore
    };
  });

  await test('supplied same-case completed finalAppointmentId is still accepted', async () => {
    if (!adminToken) throw new Error('Admin token is required.');
    const suppliedCase = await prepareCaseForDispatch(
      adminToken,
      'supplied',
      fixture.suppliedCustomerName,
      fixture.suppliedCustomerMobile
    );
    state.suppliedCaseId = suppliedCase.id;

    const suppliedAppointment = await createAppointment(adminToken, state.suppliedCaseId, 1, 420);
    const completedAppointment = await updateAppointment(adminToken, suppliedAppointment.id, {
      appointmentStatus: 'completed',
      visitResult: 'completed',
      nextAction: 'close_case',
      actualArrivalAt: isoMinutesFromNow(420),
      actualFinishedAt: isoMinutesFromNow(450)
    }, 'update supplied appointment completed');
    state.suppliedAppointmentId = completedAppointment.id;

    const suppliedReport = requireOk(await api(`/api/v1/admin/cases/${state.suppliedCaseId}/service-report`, {
      method: 'POST',
      token: adminToken,
      body: {
        diagnosisResult: fixture.diagnosisResult,
        repairAction: fixture.repairAction,
        engineerNote: fixture.engineerNote
      }
    }), 'create supplied service report');

    const completedReport = requireOk(await api(`/api/v1/admin/service-reports/${suppliedReport.id}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        serviceStatus: 'completed',
        finalAppointmentId: state.suppliedAppointmentId,
        repairResult: fixture.suppliedRepairResult
      }
    }), 'complete service report with supplied final appointment');

    if (completedReport.serviceStatus !== 'completed') {
      throw new Error(`expected completed supplied report, got ${completedReport.serviceStatus}`);
    }
    if (completedReport.finalAppointmentId !== state.suppliedAppointmentId) {
      throw new Error(`expected supplied finalAppointmentId ${state.suppliedAppointmentId}, got ${completedReport.finalAppointmentId}`);
    }

    return {
      serviceReportId: completedReport.id,
      serviceStatus: completedReport.serviceStatus,
      finalAppointmentId: completedReport.finalAppointmentId
    };
  });

  await test('multiple completed appointments infer deterministic latest visit', async () => {
    if (!adminToken) throw new Error('Admin token is required.');
    const deterministicCase = await prepareCaseForDispatch(
      adminToken,
      'deterministic',
      fixture.deterministicCustomerName,
      fixture.deterministicCustomerMobile
    );
    state.deterministicCaseId = deterministicCase.id;

    const appointmentOne = await createAppointment(adminToken, state.deterministicCaseId, 1, 540);
    const completedOne = await updateAppointment(adminToken, appointmentOne.id, {
      appointmentStatus: 'completed',
      visitResult: 'completed',
      nextAction: 'close_case',
      actualArrivalAt: isoMinutesFromNow(540),
      actualFinishedAt: isoMinutesFromNow(570)
    }, 'update deterministic appointment 1 completed');
    state.deterministicAppointmentOneId = completedOne.id;

    const appointmentTwo = await createAppointment(adminToken, state.deterministicCaseId, 2, 660);
    const completedTwo = await updateAppointment(adminToken, appointmentTwo.id, {
      appointmentStatus: 'completed',
      visitResult: 'completed',
      nextAction: 'close_case',
      actualArrivalAt: isoMinutesFromNow(660),
      actualFinishedAt: isoMinutesFromNow(705)
    }, 'update deterministic appointment 2 completed');
    state.deterministicAppointmentTwoId = completedTwo.id;

    const deterministicReport = requireOk(await api(`/api/v1/admin/cases/${state.deterministicCaseId}/service-report`, {
      method: 'POST',
      token: adminToken,
      body: {
        diagnosisResult: fixture.diagnosisResult,
        repairAction: fixture.repairAction,
        engineerNote: fixture.engineerNote
      }
    }), 'create deterministic service report');
    state.deterministicServiceReportId = deterministicReport.id;

    const completedReport = requireOk(await api(`/api/v1/admin/service-reports/${deterministicReport.id}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        serviceStatus: 'completed',
        repairResult: fixture.deterministicRepairResult
      }
    }), 'complete deterministic service report with inferred final appointment');

    if (completedReport.serviceStatus !== 'completed') {
      throw new Error(`expected completed deterministic report, got ${completedReport.serviceStatus}`);
    }
    if (completedReport.finalAppointmentId !== state.deterministicAppointmentTwoId) {
      throw new Error(`expected latest finalAppointmentId ${state.deterministicAppointmentTwoId}, got ${completedReport.finalAppointmentId}`);
    }

    return {
      serviceReportId: completedReport.id,
      inferredFinalAppointmentId: completedReport.finalAppointmentId,
      expectedFinalAppointmentId: state.deterministicAppointmentTwoId
    };
  });

  await test('repeat completion with different supplied finalAppointmentId cannot override completed report', async () => {
    if (
      !adminToken ||
      !state.deterministicCaseId ||
      !state.deterministicServiceReportId ||
      !state.deterministicAppointmentOneId ||
      !state.deterministicAppointmentTwoId
    ) {
      throw new Error('Admin token, deterministic case, report, and appointments are required.');
    }

    const reportBefore = await getServiceReportByCase(adminToken, state.deterministicCaseId);
    const caseBefore = await getCase(adminToken, state.deterministicCaseId);
    const messagesBefore = await getCaseMessageCount(adminToken, state.deterministicCaseId);

    const response = await api(`/api/v1/admin/service-reports/${state.deterministicServiceReportId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        serviceStatus: 'completed',
        finalAppointmentId: state.deterministicAppointmentOneId,
        repairResult: fixture.repeatCompletionRepairResult
      }
    });

    const failure = requireFailure(response, 'repeat complete with different supplied finalAppointmentId', [409]);
    const reportAfter = await getServiceReportByCase(adminToken, state.deterministicCaseId);
    const caseAfter = await getCase(adminToken, state.deterministicCaseId);
    const messagesAfter = await getCaseMessageCount(adminToken, state.deterministicCaseId);

    if (reportAfter.finalAppointmentId !== state.deterministicAppointmentTwoId) {
      throw new Error('different supplied finalAppointmentId overrode completed report finalAppointmentId.');
    }
    if (reportAfter.finalAppointmentId !== reportBefore.finalAppointmentId) {
      throw new Error('completed report finalAppointmentId changed after repeat supplied-id completion.');
    }
    if (reportAfter.onsiteCompletedAt !== reportBefore.onsiteCompletedAt) {
      throw new Error('repeat supplied-id completion changed report onsiteCompletedAt.');
    }
    if (caseAfter.completedAt !== caseBefore.completedAt) {
      throw new Error('repeat supplied-id completion changed case completedAt.');
    }
    if (messagesAfter !== messagesBefore) {
      throw new Error('repeat supplied-id completion created duplicate timeline message.');
    }

    return {
      ...failure,
      finalAppointmentIdStable: reportAfter.finalAppointmentId === reportBefore.finalAppointmentId,
      attemptedFinalAppointmentId: state.deterministicAppointmentOneId,
      preservedFinalAppointmentId: reportAfter.finalAppointmentId,
      reportCompletedAtStable: reportAfter.onsiteCompletedAt === reportBefore.onsiteCompletedAt,
      caseCompletedAtStable: caseAfter.completedAt === caseBefore.completedAt,
      timelineMessageCountStable: messagesAfter === messagesBefore
    };
  });

  await test('concurrent completion only allows one first-transition side effect', async () => {
    if (!adminToken) throw new Error('Admin token is required.');
    const concurrentCase = await prepareCaseForDispatch(
      adminToken,
      'concurrent',
      fixture.concurrentCustomerName,
      fixture.concurrentCustomerMobile
    );
    state.concurrentCaseId = concurrentCase.id;

    const appointment = await createAppointment(adminToken, state.concurrentCaseId, 1, 780);
    const completedAppointment = await updateAppointment(adminToken, appointment.id, {
      appointmentStatus: 'completed',
      visitResult: 'completed',
      nextAction: 'close_case',
      actualArrivalAt: isoMinutesFromNow(780),
      actualFinishedAt: isoMinutesFromNow(810)
    }, 'update concurrent appointment completed');
    state.concurrentAppointmentId = completedAppointment.id;

    const serviceReport = requireOk(await api(`/api/v1/admin/cases/${state.concurrentCaseId}/service-report`, {
      method: 'POST',
      token: adminToken,
      body: {
        diagnosisResult: fixture.diagnosisResult,
        repairAction: fixture.repairAction,
        engineerNote: fixture.engineerNote
      }
    }), 'create concurrent service report');
    state.concurrentServiceReportId = serviceReport.id;

    const messagesBefore = await getCaseMessageCount(adminToken, state.concurrentCaseId);

    const [firstResponse, secondResponse] = await Promise.all([
      api(`/api/v1/admin/service-reports/${state.concurrentServiceReportId}`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          serviceStatus: 'completed',
          repairResult: fixture.concurrentRepairResult
        }
      }),
      api(`/api/v1/admin/service-reports/${state.concurrentServiceReportId}`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          serviceStatus: 'completed',
          repairResult: fixture.concurrentDuplicateRepairResult
        }
      })
    ]);

    const responses = [firstResponse, secondResponse];
    const successes = responses.filter((response) => response.ok);
    const failures = responses.filter((response) => !response.ok);

    if (successes.length !== 1 || failures.length !== 1) {
      throw new Error(`expected exactly one concurrent completion success and one failure, got ${JSON.stringify(responses.map(responseSummary))}`);
    }

    const completedReport = successes[0].json?.data;
    if (!completedReport) {
      throw new Error('concurrent completion success did not return report data.');
    }
    if (completedReport.serviceStatus !== 'completed') {
      throw new Error(`expected completed concurrent report, got ${completedReport.serviceStatus}`);
    }
    if (completedReport.finalAppointmentId !== state.concurrentAppointmentId) {
      throw new Error(`expected inferred finalAppointmentId ${state.concurrentAppointmentId}, got ${completedReport.finalAppointmentId}`);
    }

    const failure = requireFailure(failures[0], 'losing concurrent completion', [409]);
    const reportAfter = await getServiceReportByCase(adminToken, state.concurrentCaseId);
    const caseAfter = await getCase(adminToken, state.concurrentCaseId);
    const messagesAfter = await getCaseMessageCount(adminToken, state.concurrentCaseId);

    if (reportAfter.finalAppointmentId !== state.concurrentAppointmentId) {
      throw new Error('losing concurrent completion changed finalAppointmentId.');
    }
    if (reportAfter.onsiteCompletedAt !== completedReport.onsiteCompletedAt) {
      throw new Error('losing concurrent completion changed report onsiteCompletedAt.');
    }
    if (caseAfter.status !== 'completed') {
      throw new Error(`expected concurrent case completed, got ${caseAfter.status}`);
    }
    if (!caseAfter.completedAt) {
      throw new Error('concurrent case completedAt was not set.');
    }
    if (messagesAfter !== messagesBefore + 1) {
      throw new Error('concurrent completion created duplicate or missing timeline message.');
    }

    return {
      successCount: successes.length,
      failureStatus: failure.status,
      finalAppointmentIdStable: reportAfter.finalAppointmentId === state.concurrentAppointmentId,
      reportCompletedAtStable: reportAfter.onsiteCompletedAt === completedReport.onsiteCompletedAt,
      caseCompletedAtSet: Boolean(caseAfter.completedAt),
      timelineMessageDelta: messagesAfter - messagesBefore
    };
  });

  const failed = results.filter((result) => result.status === 'FAIL');
  console.log('Task 028 smoke summary', {
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
