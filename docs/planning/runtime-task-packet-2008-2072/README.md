# Runtime Task Packet 2008–2072

## Purpose

This packet is a planning-only grouped PM task roadmap for accelerated future batch execution. It does **not** authorize execution of any task. PM must explicitly assign each task or batch.

## Current execution model

- PM may batch no-DB / no-secret / no-provider / no-smoke tasks in groups of 4–6.
- Any task touching DB / migration / seed / deploy / smoke / provider / billing / AI must stop and require explicit target approval.
- Each task must have its own commit and report section.
- If any task fails checks, stop the batch and report.
- Accepted commits may be pushed to GitHub under standing sync approval.

## Phase roadmap

| Phase | Tasks | Purpose | Hard gates |
|---|---:|---|---|
| Phase 20 — Staged Runtime Authorization and Matrix Planning | Task2008–Task2015 | Prepare execution matrices before real deployment, smoke, DB, migration, seed, provider, billing, or AI action. | no deploy, no smoke, no DB / migration / seed, no endpoint probes unless explicitly scoped, no secrets, no provider / billing / AI |
| Phase 21 — Public Safe-deny Smoke Planning and Execution Gates | Task2016–Task2024 | Prepare and then execute only low-risk public safe-deny smoke after explicit target approval. | exact target required for smoke, no authenticated allow path, no DB-backed behavior, no mutation, no provider sending, no secrets |
| Phase 22 — Migration and Seed Authorization Planning | Task2025–Task2036 | Prepare DB migration and seed authorization without touching real DB until target is explicitly approved. | no shared/prod DB unless named, never print DATABASE_URL, migration and seed separate, no smoke in same task unless scoped |
| Phase 23 — DB-backed Runtime Smoke by Branch | Task2037–Task2048 | Run DB-backed smoke only after DB/migration/seed target is explicitly approved. | exact target required, no destructive fixture smoke, no provider / billing / AI, no customer-visible publish unless scoped, no finalAppointmentId mutation unless scoped |
| Phase 24 — Admin Frontend and UX Integration Readiness | Task2049–Task2058 | Prepare frontend/admin/mobile integration without deploying frontend or changing secrets. | no admin deploy, no frontend secrets, no provider / billing, no DB, no production smoke |
| Phase 25 — Observability, Operations, Backup, and Security Hardening | Task2059–Task2068 | Prepare operational readiness and ISO-friendly controls without executing production actions. | no backup/restore execution, no DB dump, no secrets, no production changes, no deploy |
| Phase 26 — MVP Trial Operation and Launch Gate | Task2069–Task2072 | Decide whether the system can enter controlled MVP trial, not full production launch. | no production launch, no live customer notification, no billing provider/payment, no provider sending, no DB/migration/seed unless separately approved, no deploy unless separately approved |

## Task list by phase

## Phase 20 — Staged Runtime Authorization and Matrix Planning

Purpose: Prepare execution matrices before real deployment, smoke, DB, migration, seed, provider, billing, or AI action.

Hard gates:
- no deploy
- no smoke
- no DB / migration / seed
- no endpoint probes unless explicitly scoped
- no secrets
- no provider / billing / AI

Tasks:
- Task2008 — Staged Runtime Execution Matrix / No Execution
- Task2009 — Zeabur Service Deployment Observation Matrix / No Deploy
- Task2010 — Smoke Target Approval Matrix / No Smoke
- Task2011 — DB Migration / Seed Target Approval Matrix / No Execution
- Task2012 — Provider / Billing / AI Execution Gate Matrix / No Execution
- Task2013 — Secrets Handling and Redaction Checklist / No Secret Values
- Task2014 — Branch-to-Smoke Dependency Matrix / No Smoke
- Task2015 — Runtime Gate Consolidation Review / No Execution
## Phase 21 — Public Safe-deny Smoke Planning and Execution Gates

Purpose: Prepare and then execute only low-risk public safe-deny smoke after explicit target approval.

Hard gates:
- exact target required for smoke
- no authenticated allow path
- no DB-backed behavior
- no mutation
- no provider sending
- no secrets

Tasks:
- Task2016 — Public Health and Safe-deny Smoke Readiness / No Smoke
- Task2017 — Zeabur Public Endpoint Safe-deny Approval Packet / No Smoke
- Task2018 — Public /healthz Smoke / Approved Target Only
- Task2019 — Engineer Mobile Public Safe-deny Smoke / Approved Target Only
- Task2020 — Customer-facing Public Safe-deny Smoke / Approved Target Only
- Task2021 — Repair Intake Public Safe-deny Smoke / Approved Target Only
- Task2022 — Admin Dispatch Public Safe-deny Smoke / Approved Target Only
- Task2023 — Depot Workshop Public Safe-deny Smoke / Approved Target Only
- Task2024 — Public Smoke Result Consolidation / No New Smoke
## Phase 22 — Migration and Seed Authorization Planning

Purpose: Prepare DB migration and seed authorization without touching real DB until target is explicitly approved.

Hard gates:
- no shared/prod DB unless named
- never print DATABASE_URL
- migration and seed separate
- no smoke in same task unless scoped

