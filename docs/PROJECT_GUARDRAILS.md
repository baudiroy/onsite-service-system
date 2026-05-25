# PROJECT GUARDRAILS / 專案總護欄

本文件是到府服務系統後續所有開發、文件更新、AI 功能設計、LINE 整合、派工、完工、結算、權限、安全與未來功能規劃都必須遵守的總指令。

若任務、文件、程式碼或設計與本文件衝突，應先停下來回報，不應直接實作。

## 0. 文件架構 / Documentation Layers

本專案文件應維持三層結構，避免把所有規則塞進單一超長 prompt 或單一任務文件。

1. `docs/PROJECT_SHORT_INSTRUCTION.md`
   - 每次給 Codex / 主程式使用的短版總指令。
   - 只保留不可違反的核心摘要與硬邊界。
   - 必須維持 8000 字以內。

2. `docs/PROJECT_GUARDRAILS.md`
   - 本專案完整正式守則與最高層 source of truth。
   - 若短版總指令、任務文件、模組設計或程式實作與本文件衝突，應先停下來回報。

3. `docs/design/*.md`
   - 模組級 future design / implementation planning 文件。
   - 放完整流程、狀態、欄位方向、例外、範例與 future task。
   - 模組文件不代表立即 runtime approval。

目前文件入口與索引：

- `docs/README.md`: 文件入口。
- `docs/design/README.md`: 模組設計索引。
- `docs/TASK_ARCHIVE_INDEX.md`: 舊 task 分支索引。
- `docs/TASK_FILE_CATALOG.md`: 舊 task 檔案完整目錄。

整理原則：

- Project Short Instruction 只放摘要與硬邊界，不放完整流程細節。
- Project Guardrails 放正式守則與不可違反原則。
- Module design docs 放完整流程、狀態、欄位、範例與 future task。
- 同一設計若已存在於多處，應保留 source of truth，其他位置改用簡短引用，避免長文重複。
- 文件整理不得順手修改 runtime、API、DB、migration、provider、AI/RAG、permission、audit log 或 smoke test。

## 1. 專案定位

本專案是現場服務 / 報修 / 派工 / 完工 / 結算 / AI 客服平台。

它不是單純後台管理系統，也不是只替內部人員建立表單與清單。它要支援完整服務流程中的所有角色：

- 客戶
- 客服
- 派工助理
- 工程師
- 主管
- 財務
- 廠商 / 品牌 / 合作單位

系統目標是降低焦慮、減少錯誤、減少重複溝通、讓資訊更清楚，並讓每個角色在正確時間拿到正確資訊。

好的功能不只是「可以操作」，而是能讓流程更穩、更少漏接、更少誤解、更容易追蹤。

## 2. 核心產品理念

每個功能都必須評估：

- 是否減少使用者摩擦。
- 是否降低人工錯誤。
- 是否提升資訊清楚度。
- 是否減少重工與重複溝通。
- 是否支援正確且可追溯的決策。
- 是否避免把現場複雜情境塞成不清楚的狀態。

AI 應服務流程，不是為了 AI 而 AI。

系統應在關鍵時刻讓使用者感覺「剛好被幫上忙」：

- 客服知道下一步要問什麼。
- 派工知道哪個案件有時間、路線、料件或逾期風險。
- 工程師能用簡單方式完成回報。
- 主管能早點看到客訴、逾期、例外與品質風險。
- 財務能看見結算依據與缺少佐證。
- 客戶能清楚知道案件進度、預約、報價、完工與後續回饋方式。

## 3. 開發總原則

開發順序應先穩定核心架構，再逐步加入 AI、營運風險、自動提醒與其他進階能力。

總原則：

