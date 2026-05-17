# Task 064 — Appointment Result Admin UX Polish

## Scope

Task 064 improves admin frontend guidance around appointment visit result updates and the single-open appointment guard.

This task only changes UI copy, hints, and lightweight guidance in the `/cases` case detail Dispatch / Appointment panel. It does not add migrations, change backend APIs, change appointment enums, modify backend workflow guards, create multiple field service reports, or introduce AI decision-making.

## Why This Polish Is Needed

Task 061 prevents a case from having more than one open / unfinished appointment at the same time.

Task 062 added a way to update appointment visit results, but users still need clear guidance about:

- why a second appointment is blocked
- which previous appointment needs a terminal visit result
- what each `visitResult` means
- which `nextAction` is usually appropriate
- what the visit result update does not do automatically

## Updated UX Areas

### Dispatch / Appointment Panel Readiness Hint

When the case has an open appointment, the panel now shows a top-level hint:

- identifies the open appointment
- shows appointment status and current visit result
- explains that the next appointment requires updating the previous visit result first
- provides an `更新這筆到府結果` action when allowed

This makes the single-open rule visible before the user reaches a backend 409.

### Appointment Create Form Hint

The create appointment form now explains:

- why the system blocks a second open appointment
- that the user should mark the previous visit result first
- examples of terminal results such as missing parts, customer not home, pending quote, or completed

The backend 409 error message is still shown as the source of truth. The frontend only adds recovery guidance.

### Appointment Cards

Appointment cards now show:

- current visit result
- next action
- incomplete reason

This reduces the need to jump between the appointment list and the read-only visit history section.

### Appointment Result Modal

The modal now explains:

- the update only records the current appointment result
- it does not automatically complete the Field Service Report
- it does not close the case
- it does not create billing or settlement

The modal also shows guidance for selected `visitResult` and `nextAction`.

## Visit Result Guidance

The UI uses the existing backend enum values only.

Guidance examples:

- `completed`: can be used later by the service report completion flow as a final appointment candidate.
- `pending_parts`: usually pairs with waiting for parts and allows a follow-up appointment after this visit is terminal.
- `pending_quote`: indicates quote approval is needed before the next step.
- `need_second_visit`: explicitly records that another appointment is needed.
- `customer_not_home` / `no_show`: usually requires contacting the customer or rescheduling.
- `unable_to_repair`: usually requires manager review.
- `rescheduled`: notes that normal date/time changes should usually use edit / reschedule.

No new visit result values were added.

## Next Action Guidance

The UI uses the existing backend enum values only.

Guidance examples:

- `schedule_follow_up`: create another appointment after the current visit has a terminal result.
- `wait_for_parts`: wait for parts before arranging the next visit.
- `wait_for_quote_approval`: wait for quote approval.
- `contact_customer`: contact the customer before continuing.
- `manager_review`: ask a manager to review the case.
- `close_case` / `no_action`: useful when the case is completed or no follow-up is needed.

No new next action values were added.

## Relationship With Task 061

The backend single-open appointment guard remains unchanged.

The frontend now makes the rule easier to understand, but backend still decides whether a second appointment can be created.

If the backend returns 409, the UI continues to show the backend message and adds recovery guidance.

## Relationship With Task 058

The read-only visit history remains the main place to review the full appointment sequence.

This task adds matching guidance and key result fields to the appointment cards so users can quickly understand the current visit state.

## Relationship With Task 059

If an appointment is marked `visitResult = completed`, Task 059 can still auto-select it as `finalAppointmentId` when completing the Field Service Report.

This task does not add manual final appointment override.

## Security Notes

This task does not:

- log full appointment payloads
- expose customer mobile
- expose raw LINE user id
- put appointment id, final appointment id, customer id, customer mobile, or raw LINE user id into the URL
- render audit logs, AI raw payload, OCR raw output, or billing data in this flow

## What This Task Does Not Do

- no migration
- no backend API change
- no backend enum change
- no single-open guard change
- no Field Service Report completion guard change
- no manual `finalAppointmentId` override
- no automatic case close
- no automatic billing or settlement
- no AI visit result decision
- no appointment-scoped attachment / photo / signature relation
- no multi-report field service report model

The one-case-one-official-field-service-report principle remains unchanged.

Task D attachment relation expansion remains deferred.

## Verification

Run:

```bash
npm run admin:check
npm run admin:build
npm run check
npm run smoke:029
npm run smoke:028
```

Manual QA:

1. Open `/cases`.
2. Open a case with one open appointment.
3. Confirm the Dispatch / Appointment panel shows the open appointment readiness hint.
4. Try creating a second appointment and confirm the 409 recovery guidance remains readable.
5. Open `更新到府結果`.
6. Select `pending_parts` and confirm visit result guidance appears.
7. Select `wait_for_parts` and confirm next action guidance appears.
8. Submit and confirm appointment cards and visit history show the updated result.
9. Create the next appointment after the previous one is terminal.
10. Mark the next appointment `completed`.
11. Confirm Task 059 service report completion still auto-selects the completed appointment.

## Known Limitations

- This is copy / hint polish only.
- The UI still does not provide manual final appointment override.
- There is no automated browser E2E for the admin UI.
- Attachment, photo, and signature relation expansion remains deferred.

## Next Step

Suggested next task:

**Task 065 — Appointment Result Manual QA / Admin Frontend Deployment Note**

This can document or automate the frontend manual QA path once a dedicated admin frontend deployment target is available.

