# Phase 19 — Billing Provider, Settlement, and Invoicing Gate

Status:
- Draft phase overview.
- Not authorization to execute.

Task range: Task1995–2000

Purpose:
- Prepare billing provider and settlement/invoicing integration only after SaaS entitlement and usage metering are accepted.

Gate:
- Proceed only after SaaS MVP readiness review and explicit billing provider decision.

Tasks:
- Task1995 — Billing Provider Selection Readiness / No Integration: Compare integration needs and define provider decision gate without coding provider.
- Task1996 — Invoice and Settlement Data Boundary: Define invoice/settlement data separation from Case/customer/reporter/billing_contact.
- Task1997 — Billing Provider Adapter Interface / No Real Provider Call: Implement provider adapter interface with fake provider tests only.
- Task1998 — Billing Webhook Security Gate / No Public Activation: Prepare webhook signature/security boundary without enabling live provider.
- Task1999 — Billing End-to-end Dry-run / Sandbox Approval Only: Run billing dry-run only against approved sandbox and no real charges.
- Task2000 — Post-MVP Roadmap and Production Launch Gate Review: Review MVP trial evidence and define post-MVP launch roadmap and production gates.

Phase restrictions:
- Do not skip task acceptance.
- Do not cross into the next phase without PM approval.
- Respect all global guardrails from README.md.