- 不過度開發，必須考慮公司營運成本。
- 優先做高影響、低風險、能減少人工負擔的功能。
- 後端與資料庫以結構化資料為核心。
- 照片、簽名、文件等大型檔案未來應走 object / file storage。
- 不要為了短期方便破壞長期架構。
- Future design 可以先記錄，但不代表現在立即實作。
- 文件中的 future note 不等於 runtime approval。
- 一般「繼續」、「go ahead」、「做下一步」不等於 DB / DDL / migration / provider sending / AI auto decision approval。
- shared runtime 不做 destructive cleanup。
- 任務邊界要明確：docs-only 就只能改文件；runtime task 才能改 runtime。
- SaaS 收費未來應採 subscription plan + seat-based pricing + usage tracking + add-on modules + enterprise contract 的混合模式。SMS、LINE push、AI call、AI token、Email、App push、file storage、export、API / Webhook、RAG usage 等具外部成本或高用量功能，不可設計成平台無限制吸收；短期可先記錄 organization-level usage 與 estimated cost，未來再依方案額度、超量費、加購包或企業合約向租用者收費。permission、entitlement、seat、usage、subscription 不可混在一起。
- 未來需優先支援 Engineer Mobile Workbench / 工程師手機工作台，可先以 mobile web、PWA、LIFF-like 手機網頁入口或可安裝到手機桌面的 Web App 實作，再評估完整原生 iOS / Android App。工程師手機工作台應支援今日 / 近期任務、任務詳情、到府 / 開始處理 / 完工狀態操作、簡短完工表單、照片上傳、零件 / 序號、客戶簽名或簽名例外原因，並送出完工資料作為 Field Service Report 資料來源；但不得增加工程師過度填表負擔，不應預設依賴 LINE 推播通知，且必須遵守 organization scope、permission、audit log、file storage、AI 不自動決策與 ISO 27001-aligned 安全原則。
- 未來 AI agent 必須採 closed-domain、permission-aware、tenant-isolated、auditable、human-controlled、RAG-grounded 設計。AI retrieval 必須遵守 `organization_id` scope、role、permission、feature entitlement、customer visible data policy、internal data policy、sensitive data masking、audit log 與 SaaS usage tracking。AI 不可直接存取未過濾資料庫或 vector database，不可跨 organization 查資料，不可自動核准報價 / 結算，不可自動修改正式案件狀態，不可自動關閉客訴。AI output 必須與 official record 分離，並支援 human accept / reject / edit。
- Cloud AI / external AI provider 使用是最高優先級資料安全議題。任何送往外部 AI provider 的資料都必須先經 organization scope filter、role / permission check、feature entitlement check、minimum necessary context selection、sensitive data masking / redaction、customer visible data policy、internal data policy、audit log 與 SaaS usage tracking；AI 不可直接取得未過濾 database、vector database、file storage 或跨 organization 資料。高敏任務未來應保留 private AI、dedicated environment、local model 或 hybrid AI architecture 選項。
- Phase 1 may use OpenAI API as the primary AI provider, but every AI call must go through an AI Gateway / Provider Abstraction layer. Business / domain logic must not import OpenAI SDKs directly, hard-code OpenAI model names, depend on provider-specific response shapes, or handle provider credentials. Model choice must be task-tiered and policy-controlled; provider credentials must never enter repo, frontend, logs, prompts, RAG context, public responses, or audit raw payloads. AI output remains advisory / draft / suggestion unless an authorized human or deterministic approved runtime rule confirms the official action.
- AI 應被設計為 embedded AI Assistance Layer，而不是只有單一通用聊天框。後台、客服、派工、工程師、客戶與 AI 電話流程可使用不同 AI 介面；Customer AI 必須限制在已驗證 / 已綁定案件、customer-visible data、官方服務流程、FAQ、報修前準備與受控 knowledge base 範圍內，不得成為開放式通用聊天機器人，不得讀取或輸出 internal note、audit log、AI raw payload、內部派工原因、internal billing / settlement rules、未確認 appointment suggestion、未確認報價 / 結算資料、跨客戶資料或跨 organization 資料。
- AI-assisted file import does not mean sending the full raw file to AI. AI 輔助檔案匯入不代表把完整原始檔案送給 AI。系統必須先解析、最小化、遮罩與過濾檔案內容；外部 AI provider 只能接收完成 permission check、organization scope 限制、sensitive data masking / redaction 後，為了欄位 mapping、驗證輔助、摘要或分類所需的最小必要內容。AI 可協助匯入 mapping、錯誤摘要、資料清理建議，但不可直接接收完整原始檔案，不可自動寫入正式資料，不可自動覆蓋既有資料。
- Billing / Settlement / Reconciliation 規則必須支援來源檔案存查、AI 解析、規則草稿、人工審核、dry-run 驗證、版本化生效與對帳結果追溯。廠商合約、品牌規則、Excel / PDF / 文件等來源檔案應保存 file version、effective period、vendor / brand scope、uploaded_by、audit log 與 file hash。AI 可協助解析檔案並產生 rule draft，但正式規則必須由授權人員審核、版本化、核准後才可生效。後續對帳產出必須引用使用的 rule version 與 source file，不可只保存金額結果。
- 未來可支援 Parts / Inventory / WMS-like Module 料件管理模組，包含料件主檔、成品主檔、品牌 / 型號料號對應、替代料號、倉庫庫存、工程師車上庫存、料件預留、出入庫、調撥、待料追蹤、序號管理、舊件回收與結算連動。此模組應與 Case、Appointment、Field Service Report、Engineer App、Billing / Settlement、AI 建議、SaaS entitlement、permission、audit log 共用核心平台架構；AI 可協助料件建議與缺料風險提醒，但不可自動扣正式庫存、建立正式出庫、覆蓋料件主檔或核准結算金額。
- Repair Intake / Case Creation 應支援品牌 API、Excel / CSV 匯入、經銷商 / 廠商 / 他人代客報修、客戶首次自助報修、客戶重複 LINE / Web / App 報修、電話 / 0800 / 未來 AI 電話報修。不同來源建立 Case 後，必須收斂到同一套 Case、Customer、Customer Channel Identity、Contact History 與 Dispatch Intake 流程。報修流程必須區分 `case_source`、`reporter`、`customer`、`billing_contact`；`reporter` 是報修建立者或協助報修者，`customer` 是真正服務對象且預設為工程師到府聯絡人。只有當現場聯絡人不同於 `customer` 時，才使用 `on_site_contact_override`。品牌 API、Excel / CSV 匯入與 AI 電話報修應先形成 import draft / `repair_intake_draft` / staging records，經 validation、dedupe、dry-run 與必要人工確認後才可正式建立或更新 Case / Customer。未來 Open Customer Repair Intake 可支援品牌報修管道查詢與協助轉介，但此類需求應先形成 `service_request`，不直接等同正式 Case；轉交資料給服務商 / 品牌前必須取得客戶同意，只提供最小必要資料並留下 referral / handoff record、contact history 與 audit log。
- Repair Intake customer matching 以手機號碼為主要識別依據。第一次手機出現時以 SMS binding link 建立 phone / customer / LINE identity；第二次同手機出現且僅對應單一 customer、LINE / App active、organization / channel scope 相同時，可直接用 LINE / App 通知與收集 Dispatch Intake，不必重走 SMS。若多 customer、資料衝突、通路失效、跨 scope 或高風險，則用 SMS / Web link 重新驗證或人工確認。所有通知與驗證都需留下 contact attempt log、notification log 與 audit log。
- Brand Official LINE / Brand Channel Integration 與 Brand Referral 應拆分基本平台能力與進階 add-on：品牌來源辨識、品牌導流、repair intake、case verification、Case Binding、contact / audit log 屬基本平台能力；品牌官方 LINE webhook、品牌知識庫 / RAG、Brand Knowledge AI、多 LINE channel、品牌專屬模板 / 報表、深度客服分流屬 Professional / Enterprise add-on。品牌官方 LINE 是 customer entry channel，不是 case identity；同一品牌或 organization 可有多個 official LINE channel，系統不得假設 brand 只有單一 `line_channel_id`；`line_user_id` 必須依 `organization_id + line_channel_id + line_user_id` scope 處理，未驗證客戶不得查詢案件資料。每個 channel 應有 purpose、allowed flow、template、knowledge base、AI/RAG enablement、usage tracking 與 channel audit 邊界。完整設計請見 `docs/design/brand-official-line-channel-integration.md` 與 `docs/design/saas-plan-entitlement-and-add-ons.md`。
- Data correction / amendment governance 是正式資料治理邊界。Phone changes require re-verification，不得直接覆蓋 phone / customer channel identity；pre-departure non-phone repair / dispatch corrections may be allowed with permission and audit；post-departure / route-started operational data must not be silently overwritten and should use manual contact / dispatch note / audit；after-arrival unable-to-complete cases should end the appointment in a terminal state and later create follow-up appointment；completion amendment must not create a second formal Field Service Report. Full module details live in `docs/design/data-correction-amendment-governance.md`.
- 未來應支援 Depot / Workshop Repair / 非到府維修流程，作為現有 On-site Service / 到府服務以外的第二種 service workflow。此模組不是另一套系統，應共用既有 Case、Customer、Customer Channel Identity、Contact History、Notification、File / Object Storage、Parts / Inventory、Billing / Settlement、AI governance、Audit Log、organization scope、permission 與 SaaS-ready 架構。非到府維修可透過 `service_type` / `workflow_type` 區分 onsite、depot、carry_in、mail_in、pickup_delivery 等服務型態，但不得破壞一個 Case 最終只有一份正式完成報告的原則；AI 可協助檢測紀錄標準化、報價草稿、品檢摘要與故障分類，但不得自動判定保固、核准報價、決定正式收費、修改正式完成結果或跨 organization 查資料。
- Case 建立後，第一時間應以 SMS 觸達客戶，SMS 應優先引導加入 / 綁定 LINE；Web link 作為備用入口但仍應引導 LINE。若數小時或隔天未回覆，可由 AI First-call Intake Assistant 在適合時段外撥收集低風險派工必要資料；若仍未取得、客戶要求真人、回答模糊、涉及客訴 / 爭議 / 高風險，則轉真人客服。所有 SMS、LINE、Web link、AI call、human call、App、Email 接觸都必須留下 contact attempt log。收集結果只能形成 `dispatch_intake_draft`，由客服或派工確認後才可轉為正式派工資料。
- Dispatch 應在派工前資料收集完成並形成 `confirmed_dispatch_intake` 後，才由 AI 產生 `dispatch_suggestion`。AI dispatch suggestion 經派工人員確認後，應先形成 `proposed_appointment`，並優先透過 LINE / 未來 App push 通知客戶確認；SMS 只作為提醒與導流，Web link 只作為備用確認入口，不是主動通知通路。客戶確認後才可成為正式 `confirmed_appointment`；若客戶要求改期、未回覆、回覆模糊、時間緊急或涉及高風險 / 客訴 / 爭議，應由 AI call 或真人電話補位。所有 proposed / confirmed / changed / rejected / no-response confirmation 都必須留下 confirmation log、contact attempt log 與 audit log。派工時間經客戶確認後，未來可提供加入行事曆功能，但 Calendar event 只作為客戶提醒工具，不可取代正式 appointment。
- 客戶端完工流程應區分內部 Field Service Report 與 customer-facing service report。客戶簽名是現場服務完成的重要佐證，但不是完工的必然條件；標準流程可將簽名連結 `finalAppointmentId` 與 Field Service Report。若無法取得簽名、代簽、拒簽、遠端完工或其他例外情境，應記錄例外原因、佐證資料、工程師說明、contact log，必要時進入主管或客服審核並寫入 audit log。LINE / App / Web 完工後流程主要提供查看維修報告、問題回報、客服聯絡與滿意度問卷，不應一律要求客戶再次確認完成。Customer-facing service report 必須遵守 customer visible data policy，不得包含 internal note、audit log、AI raw payload、billing / settlement internal data、工程師內部評語、主管審核或廠商對帳規則。若涉及客戶費用，僅顯示已確認且與客戶相關的 charge / approval / invoice 資訊。客戶回報問題未解決、低分、負評、客訴或要求回訪時，應建立 follow-up / escalation；AI 可協助摘要分類但不可隱藏負評、自動關閉客訴或修改評分。
- 未來所有資料讀取、查詢、分析、報表、匯出、下載、AI retrieval、RAG、客戶自助查詢與排程報告，都必須建立在同一套 Data Access Control / Data Permission Model 上。任何資料操作都必須檢查 organization scope、user identity、role、permission、report / export permission、feature entitlement、subscription status、allowed case / customer / document scope、customer visible data policy、internal data policy、field-level masking、audit log requirement 與 SaaS usage tracking。報表、匯出、下載、AI 查詢、RAG 檢索與排程報告都不可繞過資料權限；排程報告只是 report / analytics / export 的自動化層，不是新的權限捷徑。AI 也不是例外，只能取得目前 user / organization 被授權可讀取的資料，不可直接查詢未過濾 database、vector database 或跨 tenant 資料。
- 報表、分析、Dashboard、AI insight、排程報告與一般匯出預設不應包含完整客戶個資。客戶姓名、完整手機、完整地址、LINE user id、簽名、照片等資料，主要只應在客服聯絡、派工、工程師到府、通知、費用確認、客訴回訪等作業必要情境中使用。一般報表與分析應優先採用去識別化、遮罩、區域化或彙總資料；若需匯出完整個資，必須有明確作業目的、permission、field-level masking policy、audit log、下載期限與 SaaS usage tracking。
- 本平台必須遵守 Product Simplicity / Role-based UX 原則。功能可以完整，但每個角色的操作體驗必須簡單。系統複雜度應由後台架構、規則、AI、權限與自動化吸收，不可轉嫁給客戶、客服、派工、工程師、主管或財務。一線使用者只應看到自己需要的功能、資料與下一步；工程師完工流程必須維持最小輸入；客戶查詢流程必須簡化；主管優先看到異常、逾期、客訴與風險；財務優先看到待審核、缺佐證、金額異常與可請款狀態。任何新增功能都必須檢查是否增加一線使用者負擔，若會增加負擔，應優先由系統、AI、預設規則或管理設定吸收。

