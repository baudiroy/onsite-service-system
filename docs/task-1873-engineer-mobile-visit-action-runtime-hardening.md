# Task1873 Engineer Mobile Visit Action Runtime Hardening

## Summary

Task1873 hardens Engineer Mobile visit-action runtime metadata flow without changing schema, runtime mounts, provider behavior, or public response shape.

The hardening target is requestId propagation. HTTP normalization already accepted request IDs, but the command and integrated persistence path did not preserve them consistently after the service boundary. This task carries the safe request metadata through the existing injected runtime chain.

## requestId propagation

The following boundaries now preserve `requestId` when provided:

- Command planner result root.
- Command planner transition intent.
- Command planner audit intent.
- Application service safe result envelope.
- Transition patch builder result envelope.
- Transition writer adapter patch envelope.
- Integrated persistence writer transition `auditContext`.
- Runtime bootstrap integrated audit intent.
- Repository contract normalized audit event.
- Persistence port contract normalized audit event.
- Repository adapter synthetic operation intent audit event.

`requestId` is metadata only. It is not added to appointment mutation patch fields.

## Runtime hardening notes

- Unsupported and denied actions still pass through the existing safe planner denial path.
- Missing transition writer still returns `transition_writer_required`.
- Transition writer failure still returns `transition_write_failed`.
- Missing audit writer still preserves successful transition application with `auditRecorded=false`.
- Audit writer failure still returns `audit_write_failed` without raw error exposure.
- Repository and persistence failures remain sanitized.

## Safety boundaries

- No DB execution.
- No SQL execution.
- No migration.
- No seed.
- No runtime server start.
- No deploy.
- No Zeabur change.
- No provider sending.
- No Completion Report / Field Service Report creation, approval, or publication.
- No Field Service Report behavior.
- No `finalAppointmentId` mutation.
- No finalAppointmentId mutation.
- No customer-visible publication behavior.
- No secrets printed or stored.

## Tests

Task1873 added or adjusted synthetic tests for:

- command planner requestId propagation
- application service requestId propagation
- transition patch builder requestId handling
- transition writer adapter requestId handling
- integrated persistence writer requestId handling
- runtime bootstrap repository bridge requestId propagation
- repository contract and repository adapter safe audit event request metadata
- static no-runtime/no-provider/no-publication boundaries

The task remains synthetic only and does not connect to a database.
