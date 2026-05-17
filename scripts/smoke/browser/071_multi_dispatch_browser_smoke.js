#!/usr/bin/env node

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const ADMIN_BASE_URL = (process.env.ADMIN_BASE_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
const HEADLESS = process.env.HEADLESS !== 'false';
const SLOW_MO = Number(process.env.SLOW_MO || 0);
const BROWSER_CHANNEL = process.env.BROWSER_CHANNEL || 'chrome';
const TASK_CODE = 'Task071';
const CLEANUP_REQUESTED = process.env.CLEANUP === '1';

function createSmokeRunId() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  const timestamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('');
  return `${timestamp}-${Math.random().toString(16).slice(2, 6)}`;
}

function normalizeSmokeRunId(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return normalized || createSmokeRunId();
}

function getSmokeMarker(taskCode, runId) {
  return `${taskCode} browser-smoke ${runId}`;
}

const SMOKE_RUN_ID = normalizeSmokeRunId(process.env.SMOKE_RUN_ID || createSmokeRunId());
const SMOKE_MARKER = getSmokeMarker(TASK_CODE, SMOKE_RUN_ID);
const SHORT_SMOKE_RUN_ID = SMOKE_RUN_ID.replace(/[^a-z0-9]/g, '').slice(0, 16) || 'browser';
const fixture = {
  organizationCode: `task071-org-${SMOKE_RUN_ID}`,
  organizationName: `Task071 Browser Smoke Organization ${SMOKE_RUN_ID}`,
  dispatchUnitCode: `task071-du-${SMOKE_RUN_ID}`,
  dispatchUnitName: `Task071 Browser Smoke Dispatch Unit ${SMOKE_RUN_ID}`,
  customerName: `Task071 Browser Smoke Customer ${SMOKE_RUN_ID}`,
  customerMobile: `090071${Date.now().toString().slice(-6)}`,
  noCompletedCustomerName: `Task071 No Completed Visit Customer ${SMOKE_RUN_ID}`,
  noCompletedCustomerMobile: `090171${Date.now().toString().slice(-6)}`,
  caseModelNo: `T071-${SHORT_SMOKE_RUN_ID}`,
  noCompletedCaseModelNo: `T071-ERR-${SHORT_SMOKE_RUN_ID}`,
  caseProblemDescription: `${SMOKE_MARKER} multi-dispatch case`,
  noCompletedCaseProblemDescription: `${SMOKE_MARKER} no completed visit case`,
  dispatchAssignmentNote: `${SMOKE_MARKER} dispatch`,
  firstAppointmentNote: `${SMOKE_MARKER} appointment 1`,
  noCompletedAppointmentNote: `${SMOKE_MARKER} no completed appointment`,
  secondAppointmentNote: `${SMOKE_MARKER} appointment 2`,
  pendingPartsReason: `${SMOKE_MARKER} pending parts`,
  noCompletedPendingPartsReason: `${SMOKE_MARKER} no completed visit pending parts`,
  diagnosisResult: `${SMOKE_MARKER} diagnosis`,
  repairAction: `${SMOKE_MARKER} repair action`,
  repairResult: `${SMOKE_MARKER} repair result`,
  noCompletedDiagnosisResult: `${SMOKE_MARKER} no completed visit diagnosis`,
  noCompletedRepairAction: `${SMOKE_MARKER} no completed visit repair action`,
  noCompletedRepairResult: `${SMOKE_MARKER} no completed visit repair result`
};

const state = {
  token: null,
  organizationId: null,
  dispatchUnitId: null,
  caseId: null,
  caseNo: null,
  appointmentOneId: null,
  appointmentTwoId: null,
  noCompletedCaseId: null,
  noCompletedCaseNo: null,
  noCompletedAppointmentId: null,
  noCompletedServiceReportId: null
};

const results = [];

function validateConfig() {
  for (const [name, value] of [
    ['ADMIN_BASE_URL', ADMIN_BASE_URL],
    ['API_BASE_URL', API_BASE_URL]
  ]) {
    try {
      new URL(value);
    } catch {
      throw new Error(`${name} must be a valid URL. Received: ${value || '[empty]'}`);
    }
  }

  if (!ADMIN_EMAIL.trim()) {
    throw new Error('ADMIN_EMAIL is required for browser smoke.');
  }
  if (!ADMIN_PASSWORD.trim()) {
    throw new Error('ADMIN_PASSWORD is required for browser smoke.');
  }
}