## SaaS-ready Platform / SaaS 化平台設計原則

本專案應採 SaaS-ready multi-tenant platform 架構設計。

短期目標是先作為公司內部現場服務營運平台使用，穩定 Case、Customer、Dispatch、Appointment、Field Service Report、Billing / Settlement、Notification、LINE Binding、AI-ready、Permission 與 Audit Log 等核心流程。

中長期目標是讓系統具備對外提供 SaaS 服務的能力，可支援多組織、多品牌、多服務商、多 LINE channel、多角色、多結算規則與多租戶資料隔離。

目前不立即實作完整 SaaS 商業化功能，例如：

- 租戶自助開通
- 訂閱方案
- 用量計費
- AI token 計費
- 付款流程
- SaaS billing
- tenant plan limit

但目前架構不可阻斷未來 SaaS 化。

設計原則：

1. 所有主要資料應保留 `organization_id` 或明確 tenant scope。
2. 不同 organization / tenant 的資料必須隔離。
3. API 必須檢查 organization scope。
4. 使用者、角色、權限應能依 organization 管理。
5. LINE identity 必須依 `organization_id + line_channel_id + line_user_id` scope 處理。
6. Vendor / brand-specific rules 應可依 organization / brand / vendor 設定，不可硬寫死。
7. Notification、SMS、Email、LINE、AI provider 設定未來應可依 tenant 管理。
8. Audit log 應記錄 organization scope 與操作者。
9. 客戶可見資料與內部資料必須分離。
10. 未來應可加入 tenant-level settings、plan limits、usage tracking、billing subscription、super admin console。
11. ISO 27001-aligned by design 原則也應套用於 SaaS 化架構。
12. 不可為了短期內部使用方便，寫死單一公司、單一 LINE channel、單一品牌、單一結算規則或單一資料範圍。

SaaS-ready 不代表現在要實作 SaaS 商業化功能。它代表目前的資料模型、權限、API、audit、provider 設定、billing / settlement、AI-ready 設計與 channel abstraction 都不應把未來多租戶能力做死。

## SaaS Pricing / Subscription / Account-based Billing Future Design

## SaaS 方案、帳號數、用量與 AI 加值計費未來設計原則

本平台未來 SaaS 收費應保留 subscription plan、seat-based pricing、usage tracking、add-on modules 與 Enterprise contract 的混合模式。短期仍以穩定內部現場服務流程為主，不立即實作付款、正式訂閱、發票、金流或 SaaS billing runtime。

不可違反原則：

- 不可把所有功能設計成單一低月租或單一 tenant 無限制使用。
- 不可把 SMS、LINE push、Email、App push、AI call、AI token、Cloud AI、file storage、export、API / Webhook、RAG retrieval、scheduled reports、customer self-service high-volume usage 設計成平台永久無限制吸收。
- Plan / subscription 控制 organization 可用能力；permission 控制 user 能否操作；entitlement、permission、seat、usage、subscription 不可混在一起。
- 即使 organization 有某 feature entitlement，user 仍需有對應 permission、organization scope 與 Data Access Control。
- Internal staff seat、Field Engineer seat、Viewer seat、External / Customer Access 不應混為同一種成本。
- AI Add-on 不可繞過 AI governance、Data Access Control、sensitive data masking、audit log 或 official record separation。
- Usage tracking 與 audit log 是不同概念；usage 不可取代 audit，也不可記錄不必要敏感 payload。
- Enterprise contract 可支援客製額度、SSO、多 organization、多品牌、多 LINE channel、API / Webhook、自帶 provider 與專屬 SLA，但不得繞過 organization isolation、permission、audit log 或安全原則。
- 短期可先記錄 organization-level usage 與 estimated cost；未來再依方案額度、超量費、加購包或 Enterprise contract 收費。
- Future design 不代表立即新增 pricing table、invoice、payment、subscription、usage metering、seat billing 或 plan entitlement runtime。

完整 plan tiers、trial、seat types、usage categories、add-on modules、Enterprise contract、cost control 與 future tasks 請見：

- `docs/design/saas-trial-usage-billing.md`
- `docs/design/saas-plan-entitlement-and-add-ons.md`

本章是 future design reference，不代表立即實作 pricing runtime、billing runtime、invoice runtime、payment runtime、usage metering runtime、subscription runtime、plan entitlement runtime 或 seat billing runtime。

## Data Access Control / Data Permission Model Future Design

## 資料存取權限模型未來設計原則

本平台所有資料讀取、查詢、分析、報表、匯出、下載、AI retrieval、RAG、客戶自助查詢與排程報告，都必須建立在同一套 Data Access Control / Data Permission Model 上。資料權限是底層核心；Report、Analytics、Export、Download、AI Filtering、AI Import / Export、RAG Retrieval、Scheduled Reports、Customer Self-service Inquiry 都不可各自繞過或另建權限模型。

不可違反原則：

- 任何資料操作都必須至少檢查 organization scope、user identity、role、permission、feature entitlement、allowed case / customer / document scope、customer visible data policy、internal data policy、field-level masking、audit log requirement 與必要的 SaaS usage tracking。
- Report / Analytics 只能彙整使用者有權查看的資料；Export / Download 必須檢查 export permission 與欄位可見性。
- Scheduled reports 是 report / analytics / export 的自動化層，不是權限捷徑，不可跨 organization、寄給無權限 recipient 或繞過 masking / audit / export permission。
- 報表、分析、Dashboard、AI insight、排程報告與一般匯出預設不應包含完整客戶個資，應優先使用去識別化、遮罩、區域化、彙總或統計資料。
- AI 不是例外；AI retrieval、RAG、AI-assisted filtering/import/export、AI summary、AI risk radar 必須使用相同資料權限模型，不可直接查詢未過濾 database 或 vector database。
- Customer-visible data 與 internal data 必須分離；客戶不可看到 internal note、audit log、billing internal data、settlement internal data、工程師內部評語、AI raw payload、主管審核紀錄或內部風險標記。
- Sensitive fields such as phone、address、customer name、LINE user id、email、token、secret、signature、photos、quote、settlement amount、internal note、AI raw payload must support masking or exclusion.
- Entitlement 決定 organization 是否擁有功能；permission 決定 user 是否能操作。兩者不可混在一起。
- 重要資料操作、permission denied、cross-scope denied、report/export/download、AI retrieval、customer self-service access 應可 audit，且 audit log 不得記錄完整 token、secret、LINE access token、完整手機、完整地址或不必要 AI raw sensitive payload。

完整 core checks、report/export rules、scheduled reports、data minimization、AI/RAG permission、customer-visible/internal data、masking、usage tracking、audit event catalog 與 future tasks 請見：

