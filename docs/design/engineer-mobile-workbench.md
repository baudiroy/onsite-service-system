# Engineer Mobile Workbench / 工程師手機工作台

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

Engineer Mobile Workbench is the first-stage engineer field workflow. It should start as mobile web, PWA, LIFF-like entry, or installable Web App. It should not begin as a full native iOS / Android App unless a later product task explicitly changes that strategy.

The goal is fast, low-burden field operation on a phone, not a complex back-office form.

## Phase 1 Scope

Phase 1 should support:

- engineer login and session boundary
- organization scope and permission check
- engineer assignment isolation
- today / upcoming task list
- appointment / dispatch visit detail
- customer address and contact details with masking policy
- scheduled time and service notes
- product / reported issue / safety notes
- arrive / start / complete status operations
- concise completion form
- photo upload as file/object storage evidence
- parts replacement record
- fault cause and repair action summary
- customer signature or signature exception reason
- completion submission as Field Service Report source data
- audit log for important actions

## Core Workflow Integration

Engineer Mobile Workbench must connect to the existing workflow:

Case -> Appointment / Dispatch Visit -> Field Service Report -> Service Parts -> Photos / Signature -> Completion Confirmation

It must preserve:

- one Case has one formal completion report
- one Case may have many appointments / dispatch visits
- visit results belong to appointment / dispatch visit layer
- final report is case-level completion summary
- `finalAppointmentId` is backend/system determined from the completed appointment
- engineers should not manually select `finalAppointmentId` in normal flow
- admin exception / override is not an engineer default workflow

## LINE Boundary

Engineer tasks should not depend on LINE push notifications. Engineers should actively login to the workbench to view assigned tasks. LINE may later be used only as quick-login, identity binding, or shortcut entry to open the workbench.

## UX Rules

- mobile-first
- large actions
- few fields
- concise text
- minimal required input
- photo capture support
- signature or signature exception support
- draft saving for weak network as future design
- no complex admin settings in the field UI

## Extended Future Capabilities

Future Engineer Mobile Workbench / mobile app capabilities may include:

- next-stop reminder
- map / navigation link
- case summary and service history summary
- repair-time estimate
- arrive / leave / complete time records
- fault / after-repair / parts photos
- old / new serial number record
- pending parts report
- quote-needed report
- customer-not-home report
- unable-to-repair report
- cancel / reschedule outcome
- add-on / extra work report
- customer fee approval record
- missing evidence reminder
- future push notification
- future offline draft / weak-network sync

These features must remain low-burden for engineers and should be added gradually.

## Security / Privacy / SaaS

Engineer-facing workflows must follow organization scope, role permission, audit log, ISO 27001-aligned safety, sensitive data masking, and least-privilege data visibility.

Engineers should only see assigned or authorized tasks. They should not see unnecessary billing internal data, settlement internal data, audit logs, AI raw payload, other engineers' tasks, management reports, or internal billing rules.

Photos, signatures, and documents should use file / object storage with metadata, uploader, timestamp, and related case / appointment / service report. App tokens, sessions, push tokens, customer signatures, photos, address, phone, serials, and AI raw sensitive payload must not appear in unsafe logs or errors.

Engineer accounts may later be priced as Field Engineer Seats and controlled by SaaS plan / entitlement / permission. Possible future feature keys include:

- engineer_mobile_basic
- engineer_photo_upload
- engineer_signature_capture
- engineer_parts_tracking
- engineer_serial_tracking
- engineer_quote_request
- engineer_offline_mode
- engineer_push_notification
- engineer_ai_completion_summary

## Implementation Strategy

Do not start with a full native iOS / Android app. Build mobile responsive web / PWA / LIFF-like workbench first, stabilize appointment, completion, photo, signature, parts, and Field Service Report flow, then evaluate native apps later.

Any native app must use the same backend API, permission, organization scope, audit log, file storage, Case, Appointment, Service Report, and completion model.

## Task720-729 Read-model Branch Closure

Tasks720-729 close the current Engineer Mobile read-model safety branch. The accepted boundary is read-model only: sanitized fixtures, mapper redaction, injected provider behavior, list / detail safety, no action intent, no completion writes, and no DB. Multiple appointments can appear for the same Case without implying multiple formal reports. `finalAppointmentId` remains backend/system-owned and is not exposed or decided by Engineer Mobile read-model mapping.

## Task775 Migration 022 No-DB Readiness Closure