async function assertUrlReachable(label, url, hint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    return { status: response.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} is not reachable at ${url}. ${hint} Original error: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}

function redact(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact);

  const safe = {};
  for (const [key, item] of Object.entries(value)) {
    if (/password|token|secret|mobile|lineUserId|channelAccessToken|channelSecret|apiKey/i.test(key)) {
      safe[key] = '[REDACTED]';
    } else if (item && typeof item === 'object') {
      safe[key] = redact(item);
    } else {
      safe[key] = item;
    }
  }
  return safe;
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

async function step(name, fn) {
  try {
    const details = await fn();
    pass(name, details);
    return details;
  } catch (error) {
    fail(name, error);
    throw error;
  }
}

async function api(path, { method = 'GET', token = state.token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { status: response.status, ok: response.ok, json };
}

function responseSummary(response) {
  return {
    status: response.status,
    body: redact(response.json)
  };
}

function requestPostDataJSON(request) {
  try {
    const postData = request.postData();
    return postData ? JSON.parse(postData) : null;
  } catch {
    return null;
  }
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

const NOT_COMPLETED_CASE_STATUS_PATTERN = /工程師處理中|到府中|on_site|已派工|assigned|已排程|scheduled/i;

function requireOk(response, label) {
  if (!response.ok) {
    throw new Error(`${label} failed: ${JSON.stringify(responseSummary(response))}`);
  }
  return response.json?.data;
}

function localDatetimeFromNow(minutes) {
  const date = new Date(Date.now() + minutes * 60 * 1000);
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes())
  ].join('');
}