- `docs/design/data-access-control.md`

本章是 future design reference，不代表立即實作 permission runtime、report runtime、export runtime、AI retrieval runtime、RAG runtime、scheduled report runtime、audit runtime 或 SaaS usage tracking runtime。

## Brand / Service Provider / Subcontractor Access Model / 品牌方、服務商、外包商權限模型

本專案未來需支援品牌方、服務商、外包商、工程師與客戶之間的多方協作權限。此模型是 Data Access Control、organization isolation、Billing / Settlement visibility 與 AI/RAG permission boundary 的延伸。

不可違反原則：

- 權限不可只用單一 role 判斷。
- 每次資料存取都必須同時檢查 organization scope、case relationship / assignment scope、role permission、field-level visibility 與 audit log。
- Brand / Vendor、Service Provider、Subcontractor、Engineer、Customer 對同一 Case 的可見資料與可操作範圍不同。
- 品牌方不得看到服務商內部成本、內部派工備註、工程師內部評語、其他品牌 / 服務商資料、AI raw payload 或完整 audit log。
- 外包商與工程師預設最小權限，只能看被分派或被授權的案件與必要執行資料。
- 客戶只能看本人已驗證 / 已綁定案件與 customer-visible data。
- 結算權限必須分層；品牌、服務商、外包商可見的金額、成本、規則與請款資訊不同。
- AI/RAG 可協助摘要、比對與異常提示，但不得自動核准正式金額、請款、規則或跨 organization 存取資料。

完整 actor scope、future access levels、settlement visibility 與 future tasks 請見：

- `docs/design/brand-service-provider-subcontractor-access.md`

本章是 future design reference，不代表立即新增資料表、migration、API、權限 runtime、audit runtime 或 smoke test。

## Product Simplicity / Role-based UX Design Principle

## 產品簡化與角色化操作設計原則

本平台未來功能會很完整，但不得讓使用者感覺複雜。系統複雜度應由後台架構、規則、AI、權限、預設流程與自動化吸收，不應轉嫁給客戶、客服、派工、工程師、主管或財務。

不可違反原則：

- Powerful backend, simple role-based experience.
- 不同角色只應看到自己需要的功能、資料與下一步；不可把完整平台能力一次暴露給所有人。
- 預設流程應簡單，進階欄位、例外處理與管理設定應漸進式顯示。
- AI 應減少人工整理、判斷與重複輸入，不應增加使用者負擔或額外維護欄位。
- SaaS 方案、結算規則、AI RAG、權限、SLA、通知、遮罩、供應商設定等複雜設定應與日常操作分離。
- 客戶端應簡單、清楚、少按鈕，且不得看到 internal note、audit log、billing / settlement internal data、工程師內部評語、AI raw payload、主管審核或內部風險標記。
- 工程師端必須最簡化，聚焦今日任務、下一站、導航、到場、拍照、服務結果、短輸入、零件 / 序號、簽名與完成。
- 主管介面應 exception-first / risk-first；財務介面應聚焦待結算、缺佐證、金額異常、可請款 / 不可請款與 AI 檢查提示。
- 任何新增功能都必須檢查是否增加一線使用者負擔；若會增加負擔，應優先由系統、AI、預設規則或管理設定吸收。

完整角色化 UX、客戶 / 客服 / 派工 / 工程師 / 主管 / 財務體驗原則、新功能檢查表與 future tasks 請見：

- `docs/design/product-simplicity-role-ux.md`

本章是 future design reference，不代表現在實作任何 UI、UX、AI、自動化、權限或 runtime 功能。

## 4. 現場服務核心資料原則

### Case / Appointment / Field Service Report

- 一張 Case 只能有一份正式 Field Service Report。
- 一張 Case 可以有多筆 appointment / dispatch visit。
- 多次到府、客戶不在、待料、報價、取消、無法維修等狀況，應記錄在 appointment / dispatch visit 層。
- Field Service Report 是案件層級的最終完工總結，不是一訪一報告。
- 不可破壞 `field_service_reports.case_id` 唯一性原則。
- 同一個 Case 不應同時存在多個未完成 / open appointment。
- 新 appointment 應在前一個 appointment 有明確終態後才建立。
- appointment / visit history 必須保留，不能用覆寫方式抹掉歷史。

### finalAppointmentId

- `finalAppointmentId` 應主要由系統依最終完成 appointment 自動判定。
- Admin UI 不應提供一般 operator 手動挑選 final appointment 的 picker。
- 手動選擇只能作為未來受控 admin override / correction flow，而且必須有權限、理由與 audit log。
- 已完成 report 的 `finalAppointmentId` 必須穩定，不應因 repeat completion、後續 appointment 或 direct API payload 被重新推論或覆寫。
- final appointment 必須屬於同一 Case。
- final appointment 的正式完成判斷應以 `visit_result = completed` 為核心，不應只看 appointment status。

## 5. 工程師完工設計原則

工程師完工流程必須簡單。

不可讓工程師填過度複雜的表單。工程師應只提供必要、簡潔的完工資訊，系統與 AI 再協助整理成結構化資料。

未來完工資料需支援：

- 維修結果
- 更換零件
- 舊序號 / 新序號
- 故障原因
- 維修動作
- 現場照片
- 客戶簽名
- 完成確認
- 結算依據
- 服務品質分析
- AI 學習與建議

設計原則：

- 工程師輸入越短越好，但正式資料要可追溯。
- AI 可協助整理、分類、提醒缺漏。
- AI 不可把不確定內容直接寫入正式紀錄。
- 正式 Field Service Report 仍是 Case-level 最終彙總。

## Customer-facing Completion Flow Future Design
## 客戶端完工流程未來設計原則

客戶端完工流程必須區分內部 Field Service Report 與 customer-facing service report。Field Service Report 是內部正式完工、結算、營運與追蹤依據；customer-facing service report 是給客戶看的維修結果摘要，必須遵守 customer visible data policy。

不可違反原則：

- 客戶簽名是重要佐證，但不是所有完工的絕對必要條件。
- 無簽名、代簽、拒簽、遠端完工、客戶不在或其他例外情境必須留下 structured exception reason、evidence、engineer note、contact log、review status 與 audit log。
- Customer-facing service report 不得包含 internal note、audit log、AI raw payload、AI risk flag、billing / settlement internal data、工程師內部評語、主管審核、廠商對帳規則、內部成本或未授權資料。
- 客戶端費用 / 發票 / 收據資訊只能顯示與客戶相關且已確認的 charge / approval / invoice records，不得顯示內部結算價、廠商請款價、工程師成本或 settlement internal data。
- 問題未解決、低分、負評、客訴或要求回訪時，應建立 follow-up / escalation；AI 可摘要分類，但不得隱藏負評、自動關閉客訴或修改評分。
- Customer-facing report 發送後若修正重要內容，應保留版本、change reason、updated_by 與 audit log。
- 完工通知、報告查看、下載、問卷與問題回報應留下 contact history / access log / audit log；不建議永久公開連結。
- LINE / App 可作為主要互動通路，SMS 主要作為提醒與導流，Web link 是查看 / 填寫入口而非主動通知通路。

完整 signature exception、customer-facing report allow/deny list、fee/invoice visibility、issue report、survey、versioning、access/download tracking 與 future tasks 請見：

- `docs/design/customer-facing-completion-flow.md`

本章是 future design reference，不代表立即實作 completion runtime、customer report runtime、signature runtime、invoice runtime、survey runtime、notification runtime、follow-up runtime 或 audit runtime。

## Engineer Mobile Workbench / 工程師手機工作台

工程師端未來應優先定位為 Engineer Mobile Workbench / 工程師手機工作台，而不是一開始直接開發完整原生 iOS / Android App。第一階段應採用低成本、輕量、可快速迭代的方式，例如 mobile web、PWA、LIFF-like 手機網頁入口，或可安裝到手機桌面的 Web App。核心目標是讓工程師能在手機上方便完成日常現場作業，而不是先追求完整 App 生態。

