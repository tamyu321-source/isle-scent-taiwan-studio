import { ArrowUpRight, LayoutDashboard } from "lucide-react";

const projects = [
  { number: "01", title: "Isle / Scent", subtitle: "島嶼香氣 · 互動品牌網站", type: "BRAND EXPERIENCE", image: "work-isle-preview.webp", href: "/isle-scent/", description: "以大幅影像與自動播放的動態敘事，呈現台灣島嶼香氣。從產品細節、品牌故事到聯絡資訊，完整探索香氛品牌。", tags: ["動態敘事", "品牌官網", "響應式設計"], extra: "/work/isle-scent/", extraLabel: "案例說明" },
  { number: "02", title: "豬仔仔幼兒園", subtitle: "狗狗貓貓 · 寵物寄宿管理", type: "PET BOARDING & ADMIN", image: "work-daycare-preview.webp", href: "/piglet-daycare/", admin: "/piglet-daycare/admin/", description: "以狗狗貓貓與形象貓「乳酪」迎接訪客。前台的方案、相簿與留言，串連後台預約、客戶和費用紀錄。", tags: ["寵物品牌", "預約月曆", "相簿與留言"] },
  { number: "03", title: "Order Flow", subtitle: "從下單連結，到訂貨出貨", type: "ORDER OPERATIONS", image: "work-order-preview.webp", href: "/order-hub/", admin: "/order-hub/admin/", description: "建立專屬下單連結，讓客人自行填單。訂單、採購、到貨、庫存與出貨在同一個管理台串接，減少重複登記。", tags: ["專屬下單連結", "庫存管理", "出貨流程"] },
  { number: "04", title: "MORI 留白陶作", subtitle: "莫蘭迪色系 · 會員預約與選物", type: "BOOKING & COMMERCE", image: "work-mori-preview.webp", href: "/mori-studio/", admin: "/mori-studio/admin/", extra: "/mori-studio/member/", extraLabel: "會員空間", description: "在溫柔的霧綠與陶土色裡，預約一段手作時光。整合體驗時段、器物購物袋、示範結帳、會員紀錄與管理台。", tags: ["會員空間", "體驗預約", "購物與結帳"] },
  { number: "05", title: "PURE WHITE", subtitle: "純粹，自有厚度 · 手作希臘優格", type: "FOOD & CRAFT BRAND", image: "work-pure-white-preview.webp", href: "/pure-white/", description: "以奶白、鈷藍與細緻的食物影像，描繪一杯手作希臘優格。從原料堅持、慢工製法到日常品嚐提案，感受純粹的厚度。", tags: ["品牌官網", "手作敘事", "響應式設計"] },
];

export function PortfolioWorks() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return <section id="work" className="portfolio-work portfolio-real-work" aria-labelledby="work-title">
    <div className="portfolio-section-heading"><p className="portfolio-label">01—{String(projects.length).padStart(2, "0")} / SELECTED WORK</p><h2 id="work-title">精選作品。<br />一鍵，直接體驗。</h2><p>以下皆為可瀏覽、可互動的概念作品，預覽圖取自實際網站。點擊圖片或「進入網站」即可直達；管理系統為本機資料示範，無真實交易。</p></div>
    <nav className="portfolio-work-index" aria-label="作品快速索引">{projects.map(p => <a href={`#project-${p.number}`} key={p.number}><span>{p.number}</span>{p.title}<ArrowUpRight size={16} /></a>)}</nav>
    <div className="portfolio-real-grid">{projects.map(p => <article className={`portfolio-real-card${p.number === "05" ? " portfolio-real-feature" : ""}`} id={`project-${p.number}`} key={p.number}>
      <div className="portfolio-real-meta"><span className="portfolio-real-number">{p.number}</span><span>{p.type}</span><span>2026</span></div>
      <a className="portfolio-real-preview" href={base + p.href} aria-label={`直接進入 ${p.title} 網站`}><img src={`${base}/images/${p.image}`} alt={`${p.title} 實際網站首頁預覽`} width={1264} height={712} loading="lazy" /><span>實際網站預覽 <ArrowUpRight size={17} /></span></a>
      <div className="portfolio-real-copy"><p className="portfolio-real-subtitle">{p.subtitle}</p><h3>{p.title}</h3><p>{p.description}</p><div className="portfolio-tag-row">{p.tags.map(t => <span key={t}>{t}</span>)}</div><div className="portfolio-work-actions"><a className="portfolio-enter-button" href={base + p.href}>進入網站 <ArrowUpRight size={18} /></a>{p.admin && <a href={base + p.admin}><LayoutDashboard size={16} /> 查看後台</a>}{p.extra && <a href={base + p.extra}>{p.extraLabel} ↗</a>}</div></div>
    </article>)}</div>
  </section>;
}