function isoFromLocalDatetime(value) {
  return new Date(value).toISOString();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function transitionCase(caseId, action) {
  return requireOk(await api(`/api/v1/admin/cases/${caseId}/${action}`, {
    method: 'POST',
    body: { note: `${SMOKE_MARKER} ${action}` }
  }), `${action} case`);
}

async function loginApi() {
  const response = await api('/api/v1/auth/login', {
    method: 'POST',
    token: null,
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  });

  const data = requireOk(response, 'admin API login');
  if (!data?.accessToken) throw new Error('Admin API login did not return access token.');
  state.token = data.accessToken;
}

async function createFixture() {
  const organization = requireOk(await api('/api/v1/admin/organizations', {
    method: 'POST',
    body: {
      organizationCode: fixture.organizationCode,
      organizationName: fixture.organizationName,
      status: 'active'
    }
  }), 'create organization');
  state.organizationId = organization.id;

  const dispatchUnit = requireOk(await api('/api/v1/admin/dispatch-units', {
    method: 'POST',
    body: {
      organizationId: state.organizationId,
      code: fixture.dispatchUnitCode,
      name: fixture.dispatchUnitName,
      serviceRegion: 'north',
      status: 'active'
    }
  }), 'create dispatch unit');
  state.dispatchUnitId = dispatchUnit.id;

  const adminCase = requireOk(await api('/api/v1/admin/cases', {
    method: 'POST',
    body: {
      organizationId: state.organizationId,
      customer: {
        customerName: fixture.customerName,
        mobile: fixture.customerMobile,
        city: 'Taipei',
        address: 'Task071 Browser Smoke Address',
        source: 'admin'
      },
      case: {
        source: 'admin',
        brand: 'Task071 Brand',
        caseType: 'repair',
        productType: 'TV',
        modelNo: fixture.caseModelNo,
        problemDescription: fixture.caseProblemDescription,
        priority: 'normal',
        warrantyStatus: 'unknown',
        serviceRegion: 'north'
      }
    }
  }), 'create case');
  state.caseId = adminCase.id;
  state.caseNo = adminCase.caseNo;

  await transitionCase(state.caseId, 'submit');
  await transitionCase(state.caseId, 'review');
  await transitionCase(state.caseId, 'accept');

  requireOk(await api(`/api/v1/admin/cases/${state.caseId}/dispatch`, {
    method: 'POST',
    body: {
      dispatchUnitId: state.dispatchUnitId,
      assignmentNote: fixture.dispatchAssignmentNote
    }
  }), 'create dispatch assignment');

  const firstStart = localDatetimeFromNow(90);
  const firstEnd = localDatetimeFromNow(150);
  const appointment = requireOk(await api(`/api/v1/admin/cases/${state.caseId}/appointments`, {
    method: 'POST',
    body: {
      scheduledStartAt: isoFromLocalDatetime(firstStart),
      scheduledEndAt: isoFromLocalDatetime(firstEnd),
      visitType: 'repair',
      timezone: 'Asia/Taipei',
      visitSequence: 1,
      note: fixture.firstAppointmentNote
    }
  }), 'create first appointment');
  state.appointmentOneId = appointment.id;

  return {
    smokeRunId: SMOKE_RUN_ID,
    caseId: state.caseId,
    caseNo: state.caseNo,
    appointmentOneId: state.appointmentOneId
  };
}

async function createNoCompletedVisitFixture() {
  if (!state.organizationId || !state.dispatchUnitId) {
    throw new Error('Organization and dispatch unit are required before creating no-completed-visit fixture.');
  }

  const adminCase = requireOk(await api('/api/v1/admin/cases', {
    method: 'POST',
    body: {
      organizationId: state.organizationId,
      customer: {
        customerName: fixture.noCompletedCustomerName,
        mobile: fixture.noCompletedCustomerMobile,
        city: 'Taipei',
        address: 'Task071 No Completed Visit Address',
        source: 'admin'
      },
      case: {
        source: 'admin',
        brand: 'Task071 Brand',
        caseType: 'repair',
        productType: 'TV',
        modelNo: fixture.noCompletedCaseModelNo,
        problemDescription: fixture.noCompletedCaseProblemDescription,
        priority: 'normal',
        warrantyStatus: 'unknown',
        serviceRegion: 'north'
      }
    }
  }), 'create no completed visit case');
  state.noCompletedCaseId = adminCase.id;
  state.noCompletedCaseNo = adminCase.caseNo;

  await transitionCase(state.noCompletedCaseId, 'submit');
  await transitionCase(state.noCompletedCaseId, 'review');
  await transitionCase(state.noCompletedCaseId, 'accept');

  requireOk(await api(`/api/v1/admin/cases/${state.noCompletedCaseId}/dispatch`, {
    method: 'POST',
    body: {
      dispatchUnitId: state.dispatchUnitId,
      assignmentNote: `${SMOKE_MARKER} no completed visit dispatch`
    }
  }), 'create no completed visit dispatch assignment');

  const start = localDatetimeFromNow(360);
  const end = localDatetimeFromNow(420);
  const appointment = requireOk(await api(`/api/v1/admin/cases/${state.noCompletedCaseId}/appointments`, {
    method: 'POST',
    body: {
      scheduledStartAt: isoFromLocalDatetime(start),
      scheduledEndAt: isoFromLocalDatetime(end),
      visitType: 'repair',
      timezone: 'Asia/Taipei',
      visitSequence: 1,
      note: fixture.noCompletedAppointmentNote
    }
  }), 'create no completed visit appointment');
  state.noCompletedAppointmentId = appointment.id;

  const pendingAppointment = requireOk(await api(`/api/v1/admin/appointments/${state.noCompletedAppointmentId}`, {
    method: 'PATCH',
    body: {
      visitResult: 'pending_parts',
      nextAction: 'wait_for_parts',
      incompleteReason: fixture.noCompletedPendingPartsReason
    }
  }), 'mark no completed visit appointment pending parts');

  if (pendingAppointment.visitResult !== 'pending_parts') {
    throw new Error('No completed visit fixture appointment was not pending_parts.');
  }

  const report = requireOk(await api(`/api/v1/admin/cases/${state.noCompletedCaseId}/service-report`, {
    method: 'POST',
    body: {
      diagnosisResult: fixture.noCompletedDiagnosisResult,
      repairAction: fixture.noCompletedRepairAction
    }
  }), 'create no completed visit service report');
  state.noCompletedServiceReportId = report.id;

  return {
    caseId: state.noCompletedCaseId,
    caseNo: state.noCompletedCaseNo,
    appointmentId: state.noCompletedAppointmentId,
    serviceReportId: state.noCompletedServiceReportId,
    visitResult: pendingAppointment.visitResult
  };
}

async function getCaseAppointments() {
  const data = requireOk(await api(`/api/v1/admin/cases/${state.caseId}/appointments?limit=20&offset=0`), 'list case appointments');
  return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
}

async function waitForAppointmentTwoId() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    const appointments = await getCaseAppointments();
    const appointment = appointments.find((item) => item.id !== state.appointmentOneId);
    if (appointment?.id) {
      state.appointmentTwoId = appointment.id;
      return appointment.id;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Timed out waiting for second appointment id.');
}

async function loginBrowser(page) {
  await page.goto(ADMIN_BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('login-email').fill(ADMIN_EMAIL);
  await page.getByTestId('login-password').fill(ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }).catch(() => null),
    page.getByTestId('login-submit').click()
  ]);
}

