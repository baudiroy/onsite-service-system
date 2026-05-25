# Dispatch Suggestion to Appointment Confirmation

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

Dispatch is a decision layer, not just appointment assignment. AI dispatch suggestion can help, but formal appointment creation must remain human-in-the-loop and customer-confirmed where required.

## Data States

Recommended future states:

- dispatch_intake_draft
- confirmed_dispatch_intake
- dispatch_suggestion
- proposed_appointment
- pending_customer_confirmation
- appointment_change_requested
- confirmed_appointment

AI dispatch suggestion should depend on confirmed_dispatch_intake, not uncertain draft data.

## AI Dispatch Boundary

AI may help with case ranking, engineer matching, route grouping, parts reminder, repair-time estimate, SLA risk, complaint risk, parts risk, and dispatch draft.

AI must not directly create formal appointment, notify customer of final service time, promise arrival time, ignore high-risk cases, bypass dispatcher confirmation, or bypass Data Access Control, organization scope, permission, audit log, or SaaS entitlement.

## Dispatcher Review

Dispatcher must accept, modify, reject, regenerate, or manually override AI suggestion before customer confirmation. Record dispatcher_id, decision, reason, updated fields, and created time. This becomes dispatch learning feedback.

## Customer Final Confirmation

Dispatcher-confirmed proposal should create proposed_appointment. Customer confirmation turns it into confirmed_appointment.

Preferred channels:

1. LINE
2. future App push
3. SMS as reminder/routing to LINE or Web confirmation
4. Web link as fallback entry
5. AI call for low-risk no-response fallback
6. Human call for high-risk, urgent, unclear, dispute, complaint, or human-requested cases

Customer-facing copy should clearly say the time is reserved/proposed and needs confirmation.

## No Response / Exception

No response may trigger LINE/App/SMS reminder, waiting period, low-risk AI call, human call, and pending_customer_confirmation or manual handling.

Human handling is required for unclear response, urgent timing, send failure, repeated no response, complaint/dispute/high risk, fee/quote/floor/carrying/special commitment, or unsafe AI judgment.

AI call must not promise quote, compensation, settlement, modify formal appointment, ask for verification codes/payment/token/secret, or handle disputes.

## Confirmation Log

All proposed / confirmed / changed / rejected / no-response confirmation should leave confirmation log, contact attempt log, and audit log.

Future log fields may include case, appointment, proposed appointment, customer, organization, proposed date/time, channel, sent/opened/clicked/read time, response, confirmed time, confirmed by, actor type, summary, next action, and audit reference.

## Add to Calendar

After customer confirmation, the system may provide .ics, Google Calendar, Outlook Calendar, or Apple/mobile calendar link. Calendar event is only a reminder and must not replace platform confirmed_appointment.

Calendar content should be data-minimized and must not include internal notes, billing/settlement data, AI raw payload, sensitive personal data, or unauthorized data.

## Learning Feedback

AI dispatch suggestion, dispatcher decision, customer confirmation result, field outcome, actual duration, pending parts, repeat dispatch, satisfaction, and engineer result may be future dispatch learning feedback. It must remain tenant-isolated and permission-aware.

## Future Tasks

- dispatch suggestion DTO
- proposed appointment model
- confirmation log model
- customer copy templates
- no-response policy
- calendar link policy
- dispatch learning feedback
