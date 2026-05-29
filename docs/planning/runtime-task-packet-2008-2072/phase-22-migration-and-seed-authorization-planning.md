# Phase 22 — Migration and Seed Authorization Planning

## Purpose

Prepare DB migration and seed authorization without touching real DB until target is explicitly approved.

## Hard gates

- no shared/prod DB unless named
- never print DATABASE_URL
- migration and seed separate
- no smoke in same task unless scoped

## Tasks

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

Draft only. Not authorization to execute.
