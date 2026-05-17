# Multi-Visit Field Service Design

## 1. Product Rule / 產品規則

- Case 代表整個報修案件生命週期。
- 一個 Case 原則上只有一份正式 Field Service Report。
- Field Service Report 是整案最終彙總報告，不是每次到府各一份報告。
- 一個 Case 可以有多筆 dispatch orders / appointments / visits。
- Dispatch Order / Appointment / Visit 代表每一次派工安排、到府嘗試或實際到訪。
- 每次派工 / 到府應能記錄 visit_sequence、visit_result、incomplete_reason、next_action、actual_arrival_at、actual_finished_at 等資料。
- 多次派工資料是未來一次完修率、缺料率、二次派工原因、工程師效率、派工 AI 學習、對帳規則的重要資料來源。
- Service Parts 仍可先歸屬於同一份 Field Service Report；未來若需要精準分析零件是哪一次派工使用，再評估 service_parts.appointment_id 或 dispatch_order_id。
- Photos / Signatures / Attachments 未來應可關聯到 case、dispatch order / appointment、service report。
- 只有最終完修或確認完成時，case 才能進入 completed。
- 缺料、需報價、客戶不在、需二次到府，不應直接讓 case completed，而應更新該次派工 / appointment 的 visit_result 與 next_action。

## 2. Current Implementation Finding / 目前現況

- appointments 已支援一案多筆 appointment。
- appointments 目前可用 case_id 關聯同一個 case，沒有 case_id 唯一限制。
- appointments 目前缺少 visit_sequence、visit_result、incomplete_reason、next_action 等結構化欄位。
- appointment status 目前可表達 scheduled、rescheduled、cancelled、completed、no_show。
- appointments 目前有 reschedule_reason / note，但不足以穩定支援「本次到府未完成原因」與後續流程判斷。
- field_service_reports 目前一案一份，這符合新的業務原則，應保留。
- field_service_reports.case_id active unique index 符合「一案一正式報告」的設計，不再視為阻擋點。
- 不應移除 `idx_field_service_reports_case_active_unique`。
- 目前缺口不是支援多份正式 service report，而是 appointments / dispatch records 缺少 visit_sequence、visit_result、incomplete_reason、next_action 等結構化欄位。
- field_service_reports 目前沒有 final_appointment_id / final_dispatch_order_id，未來可新增，用來標示最終完成或確認服務結果的是哪一次派工 / 到府。
- existing singular endpoint `/api/v1/admin/cases/:caseId/service-report` 符合一案一份正式服務報告原則，可保留。
- service_parts 目前綁 service_report_id；在一案一正式報告模型下仍可運作。
- case_attachments 目前只綁 case_id，未來可擴充 appointment_id / service_report_id，用於每次到府照片、簽名、完修證明等。

## 3. Proposed Data Model / 建議資料模型

### cases

- id
- status
- case lifecycle fields
- completed_at
- closed_at
- last_internal_activity_at

### dispatch_orders / appointments

- id
- case_id
- visit_sequence
- dispatch_unit_id
- engineer_id
- scheduled_start_at
- scheduled_end_at
- actual_arrival_at
- actual_finished_at
- status
- visit_result
- incomplete_reason
- next_action
- is_first_visit
- is_final_visit

Dispatch order table 若未來獨立於 appointments，可承擔更完整的派工單生命週期；在目前模型中，appointments 可先作為每次到府 / 重約 / 取消 / 空趟 / 完成的 visit record foundation。

### field_service_reports

- id
- case_id
- final_appointment_id nullable
- final_dispatch_order_id nullable, if dispatch_order table exists in future
- diagnosis_result
- repair_action
- repair_result
- test_result
- service_status
- customer_visible_summary
- internal_note
- customer_confirmation

Field Service Report 是整案最終彙總，不為了 multi-visit 產生多份正式報告。派工過程資料由 appointment / dispatch_order 記錄；report 僅在最終完修或確認完成後彙總診斷、處理、測試結果與客戶確認資訊。

### service_parts

- id
- service_report_id
- part fields
- future optional appointment_id / dispatch_order_id only if needed for analytics

