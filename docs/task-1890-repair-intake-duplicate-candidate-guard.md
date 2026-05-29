# Task1890 Repair Intake Duplicate Candidate Guard

Status: implemented and verified with synthetic tests only.

Scope:
- Add a dedicated Repair Intake duplicate candidate guard.
- Integrate the guard into the existing draft-to-Case eligibility boundary.
- Keep duplicate candidate signals advisory until explicitly reviewed or explicitly confirmed by status.

## Implementation Summary

- Added `src/repairIntake/repairIntakeDuplicateCandidateGuard.js`.
- Hardened `src/repairIntake/repairIntakeDraftCaseEligibility.js` to use the guard.
- The guard classifies duplicate state as:
  - `clear`
  - `review_required`
  - `blocked`
- Missing or ambiguous duplicate signal now fails closed as review-required.
- A duplicate candidate object never becomes a confirmed duplicate by itself.
- Explicit `confirmed_duplicate` or `duplicate` status blocks promotion without linking or creating a Case.

## Guard Behavior

- Clear path:
  - `duplicateStatus` of `clear`, `cleared`, `no_duplicate`, `none`, or `not_duplicate`
  - no duplicate candidate object present
- Review-required path:
  - unresolved/candidate duplicate status;
  - duplicate candidate present while status is otherwise clear;
  - missing duplicate status;
  - ambiguous candidate-only signal.
- Blocked path:
  - explicit confirmed duplicate status;
  - organization mismatch.

The sanitized duplicate candidate output is limited to candidate/status/reason/source metadata and strips raw PII, raw rows, formal Case identifiers, tokens, secrets, SQL, and stack traces.

## Explicit Non-goals

- No DB connection.
- No SQL execution.
- No migration.
- No seed.
- No route.
- No route mount.
- No smoke.
- No deploy.
- No Zeabur env changes.
- No provider sending.
- No AI/RAG execution.
- No billing.
- No draft merge.
- No formal Case creation.
- No draft-to-formal-Case linking.
- No customer mutation.
- No billing contact mutation.
- No appointment mutation.
- No Completion Report / Field Service Report mutation.
- No finalAppointmentId mutation.
- No customer-visible publication behavior.

## Verification Summary

- Added synthetic guard tests for:
  - clear no-duplicate path;
  - duplicate candidate review-required path;
  - confirmed marker not automatically inferred from candidate metadata;
  - explicit confirmed duplicate blocked path;
  - missing duplicate signal fail-closed path;
  - ambiguous candidate with clear status review-required path;
  - organization mismatch safe failure.
- Added eligibility coverage for:
  - duplicate candidate remains advisory;
  - missing duplicate signal requires review.
- Added static Task1890 boundary coverage for:
  - no DB/runtime/provider/AI/billing/route coupling;
  - no formal Case creation/linking;
  - no draft merge;
  - no Completion Report / Field Service Report mutation;
  - no finalAppointmentId mutation.