async function openResultModalForAppointment(page, appointmentId) {
  const card = page.locator(`[data-testid="appointment-card"][data-appointment-id="${appointmentId}"]`).first();
  await card.scrollIntoViewIfNeeded();
  await card.getByTestId('appointment-card-result-button').click();
  await page.getByTestId('appointment-result-modal').waitFor({ state: 'visible', timeout: 10000 });
}

async function submitAppointmentResult(page, input) {
  await page.getByTestId('appointment-result-visit-result').selectOption(input.visitResult);
  if (input.nextAction) await page.getByTestId('appointment-result-next-action').selectOption(input.nextAction);
  if (input.incompleteReason) await page.getByTestId('appointment-result-incomplete-reason').fill(input.incompleteReason);
  if (input.actualArrivalAt) await page.getByTestId('appointment-result-arrival').fill(input.actualArrivalAt);
  if (input.actualFinishedAt) await page.getByTestId('appointment-result-finished').fill(input.actualFinishedAt);
  await page.getByTestId('appointment-result-submit').click();
  await page.getByTestId('appointment-result-modal').waitFor({ state: 'detached', timeout: 15000 });
}

async function waitForNotice(page, pattern, timeout = 15000) {
  const notice = page.getByTestId('notice-message');
  await notice.waitFor({ state: 'visible', timeout });
  await page.waitForFunction(
    ({ source, flags }) => {
      const element = document.querySelector('[data-testid="notice-message"]');
      return Boolean(element?.textContent?.match(new RegExp(source, flags)));
    },
    { source: pattern.source, flags: pattern.flags },
    { timeout }
  );
  await expectText(notice, pattern);
}

async function fillAndExpectInput(locator, value, attempts = 3) {
  let lastValue = '';
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await locator.fill(value);
    await new Promise((resolve) => setTimeout(resolve, 250));
    lastValue = await locator.inputValue({ timeout: 5000 });
    if (lastValue === value) return;
  }
  throw new Error(`Input value did not stabilize. Expected ${JSON.stringify(value)}, received ${JSON.stringify(lastValue)}.`);
}

async function waitForCaseDetailReady(page) {
  await page.getByTestId('case-detail-panel').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByTestId('dispatch-appointment-panel').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByTestId('visit-history-section').waitFor({ state: 'visible', timeout: 20000 });
}

async function waitForFinalMarker(page) {
  try {
    await page.getByTestId('visit-history-final-marker').waitFor({ state: 'visible', timeout: 20000 });
    return { reloaded: false };
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForCaseDetailReady(page);
    await page.getByTestId('visit-history-final-marker').waitFor({ state: 'visible', timeout: 20000 });
    return { reloaded: true };
  }
}

