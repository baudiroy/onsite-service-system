# Case-created First Contact / Dispatch Intake Contact Workflow

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

After Case creation, the platform should support a first-contact and dispatch-intake workflow. The goal is to gather low-risk dispatch-required information and route customers into the right customer channel without turning first contact into a formal appointment promise.

## Recommended Flow

Case created -> SMS first contact -> SMS guides customer to LINE binding -> LINE collects dispatch-required data -> Web link fallback if customer does not use LINE -> Web still encourages LINE binding -> if no response after configured time, AI First-call Intake Assistant may call for low-risk intake -> unclear/high-risk/customer requests human goes to human customer service -> all attempts are logged -> result becomes dispatch_intake_draft -> customer service or dispatcher confirms before formal dispatch data.

## Channel Roles

- SMS: first contact, verification, LINE binding, fallback routing.
- LINE: primary short/mid-term interactive channel for appointment, inquiry, supplements, notification, completion, survey.
- Web link: fallback entry for customers who do not use LINE; should still guide toward LINE binding.
- App: future owned channel.
- AI call: low-risk fallback intake only.
- Human call: high-risk, unclear, complaint, dispute, or customer-requested human handling.

## Dispatch Intake Boundary

SMS / LINE / Web / AI call collection results may only form dispatch_intake_draft. They become formal dispatch input only after customer service or dispatcher confirmation.

AI First-call Intake Assistant must not promise appointment, quote, compensation, settlement result, fee approval, or special commitment.

## Contact History

All SMS, link click, LINE binding attempt, binding success/failure, Web form completion, AI call, human call, App, and Email contact should leave contact attempt log / contact history.

Contact history should track channel, time, purpose, status, result, summary, next action, actor_type, and audit log reference.

Call recordings or transcripts should not be default generally visible data. Use contact record and summary by default. Complaint, dispute, supervisor review, or legal needs may require restricted recording/transcript access, retention policy, permission, and audit log.

## Safety Requirements

This workflow must follow organization scope, Data Access Control, customer visible data policy, sensitive data masking, audit log, notification policy, and SaaS usage tracking.

## Future Tasks

- notification policy
- contact attempt schema
- dispatch_intake_draft model
- customer channel identity scope
- safe error messages
- AI call handoff policy
- human handoff queue