service_parts 第一階段仍掛 service_report_id。若未來需要分析「哪一次派工使用哪個零件」，再新增 appointment_id / dispatch_order_id。這可以避免第一階段過早引入雙重來源，也避免同一零件同時指向 report 與 appointment 但資料不一致。

### case_attachments

- id
- case_id
- appointment_id nullable
- service_report_id nullable
- attachment metadata / storage key

attachments 可在後續任務加入 optional appointment_id / service_report_id。每次到府照片、完修照片、簽名或檢測資料通常需要知道是哪一次派工產生；保留 nullable 則可相容既有只屬於 case 的附件。

## 4. Suggested Enum / 建議列舉值

visit_result 與 next_action 應定位為 appointment / dispatch_order 層級欄位，不是正式服務報告層級欄位。

### appointment.status

appointment.status 可先維持既有方向：

- scheduled
- rescheduled
- cancelled
- completed
- no_show

### visit_result

- completed
- pending_parts
- pending_quote
- need_second_visit
- customer_not_home
- customer_cancelled
- unable_to_repair
- rescheduled
- no_show

### next_action

- close_case
- schedule_follow_up
- wait_for_parts
- wait_for_quote_approval
- contact_customer
- manager_review
- no_action

### incomplete_reason

incomplete_reason 建議第一階段先使用 text，讓營運團隊累積真實原因資料；等分類穩定後再評估 enum 化，避免太早把現場情境鎖死。

## 5. Case Status Strategy / 案件狀態策略

cases.status 代表整體案件生命週期。appointment / dispatch_order 的 visit_result 代表單次派工結果。不要把所有單次派工結果塞進 cases.status。

cases.status 應保留整體流程狀態，例如：

- scheduled
- on_site
- completed
- closed
- cancelled

為了後台篩選與營運管理，未來可評估在 case 層新增少數整體可查狀態，例如：

- pending_parts
- pending_quote
- need_second_visit

優點：

- 對客服、派工與主管查詢直覺。
- 不需要 join 最新 appointment / dispatch record 就能做列表篩選。
- 可快速建立營運 dashboard。

缺點：

- case status enum 會變大，workflow transition 會更複雜。
- public customer visible status mapping 也需要同步擴充。
- 單次 visit_result 與 case.status 可能產生同步問題。

另一個方向是新增 case-level 欄位：

- case_resolution_status
- hold_reason
- next_action

優點：

- 保留 cases.status 作為主流程狀態。
- 可明確區分「案件目前卡在哪裡」與「案件生命週期走到哪裡」。
- 對 multi-dispatch、pending quote、pending parts 會更有彈性。

缺點：

- API DTO、admin filters、workflow service 需要額外欄位。
- 前端需要同時顯示 status 與 resolution/hold state。

本文件建議後續優先採「appointment / dispatch_order 記錄 visit_result + case 層保留少數必要查詢欄位」的漸進式方案，不在第一階段把所有 visit result 都擴成 case status。

## 6. Backend/API Migration Roadmap / 後續實作路線

### Task A: Migration: Appointment / Dispatch Visit Result Fields

Implementation progress: completed as `018_add_visit_result_fields_to_appointments.sql` for appointments.

- appointments 加 visit_sequence。
- appointments 加 visit_result。
- appointments 加 incomplete_reason。
- appointments 加 next_action。
- appointments 加 actual_arrival_at / actual_finished_at，如尚未存在。
- 可評估 is_first_visit / is_final_visit 是否需要。

### Task B: Migration: Field Service Report Final Visit Link

Implementation progress: completed as `019_add_final_appointment_id_to_field_service_reports.sql`.

- field_service_reports 保留一案一份。
- 不移除 case_id unique index。
- 新增 final_appointment_id nullable。
- 若未來有 dispatch_orders table，可再新增 final_dispatch_order_id。
- 讓最終服務報告能追溯最後完成服務的是哪一次 appointment / dispatch。

### Task C: Backend Workflow Rules

Implementation progress: service report completion now requires a valid final appointment when the case has appointments. The final appointment must belong to the same case and its visit_result must be completed. Legacy cases without appointments can still complete service reports.