Tasks:
- Task2025 — Migration Inventory and Applied-State Readiness / No DB
- Task2026 — Disposable DB Migration Dry-run Plan / No Execution
- Task2027 — Zeabur DB Target Classification / No Secret Values
- Task2028 — Migration Apply Authorization Packet / No Execution
- Task2029 — Seed Strategy Readiness / No Seed
- Task2030 — Admin Seed Approval Packet / No Seed
- Task2031 — Test Data Fixture Boundary / No Seed
- Task2032 — Migration Rollback and Stop-condition Checklist / No Execution
- Task2033 — Disposable DB Migration Dry-run / Explicit Target Only
- Task2034 — Approved Test DB Migration Apply / Explicit Target Only
- Task2035 — Approved Test Seed Execution / Explicit Target Only
- Task2036 — DB Target Post-apply Verification / Approved Target Only
## Phase 23 — DB-backed Runtime Smoke by Branch

Purpose: Run DB-backed smoke only after DB/migration/seed target is explicitly approved.

Hard gates:
- exact target required
- no destructive fixture smoke
- no provider / billing / AI
- no customer-visible publish unless scoped
- no finalAppointmentId mutation unless scoped

Tasks:
- Task2037 — Engineer Mobile DB-backed Smoke / Approved Target Only
- Task2038 — Customer-facing Report DB-backed Smoke / Approved Target Only
- Task2039 — Repair Intake DB-backed Smoke / Approved Target Only
- Task2040 — Admin Dispatch DB-backed Smoke / Approved Target Only
- Task2041 — Depot Workshop DB-backed Smoke / Approved Target Only
- Task2042 — SaaS Entitlement DB-backed Smoke / Approved Target Only
- Task2043 — Cross-branch Organization Isolation Smoke / Approved Target Only
- Task2044 — Customer-visible Data Filter Smoke / Approved Target Only
- Task2045 — Audit Boundary Smoke / Approved Target Only
- Task2046 — Permission Deny Matrix Smoke / Approved Target Only
- Task2047 — DB-backed Smoke Result Consolidation / No New Smoke
- Task2048 — Runtime Smoke Gate Review / No New Execution
## Phase 24 — Admin Frontend and UX Integration Readiness

Purpose: Prepare frontend/admin/mobile integration without deploying frontend or changing secrets.

Hard gates:
- no admin deploy
- no frontend secrets
- no provider / billing
- no DB
- no production smoke

Tasks:
- Task2049 — Admin Frontend Integration Readiness / No Deploy
- Task2050 — Admin Dispatch UI Contract Review / No Runtime
- Task2051 — Customer-facing Report UI Contract Review / No Runtime
- Task2052 — Repair Intake Admin UI Contract Review / No Runtime
- Task2053 — Engineer Mobile UX Contract Review / No Runtime
- Task2054 — Depot Workshop Admin UI Contract Review / No Runtime
- Task2055 — SaaS Entitlement Admin UI Contract Review / No Billing Provider
- Task2056 — PWA / Mobile Install Readiness Review / No Deploy
- Task2057 — Frontend Env Variable Matrix / No Secret Values
- Task2058 — Frontend Integration Gate Review / No Deploy
## Phase 25 — Observability, Operations, Backup, and Security Hardening

Purpose: Prepare operational readiness and ISO-friendly controls without executing production actions.

Hard gates:
- no backup/restore execution
- no DB dump
- no secrets
- no production changes
- no deploy

Tasks:
- Task2059 — Observability Readiness Inspection / No Runtime Change
- Task2060 — Structured Logging Boundary Review / No Secrets
- Task2061 — RequestId / Audit Correlation Review / No Runtime Change
- Task2062 — Error Envelope Redaction Review / No Runtime Change
- Task2063 — Backup and Restore Readiness Plan / No DB Execution
- Task2064 — Disaster Recovery Runbook Draft / No Execution
- Task2065 — Access Control Evidence Packet / No Runtime Change
- Task2066 — ISO27001 Control Mapping Update / Docs Only
- Task2067 — Security Smoke Readiness / No Smoke
- Task2068 — Operations Gate Review / No Execution
## Phase 26 — MVP Trial Operation and Launch Gate

Purpose: Decide whether the system can enter controlled MVP trial, not full production launch.

Hard gates:
- no production launch
- no live customer notification
- no billing provider/payment
- no provider sending
- no DB/migration/seed unless separately approved
- no deploy unless separately approved

Tasks:
- Task2069 — MVP Trial Readiness Consolidation / No Execution
- Task2070 — Controlled Trial Go / No-go Checklist / No Execution
- Task2071 — Production Launch Gap Register / No Execution
- Task2072 — Post-MVP Roadmap Refresh / Planning Only

## Global restrictions inherited from README

- Do not print `DATABASE_URL`, `JWT_SECRET`, tokens, private keys, provider keys, billing provider secrets, OpenAI keys, R2 keys, LINE secrets, Zeabur secrets, or passwords.
- Do not force push.
- Do not touch the 7 held historical untracked docs.
- Do not bypass organization isolation.
- Do not mutate `finalAppointmentId`.
- Do not create, approve, publish, revoke, or mutate Completion Report / Field Service Report unless a future exact task explicitly scopes it.
- Do not create unfiltered customer-visible publication behavior.
- Do not treat LINE as global identity.
- Do not execute provider sending unless explicitly scoped.
- Do not execute billing provider / invoice / payment / payment method collection unless explicitly scoped.
- Do not execute AI/RAG provider calls unless explicitly scoped.