Task775 closes the Engineer Mobile Migration 022 no-DB readiness checkpoint. The accepted boundary covers mapper/migration alignment, rollback plan, dry-run authorization, dry-run result template, sanitized fixtures, provider redaction, detail redaction, action intent boundary, and read-model closure. Migration 022 remains an authoring-only file with no DB connection, no psql, no db:migrate, no DDL, no SQL execution, no dry-run, and no apply. The branch still has no completion writes, no Field Service Report creation/update, no finalAppointmentId mutation, no provider sending, no AI/RAG runtime, no admin UI, and no smoke/integration expansion.

## Task782 Runtime Adoption Readiness Packet

Task782 records the readiness gates before any future Engineer Mobile runtime adoption after the Migration 022 closure. A future first runtime slice, if separately approved, should be repository-read only with an injected DB boundary and no completion writes. API, DB/migration, repository, permission, audit, completion write, finalAppointmentId, provider, AI/RAG, admin UI, package, and smoke changes all require explicit bounded approval.

## Task783-784 Read Model Repository Closure

Tasks783-784 close the first injected read-model repository slice. The accepted boundary is injected DB boundary only, no real DB, no API route wiring, no app/server/router wiring, no completion writes, and no finalAppointmentId exposure or mutation. Repository output remains mapped through the safe read-model mappers. finalAppointmentId remains backend/system-owned. Engineer Mobile still preserves that one Case has one formal completion report while one Case may have many appointments / dispatch visits.

## Task785-786 Injected Repository Provider Path Closure

Tasks785-786 close the optional app-factory provider composition path for the injected read-model repository. The accepted boundary is explicit opt-in only: `useRequestAwareProvider` plus an injected `dbClient` or `transaction`, with explicit read sources and executor sources keeping priority. The path remains no real DB, no API shape change, no completion writes, no provider sending, no AI/RAG runtime, and no `finalAppointmentId` exposure, mutation, or inference. Engineer Mobile still preserves that one Case has one formal completion report while one Case may have many appointments / dispatch visits, and finalAppointmentId remains backend/system-owned.

## Task787-788 Injected Repository HTTP Behavior Closure

Tasks787-788 close the HTTP-style behavior coverage for the injected repository provider path. The accepted boundary is app-like unit testing only: no listen, no server start, no real DB, no API shape change, no completion writes, no provider sending, no AI/RAG runtime, and no `finalAppointmentId` exposure, mutation, or inference. The list/detail response shapes remain `status` / `tasks` and `status` / `detail`. Engineer Mobile still preserves that one Case has one formal completion report while one Case may have many appointments / dispatch visits, and finalAppointmentId remains backend/system-owned.

## Task783-789 Injected Repository Branch Closure

Tasks783-789 close the current Engineer Mobile injected repository runtime-adjacent branch. The accepted boundary is injected-only, fake-DB unit coverage only, no listen, no real DB, no API shape change, no completion writes, no Field Service Report creation/update, no provider sending, no AI/RAG runtime, no Migration 022 execution, and no `finalAppointmentId` exposure, mutation, or inference. Repository access remains limited to explicit injected `dbClient` / `transaction` boundaries and explicit request-aware opt-in. Engineer Mobile still preserves that one Case has one formal completion report while one Case may have many appointments / dispatch visits, and finalAppointmentId remains backend/system-owned.

## Task793 Permission Assignment Guard

Task793 adds a pure `engineerMobilePermissionAssignmentGuard` decision helper for `task_list` and `task_detail`. It is fail-closed, organization-scoped, and uses only caller-provided synthetic permission / assignment context. It returns safe allow/deny metadata only and does not wire into API routes, DB, repositories, audit writers, completion writes, provider sending, AI/RAG runtime, admin UI, smoke tests, or `finalAppointmentId` logic. Dispatcher / supervisor / admin style access remains explicit same-organization assignment context only; engineers require assigned or eligible task scope.

## Task793-794 Permission Assignment Guard Closure

Task794 closes the Task793 guard slice with static evidence. The permission / assignment guard remains a pure decision helper and is not wired into API, DB, repositories, audit writers, completion writes, Field Service Report writes, provider sending, AI/RAG runtime, admin UI, package changes, or smoke/integration coverage. Any future route/controller integration, real assignment resolver, real permission service, or audit writer requires a separate bounded task.

## Task795 App Provider Guard Integration

Task795 wires the Task793 permission / assignment guard into the existing Engineer Mobile app/provider read path as an opt-in synthetic check. The provider path can inject `permissionAssignmentGuardEnabled`, `permissionAssignmentGuard`, and `permissionAssignmentContext`; default behavior remains backward compatible when the guard is not enabled. Allowed output keeps the existing `status` / `tasks` and `status` / `detail` shapes. Denied list/detail access returns safe empty or existing not-found / denied envelopes without leaking raw provider rows, internal notes, full phone/address, raw LINE ids, AI raw payload, billing/settlement internals, Field Service Report ids, or `finalAppointmentId`.

