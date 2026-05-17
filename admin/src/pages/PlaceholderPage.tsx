export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <section className="page-hero">
      <p className="eyebrow">Coming Soon</p>
      <h2>{title}</h2>
      <p>{description || '此功能頁已保留路由與選單位置，後續任務會依照後端 API 逐步接上實際管理功能。'}</p>
      <p>此功能將於後續任務接 API。</p>
    </section>
  );
}