第一階段工程師手機工作台應支援工程師登入、權限檢查、工程師只能查看自己被派的任務、今日 / 近期任務列表、任務詳情、客戶地址與聯絡方式、預約時間、產品 / 報修問題 / 注意事項、到府 / 開始處理 / 完工狀態操作、簡短完工表單、照片上傳、零件更換紀錄、故障原因與處理方式、客戶簽名或簽名例外原因，並送出完工資料作為 Field Service Report 的資料來源。

工程師端不應預設依賴 LINE 推播通知。工程師應主動登入工作台查看自己的派工任務。LINE 若未來使用，應只作為快速登入入口、身分綁定入口或打開工程師工作台的快捷入口，不應成為工程師端通知或任務管理的必要依賴。設計上應避免增加 LINE 訊息成本、通知管理複雜度，以及避免平台工程師端流程被綁死在 LINE 上。

工程師端 UI / UX 必須保持簡單、快速、低負擔。設計原則包括手機優先、大按鈕、少欄位、少文字、快速完成、支援拍照上傳、支援客戶簽名或簽名例外、支援現場弱網路情境的草稿保存。不要讓工程師在現場填寫過多欄位；工程師只應輸入必要現場資訊，後續由系統或 AI 協助整理成結構化資料。

工程師手機工作台必須串接既有核心流程：Case → Appointment / Dispatch Visit → Field Service Report → Service Parts → Photos / Signature → Completion Confirmation。仍須維持既有原則：一個 Case 最終只有一份正式 Field Service Report；一個 Case 可以有多次 Appointment / Dispatch Visit；工程師完工時系統應優先根據當前完成的 appointment 自動帶入 finalAppointmentId；不要要求工程師在一般情況下手動選擇 finalAppointmentId。手動選擇 finalAppointmentId 只應作為 admin exception / override。

AI 可在工程師端後續協助將工程師簡短輸入轉成標準化完工描述、協助判斷故障原因分類、整理更換零件資訊、從照片 / 銘牌 / 序號標籤中擷取資料、補全 Field Service Report 草稿，並累積未來工程師處理經驗與 AI 學習資料。但第一階段不得讓 AI 增加工程師負擔。AI 應是輔助整理，而不是要求工程師多填更多 AI 欄位。

第一階段優先事項包括：工程師登入 / 權限檢查、工程師任務隔離、今日任務列表、任務詳情頁、到府 / 開始處理 / 完工狀態操作、簡短完工表單、照片上傳、客戶簽名或簽名例外原因、完工送出，以及寫入 Field Service Report / service_parts / photos / audit log。

暫時不要優先實作完整原生 iOS / Android App、複雜工程師排班 App、工程師 LINE 推播、過度複雜的 AI 自動判斷、過度細緻的現場表單，或過早的完整離線同步系統。

本原則屬於 future design memo。若任務只要求更新 PROJECT_GUARDRAILS.md 或文件，請採 docs-only / no runtime change，不得修改 backend src/、admin/src/、API、migration、smoke test 或 package.json。若發現需要程式修改，請列為 future task，不要擴大實作範圍。

## Engineer Mobile App / 工程師到府服務 App 未來設計原則

工程師端未來應以 Engineer Mobile Workbench / mobile responsive web / PWA / LIFF-like 手機入口優先，不應一開始直接投入完整原生 iOS / Android App。Native App 可作為中長期評估，但核心流程、API、permission、organization scope、audit log、file storage 與 Case / Appointment / Field Service Report 模型必須共用。

不可違反原則：

- 工程師端流程必須簡單、快速、低負擔；工程師只輸入現場必要資訊，不承擔後台、財務、主管或 AI 所需的複雜欄位。
- 工程師只能看到自己被派工或授權的 appointment / dispatch task 與必要現場資料。
- 工程師 App / Workbench 必須遵守一案一份正式 Field Service Report、多 appointment / dispatch visit、visit result 屬於 appointment 層、finalAppointmentId 由 backend/system 判定的原則。
- 工程師不應在一般流程手動選 finalAppointmentId；手動選擇僅作為受控 admin exception / override。
- 照片、簽名、文件應使用 file / object storage；重要操作如到場、完工、照片上傳、簽名、費用確認應可 audit。
- AI 可協助完工摘要、故障分類、零件整理、序號擷取與缺漏提醒，但不可偽造到場、簽名、工程師確認、核准報價、決定結算或修改正式案件狀態。
- Engineer seat、photo/signature、parts tracking、offline mode、push notification、AI completion summary 等可作為 future SaaS entitlement / feature_key。

完整 phase 1 scope、extended capabilities、安全與隱私、SaaS seat、AI assistance、implementation strategy 與 future tasks 請見：

- `docs/design/engineer-mobile-workbench.md`

本章是 future design reference，不代表立即實作 App、mobile web、API、upload、signature、push、offline、AI runtime、migration 或 smoke test。

## Depot / Workshop Repair Module / 非到府維修模組

本專案未來應支援 Depot / Workshop Repair / 非到府維修流程，作為 On-site Service / 到府服務以外的第二種 service workflow。此模組不是另一套系統，必須共用 Case、Customer、Customer Channel Identity、Contact History、Notification、File / Object Storage、Parts / Inventory、Billing / Settlement、AI governance、Audit Log、organization scope、permission 與 SaaS-ready 架構。

不可違反原則：

- 到府服務是 appointment-driven；非到府維修是 receiving / diagnosis / quote / repair / QC / return-driven。
- 未來可用 service_type / workflow_type 區分 onsite、depot、carry_in、mail_in、pickup_delivery。
- 非到府維修不得破壞一個 Case 最終只有一份正式完成報告的原則。
- Customer-facing timeline 不得顯示 internal note、audit log、AI raw payload、內部成本、內部結算規則、技師內部評語、主管審核或跨 organization 資料。
- AI 可協助檢測紀錄標準化、報價草稿、品檢摘要與故障分類，但不得自動判定正式保固、核准報價、決定正式收費、修改正式完成結果、跳過人工檢測、關閉客訴或跨 organization 查資料。

完整流程、future data concepts、customer timeline 與 future tasks 請見：

- `docs/design/depot-workshop-repair.md`

本章是 future design reference，不代表立即新增資料表、migration、API、runtime、AI provider、notification 或 smoke test。

## Case-created First Contact / Dispatch Intake Contact Workflow
## Case 建立後第一觸達與派工前資料收集流程

Case 建立後，系統未來應支援 First Contact / Dispatch Intake Contact Workflow。此流程的目標是第一觸達、LINE / channel 導流與低風險派工必要資料收集，不是承諾正式 appointment。

不可違反原則：

- SMS 是 Case 建立後第一觸達與 LINE binding 的主要導流工具。
- LINE 是短中期主要互動通路；Web link 是 fallback，且仍應引導 LINE binding；App 是 future owned channel。
- 若客戶數小時或隔天仍未回覆，可由 AI First-call Intake Assistant 在適合時段外撥，但僅限低風險 intake。
- AI First-call Intake Assistant 不可承諾正式 appointment、報價、賠償、結算結果、費用同意或特殊承諾。
- 高風險、客訴、爭議、模糊回答或客戶要求真人時，必須轉真人客服。
- SMS / LINE / Web / AI call 收集結果只能形成 `dispatch_intake_draft`，必須由客服或派工確認後才可轉為正式派工資料。
- 所有 SMS、link click、LINE binding attempt/success/failure、Web completion、AI call、human call、App、Email contact 都必須留下 contact attempt log / contact history。
- 通話錄音 / transcript 不應預設為一般可查資料；需依權限、保存期限與 audit log 控制。

完整 first-contact flow、channel roles、dispatch_intake_draft boundary、contact history、AI call handoff 與 future tasks 請見：

- `docs/design/case-first-contact-dispatch-intake.md`

本章是 future design reference，不代表立即實作 SMS、LINE binding、Web link、AI call、human call、contact log、dispatch intake runtime、API、migration、UI 或 smoke test。

## Dispatch Suggestion to Appointment Confirmation Future Design
## 派工建議到預約確認未來設計原則

派工應在派工前資料收集完成並形成 `confirmed_dispatch_intake` 後，才由 AI 產生 `dispatch_suggestion`。正式 appointment 不應由 AI 直接建立，必須經派工人員確認與客戶最終確認。

不可違反原則：

