# Project Short Instruction / 專案短版總指令

This short instruction is the compact project constitution for Codex / engineering work. It must stay under 8000 characters. The full source of truth is `docs/PROJECT_GUARDRAILS.md`; module details live under `docs/design/`.

## Hard Boundaries / 不可違反摘要

- 本專案是現場服務 / 報修 / 安裝 / 派工 / 完工 / 結算 / AI 客服平台，不是單純後台管理系統。
- On-site Service 支援維修、安裝、保養、檢測；Depot / Workshop Repair 是另一種 service workflow，不是另一套孤立系統。
- 一張 Case 只能有一份正式完成報告；到府流程目前為 Field Service Report。不可破壞 `field_service_reports.case_id` 唯一性。
- 一張 Case 可以有多筆 appointment / dispatch visit；多次到府、待料、報價、取消、客戶不在、無法維修等記錄在 appointment / visit 層。
- 同一 Case 不可同時有多個未完成 / open appointment。新 appointment 應在前一筆有明確終態後才建立。
- `finalAppointmentId` 主要由 backend / system 依最終完成 appointment 自動判定；手動選擇僅能是 admin exception / override，不可成為一般流程。
- Engineer Mobile Workbench 第一階段採 mobile web / PWA / LIFF-like 或可安裝 Web App，不先做完整原生 iOS / Android App，不依賴 LINE 推播；工程師只能看自己被派或被授權的任務。
- Repair Intake 支援 API、Excel / CSV、代客報修、LINE / Web / App、電話 / AI 電話。所有來源必須收斂到 Case、Customer、Customer Channel Identity、Contact History、Dispatch Intake。
- SMS / LINE 綁定與 customer matching 以手機為主要識別入口，但必須遵守 organization scope、LINE channel scope、customer identity scope、重新驗證與高風險 fallback 規則。
- Data correction / amendment must protect phone identity changes, engineer-departure freeze, audit trail, and one Case / one formal completion report invariants; phone changes require re-verification and post-departure operational changes must not silently overwrite dispatch data.
- Dispatch / Appointment 必須 human-in-the-loop。AI 只能產生 `dispatch_suggestion` / draft / risk hint，不得直接形成正式 appointment 或承諾到府時間。
- Customer-facing data 不得包含 internal note、audit log、AI raw payload、內部成本、內部結算規則、工程師內部評語、主管審核或跨 organization 資料。
- Billing / Settlement / Reconciliation 不可硬寫死單一廠商、品牌、規則或金額邏輯。AI 不可核准正式規則、結算、請款金額、報價或費用同意。
- AI 是 embedded AI Assistance Layer，不是單一通用聊天框。AI 必須 closed-domain、permission-aware、tenant-isolated、auditable、human-controlled、RAG-grounded。
- Customer AI 只能回答 customer-visible、本人的已驗證 / 已綁定案件、官方流程、FAQ、報修前準備與低風險故障排除；遇到爭議、費用、高風險、不確定或非服務範圍，應轉真人或建立 follow-up。
- LINE 是目前主要入口，但不可寫死為唯一入口；未來需保留 SMS、Web link、App、Email、phone、provider abstraction。
- Brand Official LINE / Brand Channel Integration 必須區分基本品牌導流與案件驗證能力，以及品牌官方 LINE webhook、品牌知識庫 / RAG、Brand AI、多 LINE channel、品牌報表、深度客服分流等 Professional / Enterprise add-on；同一品牌可有多個 LINE channel，`line_user_id` 必須依 `organization_id + line_channel_id + line_user_id` scope 管理。
- SaaS 必須 multi-tenant。未來支援 entitlement、seat、usage、add-on、Enterprise contract；SMS、LINE push、AI、storage、export、API、RAG 等外部成本功能須可 usage tracking。
- Brand / Service Provider / Subcontractor / Engineer / Customer 權限不可只用單一 role 判斷，須同時檢查 organization scope、case relationship / assignment scope、role permission、field-level visibility 與 audit log。
- 資料讀取、報表、匯出、下載、Customer Self-service、AI retrieval、RAG、scheduled reports 必須共用 Data Access Control；不得因功能不同繞過權限。
- AI / Cloud AI / file import 不得直接接收完整未過濾 database、vector database、file storage、raw file、跨 tenant 資料、token、secret、完整手機、完整地址、簽名、未遮罩照片或 sensitive raw payload。
- ISO27001-aligned system controls must preserve organization isolation, permission-aware access, auditability, customer-visible data filtering, AI / RAG retrieval guards, provider secret safety, and SaaS-ready multi-tenant boundaries.
- Future design 不代表立即實作。Docs-only 任務不得修改 runtime；runtime 任務必須先限定 scope，遵守 guardrails，不碰敏感資料，不破壞多租戶與 Case / Appointment / Completion 原則。
- 任務完成需回報：修改檔案、實作內容、未實作內容、runtime/API/DB/migration/permission/audit log/smoke 影響、測試結果、風險限制、future task，以及是否違反 `PROJECT_GUARDRAILS.md`。
