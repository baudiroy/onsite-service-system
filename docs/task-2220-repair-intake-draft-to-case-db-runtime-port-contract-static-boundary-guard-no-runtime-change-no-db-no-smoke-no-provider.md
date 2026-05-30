# Task2220 Repair Intake Draft-to-Case DB Runtime Port Contract Static Boundary Guard

## Scope

- Adds a no-runtime-change static boundary guard for the Task2219 DB runtime port / repository contract inventory.
- The guard reads source files only.
- It does not import or execute the DB-capable runtime ports factory or repository implementation code.
- It does not authorize Task2221 or any future task.

## Guarded Boundary

- Route/admin/API/controller/application/synthetic files must remain injected-port based.
- Repository implementation imports must not appear in those boundary files.
- The DB-capable runtime ports factory must not be imported or executed by those boundary files.
- Direct DB packages such as pg, postgres, knex, sequelize, prisma, mysql, sqlite, mongo, or redis must not be imported by those boundary files.
- SQL, transaction, migration, env, and audit persistence markers must not enter those boundary files.
- Repository contract modules must remain injected contract/seam files and must not execute DB.

## Guard Coverage

- `tests/repairIntake/repairIntakeDraftToCaseDbRuntimePortContractBoundary.static.test.js` freezes the route/admin/API/controller/application/synthetic injected-port boundary.
- The guard checks imports in boundary files for repository implementations, DB packages, and the DB-capable runtime ports factory.
- The guard checks sanitized source text for SQL, transaction, migration, env, and audit persistence markers.
- The guard inventories current repository contract modules as sanitized contract seams.
- The guard inventories the DB-capable runtime ports factory by reading it only.
- The guard confirms Task2218 remains the DB transaction decision gate and Task2219 remains the DB runtime port contract inventory.

## Authorization Boundary

Task2220 does not authorize DB-backed execution, SQL execution, repository implementation changes, transaction implementation, migration work, audit persistence, runtime exposure, smoke probes, provider work, or Task2221. PM must authorize one exact task at a time.