- AI dispatch suggestion 可協助案件排序、工程師匹配、路線群聚、備料提醒、維修時間預估、SLA / 客訴 / 缺料風險提示與派工草稿。
- AI 不得直接建立正式 appointment、通知正式到府時間、自動承諾時段、忽略高風險案件或繞過派工人員確認。
- `dispatch_intake_draft` 必須先由客服或派工確認為 `confirmed_dispatch_intake`，才能作為 AI dispatch suggestion 依據。
- 派工人員確認後應先形成 `proposed_appointment`；客戶確認後才可成為正式 `confirmed_appointment`。
- LINE / App push 可作為主動互動通路，SMS 主要提醒與導流，Web link 是 fallback 入口，AI call / human call 用於補位與例外處理。
- 客戶未回覆、要求改期、回覆模糊、時間緊急、send failure、客訴 / 爭議 / 高風險、涉及費用或特殊承諾時，必須進入安全補位或真人處理。
- 所有 proposed / confirmed / changed / rejected / no-response confirmation 都必須留下 confirmation log、contact attempt log 與 audit log。
- Calendar event 僅作為客戶提醒工具，不可取代平台內部 `confirmed_appointment`，且必須資料最小化。
- AI dispatch learning feedback 必須遵守 organization scope、Data Access Control、sensitive data masking、audit log 與 SaaS / AI governance。

完整 dispatch states、dispatcher review、customer confirmation、no-response handling、confirmation log、calendar link、learning feedback 與 future tasks 請見：

- `docs/design/dispatch-appointment-confirmation.md`

本章是 future design reference，不代表立即實作 dispatch runtime、appointment runtime、notification runtime、LINE push、App push、SMS、Web link、AI call、calendar link、ICS、confirmation log 或 audit runtime。

## 8. 既有報修單反向綁定 LINE

平台必須支援既有 Case 反向邀請客戶加入 LINE 並完成綁定。

建議流程：

1. 已有 Case。
2. 系統或客服邀請客戶加入 LINE。
3. 客戶透過安全驗證確認身份。
4. 綁定 `customer_line_identity`。
5. 後續可透過 LINE 查詢、通知、補件、確認預約與收到完工資訊。

安全原則：

- 綁定 token 必須過期。
- 綁定 token 必須一次性使用。
- 綁定 token 建議雜湊儲存。
- 驗證失敗不可洩漏案件是否存在、手機是否正確、LINE 是否已綁定。
- 成功、失敗、過期、重複使用都需 audit log。
- 不可在 log 中暴露完整手機、token、LINE access token、channel secret。
- 不可只用 raw `line_user_id` 做全域綁定。

## 9. 自有 App 未來方向

LINE 是短中期低摩擦入口，自有 App 是長期 owned customer entry point。

App 不立即實作，但目前架構不可把未來 App 做死。

未來 App 可支援：

- 報修
- 案件查詢
- 服務紀錄
- 照片 / 文件上傳
- 預約確認
- push notification
- 完工摘要
- 滿意度問卷
- 報價確認
- 費用同意

App identity 應能與同一 `customer_id` 連接，不應與 LINE identity 互斥。

## 10. Billing / Settlement / Vendor Rules

結算規則不能硬寫死。

不同廠商 / 品牌可能有不同結算規則，規則需可配置、可審核、可追溯。

未來需支援：

- 多次派工
- 首次未完成
- 待料
- 客戶不在
- 報價場
- 再次派工
- 加購服務
- 樓層 / 搬運費
- 偏遠地區費
- 安裝 / 施工加價
- 廠商或品牌專屬規則
- 保固與非保固差異

AI 可協助建議與檢查，但不可自動核准正式結算或修改正式金額。

正式金額應由 deterministic billing / settlement rule engine 或人工審核流程決定，並保留規則版本與審核軌跡。

## Billing / Settlement / Reconciliation Rule Source File & Version Governance
## 對帳 / 結算規則來源檔案、版本與追溯治理原則

Billing / Settlement / Reconciliation 規則必須支援來源檔案存查、AI 解析、規則草稿、人工審核、dry-run 驗證、版本化生效與對帳結果追溯。

不可違反原則：

- 廠商合約、品牌規則、Excel、PDF、文件等來源檔案應保留 source file、file version、effective period、vendor / brand scope、uploaded_by、file hash / checksum、storage reference 與 audit log。
- 來源檔案不得存入主資料表的大欄位，應使用 file / object storage。
- AI 可協助解析、摘要、建議 rule draft、找出缺漏 / 衝突與 dry-run 異常，但 AI 內容只是 draft / suggestion。
- AI 不得直接建立正式規則、讓規則生效、核准結算、修改請款金額、覆蓋既有規則或忽略缺佐證案件。
- 正式規則必須經授權人員審核、dry-run、核准、版本化與 audit log 後才可生效。
- 規則必須版本化，不可直接覆蓋舊規則；舊案件應可依當時有效規則追溯或重算。
- 對帳結果必須引用 rule version 與 source file，不可只保存總金額；calculation breakdown、applied conditions、missing evidence、exception flags 與 review status 必須可追溯。
- AI 解析來源檔案仍需遵守 AI-assisted file import、Cloud AI Data Protection、Data Access Control、organization scope、permission、masking / redaction 與 minimum necessary context。

完整 source file governance、AI rule draft、human review、dry-run、rule versioning、settlement traceability 與 future tasks 請見：

- `docs/design/billing-settlement-rule-governance.md`

本章是 future design reference，不代表立即實作 file upload、AI parsing、rule engine、dry-run、versioning、settlement runtime、audit runtime、API、migration 或 smoke test。

## Parts / Inventory / WMS-like Module Future Design
## 料件 / 成品 / 庫存管理模組未來設計原則

本平台未來應支援 Parts / Inventory / WMS-like Module，用於管理料件、成品、倉庫庫存、工程師車上庫存、料件預留、出入庫、調撥、待料、序號、舊件回收、退料、報廢、盤點與結算連動。

不可違反原則：

- 此模組不是孤立倉儲系統，必須與 Case、Appointment、Dispatch Visit、Field Service Report、Engineer Workbench、Billing / Settlement、AI、SaaS entitlement、permission 與 audit log 共用平台架構。
- 料件使用應能關聯 case_id、appointment_id、field_service_report_id；待料狀態應記錄在 appointment / dispatch visit 層。
- 多次到府仍維持一案一份正式 Field Service Report，料件模組不得破壞 Case / Appointment / Field Service Report 邏輯。
- 正式庫存異動不可只靠 note，必須可追蹤 movement type、source/destination、quantity、serial、related case / appointment / report、performed_by、reason 與 audit log。
- 缺料、預留、釋放預留、實際使用、出庫、退料、報廢、調撥與舊件回收必須分清楚。
- AI 可協助料件建議、替代料號、備料提醒、待料風險與 feedback learning，但不可自動扣正式庫存、建立正式出庫 / 調撥、覆蓋料件主檔、核准成本或決定正式結算金額。
- 料件費、舊件回收、序號、照片與客戶同意紀錄可作為結算佐證；正式金額仍須 deterministic rule engine 或授權人員確認。
- 料件 / 成品資料必須遵守 organization scope、role permission、audit log、SaaS entitlement 與 usage tracking。

完整 module scope、service workflow、inventory movement traceability、AI recommendation、settlement linkage、SaaS / permission / audit、external integration 與 future tasks 請見：

- `docs/design/parts-inventory-wms.md`

本章是 future design reference，不代表立即實作 parts、inventory、WMS、stock、reservation、serial tracking、warehouse、vehicle stock、billing runtime、AI runtime、API、migration 或 smoke test。

## 11. 樓層 / 搬運 / 加價設計

從服務角度，不應問「是否需要工程師協助搬運」，因為現場服務預期工程師處理必要搬運。

目前實務是根據地址詢問是否有電梯。無電梯代表可能有：

- 樓層搬運風險
- 排程時間風險
- 需要多人協助
- 費用風險
- 客戶同意風險

樓層費、搬運費、偏遠費、施工加價應作為 configurable billing items / settlement rules，不應只寫在 note。

## 12. 客戶滿意度與服務品質

未來必須加入完工後客戶滿意度問卷。

原則：

