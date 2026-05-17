export type MenuItem = {
  key: string;
  label: string;
  path: string;
  description: string;
  disabled?: boolean;
  requiredPermissions?: string[];
  requiredRoles?: string[];
};

export const adminMenuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    description: '營運總覽與目前登入狀態。'
  },
  {
    key: 'users',
    label: '使用者管理',
    path: '/users',
    description: '後續將接入後台使用者、角色與停用管理。',
    requiredPermissions: ['users.read']
  },
  {
    key: 'organizations',
    label: '組織管理',
    path: '/organizations',
    description: '後續將接入 organization master data 與 membership 管理。',
    requiredPermissions: ['organizations.read']
  },
  {
    key: 'dispatch-units',
    label: '派工單位管理',
    path: '/dispatch-units',
    description: '後續將接入派工單位清單、區域與啟用狀態管理。',
    requiredPermissions: ['dispatch_units.manage']
  },
  {
    key: 'cases',
    label: '案件管理',
    path: '/cases',
    description: '後續將接入案件列表、詳情與 workflow 操作。',
    requiredPermissions: ['cases.read']
  },
  {
    key: 'customers',
    label: '客戶管理',
    path: '/customers',
    description: '管理客戶基本資料、聯絡資訊、LINE 身分與案件歷史。',
    requiredPermissions: ['customers.read']
  },
  {
    key: 'dispatch-appointments',
    label: '派工 / 預約',
    path: '/dispatch-appointments',
    description: '後續將接入派工與預約時段管理。',
    requiredPermissions: ['dispatch.manage', 'appointments.manage']
  },
  {
    key: 'field-service',
    label: '到府服務紀錄',
    path: '/field-service',
    description: '後續將接入到府服務報告與零件紀錄。',
    requiredPermissions: ['service_reports.manage']
  },
  {
    key: 'billing-settlement',
    label: '帳務 / 結算',
    path: '/billing-settlement',
    description: '後續將接入帳務摘要、請款與結算紀錄。',
    requiredPermissions: ['billing.manage']
  },
  {
    key: 'customer-inquiries',
    label: '客戶詢問',
    path: '/customer-inquiries',
    description: '後續將接入客戶查詢與補件提示檢視。Phase 1 暫以 cases.read 作為可見權限。',
    requiredPermissions: ['cases.read']
  },
  {
    key: 'line-channels',
    label: 'LINE Channel 管理',
    path: '/line-channels',
    description: '查看 LINE channelCode 與安全設定摘要，不顯示 channel secret 或 access token。',
    requiredPermissions: ['line.read']
  },
  {
    key: 'ai-jobs',
    label: 'AI 任務',
    path: '/ai-jobs',
    description: '後續將接入 AI/OCR job 查詢與結果檢視。',
    requiredPermissions: ['ai.read']
  },
  {
    key: 'audit-logs',
    label: 'Audit Logs',
    path: '/audit-logs',
    description: '後續將接入稽核事件查詢。',
    requiredPermissions: ['audit_logs.read']
  },
  {
    key: 'notifications',
    label: '通知設定',
    path: '/notifications',
    description: '後續將接入通知模板、偏好與發送紀錄。',
    requiredPermissions: ['notifications.read']
  },
  {
    key: 'settings',
    label: '系統設定',
    path: '/settings',
    description: '後續將接入系統層級設定。第一版限定 admin/system role 可見。',
    requiredRoles: ['admin', 'system']
  }
];