- 建立或更新 appointment / dispatch visit_result 與 next_action。
- 第一次到府缺料、需報價、客戶不在，不應讓 case completed。
- 只有最終完成時才更新 field_service_report 與 case completed。
- case 可依最新 appointment / dispatch result 顯示目前卡點。
- complete service report 時應確認 final_appointment_id / final_dispatch_order_id 與案件一致。

### Task D: Attachments Relation Expansion

- case_attachments 支援 optional appointment_id / service_report_id。
- 用於每次到府照片、簽名、完修證明。
- 驗證 appointment / report 與 case 屬於同一案件。
- upload-url payload 可支援 appointmentId / serviceReportId。
- list attachments 可支援 appointment/report filter。

### Task E: Admin Frontend Multi-Dispatch UI

- case detail 顯示多筆 dispatch / appointment。
- 顯示每次 visit_result、next_action、未完成原因。
- field_service_report 仍顯示一份最終報告。
- report 可顯示 final appointment / final dispatch。
- parts/photos/signatures 可依 selected appointment / final report 呈現關聯資料。

### Task F: Smoke Tests

- 一案多次 appointment / dispatch。
- 第一次缺料不結案。
- 第二次完修才 completed。
- 一案仍只能有一份 active field_service_report。
- final_appointment_id 可正確關聯最後完成到府。
- attachments 若擴充 appointment/report 關聯，需驗證不能跨 case 關聯。

## 7. Backward Compatibility / 相容性

- 現有一案一份 field_service_report 不需要搬移。
- field_service_reports.case_id unique index 保留。
- 既有 singular endpoint `/api/v1/admin/cases/:caseId/service-report` 符合一案一正式報告原則，可以保留。
- 主要相容性工作在 appointments / dispatch records 補結構化 visit result。
- final_appointment_id 應 nullable，以相容既有報告。
- API DTO 需要能處理 finalAppointmentId nullable。
- 前端可先顯示既有 report，再逐步增加 final appointment / dispatch 顯示。
- service_parts 既有資料仍透過 service_report_id 關聯，不需要搬移。
- case-level billing record 仍可保留為整案帳務摘要，不必因 multi-dispatch 立即拆成多筆 billing。

## 8. AI Learning Impact / AI 學習影響

AI 學習主要從多筆 appointment / dispatch order 的 visit_result、incomplete_reason、next_action、actual duration、engineer、region、parts readiness 等資料學習，而不是從多份 service report 學習。

multi-dispatch 結構會讓未來 AI 學習與營運分析更準確：

- 一次完修率：第一筆 visit 是否 completed，可衡量派工準備、備料與工程師能力。
- 二次派工率：同一 case 的 visit_sequence 數量可直接衡量 repeat dispatch。
- 缺料率：visit_result = pending_parts 可分析哪些品牌、機型、問題描述容易缺料。
- 客戶不在率：customer_not_home / no_show 可用來優化預約提醒與時段策略。
- pending quote 比率：pending_quote 可用於分析需報價案件類型與報價等待時間。
- 哪些品牌 / 類型容易多次派工：可用 brand、productType、modelNo、problemDescription 與 visit_result 交叉分析。
- 哪些工程師一次完修率較高：可用 engineer_id、region、visit_result、actual duration 觀察。
- 哪些零件應先備料：pending_parts 與 parts_used 可共同回饋備料建議。
- 哪些派工結果會影響對帳規則：no_show、pending_parts、company-side missing parts、pending_quote、unable_to_repair 等可影響 engineer payout、vendor claim 或 internal cost。

AI 可協助生成營運建議、異常偵測、備料提醒與規則草稿，但不應直接決定正式工作流狀態、帳務金額或結算金額。

## 9. Settlement / Reconciliation Impact

多次派工的費用與請款邏輯應由未來 settlement rule engine 判斷。一張報修單雖然只有一份最終報告，但可能有多次派工，每次派工都可能影響工程師費用、空趟費、缺料責任、廠商請款、二次到府是否可計費。

可能規則例子：

