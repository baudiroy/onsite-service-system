# SaaS Trial / Usage Billing Future Design

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Pricing Model

Future SaaS pricing should be hybrid:

- subscription plan
- seat-based pricing
- usage tracking
- add-on modules
- Enterprise contract

The platform must not assume all tenants have all features, unlimited usage, or the same cost profile.

## Subscription Plan

Potential plans:

- Basic
- Professional
- Business
- Enterprise

Plans may control feature entitlement, included seats, notification quota, AI quota, storage, export count, API/Webhook access, advanced audit, SSO, and Enterprise features.

## Trial

Future trial design may include:

- trial subscription state
- limited seat count
- limited SMS / LINE / AI / storage / export quota
- disabled or capped high-cost features
- upgrade prompt
- trial end policy

Trial is future design only and does not authorize billing runtime.

## Seat Types

Potential seat types:

- Full User Seat: admin, customer service, dispatcher, supervisor, finance
- Field Engineer Seat: Engineer Mobile Workbench / App user
- Viewer Seat: read-only or limited review user
- External / Customer Access: customer-facing access, not an internal paid seat

Seat, permission, entitlement, and subscription must remain separate concepts.

## Usage Tracking

High-cost or high-volume features should support organization-level usage tracking:

- SMS
- LINE push
- AI call minutes
- AI token / AI job
- Email
- App push
- file storage
- photo / signature / document upload
- export count and rows
- API / Webhook calls
- RAG retrieval
- report generation
- scheduled reports
- customer self-service query
- survey sending

Usage records may include organization, usage type, related case, provider, quantity, estimated cost, status, created time, and safe metadata.

## Add-on Modules

Future add-ons may include:

- AI Add-on
- AI Dispatch Add-on
- AI Call Add-on
- RAG Knowledge Base Add-on
- Parts / Inventory / WMS-like Module
- Billing / Settlement Advanced Module
- Advanced Reports / Analytics
- API / Webhook Access
- Enterprise Audit
- SSO
- Multiple LINE Channels
- Open Repair Intake / Referral Module

Entitlement enables organization-level access. User permission still controls who can operate the feature.

## Enterprise Contract

Enterprise may support annual contracts, custom quotas, onboarding fee, many seats, multiple organizations, multiple brands, multiple LINE channels, SSO, API/Webhook, advanced audit, dedicated data requirements, custom settlement rules, own SMS/Email/LINE provider, and custom SLA.

Enterprise features must not bypass organization isolation, Data Access Control, permission, audit log, or AI governance.

## Future Tasks

- plan and entitlement model
- seat allocation model
- usage metering design
- billing event design
- invoice/payment design
- trial lifecycle
- cost alert and quota enforcement
