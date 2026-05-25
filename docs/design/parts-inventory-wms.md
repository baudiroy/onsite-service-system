# Parts / Inventory / WMS-like Module

Status: future design / no runtime change.

Source of truth: `docs/PROJECT_GUARDRAILS.md`.

## Positioning

The future Parts / Inventory / WMS-like Module should manage parts, products, warehouses, engineer vehicle stock, reservations, movements, pending parts, serial numbers, old parts returns, stocktake, and settlement linkage.

It is not an isolated warehouse system. It must share the platform architecture with Case, Appointment, Dispatch Visit, Field Service Report, Engineer Workbench, Billing / Settlement, AI governance, SaaS entitlement, permission, and audit log.

## Future Scope

Future capabilities may include:

- parts master data
- product master data
- brand / model / part-code mapping
- substitute parts
- part categories
- warehouse inventory
- engineer vehicle stock
- multiple warehouses / branches
- parts reservation
- inbound / outbound
- transfer
- return
- scrap
- old parts return
- stocktake
- pending parts tracking
- parts arrival reminder
- serial tracking
- warranty / batch / cost information
- parts and settlement rule linkage

## Service Workflow Integration

Recommended flow:

Case created -> AI suggests likely parts from brand/model/error/customer description/history/RAG -> dispatcher checks warehouse / vehicle stock -> parts are reserved -> engineer uses or replaces parts on site -> completion records parts, quantity, old/new serials, old part return -> inventory movement is written -> pending_parts is tracked when missing -> appointment is arranged when parts arrive -> settlement checks part fee, evidence, vendor/brand rules, and customer approval.

Parts usage should be linkable to case_id, appointment_id, and field_service_report_id. Pending parts state belongs to appointment / dispatch visit layer. The module must not break one Case = one formal Field Service Report.

## Inventory Movement Traceability

Official inventory movements must be traceable.

Future movement records may include:

- organization_id
- warehouse_id / vehicle_stock_id
- part_id / product_id
- quantity
- serial_number when applicable
- movement_type such as inbound, outbound, transfer, reserve, release, return, scrap, adjustment
- source_location
- destination_location
- related_case_id
- related_appointment_id
- related_service_report_id
- performed_by
- performed_at
- reason
- audit log

Inventory movement must not live only in free-text notes. Reservation, release, actual usage, return, scrap, transfer, and formal stock decrease must be separated.

## AI-assisted Parts Recommendation

AI may suggest likely parts, part codes, substitute parts, pre-dispatch stock needs, pending-parts risk, and learn from differences between predicted and actual parts usage.

AI must not deduct official stock, create official outbound movement, overwrite parts/product master data, create formal transfers, approve part cost, decide official settlement amount, or ignore missing parts/evidence.

AI parts recommendation is a required_parts_estimate / suggestion, not an official inventory record.

## Billing / Settlement Linkage

Parts fees may depend on vendor / brand / contract-specific settlement rules. Parts usage, old parts return, serials, photos, and customer approval records may be settlement evidence.

AI may check missing evidence, abnormal usage, amount anomalies, and rule conflicts. Official settlement amount must remain deterministic rule engine or authorized human decision.

## SaaS / Permission / Audit

Possible future feature keys:

- parts_basic
- parts_master_data
- product_master_data
- parts_recommendation_ai
- warehouse_inventory
- engineer_vehicle_stock
- parts_reservation
- serial_tracking
- inventory_movement
- inventory_transfer
- stocktake
- parts_billing_integration
- advanced_wms
- inventory_api_access

Roles should separate customer service lookup, dispatcher reservation, engineer usage, warehouse transfer, finance settlement, and admin master-data maintenance. Important inventory movements must be audited. Import, export, API access, and AI recommendation may be usage-tracked.

## External Integration

Future ERP / WMS / accounting integration should use API, Webhook, Import / Export, or Connector. External sync failures, retry, conflicts, and duplicate imports should be auditable.

The module must not create isolated customer, case, permission, notification, AI, or settlement logic.

## Future Tasks

- parts master data
- basic parts usage record
- pending parts tracking
- engineer completion parts input
- warehouse inventory
- vehicle stock
- reservations
- serial tracking
- stock movements
- old parts return
- stocktake
- ERP / WMS integration
- settlement evidence linkage