- 每次派工是否都可計費。
- 是否只有最終 completed visit 可計費。
- 缺料造成的 failed visit 是否可計費。
- customer no-show visit 是否產生費用。
- follow-up visit 是否可產生另一筆 engineer payout。
- 因前次維修失敗造成的 repeat visit 是否排除 vendor claim。
- pending quote visit 是否只算 inspection-only。
- 公司端缺料造成的 second visit 是否只能列 internal cost。

Future settlement rule engine 應能評估：

- case_id
- appointment_id / dispatch_order_id
- visit_sequence
- visit_result
- incomplete_reason
- next_action
- parts_used
- final case completion status

BillingService 應保留為共同帳務 workflow layer，負責建立與維護 case-level billing record、billing status、基本金額與流程狀態。

VendorSettlementPolicy / SettlementRuleEngine 應負責 vendor/brand-specific multi-dispatch billing and settlement logic，例如是否可請款、是否可結算工程師費用、是否列入內部成本、是否排除 vendor claim。

AI 未來可協助草擬規則、標記異常多次派工結算案件、提示可能需要主管審核的費用，但 AI 不應直接決定 official payable amounts，也不應繞過 BillingService 與審核流程。

## Billing Items / Surcharges / Onsite Add-ons Future Note

未來金額計算、對帳與結算不應只依賴 `billing_records` 的固定欄位。搬運 / 爬樓層費、偏遠地區 / 路線加價、現場加購與額外施工，都可能成為客戶收費、廠商請款、工程師績效、工程師給付或公司內部成本的一部分。

本節只記錄 future design note，不代表現階段要立即新增 `billing_items` 或修改現有 billing schema。

### 1. Billing item 明細化

未來不要把所有金額都硬寫在 `billing_records` 固定欄位裡。

`billing_records` 可保留為 case-level billing summary，但應評估新增 `billing_items` 或 `charge_items` 作為明細層，用來記錄：

- 基本工資
- 零件費
- 交通費
- 樓層費
- 偏遠地區費
- 路線加價
- 現場加購
- 額外施工
- 折扣
- 調整
- 保固吸收
- 內部成本

未來可能資料模型：

```text
billing_items
- id
- billing_record_id
- case_id
- appointment_id nullable
- service_report_id nullable
- item_type
- item_code
- item_name
- quantity
- unit_price
- amount
- payer_type
- settlement_target_type
- settlement_rule_code
- note
- created_by
- created_at
```

`item_type` 可包含：

- labor
- parts
- transport
- stair_fee
- remote_area_fee
- route_surcharge
- onsite_addon
- installation_extra
- discount
- adjustment
- warranty
- internal_cost

### 2. Stair / floor carrying fee

搬運 / 爬樓層費未來應作為可配置計費項目，而不是寫死在程式裡。

可能規則：

- 無電梯幾樓以上加收。
- 每樓固定金額。
- 大型商品搬運另計。
- 是否向客戶收費。
- 是否給付工程師。
- 是否可向廠商請款。
- 是否列為內部成本。

可能欄位：

- floor_count
- has_elevator
- item_type = stair_fee
- amount
- payer_type
- settlement_target_type

### 3. Remote area / route surcharge

偏遠地區、路線、跨區、特殊時段等費用也應做成可配置規則。

可能規則：

- 偏遠地區加收固定交通費。
- 跨區加價。
- 特定鄉鎮區域加價。
- 夜間 / 假日 / 特殊時段加價。
- 是否給付工程師。
- 是否向客戶收取。
- 是否可向廠商請款。

可能欄位：

- service_region
- city
- district
- distance_km
- route_zone
- item_type = remote_area_fee / route_surcharge
- amount
- payer_type
- settlement_target_type

### 4. Onsite add-ons / extra construction

工程師到府時，客戶可能現場加購商品或施工服務，例如：

- 壁掛施工
- 支架
- 額外安裝
- 管線加長
- 額外清洗
- 額外施工
- 其他現場加購商品

這些不應只寫在 note 裡，未來應可作為 `billing_items` 明細，並保留客戶確認與工程師紀錄。

可能欄位：

- item_type = onsite_addon / installation_extra
- item_name
- quantity
- unit_price
- amount
- customer_approved
- engineer_id
- appointment_id nullable
- service_report_id nullable

### 5. Settlement rule engine integration