The slice remains no real DB, no API shape change, no route/controller/global app change, no audit writer, no completion write, no Field Service Report write, no provider sending, no AI/RAG runtime, and no `finalAppointmentId` exposure, inference, or mutation.

## Task795-796 Permission Guard App Integration Closure

Task796 closes the Task795 app/provider guard integration slice with static evidence. The accepted boundary is explicit opt-in only: an injected guard does not run unless `permissionAssignmentGuardEnabled` or `usePermissionAssignmentGuard` is explicitly enabled. The integration remains synthetic-context only and read-path only. It does not add a real permission service, real assignment resolver, audit writer, DB path, API shape change, completion write, Field Service Report write, provider sending, AI/RAG runtime, admin UI, package change, smoke expansion, or `finalAppointmentId` exposure, inference, or mutation.

## Task797-798 Permission Guard HTTP Behavior Closure

Tasks797-798 close the HTTP-style app-like behavior coverage for the optional Engineer Mobile permission / assignment guard. The accepted boundary is `createApp` plus `app.handle(req, res)` unit coverage only: no listen, no server start, no real DB, no API shape change, no completion write, no Field Service Report write, no provider sending, no AI/RAG runtime, and no `finalAppointmentId` exposure, inference, or mutation. The guard remains explicit opt-in only through injected synthetic context, and default guard-disabled behavior stays backward compatible.

## Task793-799 Permission Runtime-adjacent Branch Closure

Task799 closes the current Engineer Mobile permission / assignment runtime-adjacent branch. The accepted boundary remains optional, injected, synthetic-context, read-path only, explicit opt-in only, no DB, no API shape change, no audit writer, no completion write, no Field Service Report write, no provider sending, no AI/RAG runtime, and no `finalAppointmentId` exposure, inference, or mutation. Any real permission service, real assignment resolver, real audit writer, task-read evidence logging, DB-backed repository promotion, smoke/integration coverage, admin/mobile UI behavior, or completion submission persistence requires a separate bounded task.

## Task800 Runtime-adjacent Milestone Checkpoint

Task800 records the Engineer Mobile runtime-adjacent milestone after the Task783-789 injected repository branch and Task793-799 permission / assignment guard branch. The current accepted state is injected fake-DB/unit-test repository evidence plus optional, injected, synthetic-context, read-path-only permission guard evidence. Migration 022 remains no DB, no psql, no db:migrate, no DDL, no dry-run, and no apply. Real DB read adoption, real permission service integration, audit writer, completion submission, Field Service Report writes, provider sending, AI/RAG helpers, admin/mobile UI behavior, and smoke/integration coverage all require separate explicit approval.

## Task802 Read Access Audit Intent Builder

Task802 adds a pure Engineer Mobile read access audit intent builder for future task-list and task-detail read evidence. The builder produces safe metadata only for allowed / denied read outcomes and explicitly marks `auditWritten: false`. It does not write audit logs, persist DB rows, change API response shapes, call providers, expose or mutate `finalAppointmentId`, invoke AI/RAG, or wire into admin/mobile UI. Any real audit writer, task-read evidence logging, DB persistence, route integration, or smoke/integration coverage requires a separate bounded task.

## Task802-804 Read Access Audit Intent Side-channel Closure

Tasks802-804 close the current Engineer Mobile read access audit intent side-channel slice. The accepted state is internal-only metadata: `{ response, auditIntent }`, where `response` remains the existing public body shape and `auditIntent` remains safe metadata with `auditWritten: false`. This branch keeps no audit writer, no DB, no API response shape change, no completion write, no provider sending, no AI/RAG runtime, and no `finalAppointmentId` exposure, inference, or mutation. Any real audit persistence, route/controller wiring, task-read evidence logging, DB adoption, or smoke/integration coverage requires a separate bounded task.

## AI Assistance

AI may later help:

- turn short engineer input into standardized completion summary
- classify fault cause
- organize parts replacement information
- extract serial/model labels from photos
- complete Field Service Report draft
- learn from accepted engineer completion patterns

AI must not add field burden, auto-fake arrival, auto-fake signature, auto-complete required checks, approve quotes, settle fees, or modify formal case status.

## Future Tasks

- mobile web / PWA UI design
- real auth/session integration
- assignment resolver and permission tests
- completion submission persistence
- photo/signature file storage
- weak network draft strategy
- engineer-facing AI confirmation card
