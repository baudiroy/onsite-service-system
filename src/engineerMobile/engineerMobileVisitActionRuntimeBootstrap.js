'use strict';

const {
  createEngineerMobileVisitActionApplicationService,
} = require('./engineerMobileVisitActionApplicationService');
const {
  createEngineerMobileVisitActionInjectedMountAdapter,
} = require('./engineerMobileVisitActionInjectedMountAdapter');
const {
  createEngineerMobileVisitActionTransitionWriterAdapter,
} = require('./engineerMobileVisitActionTransitionWriterAdapter');
const {
  createEngineerMobileVisitActionAuditWriterAdapter,
} = require('./engineerMobileVisitActionAuditWriterAdapter');
const {
  createEngineerMobileVisitActionIntegratedPersistenceWriter,
} = require('./engineerMobileVisitActionIntegratedPersistenceWriter');
const {
  createEngineerMobileVisitActionRepositoryPersistencePortBridge,
} = require('./engineerMobileVisitActionRepositoryPersistencePortBridge');

const ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND = 'engineer_mobile.visit_action_runtime_bootstrap';
const AUDIT_EVENT_ACTION_BY_VISIT_ACTION = Object.freeze({
  'engineer_mobile.start_travel': 'engineer_mobile.start_travel.allowed',
  'engineer_mobile.arrive': 'engineer_mobile.arrive.allowed',
  'engineer_mobile.start_work': 'engineer_mobile.start_work.allowed',
  'engineer_mobile.finish_work': 'engineer_mobile.finish_work.allowed',
  'engineer_mobile.record_visit_result': 'engineer_mobile.record_visit_result.allowed',
});

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneRoutes(routes) {
  if (!Array.isArray(routes)) {
    return [];
  }

  return routes
    .filter(isObject)
    .map((route) => ({
      method: route.method,
      path: route.path,
    }));
}

function writerSourceResult(writerSources) {
  return {
    transitionWriter: writerSources.transitionWriter,
    auditWriter: writerSources.auditWriter,
  };
}

function resolveTransitionWriter(source) {
  if (isObject(source.transitionWriter)) {
    return {
      writer: source.transitionWriter,
      source: 'direct',
    };
  }

  if (isObject(source.patchWriter)) {
    return {
      writer: createEngineerMobileVisitActionTransitionWriterAdapter({
        patchWriter: source.patchWriter,
        now: source.now,
      }),
      source: 'patch_writer_adapter',
    };
  }

  return {
    writer: undefined,
    source: 'missing',
  };
}

function resolveAuditWriter(source) {
  if (isObject(source.auditWriter)) {
    return {
      writer: source.auditWriter,
      source: 'direct',
    };
  }

  if (isObject(source.auditEventWriter)) {
    const auditEventWriterAdapter = createEngineerMobileVisitActionAuditWriterAdapter({
      auditEventWriter: source.auditEventWriter,
      now: source.now,
    });

    return {
      writer: auditIntentWriterAdapter(auditEventWriterAdapter),
      source: 'audit_event_writer_adapter',
    };
  }

  return {
    writer: undefined,
    source: 'missing',
  };
}

function auditEventIntentFrom(auditIntent) {
  const source = isObject(auditIntent) ? auditIntent : {};
  const action = AUDIT_EVENT_ACTION_BY_VISIT_ACTION[source.action];

  return {
    action,
    entityType: 'appointment',
    entityId: source.appointmentId,
    actorId: source.actorId,
    organizationId: source.organizationId,
    caseId: source.caseId,
    appointmentId: source.appointmentId,
    requestId: source.requestId,
  };
}

function integratedAuditIntentFrom(transitionIntent) {
  const source = isObject(transitionIntent) ? transitionIntent : {};
  const action = AUDIT_EVENT_ACTION_BY_VISIT_ACTION[source.action];

  return {
    action,
    entityType: 'appointment',
    entityId: source.appointmentId,
    actorId: source.actorId,
    organizationId: source.organizationId,
    caseId: source.caseId,
    appointmentId: source.appointmentId,
    requestId: source.requestId,
  };
}

function integratedTransitionWriterAdapter(integratedPersistenceWriter, options = {}) {
  const includeAudit = options.includeAudit === true;

  return {
    kind: integratedPersistenceWriter.kind,
    write(transitionIntent) {
      return integratedPersistenceWriter.write({
        transitionIntent,
        auditIntent: includeAudit ? integratedAuditIntentFrom(transitionIntent) : undefined,
      });
    },
  };
}