這些 `billing_items` 未來應由 settlement rule engine / vendor settlement policy 判斷：

- 是否可向客戶收費。
- 是否可向廠商請款。
- 是否可列入工程師績效。
- 是否可給付工程師。
- 是否列為公司內部成本。
- 是否需要主管審核。
- 是否需要客戶簽名或照片佐證。

設計原則：

- BillingService 保持共同帳務 workflow。
- VendorSettlementPolicy / SettlementRuleEngine 處理品牌、廠商、工程師、加價項目的規則。
- AI 未來可協助草擬規則、檢查異常、提示缺少佐證資料。
- AI 不得直接決定正式 payable amount。
- 所有正式金額仍需由規則引擎與人工審核控管。

### 6. Multi-dispatch relation

這些費用可能與多次派工有關。

例如：

- 第一次到府客戶不在，是否收空趟費。
- 第二次到府因公司缺料，是否列內部成本。
- 偏遠地區多次到府是否每次都計交通費。
- 樓層搬運費是否只收一次。
- 額外施工是否歸屬於某一次 appointment。
- 工程師與小幫手是否都可計入費用或績效。

因此 `billing_items` 未來應可選擇關聯：

- case_id
- appointment_id / dispatch_order_id
- service_report_id

## Future Extension Notes / 未來擴充備註

以下項目目前都屬於 future extension，不應立即實作。現階段只需要避免資料模型與流程被寫死，讓未來可以逐步擴充。

### 1. Multi-staff Dispatch / 多人派工

目前派工通常是一位主要工程師，但未來部分案件可能需要第二位人員或小幫手。

未來可擴充的派工人員角色包含：

- primary engineer / 主工程師
- helper / 小幫手
- assistant / 協助人員
- trainee / 學習人員
- supervisor / 主管支援

未來資料模型可評估新增 `appointment_staff` 或 `dispatch_order_staff` 延伸表。

可能欄位：

- appointment_id 或 dispatch_order_id
- user_id
- staff_role
- is_primary
- assigned_at
- note

設計原則：

- 不要把 appointment 永久寫死成只能有一位工程師。
- 現階段可以保留 assigned_engineer_id 作為主要工程師。
- 未來多人派工應以延伸表處理，避免破壞既有 appointment / dispatch foundation。

### 2. Engineer Performance & Settlement Link / 工程師績效與結算連動

未來工程師績效計算應與多次派工、完工結果、對帳 / 結算規則連動。

可分析指標：

- 完成件數
- 一次完修率
- 二次派工率
- 平均處理時間
- 準時率
- 客戶不在率
- 缺料率
- 客訴率
- 主工程師與小幫手參與案件數
- 可結算服務費
- 不可結算服務費
- 空趟費
- 二次到府是否給付

設計原則：

- 工程師績效不應只看完成件數。
- 是否給付工程師費用、是否計入績效，未來應由 settlement rule engine / engineer performance policy 判斷。
- 不要把工程師績效規則寫死在 Field Service Report 或 Appointment 裡。
- AI 未來可協助找出異常績效與可疑結算項目，但不能直接決定正式 payable amount。

### 3. AI-assisted Filtering / AI 輔助篩選

除了固定欄位篩選，未來後台可增加 AI 篩選欄位，讓使用者用自然語言查詢。

範例：

- 找出最近可能會客訴的案件
- 找出缺料後還沒安排第二次到府的案件
- 找出工程師處理時間異常偏長的案件
- 找出需要主管注意的對帳項目
- 找出今天下午中和附近可以順路排的案件

設計原則：

- 第一階段 AI 只產生建議 filter，不直接改資料。
- AI 解析自然語言後，應轉成可檢查的 structured filter。
- 使用者確認後，系統才執行查詢。
- AI filter 應受權限與 organization scope 控制，不能查到使用者無權限的資料。

### 4. Recurring Schedule / 固定排程

未來可能支援固定排程或週期性服務，例如：

- 定期保養
- 固定巡檢
- 合約客戶週期服務
- 每月固定到府
- 固定區域排程
- 固定工程師值班

未來可評估資料模型：

- recurring_schedules
- schedule_templates
- maintenance_contracts
- generated_appointments