async function main() {
  console.log('Task 071 browser smoke config', {
    taskCode: TASK_CODE,
    smokeRunId: SMOKE_RUN_ID,
    adminBaseUrl: ADMIN_BASE_URL,
    apiBaseUrl: API_BASE_URL,
    adminEmail: ADMIN_EMAIL,
    adminPasswordProvided: Boolean(process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD),
    cleanupRequested: CLEANUP_REQUESTED,
    headless: HEADLESS,
    browserChannel: BROWSER_CHANNEL
  });

  if (CLEANUP_REQUESTED) {
    console.warn('CLEANUP=1 is not implemented for shared/runtime safety. No cleanup was performed.');
  }

  await step('preflight config and endpoints', async () => {
    validateConfig();
    const admin = await assertUrlReachable(
      'Admin frontend',
      ADMIN_BASE_URL,
      'Start local Vite first, or set ADMIN_BASE_URL to the active Vite port.'
    );
    const apiStatus = await assertUrlReachable(
      'Backend API',
      API_BASE_URL,
      'Check API_BASE_URL and network access.'
    );
    return {
      adminBaseUrl: ADMIN_BASE_URL,
      adminStatus: admin.status,
      apiBaseUrl: API_BASE_URL,
      apiStatus: apiStatus.status
    };
  });

  await step('admin API login', async () => {
    await loginApi();
    return { tokenReceived: true };
  });

  await step('create API fixture', createFixture);
  await step('create no completed visit API fixture', createNoCompletedVisitFixture);

  const browser = await chromium.launch({
    channel: BROWSER_CHANNEL,
    headless: HEADLESS,
    slowMo: Number.isFinite(SLOW_MO) ? SLOW_MO : 0
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  const acceptedDialogs = [];
  page.on('dialog', async (dialog) => {
    acceptedDialogs.push(dialog.message());
    await dialog.accept();
  });

  try {
    await step('browser login', async () => {
      await loginBrowser(page);
      return { loggedIn: true };
    });

    await step('open case detail', async () => {
      await page.goto(`${ADMIN_BASE_URL}/cases?caseId=${state.caseId}`, { waitUntil: 'domcontentloaded' });
      await waitForCaseDetailReady(page);
      return { caseId: state.caseId, caseNo: state.caseNo };
    });

    await step('mark first appointment pending parts in browser', async () => {
      await openResultModalForAppointment(page, state.appointmentOneId);
      await submitAppointmentResult(page, {
        visitResult: 'pending_parts',
        nextAction: 'wait_for_parts',
        incompleteReason: fixture.pendingPartsReason
      });
      const firstCard = page.locator(`[data-testid="visit-history-card"][data-appointment-id="${state.appointmentOneId}"]`);
      await expectText(firstCard, /缺料/);
      await expectText(firstCard, /等待零件/);
      await expectText(firstCard, new RegExp(escapeRegExp(fixture.pendingPartsReason)));
      return { appointmentId: state.appointmentOneId, visitResult: 'pending_parts' };
    });

    await step('create second appointment in browser', async () => {
      const secondStart = localDatetimeFromNow(240);
      const secondEnd = localDatetimeFromNow(300);
      await page.getByTestId('appointment-create-start').fill(secondStart);
      await page.getByTestId('appointment-create-end').fill(secondEnd);
      await page.getByTestId('appointment-create-note').fill(fixture.secondAppointmentNote);
      await page.getByTestId('appointment-create-submit').click();
      await waitForNotice(page, /預約已建立/);
      const appointmentTwoId = await waitForAppointmentTwoId();
      await page.locator(`[data-testid="appointment-card"][data-appointment-id="${appointmentTwoId}"]`).waitFor({ timeout: 15000 });
      return { appointmentId: appointmentTwoId };
    });

    await step('mark second appointment completed in browser', async () => {
      const arrival = localDatetimeFromNow(245);
      const finished = localDatetimeFromNow(295);
      await openResultModalForAppointment(page, state.appointmentTwoId);
      await submitAppointmentResult(page, {
        visitResult: 'completed',
        nextAction: 'no_action',
        actualArrivalAt: arrival,
        actualFinishedAt: finished
      });
      const secondCard = page.locator(`[data-testid="visit-history-card"][data-appointment-id="${state.appointmentTwoId}"]`);
      await expectText(secondCard, /已完成/);
      await expectText(secondCard, /無下一步/);
      return { appointmentId: state.appointmentTwoId, visitResult: 'completed' };
    });

    await step('create service report in browser', async () => {
      await page.getByTestId('service-report-panel').scrollIntoViewIfNeeded();
      await page.getByTestId('service-report-diagnosis').fill(fixture.diagnosisResult);
      await page.getByTestId('service-report-repair-action').fill(fixture.repairAction);
      const createResponsePromise = page.waitForResponse((response) => (
        response.url().includes(`/api/v1/admin/cases/${state.caseId}/service-report`) &&
        response.request().method() === 'POST'
      ), { timeout: 20000 });
      await page.getByTestId('service-report-submit').click();
      const createResponse = await createResponsePromise;
      let createJson = null;
      try {
        createJson = await createResponse.json();
      } catch {
        createJson = null;
      }
      if (!createResponse.ok()) {
        throw new Error(`service report creation failed: HTTP ${createResponse.status()} ${JSON.stringify(redact(createJson))}`);
      }
      if (createJson?.data?.serviceStatus !== 'in_progress') {
        throw new Error(`service report creation returned unexpected status: ${JSON.stringify(redact(createJson?.data))}`);
      }
      await waitForNotice(page, /到府服務紀錄已建立/);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForCaseDetailReady(page);
      await page.getByTestId('service-report-panel').waitFor({ state: 'visible', timeout: 20000 });
      await page.getByTestId('service-report-service-status').waitFor({ state: 'visible', timeout: 15000 });
      return { created: true };
    });

    await step('complete service report in browser', async () => {
      await expectInputValue(page.getByTestId('service-report-diagnosis'), fixture.diagnosisResult);
      await expectInputValue(page.getByTestId('service-report-repair-action'), fixture.repairAction);
      await fillAndExpectInput(page.getByTestId('service-report-repair-result'), fixture.repairResult);
      await page.getByTestId('service-report-service-status').selectOption('completed');
      await expectInputValue(page.getByTestId('service-report-repair-result'), fixture.repairResult);
      await expectInputValue(page.getByTestId('service-report-service-status'), 'completed');
      await expectText(page.getByTestId('service-report-final-appointment-hint'), /後端會.*finalAppointmentId.*不會由前端送出/);
      const manualPickerCount = await page.locator('[data-testid="service-report-final-appointment-picker"]').count();
      assert.equal(manualPickerCount, 0);

      const updateResponsePromise = page.waitForResponse((response) => (
        response.url().includes('/api/v1/admin/service-reports/') &&
        response.request().method() === 'PATCH'
      ), { timeout: 20000 });
      await page.getByTestId('service-report-submit').scrollIntoViewIfNeeded();
      await page.getByTestId('service-report-submit').click();
      const updateResponse = await updateResponsePromise;
      let updateJson = null;
      try {
        updateJson = await updateResponse.json();
      } catch {
        updateJson = null;
      }
      const requestPayload = requestPostDataJSON(updateResponse.request());
      if (hasOwn(requestPayload, 'finalAppointmentId')) {
        throw new Error('service report completion request unexpectedly included finalAppointmentId.');
      }
      if (!updateResponse.ok()) {
        throw new Error(`service report completion failed: HTTP ${updateResponse.status()} ${JSON.stringify(redact(updateJson))}`);
      }
      if (updateJson?.data?.serviceStatus !== 'completed') {
        throw new Error(`service report completion did not return completed: ${JSON.stringify(redact({
          requestPayload,
          response: updateJson?.data
        }))}`);
      }
      if (updateJson?.data?.finalAppointmentId !== state.appointmentTwoId) {
        throw new Error('service report completion response did not include the backend-resolved finalAppointmentId.');
      }
      await waitForNotice(page, /到府服務紀錄已更新/, 20000);
      const finalMarker = await waitForFinalMarker(page);
      await expectText(page.getByTestId('case-status-label'), /服務已完成|completed/i);
      await page.getByTestId('billing-empty-state').waitFor({ state: 'visible', timeout: 10000 });
      await expectText(page.getByTestId('case-close-status'), /案件尚未結案|正式結案|目前狀態/);
      return {
        smokeRunId: SMOKE_RUN_ID,
        caseStatus: await page.getByTestId('case-status-label').textContent(),
        finalMarkerReloaded: finalMarker.reloaded,
        finalAppointmentIdResolvedFromResponse: updateJson.data.finalAppointmentId === state.appointmentTwoId,
        requestOmittedFinalAppointmentId: !hasOwn(requestPayload, 'finalAppointmentId'),
        manualPickerAbsent: manualPickerCount === 0,
        confirmationDialogAccepted: acceptedDialogs.some((message) => /final appointment|finalAppointmentId|completed|完修/.test(message))
      };
    });

    await step('open no completed visit case detail', async () => {
      await page.goto(`${ADMIN_BASE_URL}/cases?caseId=${state.noCompletedCaseId}`, { waitUntil: 'domcontentloaded' });
      await waitForCaseDetailReady(page);
      await page.getByTestId('service-report-panel').waitFor({ state: 'visible', timeout: 20000 });
      await page.getByTestId('service-report-service-status').waitFor({ state: 'visible', timeout: 15000 });
      await page.locator(`[data-testid="visit-history-card"][data-appointment-id="${state.noCompletedAppointmentId}"]`).waitFor({ timeout: 15000 });
      await expectText(page.getByTestId('case-status-label'), NOT_COMPLETED_CASE_STATUS_PATTERN);
      const finalMarkerCount = await page.getByTestId('visit-history-final-marker').count();
      assert.equal(finalMarkerCount, 0);
      return {
        caseId: state.noCompletedCaseId,
        appointmentId: state.noCompletedAppointmentId,
        finalMarkerAbsent: finalMarkerCount === 0
      };
    });

    await step('no eligible completed visit completion is rejected in browser', async () => {
      await expectInputValue(page.getByTestId('service-report-diagnosis'), fixture.noCompletedDiagnosisResult);
      await expectInputValue(page.getByTestId('service-report-repair-action'), fixture.noCompletedRepairAction);
      await fillAndExpectInput(page.getByTestId('service-report-repair-result'), fixture.noCompletedRepairResult);
      await page.getByTestId('service-report-service-status').selectOption('completed');
      await expectText(page.getByTestId('service-report-final-appointment-hint'), /未顯示 completed visit|找不到 eligible completed visit/);
      const manualPickerCount = await page.locator('[data-testid="service-report-final-appointment-picker"]').count();
      assert.equal(manualPickerCount, 0);

      const updateResponsePromise = page.waitForResponse((response) => (
        response.url().includes('/api/v1/admin/service-reports/') &&
        response.request().method() === 'PATCH'
      ), { timeout: 20000 });
      await page.getByTestId('service-report-submit').scrollIntoViewIfNeeded();
      await page.getByTestId('service-report-submit').click();
      const updateResponse = await updateResponsePromise;
      let updateJson = null;
      try {
        updateJson = await updateResponse.json();
      } catch {
        updateJson = null;
      }
      const requestPayload = requestPostDataJSON(updateResponse.request());
      if (hasOwn(requestPayload, 'finalAppointmentId')) {
        throw new Error('No eligible completed visit completion request unexpectedly included finalAppointmentId.');
      }
      assert.equal(updateResponse.ok(), false);
      assert.equal(updateResponse.status(), 400);

      await page.getByTestId('service-report-error').waitFor({ state: 'visible', timeout: 10000 });
      await expectText(page.getByTestId('service-report-error'), /completed appointment|required|完成/i);

      const finalMarkerCount = await page.getByTestId('visit-history-final-marker').count();
      assert.equal(finalMarkerCount, 0);
      await page.locator(`[data-testid="visit-history-card"][data-appointment-id="${state.noCompletedAppointmentId}"]`).waitFor({ timeout: 15000 });

      const reportAfter = requireOk(
        await api(`/api/v1/admin/cases/${state.noCompletedCaseId}/service-report`),
        'get no completed visit report after rejected completion'
      );
      const caseAfter = requireOk(
        await api(`/api/v1/admin/cases/${state.noCompletedCaseId}`),
        'get no completed visit case after rejected completion'
      );

      if (reportAfter.serviceStatus === 'completed') {
        throw new Error('No completed visit report was unexpectedly completed.');
      }
      if (caseAfter.status === 'completed' || caseAfter.status === 'closed') {
        throw new Error('No completed visit case was unexpectedly completed or closed.');
      }
      if (caseAfter.completedAt) {
        throw new Error('No completed visit case completedAt was unexpectedly set.');
      }

      await expectText(page.getByTestId('case-status-label'), NOT_COMPLETED_CASE_STATUS_PATTERN);

      return {
        requestOmittedFinalAppointmentId: !hasOwn(requestPayload, 'finalAppointmentId'),
        backendRejected: !updateResponse.ok(),
        errorCode: updateJson?.error?.code || null,
        reportStatus: reportAfter.serviceStatus,
        caseStatus: caseAfter.status,
        completedAtSet: Boolean(caseAfter.completedAt),
        finalMarkerAbsent: finalMarkerCount === 0,
        manualPickerAbsent: manualPickerCount === 0
      };
    });
  } finally {
    await context.close();
    await browser.close();
  }

  const failed = results.filter((result) => result.status === 'FAIL');
  console.log('Task 071 browser smoke summary', {
    smokeRunId: SMOKE_RUN_ID,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length
  });

  if (failed.length > 0) process.exitCode = 1;
}

async function expectText(locator, pattern) {
  const text = await locator.textContent({ timeout: 10000 });
  assert.match(text || '', pattern);
}

async function expectInputValue(locator, expectedValue) {
  const value = await locator.inputValue({ timeout: 10000 });
  assert.equal(value, expectedValue);
}


main().catch((error) => {
  fail('unhandled browser smoke error', error);
  process.exitCode = 1;
});
