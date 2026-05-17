# System Overview

## Product Definition

This system is an AI-enhanced field service platform.

It includes:

```text
AI customer service
+
Repair request system
+
Dispatch system
+
Engineer on-site service system
+
Billing reconciliation system
```

The first phase focuses on the repair request foundation while preserving future expansion for dispatch, engineer workflow, and billing reconciliation.

For the long-term product and AI platform direction, see [Future AI Platform / Product Design Principles](future_ai_platform_design.md). That document records the cost-control principles, large-file storage rules, AI-assisted completion normalization, dispatch learning roadmap, alternate dispatch workflow, vendor/brand settlement flexibility, and AI implementation guardrails.

---

## Confirmed Low-Cost Formal Architecture

```text
LINE Official Account
Website Repair Form
        ↓
Node.js API Backend
(Zeabur)
        ↓
PostgreSQL
        ↓
AI Service Adapter
(OpenAI in phase 1)
        ↓
Cloudflare R2
(Photos / attachments)
        ↓
Admin Backend
```

---

## Phase 1 Goals

- Let customers submit repair requests through LINE and website.
- Let AI guide customers to provide required repair data.
- Store customer, case, conversation, and attachment data safely.
- Generate case numbers.
- Allow admin users to review and manage cases.
- Prepare the schema for dispatch, on-site service, and billing without fully implementing those modules.