設計原則：

- 現階段 appointment 可維持單次派工 foundation。
- 不要把 appointment 設計死成只能由單一報修即時產生。
- 未來 recurring schedule 應產生 appointments，但仍需保留人工確認與例外調整能力。

### 5. Export & Report Form / 匯出與報表表單

未來後台需要資料匯出與正式報表表單。

匯出類型可能包含：

- CSV 匯出
- Excel 匯出
- 案件報表
- 派工報表
- 工程師績效報表
- 對帳報表
- 廠商 / 品牌請款表
- 服務報告 PDF
- 客戶可見報告
- 主管統計報表

設計原則：

- CSV / Excel 主要用於內部分析、對帳與營運管理。
- PDF / report form 主要用於客戶、廠商、主管留存。
- 匯出功能必須遵守權限與 organization scope。
- 匯出內容應避免包含 password、token、secret、內部敏感資料。
- 未來可依角色提供不同匯出模板。

這些項目目前都屬於 future extension，不應立即實作。現階段只需要避免資料模型與流程被寫死，讓未來可以逐步擴充。

## Future Operations & Risk Control Extensions / 未來營運與風險控管擴充

以下項目是未來營運成熟後可逐步加入的風險控管與作業強化方向。這些內容目前只作為 future design note，不代表現階段要新增 migration、API、UI 或自動化行為。

### 1. SLA / Service Timeliness / 服務時效與逾期提醒

未來平台應能追蹤案件、派工、待料、報價、回訪與客訴處理的時效，協助客服、派工助理與主管提早發現風險。

可能追蹤情境：

- 客戶已建立案件但尚未聯繫。
- 已取得客戶可配合時段但尚未派工。
- 已派工但客戶尚未確認。
- 第一次到府 pending_parts 後，超過指定天數未安排下一次 appointment。
- pending_quote 後，客戶尚未確認報價。
- 客訴案件超過指定時間未處理。
- 完工後尚未回訪。
- LINE 綁定邀請尚未完成。

未來可能欄位：

- response_due_at
- dispatch_due_at
- visit_due_at
- follow_up_due_at
- quote_due_at
- parts_due_at
- sla_status
- sla_breach_at
- escalation_level
- escalation_reason
- assigned_owner_id

設計原則：

- SLA 不應只是一個單一欄位，而應能依案件類型、品牌、廠商、客戶等級、保固狀態設定不同規則。
- AI 可協助提醒高風險逾期案件，但不應自動關閉或改變正式案件狀態。
- 主管 Dashboard 應能看到即將逾期與已逾期案件。

### 2. Customer Approval Records / 客戶費用同意紀錄

未來平台需要保留客戶對費用、加價、報價、現場加購、額外施工的同意紀錄，避免日後客訴或對帳爭議。

適用情境：

- 樓層費 / 搬運費。
- 偏遠地區費。
- 路線加價。
- 壁掛施工。
- 支架、管線、額外安裝。
- 現場加購商品。
- 高金額維修報價。
- 保固外費用。
- 客戶同意二次到府費用。

未來可能資料模型：

```text
customer_approval_records
- id
- organization_id
- case_id
- appointment_id nullable
- service_report_id nullable
- billing_item_id nullable
- quote_id nullable
- approval_type
- approval_status
- approved_amount
- approval_channel
- approved_by_customer
- approved_at
- evidence_attachment_id nullable
- created_by
- created_at
- note
```

`approval_channel` 可包含：

- phone
- line
- sms
- onsite_signature
- admin_manual
- email

設計原則：

- 費用同意不能只寫在 note。
- 重要費用應可追溯同意來源、同意時間與佐證。
- LINE 未來可支援客戶確認報價或費用。
- AI 可提醒缺少同意紀錄，但不能替客戶同意。

### 3. Parts Reservation / Vehicle Stock / Pending Parts Tracking / 料件預留與待料追蹤

未來平台應支援料件準備與待料管理，降低二次派工與缺料率。

適用情境：

- AI 或客服判斷此案件可能需要特定零件。
- 派工前確認工程師車上是否有料。
- 倉庫是否有庫存。
- 是否已預留給某一個 case。
- 料件到貨後自動提醒安排下一次 appointment。
- 第一次到府 pending_parts 後，需要追蹤料件 ETA。

