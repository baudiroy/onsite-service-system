# Task 764 - Engineer Mobile App Executor-specific Priority Coverage / No Runtime Change

## Status

Completed.

## Scope

Test-only coverage after Task 762 and Task 763 app executor shortcut wiring.

This task verifies that app-level Engineer Mobile executor shortcuts route list and detail requests to the most specific injected executor when both shared and route-specific executors are provided.

## Changes

- Added list-route coverage for:
  - shared `engineerMobileReadExecutor`
  - list-specific `engineerMobileListExecutor`
- Added detail-route coverage for:
  - shared `engineerMobileReadExecutor`
  - detail-specific `engineerMobileDetailExecutor`

The tests confirm:

- route-specific executor shortcuts have priority over the shared executor shortcut.
- app factory creation does not need DB access.
- list requests receive only organization and engineer scope.
- detail requests receive organization, engineer, and appointment scope.
- safe output excludes internal fields, raw identifiers, and `finalAppointmentId`.

## Runtime Decision

No runtime behavior changed in this task.

## Non-goals

- No backend DB connection.
- No migration.
- No provider sending.
- No LINE, SMS, email, App push, AI, RAG, vector DB, or notification runtime.
- No admin frontend changes.

## Verification

Targeted and full verification were run in the task close-out sequence.