- 不應在服務結果確認前發送。
- 多次派工案件，預設只針對最終完成 appointment 發送問卷。
- Survey context 應是 Case-level completion context，而不是 appointment-level formal report context。
- 一張 Case 仍只有一份正式 Field Service Report。
- `finalAppointmentId` 可作為最終完成 appointment 的追溯 context。

問卷未來可支援：

- 評分
- 文字回饋
- 問題標籤
- 客訴 / 升級處理
- 品牌或廠商服務品質報表

負評或客訴關鍵字應建立追蹤或主管提醒。

AI 可摘要、分類、偵測異常與建議回覆，但不可自動隱藏負評或關閉客訴。

## 13. AI 使用原則

AI 是核心能力，但必須服務流程。

AI 可以用於：

- 客服資料整理
- 報修內容結構化
- 地址 / 樓層 / 搬運風險提醒
- 派工建議
- 維修時間預估
- 完工內容整理
- 故障分類
- 結算輔助
- 滿意度摘要
- 服務品質異常提醒
- SLA / 逾期風險提醒
- 客訴風險偵測
- 缺料風險偵測
- 缺少照片 / 簽名 / 序號提醒

AI 不可以：

- 繞過權限。
- 自動核准報價。
- 自動核准結算。
- 自動改變正式案件狀態。
- 自動關閉客訴。
- 自動派工。
- 自動完工。
- 自動決定正式 payable amount。
- 把不確定內容當成事實寫入正式資料。
- 替客戶同意費用。
- 替主管通過審核。

AI suggestion / official record 必須清楚區分。

## Closed-domain AI Agent / Permission-aware RAG Future Design
## 封閉式 AI Agent / 權限感知 RAG 未來設計原則

本平台未來 AI agent 必須採 closed-domain、permission-aware、tenant-isolated、auditable、human-controlled、RAG-grounded 設計。AI 回答、摘要、建議與風險標記應基於平台內部授權資料、SOP、品牌規則、案件資料、維修紀錄、結算規則、通知政策與使用者有權限查看的內容。

不可違反原則：

- AI 不應自由存取外部資料、未過濾 database、未過濾 vector database、raw file storage 或跨 organization 資料。
- 所有 AI retrieval 必須檢查 organization_id scope、user identity、role、permission、feature entitlement、subscription status、allowed case/customer/document scope、customer-visible policy、internal data policy、masking / redaction、audit log 與 SaaS usage。
- RAG 查詢不得缺少 organization_id filter，不可跨 tenant、LINE channel 或授權範圍。
- AI agent 應依客服、派工、工程師完工、結算、品質風險、Knowledge/SOP 等任務分工，每個 agent 都要有 retrieval policy、資料邊界、permission requirement 與 audit event type。
- AI 可以摘要、整理、提醒、建議、標記風險與查詢 RAG；不可核准報價、核准結算、改正式案件狀態、關閉客訴、替客戶同意、偽造簽名 / 到場、繞過權限或把不確定內容寫入 official record。
- AI output 必須與 official record 分離，並支援 human accept / reject / edit。
- RAG knowledge 應有 version、effective period、visibility、organization/brand/vendor scope 與來源追溯。
- AI feedback learning 與 usage tracking 必須 tenant-isolated、masked、auditable 且不可成為跨 tenant 洩漏來源。

完整 retrieval flow、RAG metadata、tenant isolation、agent types、audit log、knowledge versioning、feedback learning、SaaS usage 與 future tasks 請見：

- `docs/design/closed-domain-ai-permission-rag.md`
- `docs/design/ai-assistance-layer.md`
- `docs/design/cloud-ai-data-protection.md`
- `docs/design/data-access-control.md`

本章是 future design reference，不代表立即實作 AI agent、RAG、vector DB、embedding、retrieval、prompt、worker、runtime、API、migration 或 smoke test。

## Cloud AI / External AI Provider Data Protection Principle
## 雲端 AI / 外部 AI Provider 資料保護原則

AI / RAG / Cloud AI 資料安全是本平台最高優先級之一。平台未來可以使用 cloud AI provider，但任何送往外部 AI provider 的內容都必須先經過 scope、permission、entitlement、minimum necessary context、masking / redaction、customer-visible / internal policy、audit log 與 usage 控制。

不可違反原則：

- AI 不可直接取得未過濾 database、vector database、file storage 或跨 organization 資料。
- token、secret、LINE access token、LINE channel secret、webhook secret、binding token、驗證碼、完整手機、完整地址、客戶簽名原始資料、未遮罩照片、audit log 全文、internal note 全文、billing / settlement internal data 全文、AI raw sensitive payload、跨 organization / tenant 資料不得直接送往外部 AI provider。
- AI 可以使用經授權、過濾、遮罩、最小化後的資料協助摘要、分類、建議、風險標記與 RAG 查詢，但不可因便利性、準確率或自動化需求犧牲資料安全。
- 高敏任務應保留 private AI、dedicated environment、local model、hybrid AI architecture 等選項。
- AI provider 必須視為 third-party supplier / external service，納入供應商風險管理、資料處理條款、資料保留政策、加密、audit / logging、incident response 與 exit strategy。
- AI output 必須與 official record 分離，並支援 human accept / reject / edit。
- 不可因 organization 購買高階方案，就放寬安全、個資、權限或 ISO 27001-aligned 原則。

完整 external provider controls、never-send list、supplier risk、private/local/hybrid AI options 與 future tasks 請見：

- `docs/design/cloud-ai-data-protection.md`

本章是 future design reference，不代表立即實作 AI provider、RAG、masking、redaction、private AI、local model、hybrid AI、runtime、API、migration 或 smoke test。

## AI Assistance Layer / Customer AI Scope

AI 應被設計為 embedded AI Assistance Layer，而不是單一通用聊天框。不同角色與流程可使用不同 AI 介面，例如 AI 對話框、AI 建議卡、表單欄位建議、完工整理確認卡、草稿產生器、摘要器與 AI voice intake。

不可違反原則：

- AI 必須 closed-domain、permission-aware、tenant-isolated、auditable、human-controlled，且 RAG-grounded。
- AI 不得繞過 permission、organization scope、Data Access Control、audit log、formal review 或 official approval。
- 派工 AI 只能產生 suggestion / draft，必須由派工人員確認、修改或拒絕。
- 工程師端 AI 第一階段應以完工整理確認卡為主，不得增加工程師填表負擔。
- Customer AI 不得做成開放式通用聊天機器人，只能回答 customer-visible、本人的已驗證 / 已綁定案件、官方流程、FAQ、報修前準備與低風險故障排除。
- Customer AI 不得讀取或輸出 internal note、audit log、AI raw payload、internal billing / settlement rules、未確認 appointment suggestion、未確認報價 / 結算資料、跨客戶或跨 organization 資料。
- AI 遇到客訴、爭議、費用問題、緊急 / 高風險情境、負評、身份不明或不確定時，應轉真人或建立 escalation / follow-up。

完整 AI surface、Customer AI boundary、official record separation、data protection 與 future tasks 請見：

- `docs/design/ai-assistance-layer.md`
- `docs/design/customer-ai-scope.md`

本章是 future design reference，不代表現在實作 AI assistance layer、Customer AI、AI voice intake、RAG knowledge base、AI provider、prompt、retrieval、runtime 或 UI。

## AI-assisted File Import Raw File Protection Principle
## AI 輔助檔案匯入原始檔案保護原則

AI-assisted file import does not mean sending the full raw file to AI. AI 輔助檔案匯入不代表把完整原始檔案送給 AI。

不可違反原則：

- 系統必須先解析、最小化、遮罩與過濾檔案內容；外部 AI provider 只能接收為欄位 mapping、驗證輔助、摘要或分類所需的最小必要內容。
- AI 可協助欄位辨識、mapping 建議、錯誤摘要、缺漏提醒、重複風險、故障描述摘要、產品類型推測、料件料號初步建議與 RAG 文件分類摘要。
- 完整報修資料原始檔、完整客戶清單、完整案件匯入檔、完整手機、完整地址、完整姓名、客戶簽名原始資料、未遮罩照片、internal note 全文、audit log 全文、billing / settlement internal data 全文、token、secret、LINE access token、LINE channel secret、webhook secret、binding token、驗證碼、跨 organization / tenant 資料不得直接整包送往外部 AI provider。
- 正確流程應先做 user / role / permission / organization scope 檢查、file type / size / security 檢查、deterministic parsing、sample extraction、masking / redaction、AI mapping assistance、dry-run validation、human confirmation，才可正式寫入資料。
- AI 不可自動建立正式 customer / case、覆蓋既有資料、合併客戶、建立高風險結算規則、把未驗證文件加入 production RAG、跨 organization 比對或將不確定內容寫入 official record。
- AI-assisted import 必須遵守 Data Access Control、Cloud AI Data Protection、permission-aware RAG、organization isolation、masking / redaction、audit log 與 SaaS usage tracking。