未來可能資料模型：

```text
required_parts_estimates
- id
- case_id
- appointment_id nullable
- part_name
- part_code
- quantity
- confidence_score
- source
- created_at

parts_reservations
- id
- case_id
- appointment_id nullable
- part_id
- quantity
- reservation_status
- reserved_by
- reserved_at
- released_at

engineer_vehicle_stock
- engineer_id
- part_id
- quantity
- updated_at

pending_parts_tracking
- case_id
- appointment_id
- part_id
- status
- eta
- supplier_note
- next_action
```

設計原則：

- 料件資料會影響一次完修率、派工建議、工程師效率與對帳。
- AI 可根據歷史案件建議可能需要的料件。
- 正式庫存、預留與成本仍需由 deterministic inventory / billing logic 控管。

### 4. Quote Approval / 報價流程

未來 pending_quote 不應只是一個文字狀態，應可形成正式報價流程。

建議流程：

```text
工程師或客服建立 quote draft
→ 主管或客服確認
→ 客戶透過 LINE / 電話 / SMS / 現場簽名確認
→ 客戶同意後安排下一次 appointment 或繼續施工
→ 客戶拒絕則記錄原因並決定結案、取消或其他處理
```

未來可能資料模型：

```text
quotes
- id
- organization_id
- case_id
- appointment_id nullable
- quote_no
- quote_status
- total_amount
- customer_approved_at
- approval_channel
- expires_at
- created_by
- created_at
- note

quote_items
- id
- quote_id
- item_type
- item_name
- quantity
- unit_price
- amount
- note
```

`quote_status` 可包含：

- draft
- pending_review
- pending_customer
- approved
- rejected
- expired
- cancelled

設計原則：

- pending_quote 案件不應直接 completed。
- 報價金額應可與 billing_items / settlement rules 銜接。
- AI 可協助產生報價說明、檢查缺少照片或序號，但不能自動核准正式報價。

### 5. Customer Feedback / Quality Follow-up / 客戶回訪與品質追蹤

未來完工後應可進行品質回訪與滿意度追蹤。

適用情境：

- 完工後 LINE 發送滿意度問卷。
- 客戶低分自動提醒主管。
- 客戶留言不滿，AI 協助摘要客訴原因。
- 重複維修或二次派工案件需要主管回訪。
- 品牌或廠商需要服務品質報表。

未來可能資料模型：

```text
customer_feedback
- id
- organization_id
- case_id
- appointment_id nullable
- rating
- feedback_text
- complaint_flag
- callback_required
- callback_status
- resolved_at
- created_at
```

設計原則：

- 客戶回饋不應混在 service report internal note。
- 客訴風險應能被主管 Dashboard 看見。
- AI 可協助摘要回饋、判斷客訴風險，但不能自動關閉客訴。

### 6. Case Type Checklist / 現場檢核表

未來工程師完工流程應盡量簡單，但可以依案件類型提供少量必要 checklist，避免漏資料。

範例：

冷氣維修：

- 是否測試冷房。
- 是否拍故障照片。
- 是否記錄更換零件。
- 是否確認排水。
- 是否客戶確認。

安裝：

- 是否拍安裝前照片。
- 是否拍安裝後照片。
- 是否確認固定。
- 是否測試運轉。
- 是否簽名。

客戶不在：

- 是否有到場證明。
- 是否有聯絡紀錄。
- 是否需重新安排。

未來可能資料模型：

```text
checklist_templates
- id
- organization_id
- case_type
- product_type
- template_name
- status

checklist_items
- id
- template_id
- item_key
- label
- required
- sort_order

appointment_checklist_results
- id
- appointment_id
- checklist_item_id
- value
- completed_by
- completed_at
```

設計原則：

- Checklist 應短而必要，不要增加工程師負擔。
- AI 可根據工程師輸入提醒缺漏，例如「提到更換零件，但未上傳零件照片」。
- 不同 case_type 可有不同 checklist，但 field service report 仍維持一案一份正式彙總報告。

