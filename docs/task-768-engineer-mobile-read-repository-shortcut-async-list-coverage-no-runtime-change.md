# Task 768 - Engineer Mobile Read Repository Shortcut Async List Coverage / No Runtime Change

## Status

Completed.

## Scope

Test-only coverage after Task 761 read repository shortcut wiring and Task 767 async detail shortcut coverage.

This task verifies that the top-level `engineerMobileReadRepository` shortcut supports async task list reads in both app factory and server bootstrap wiring.

## Changes

- Added app list-route coverage for async `engineerMobileReadRepository.getReadModelAsync(...)`.
- Added server list-route coverage for async `engineerMobileReadRepository.getReadModelAsync(...)`.

The tests confirm:

- list routes call async repository `getReadModelAsync(...)`.
- list routes do not fall back to sync list methods when the async read model method exists.
- async list calls receive organization and engineer scope.
- wrong organization and wrong engineer rows remain filtered out.
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
