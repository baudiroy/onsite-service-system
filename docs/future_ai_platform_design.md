# Future AI Platform / Product Design Principles

This document records future AI platform direction and product design principles for the onsite service system.

It is intentionally a roadmap and architecture note. It does not require immediate API changes, new migrations, model training, or automation behavior changes.

## 1. Product Vision / 設計理念

This platform is not only a backend for creating cases, dispatching engineers, completing service reports, and reconciling settlements. It should become an AI-assisted service platform that supports every role in the onsite service process.

The core design principle:

```text
讓每一個參與到府服務流程的人，
都在最麻煩、最容易出錯、最焦慮的時刻，
被系統剛好幫上忙。
```

Every future feature should be checked against these questions:

- Does it reduce the customer service team's burden of organizing information and chasing missing data?
- Does it help dispatch assistants make reasonable, safe, route-aware dispatch decisions?
- Does it help engineers type less, miss fewer fields, and avoid rework?
- Does it help supervisors see abnormal cases and operational risk earlier?
- Does it help finance and reconciliation staff handle vendor, manufacturer, and brand-specific rules more easily?
- Does it help customers feel clearly informed, respected, and properly notified?
- Does it reduce errors, anxiety, communication cost, and operational friction?

AI is not for novelty. AI should make the process more accurate, smoother, and more considerate. Each role should feel that the system understands the painful parts of their work.

## 2. Cost-Control Principle / 成本控制原則

The company should not carry expensive architecture before the core workflow proves its value. The platform should use staged, controllable cost design.

Principles:

- Do not start with expensive infrastructure by default.
- Prioritize a working main workflow, correct data, and safe permissions.
- Start AI as button-triggered assistance instead of calling AI on every field or keystroke.
- Record AI input, AI output, human correction, and final result before investing in model training.
- Accumulate operational data first. Consider RAG, knowledge bases, fine-tuning, or advanced models later.
- Do not put large files in PostgreSQL. Photos, signatures, PDFs, and attachments should use object storage or a dedicated file storage service.
- Stage automation carefully: stable manual workflow -> AI suggestion -> semi-automation -> low-risk automation.
- Every AI feature must justify itself by saving labor, reducing errors, or improving service quality.

Cost control does not mean avoiding AI. It means applying AI where it can clearly help and preserving enough data to improve later.

## 3. Large File Storage Principle / 大檔案儲存原則

PostgreSQL should store structured and relational data, not binary file bodies.

The primary database should store:

- Structured business data.
- Workflow data.
- Permission and RBAC data.
- Audit logs.
- File metadata.
- Storage keys or storage URLs.
- Relations between files and cases, service reports, signatures, photos, or billing artifacts.

Large files must not be stored directly in PostgreSQL:

- Photos.
- Signatures.
- PDFs.
- Customer uploads.
- Engineer-uploaded documents.
- Other attachments or media files.

Future production file storage should use object storage or a dedicated file storage service. The current Cloudflare R2 boundary follows this principle: metadata stays in PostgreSQL, while file content lives outside the database.

## 4. AI-assisted Field Service Completion Normalization

Future engineers may enter onsite results in natural language. AI can help transform raw field input into structured drafts that the backend can validate.

Target flow:

```text
工程師原始輸入
→ AI 產生結構化 draft
→ 工程師或主管確認 / 修改
→ 後端驗證
→ 寫入正式 field_service_reports / service_parts / billing hints / customer summary
```

AI must not directly overwrite formal records.

Future extension points should include:

- `diagnosis_result`
- `failure_category`
- `repair_action`
- `parts_used`
- old / new serial number
- `test_result`
- `completion_status`
- `follow_up_required`
- `customer_visible_summary`
- `internal_note`
- `customer_confirmation`
- service photos and signatures

The shared field service model should remain reusable for repair, installation, inspection, and other case types. `cases.case_type` should influence engineer UI, required fields, checklist, photo requirements, and result templates, but the backend should avoid prematurely splitting into separate `installation_reports` and `repair_reports` unless field differences become too large to maintain.

## 5. AI Feedback Learning

The platform should eventually learn from human corrections so AI becomes more accurate over time.

Future tables or logs may include:

- `ai_generation_logs`
- `ai_feedback_events`
- `ai_prompt_templates`
- `ai_domain_dictionary`

AI learning data should preserve at least:

- Engineer raw input.
- AI first output.
- Final human-confirmed result.
- Differences introduced by human correction.
- Whether the AI result was fully adopted.
- Who corrected it.
- Correction timestamp.
- Confidence score.
- Prompt or template version.

Phase 1 should only record and preserve these possibilities. It does not need to train a model.

Future use of this data:

- Improve prompts.
- Improve failure classification.
- Build part-name and synonym dictionaries.
- Improve completion-status judgment.
- Build company-specific repair knowledge.
- Identify common fields that should become structured inputs.

## 6. Dispatch Learning and Future Automatic Dispatch

Dispatch should eventually support AI learning and gradual automation. Current manual dispatch knowledge must be preserved rather than hidden in informal habits.

Current dispatch logic to preserve:

- The first customer call confirms the approximate time window when the customer may be available.
- The assistant should not immediately promise a final arrival time during the first call.
- After collecting initial customer information, the assistant checks parts inventory.
- The assistant considers engineer route, route smoothness, and regional concentration.
- The assistant considers estimated repair time for each case.
- The current default estimate is about one hour per case.
- After route planning is stable, the assistant contacts the customer again to confirm the official visit time.
- Future estimates should become more accurate from historical service duration data.

Dispatch AI should progress in stages:

1. Manual dispatch, with complete decision recording.
2. AI suggests candidate engineers, candidate time slots, route options, and risks.
3. Low-risk cases can generate semi-automatic dispatch drafts.
4. Low-risk standard cases can be automatically dispatched; exception cases remain manual.

Future tables or records may include:

- `customer_available_slots`
- `appointment_proposals`
- `dispatch_decision_logs`
- `dispatch_outcomes`

Dispatch learning should record:

- Candidate engineers.
- Candidate time slots.
- Final selection.
- Dispatch reason.
- Whether the AI suggestion was adopted.
- Human override reason.
- Actual arrival time.
- Actual completion time.
- Actual service duration.
- Whether the visit was on time.
- Whether it was fixed on the first visit.
- Whether the appointment was rescheduled.
- Whether parts were missing.
- Whether a customer complaint occurred.

These data points help future route planning, duration estimation, engineer matching, and risk detection.

## 7. Alternate Dispatch Workflow

The system should also support another dispatch workflow:

```text
系統 / 助理設計每個案件的建議到府時間
→ 直接通知客戶確認
→ 客戶可以配合則成立正式預約
→ 客戶不能配合則收集可配合時段
→ 重新規劃路線與派工順序
```

The data model and workflow should distinguish:

- `customer_available_slots`: customer-provided available times.
- `proposed appointment time`: system-proposed visit time.
- `confirmed appointment time`: customer-confirmed official visit time.

This distinction prevents the platform from confusing an internal route-planning proposal with a customer-confirmed appointment.

## 8. Vendor / Brand-specific Settlement Rule Flexibility

The platform must support different settlement and reconciliation logic for different vendors, manufacturers, distributors, partners, subcontractors, and brands.

Do not hard-code settlement amounts and rules directly in business service code.

Future tables may include:

- `vendors`
- `brands`
- `vendor_brand_contracts`
- `settlement_rule_templates`
- `settlement_rule_versions`
- `settlement_runs`
- `settlement_items`
- `settlement_exceptions`
- `ai_rule_drafts`
- `ai_rule_feedback_events`

AI may help:

- Parse vendor or brand rule documents.
- Generate settlement rule drafts.
- Guide users through rule creation.
- Check abnormal settlement items.
- Generate reconciliation summaries.

But formal amounts should be calculated by a deterministic rule engine, not decided directly by AI.

Required settlement principles:

- Rules must be reviewed by humans before activation.
- All rules need versions.
- All amount adjustments need audit logs.
- `BillingService` should remain responsible for common billing workflow.
- Future `VendorSettlementPolicy` or `SettlementRuleEngine` should own vendor-specific rule logic.

## 9. Implementation Guardrails

AI output must stay inside controlled boundaries.

Rules:

- AI results are drafts, recommendations, summaries, classifications, or extractions.
- Formal records must be confirmed by a human or validated by backend rules before being written.
- AI must not arbitrarily modify money, settlement, inventory, permissions, or security configuration.
- AI must not directly approve settlement, close financial discrepancies, or override audit requirements.
- AI must not directly accept, reject, close, assign, or settle cases unless a future low-risk automation policy explicitly permits a narrow action with audit and rollback controls.
- Dispatch automation must start with low-risk cases only.
- Important workflows must retain human review and audit logs.
- Future data models should avoid hard-coding dispatch, completion, and settlement workflows into single inflexible tables.
- Metadata fields must not become permanent hiding places for formal workflow state, permissions, or settlement rules.

## 10. Architecture Implications

Existing implementation should continue to protect these boundaries:

- Routes and controllers should not call AI providers directly.
- AI provider access should remain behind provider adapters and orchestration services.
- Case workflow, dispatch, field service, billing, notification, and audit services should remain separable.
- File metadata and file content should remain separate.
- Organization scope must be preserved for AI context, LINE identity, dispatch decisions, and future notification routing.
- AI context must not cross organizations, LINE channels, customers, or cases.

Future work should prefer small, testable additions:

- Add logs before automation.
- Add review screens before auto-writing formal fields.
- Add deterministic rule engines before AI-assisted rule drafting becomes operational.
- Add cost and usage monitoring before high-volume AI workflows.

## 11. Current Task Limitation

This document is only a product and architecture note.

This task does not:

- Change existing API behavior.
- Add new migrations.
- Implement AI chatbot behavior.
- Implement model training.
- Implement RAG or vector search.
- Change smoke tests.
- Modify dispatch, field service, billing, notification, or settlement runtime behavior.

Future implementation tasks should reference this document when designing AI-assisted completion, dispatch automation, vendor settlement rules, and AI feedback loops.