### 7. Exception Review / 主管審核與例外處理

未來平台應支援需要主管審核的例外案件。

適用情境：

- 高金額報價。
- 重複維修。
- 客訴案件。
- 無法維修。
- 工程師回報異常。
- 對帳金額異常。
- 客戶不同意費用。
- 二次派工原因不明。
- 缺少照片、簽名、零件序號。

未來可能資料模型：

```text
case_reviews
- id
- organization_id
- case_id
- appointment_id nullable
- review_type
- review_reason
- review_status
- requested_by
- reviewed_by
- reviewed_at
- decision
- note
```

`review_status` 可包含：

- pending
- approved
- rejected
- needs_more_info
- resolved

設計原則：

- 例外流程必須可 audit。
- AI 可協助標記需要審核的案件，但不能自動通過主管審核。
- 審核結果可能影響 workflow、billing、settlement、customer communication。

### 8. Role-specific Dashboards / 角色專用 Dashboard

未來 Dashboard 應依角色提供不同重點。

客服 Dashboard：

- 待聯絡案件。
- 待補資料。
- 客戶未確認。
- LINE 未綁定。
- 即將逾期案件。

派工 Dashboard：

- 待排程。
- 待二次派工。
- 待料。
- 路線未確認。
- 客戶未確認 appointment。

工程師 Dashboard：

- 今日行程。
- 下一站。
- 待完工回報。
- 缺漏提醒。
- 需要補照片 / 簽名。

主管 Dashboard：

- 逾期案件。
- 客訴風險。
- 二次派工率。
- 工程師異常。
- 高金額報價。
- 需要審核案件。

財務 Dashboard：

- 待對帳。
- 缺佐證。
- 金額異常。
- 廠商規則待確認。
- 可請款 / 不可請款案件。

設計原則：

- Dashboard 應遵守 role permission 與 organization scope。
- 不同角色不應看到不必要或未授權資料。
- AI 可協助風險排序與摘要，但不能繞過權限。

### 9. LINE Self-service Case Inquiry / LINE 客戶自助查詢

未來當既有案件完成 LINE 綁定後，客戶應能透過 LINE 自助查詢與互動。

可能功能：

- 查詢目前案件進度。
- 查看預約時間。
- 確認預約。
- 回覆不方便，需要重新安排。
- 上傳補充照片。
- 確認報價。
- 查看完工摘要。
- 填寫滿意度回饋。

設計原則：

- 客戶可見資料必須簡化。
- 不得暴露 internal note、audit log、billing internal data、工程師內部紀錄、AI raw payload。
- LINE inquiry 必須遵守 organization_id + line_channel_id + line_user_id scope。
- 已綁定 LINE 的客戶可優先使用 LINE 通知；未綁定則使用 SMS / phone / other channel。

### 10. AI Risk Radar / AI 風險雷達

未來 AI 可協助客服、派工、主管、財務提前發現風險。

可能偵測項目：

- 可能客訴。
- 可能二次派工。
- 可能缺料。
- 可能逾期。
- 可能對帳異常。
- 可能需要主管審核。
- 可能缺少照片、簽名、序號。
- pending_parts 太久未安排下一次 appointment。
- 現場加購但缺少客戶確認紀錄。
- 高金額報價但未審核。
- LINE 未綁定但客戶多次查詢。

設計原則：

- AI 只提供 risk flag / suggestion / explanation。
- AI 不直接改案件狀態。
- AI 不直接決定金額。
- AI 不直接通過審核。
- AI 不直接發送敏感通知。
- 風險提示應可被人工確認、忽略或標記為已處理。
- 風險提示與人工處理結果可作為未來 AI feedback learning 資料。

這些功能目前都屬於 future design，不應立即實作。現階段只需要避免資料模型與流程被寫死，讓未來可以依照營運成熟度逐步加入。

優先順序建議：

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

## 11. Validation

本文件任務完成後應執行：

```bash
npm run check
```

若本次任務有修改 admin/src，才需要另外執行：

```bash
npm run admin:check
```

本設計任務不新增 smoke test，不修改 backend src，不修改 admin/src，不新增 migration，不修改 API 行為，不修改 README。