完整 AI-assisted import flow、never-send list、official write restrictions、example principle 與 future tasks 請見：

- `docs/design/ai-assisted-file-import-protection.md`

本章是 future design reference，不代表立即實作 AI import、file parser、masking、redaction、upload、download、RAG ingestion、permission runtime、audit runtime、SaaS usage runtime、API、migration 或 smoke test。

## 14. ISO 27001-aligned 資訊安全設計原則

本專案應採 ISO 27001-aligned by design。

ISO27001-aligned system controls roadmap 應作為系統層級技術控制規劃，不代表已完成正式認證或完整 ISMS 制度。系統設計必須逐步補強 data classification、field-level visibility、export control、file access control、AI retrieval guard、provider secret management、audit log viewer、access review report、incident evidence、backup / restore evidence 等能力，並維持 organization isolation、permission-aware access、auditability、customer-visible data filtering、SaaS-ready multi-tenant boundaries、AI / RAG safety、provider secret safety 與 no silent overwrite of formal data。完整 roadmap source 請見 `docs/design/iso27001-system-controls-roadmap.md`。

目前不一定立即取得正式認證，但設計上必須重視：

- 權限控管
- 最小權限
- audit log
- 敏感資料保護
- 資料完整性
- 安全開發
- 事件與異常處理
- 供應商風險
- 個資與隱私
- 持續改善

安全原則：

- 所有 API 必須檢查身份、角色、organization scope。
- 客戶可見資料與內部資料必須分離。
- 不可在 log、錯誤訊息、前端回應中暴露敏感資料。
- token、secret、access token、webhook secret 不可寫死在程式碼。
- customer contact values 需依角色與用途最小化顯示。
- raw provider payload 不應直接暴露給 Admin、customer 或 AI summary。
- 權限、audit、organization scope 是設計基礎，不是後補功能。

未來正式導入 ISO 27001 時，應能逐步建立：

- 風險清冊
- 資產清冊
- 控制項對應表
- 存取權限審查
- 事件管理流程
- 供應商風險管理
- 內部稽核
- 變更管理流程

## 15. Future Operations & Risk Control Extensions / 未來營運與風險控管擴充

以下功能目前都屬於 future design，不代表立即實作；現階段只需要避免資料模型與流程被寫死，讓未來可以依照營運成熟度逐步加入。

不可違反原則：

- SLA / 服務時效應能依案件類型、品牌、廠商、客戶等級、保固狀態設定規則，而不是單一欄位。
- 客戶費用同意不能只寫在 note，重要費用需可追溯同意來源、時間與佐證。
- 料件預留、車上庫存與待料追蹤會影響一次完修率、派工建議、工程師效率與對帳，未來需與 inventory / billing logic 串聯。
- pending_quote 應發展成正式 quote approval flow；報價金額需可與 billing_items / settlement rules 銜接。
- 客戶回饋不應混在 service report internal note；客訴風險需能被主管看見。
- Checklist 應短而必要，不可增加工程師負擔。
- 主管審核與例外處理必須可 audit。
- Dashboard 必須依角色與 organization scope 顯示，不可暴露未授權資料。
- LINE self-service inquiry 必須遵守 customer visible data policy，不得暴露 internal note、audit log、billing internal data 或 AI raw payload。
- AI Risk Radar 只提供 risk flag / suggestion / explanation，不直接改狀態、決定金額、通過審核或發送敏感通知。

建議優先順序：

1. SLA / 逾期提醒
2. 客戶費用同意紀錄
3. 料件預留 / 待料追蹤
4. 報價流程
5. 品質回訪 / 客訴風險
6. 主管審核
7. 角色 Dashboard
8. LINE 自助查詢
9. AI 風險雷達
10. Checklist

完整 SLA、customer approval、parts reservation、quote approval、feedback、checklist、exception review、dashboards、LINE self-service、AI risk radar 的用途、資料方向、AI 邊界與 future tasks 請見：

- `docs/design/future-operations-risk-control.md`

本章是 future design reference，不代表立即實作 SLA、approval records、parts tracking、quote approval、feedback、checklist、exception review、dashboard、LINE self-service、AI risk radar、API、migration 或 smoke test。

## 16. 文件更新與任務限制原則

若任務是文件更新，只能改文件。

文件任務不得：

- 修改 backend `src/`。
- 修改 Admin frontend `admin/src/`。
- 新增 migration。
- 修改 API。
- 修改 smoke test。
- 修改 `package.json`。
- 實作任何功能。
- 連接 DB。
- 執行 DDL。
- 啟動 provider sending。

如果發現需要程式修改，請只列為 future task，不要在文件任務內執行。

## 17. 每次 Codex / 工程任務完成後回報格式

後續每次任務完成後，回報應包含：

- 修改了哪些檔案。
- 實作了什麼。
- 沒有實作什麼。
- 測試結果。
- 風險或限制。
- 是否違反 `PROJECT_GUARDRAILS.md`。
- 是否新增或修改資料表。
- 是否新增或修改 API。
- 是否新增或修改權限邏輯。
- 是否新增或修改 audit log。
- 是否新增或修改 smoke test。
- 是否碰敏感資料、token、secret、個資或 LINE 相關邏輯。

若任務是 docs-only，回報也應明確寫：

- No backend src change。
- No admin src change。
- No migration。
- No API change。
- No smoke change。
- No package.json change。
- No runtime behavior change。

## 18. 禁止事項

以下事項禁止，除非未來有明確產品決策、架構設計、風險評估、migration / runtime approval，且不違反核心 invariant：

- 不可將 Field Service Report 改成一個 Case 多份正式報告。
- 不可移除 `field_service_reports.case_id` 唯一性原則。
- 不可讓同一 Case 同時存在多個未完成 appointment。
- 不可把 LINE 寫死成唯一客戶入口。
- 不可把 `line_user_id` 當成全域身份。
- 不可把照片、簽名、文件大型檔案塞進主資料表。
- 不可讓 AI 自動核准報價。
- 不可讓 AI 自動核准結算。
- 不可讓 AI 自動關閉客訴。
- 不可讓 AI 自動修改正式案件狀態。
- 不可讓 AI 繞過權限。
- 不可讓 AI 跨 organization / tenant 查資料。
- 不可讓 AI 直接查詢未過濾資料庫或 vector database。
- 不可讓 AI retrieval 缺少 `organization_id` filter。
- 不可把 AI output 直接當成 official record。
- 不可因為高階 SaaS 方案或 AI Add-on 就放寬權限、個資、tenant isolation、audit 或 ISO 27001-aligned 原則。
- 不可在 log 中輸出完整手機、token、secret、LINE access token、channel secret。
- 不可在錯誤訊息中透露案件是否存在、手機是否正確、帳號是否存在。
- 不可讓客戶看到 internal note、audit log、billing internal data、AI raw payload。
- 不可讓工程師完工流程變成過度複雜表單。
- 文件更新任務不可修改程式碼。
- 不可把 future design 當成已批准 implementation。
- 不可用 shared runtime 做 destructive cleanup。

## 19. Guardrail Change Policy / 護欄變更政策

本文件可以更新，但應符合以下原則：

- 只能讓專案邊界更清楚，不能偷偷放寬核心安全與資料 invariant。
- 若要放寬禁止事項，必須有明確 task、設計理由、風險評估與驗證計畫。
- 若與既有 task doc 衝突，應回報並做 consistency review。
- 若新增 runtime、migration、API、Admin、provider sending、AI automation，必須另開明確任務。

本文件是長期工程與產品協作的基準，不是一次性備忘錄。