function auditIntentWriterAdapter(auditEventWriterAdapter) {
  return {
    kind: auditEventWriterAdapter.kind,
    record(auditIntent) {
      return auditEventWriterAdapter.record(auditEventIntentFrom(auditIntent));
    },
  };
}

function integratedWriterFromPersistencePort(persistencePort, source, writerSource) {
  const integratedPersistenceWriter = createEngineerMobileVisitActionIntegratedPersistenceWriter({
    persistencePort,
    now: source.now,
  });
  const hasDirectAuditWriter = isObject(source.auditWriter);
  const audit = resolveAuditWriter({
    ...source,
    persistencePort: undefined,
    repositoryAdapter: undefined,
    auditEventWriter: hasDirectAuditWriter ? source.auditEventWriter : undefined,
  });

  return {
    transitionWriter: integratedTransitionWriterAdapter(integratedPersistenceWriter, {
      includeAudit: !hasDirectAuditWriter,
    }),
    auditWriter: audit.writer,
    sources: {
      transitionWriter: writerSource,
      auditWriter: hasDirectAuditWriter ? audit.source : writerSource,
    },
  };
}

function resolvedWriters(source) {
  const transitionSourceHasDirectWriter = isObject(source.transitionWriter);

  if (!transitionSourceHasDirectWriter && isObject(source.persistencePort)) {
    return integratedWriterFromPersistencePort(
      source.persistencePort,
      source,
      'integrated_persistence_writer',
    );
  }

  if (!transitionSourceHasDirectWriter && isObject(source.repositoryAdapter)) {
    const repositoryPersistencePortBridge = createEngineerMobileVisitActionRepositoryPersistencePortBridge({
      repositoryAdapter: source.repositoryAdapter,
    });

    return integratedWriterFromPersistencePort(
      repositoryPersistencePortBridge,
      source,
      'repository_bridge_integrated_writer',
    );
  }

  const transition = resolveTransitionWriter(source);
  const audit = (
    isObject(source.auditWriter)
    || (!isObject(source.persistencePort) && !isObject(source.repositoryAdapter))
      ? resolveAuditWriter(source)
      : { writer: undefined, source: 'missing' }
  );

  return {
    transitionWriter: transition.writer,
    auditWriter: audit.writer,
    sources: {
      transitionWriter: transition.source,
      auditWriter: audit.source,
    },
  };
}

function serviceOnlyResult(visitActionService, writerSources) {
  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND,
    ok: true,
    reasonCode: 'service_only',
    mounted: 0,
    routes: [],
    writerSources: writerSourceResult(writerSources),
    visitActionService,
  };
}

function mountedResult(visitActionService, mountSummary, writerSources) {
  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND,
    ok: true,
    reasonCode: 'mounted',
    mounted: mountSummary.mounted === 1 ? 1 : 0,
    routes: cloneRoutes(mountSummary.routes),
    writerSources: writerSourceResult(writerSources),
    mountSummary: {
      ok: true,
      reasonCode: 'mounted',
      mounted: mountSummary.mounted === 1 ? 1 : 0,
      routes: cloneRoutes(mountSummary.routes),
      mountStyle: mountSummary.mountStyle,
    },
    visitActionService,
  };
}

function failedMountResult(visitActionService, mountSummary, writerSources) {
  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND,
    ok: false,
    reasonCode: mountSummary.reasonCode,
    mounted: 0,
    routes: [],
    writerSources: writerSourceResult(writerSources),
    mountSummary: {
      ok: false,
      reasonCode: mountSummary.reasonCode,
      mounted: 0,
      routes: [],
    },
    visitActionService,
  };
}

function createEngineerMobileVisitActionRuntimeBootstrap(options = {}) {
  const source = isObject(options) ? options : {};
  const writers = resolvedWriters(source);
  const visitActionService = createEngineerMobileVisitActionApplicationService({
    transitionWriter: writers.transitionWriter,
    auditWriter: writers.auditWriter,
  });

  if (!isObject(source.mountTarget)) {
    return serviceOnlyResult(visitActionService, writers.sources);
  }

  const mountSummary = createEngineerMobileVisitActionInjectedMountAdapter({
    mountTarget: source.mountTarget,
    visitActionService,
    basePath: source.basePath,
  });

  if (!isObject(mountSummary) || mountSummary.ok !== true) {
    return failedMountResult(visitActionService, isObject(mountSummary) ? mountSummary : {
      reasonCode: 'unsupported_mount_target',
    }, writers.sources);
  }

  return mountedResult(visitActionService, mountSummary, writers.sources);
}

module.exports = {
  createEngineerMobileVisitActionRuntimeBootstrap,
  ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND,
};
