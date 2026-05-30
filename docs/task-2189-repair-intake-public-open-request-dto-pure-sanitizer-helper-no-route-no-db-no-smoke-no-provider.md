# Task2189 Repair Intake Public/Open Request DTO Pure Sanitizer Helper

## Scope

- Adds a pure Repair Intake public/open request DTO sanitizer helper.
- Adds focused unit coverage for allowlisted public/open intake draft fields.
- Does not wire the helper into any route, controller, service, or runtime path.

## Runtime Boundary

- No Task2190 or future task was executed.
- No public/open route was mounted or expanded.
- No `src/openRepairIntake/` or `tests/openRepairIntake/` directory was created.
- No DB, SQL, migration, smoke, endpoint probe, provider, AI/RAG, billing, settlement, package, admin frontend, Customer Access, or Engineer Mobile behavior was changed.

## Sanitizer Contract

The helper accepts a plain raw input object and returns a new sanitized command-shaped object with only these public/open intake fields:

- `customerDisplayName`
- `customerContactIntent`
- `customerContactMethod`
- `serviceCategory`
- `problemDescription`
- `preferredTimeDescription`
- `addressDescription`
- `source`
- `consentConfirmed`

Unknown fields and client-controlled system fields are stripped by explicit mapping. Blank strings are omitted. Missing, null, array, and non-plain inputs return an empty object.

## PM Authorization Boundary

Importing this helper does not authorize public/open Repair Intake runtime behavior. PM must still authorize one exact task at a time before any route wiring or runtime behavior change.
