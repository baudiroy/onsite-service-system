# Brand / Service Provider / Subcontractor Access Model

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Purpose

The platform must support multi-party collaboration among Brand/Vendor, Service Provider, Subcontractor, Engineer, and Customer. Access must not be based on a single role alone.

Every access decision should evaluate:

- organization scope
- case relationship / assignment scope
- role permission
- field-level visibility
- audit log requirement

## Actors

Future actor / organization types may include:

- Platform Owner
- Brand / Vendor
- Service Provider
- Subcontractor
- Engineer
- Customer

## Brand / Vendor Scope

Brand / Vendor may see authorized brand cases, case status, appointment/completion status, customer-facing report, SLA / quality reports, complaint follow-up state, and brand-related settlement result.

Brand / Vendor must not see service provider internal dispatch notes, engineer internal comments, internal costs, other brands' cases, other service providers' internal data, AI raw payload, or full audit log.

## Service Provider Scope

Service Provider may see cases it owns, manages, or operates, including dispatch, appointments, engineer workbench data, completion reports, parts/inventory, billing/settlement, contact records, and internal operation reports within its organization scope.

Service Provider must not see other service providers' data, other organization customer data, or platform owner internal settings.

## Subcontractor Scope

Subcontractor is minimum-permission by default. It may see only assigned cases and necessary execution data such as customer contact, address, appointment time, product/problem description, on-site notes, completion fields, and assigned parts.

Subcontractor must not see unassigned cases, complete brand case pools, service provider full case pools, internal costs, full settlement rules, other subcontractors' data, customer full history, internal notes, audit logs, or AI raw payload. Accounts should support fast suspension and export restrictions.

## Engineer Scope

Engineer may see only their own appointment / dispatch task and necessary field data. Engineer must not see other engineers' tasks, unrelated customers, internal settlement rules, management reports, or internal billing.

## Customer Scope

Customer may see only verified / bound own cases and customer-visible data. Customer must not see internal notes, audit logs, AI raw payload, internal dispatch reasons, AI confidence, internal billing/settlement rules, engineer internal comments, supervisor review, unconfirmed appointment suggestions, unconfirmed quote/settlement data, or cross-customer / cross-organization data.

## Future Data Concepts

Future concepts may include:

- `organization_relationships`
- `case_organization_access`
- `case_assignments`
- `case_visibility_policies`

Potential access levels:

- owner_full
- service_operator
- brand_view
- brand_finance
- assigned_executor
- assigned_engineer
- customer_self
- auditor_limited

## Settlement Visibility

Brand may see brand payable amount, reconciliation result, billable / non-billable reason, and brand contract rule result.

Service Provider may see receivable, engineer/subcontractor cost, internal cost, margin, and internal settlement adjustment.

Subcontractor may see only its own billable items, approved service fee, and assigned case status.

## Future Tasks

- relationship model design
- case access resolver
- field visibility matrix
- settlement visibility matrix
- audit event catalog
- export restrictions for external actors
