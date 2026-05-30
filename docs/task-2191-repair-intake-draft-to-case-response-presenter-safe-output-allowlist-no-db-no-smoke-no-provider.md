# Task2191 Repair Intake Draft-to-Case Response Presenter Safe Output Allowlist

## Scope

- Strengthens and verifies the outbound Repair Intake draft-to-case public response boundary.
- Keeps service/use-case results behind explicit public presenter and HTTP envelope allowlists.
- Does not mount or expand any route.

## Boundary

The inspected outbound boundary is:

- `presentRepairIntakeDraftToCaseResult()` in `src/repairIntake/repairIntakeDraftToCasePublicResultPresenter.js`
- `mapRepairIntakeDraftToCasePublicResultToHttpResponse()` in `src/repairIntake/repairIntakeDraftToCaseHttpResultMapper.js`

The presenter emits only public result fields. The HTTP mapper emits only `PUBLIC_FIELD_NAMES` and rejects unsafe public string values.

## Runtime Boundary

This task adds focused output-boundary coverage and strengthens HTTP mapper unsafe value markers. It does not change DB/repository behavior, provider behavior, public/open route mounting, admin frontend behavior, AI/RAG behavior, billing behavior, or package dependencies.

## Safe Output Fields

- `ok`
- `status`
- `messageKey`
- `reasonCode`
- `caseId`
- `repairIntakeDraftId`

`caseId` remains intentionally public-safe because it is part of the existing public result contract. Unsafe public ID values are rejected by the HTTP mapper.
