# Phase 13 — AI and RAG Assistance Layer

Status:
- Draft phase overview.
- Not authorization to execute.

Task range: Task1929–1940

Purpose:
- Introduce advisory AI/RAG support for narrow fields and events without permitting AI to bypass permissions, mutate records, or expose sensitive/customer data.

Gate:
- Proceed only after core runtime and SaaS guardrails are stable enough to protect AI boundaries.

Tasks:
- Task1929 — AI Assistance Layer Readiness Inspection / No Provider Call: Inspect current AI/RAG docs, provider env, data scope, and no-provider boundaries.
- Task1930 — AI Scope Registry / Advisory Only: Create/implement registry for allowed AI assistance scopes and forbidden actions.
- Task1931 — RAG Source Classification Boundary: Classify allowed RAG sources by org, customer-visible status, sensitivity, and retention.
- Task1932 — AI Permission and Organization Isolation Guard: Ensure AI retrieval and suggestions cannot cross organization or permission boundaries.
- Task1933 — Field-level AI Suggestion DTO / No Mutation: Implement suggestion DTOs for narrow fields/events without automatic persistence.
- Task1934 — AI Audit Log Boundary: Audit AI prompt/scope/decision metadata without storing excessive sensitive content.
- Task1935 — Provider Adapter Interface / No Real Provider Call: Implement provider interface with fake/synthetic provider tests only.
- Task1936 — AI Provider Enablement Gate / Explicit Secrets Only: Create gate for enabling real provider keys without printing secrets.
- Task1937 — RAG Indexing Readiness / No Vector DB Mutation: Prepare indexing plan and filters only; no vector DB write.
- Task1938 — AI Safety Red-team Static Tests: Add tests for prompt injection, permission bypass, raw data leakage, and unsafe tool calls.
- Task1939 — AI Assisted Workflow Smoke Readiness / No Smoke: Prepare approved-target AI smoke plan without provider calls.
- Task1940 — AI Assistance Branch Final Review: Review AI boundaries, tests, docs, provider gate, and remaining risks.

Phase restrictions:
- Do not skip task acceptance.
- Do not cross into the next phase without PM approval.
- Respect all global guardrails from README.md.
