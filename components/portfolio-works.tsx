import { ArrowUpRight, LayoutDashboard } from "lucide-react";

type Project = {
  anchor: string;
  title: string;
  subtitle: string;
  type: string;
  image: string;
  href: string;
  description: string;
  tags: string[];
  featured?: boolean;
  admin?: string;
  extra?: { href: string; label: string };
};

const projects: Project[] = [
  {
    anchor: "project-01",
    title: "Isle / Scent",
    subtitle: "島嶼香氣 · 互動品牌網站",
    type: "BRAND EXPERIENCE",
    image: "work-isle-preview.webp",
    href: "/isle-scent/",
    description:
      "以大幅影像與動態敘事，呈現台灣島嶼香氣。從產品細節、品牌故事到聯絡資訊，完整探索香氛品牌。",
    tags: ["動態敘事", "品牌官網", "響應式設計"],
    featured: true,
    extra: { href: "/work/isle-scent/", label: "案例說明" },
  },
  {
    anchor: "project-05",
    title: "PURE WHITE",
    subtitle: "手作希臘優格 · 品牌與產品體驗",
    type: "FOOD & CRAFT BRAND",
    image: "work-pure-white-preview.webp",
    href: "/pure-white/",
    description:
      "從一杯原味，到每一口的細節。以白色、鈷藍與產品特寫，串起手作製程、規格選擇和跟隨捲動的質地展示。",
    tags: ["品牌官網", "產品分鏡", "捲動互動"],
    featured: true,
    extra: { href: "/pure-white/original/", label: "產品詳情" },
  },
  {
    anchor: "project-02",
    title: "豬仔仔幼兒園",
    subtitle: "狗狗貓貓 · 寵物寄宿管理",
    type: "PET BOARDING & ADMIN",
    image: "work-daycare-preview.webp",
    href: "/piglet-daycare/",
    admin: "/piglet-daycare/admin/",
    description:
      "以狗狗貓貓與形象貓「乳酪」迎接訪客。前台的方案、相簿與留言，串連後台預約、客戶和費用紀錄。",
    tags: ["寵物品牌", "預約月曆", "相簿與留言"],
  },
  {
    anchor: "project-03",
    title: "Order Flow",
    subtitle: "從下單連結，到訂貨出貨",
    type: "ORDER OPERATIONS",
    image: "work-order-preview.webp",
    href: "/order-hub/",
    admin: "/order-hub/admin/",
    description:
      "建立專屬下單連結，讓客人自行填單。訂單、採購、到貨、庫存與出貨在同一個管理台串接，減少重複登記。",
    tags: ["專屬下單連結", "庫存管理", "出貨流程"],
  },
  {
    anchor: "project-04",
    title: "MORI 留白陶作",
    subtitle: "莫蘭迪色系 · 會員預約與選物",
    type: "BOOKING & COMMERCE",
    image: "work-mori-preview.webp",
    href: "/mori-studio/",
    admin: "/mori-studio/admin/",
    extra: { href: "/mori-studio/member/", label: "會員空間" },
    description:
      "在溫柔的霧綠與陶土色裡，預約一段手作時光。整合體驗時段、器物購物袋、示範結帳、會員紀錄與管理台。",
    tags: ["會員空間", "體驗預約", "購物與結帳"],
  },
  {
    anchor: "project-06",
    title: "ShareFlow",
    subtitle: "廣告收入 · 合作夥伴分潤台",
    type: "REVENUE SHARING SYSTEM",
    image: "work-shareflow-preview.webp",
    href: "/shareflow/",
    admin: "/shareflow/admin/",
    description:
      "把多個廣告來源、收入調整與合約比例收進同一個後台。合作夥伴可查看營收與結算進度，管理員則能同步資料、調整分潤與管理權限。",
    tags: ["API 收入整合", "自動分潤", "權限管理"],
  },
  {
    anchor: "project-07",
    title: "FIELDWORK",
    subtitle: "商家資料 · Python 自動化工作台",
    type: "PYTHON & DATA AUTOMATION",
    image: "work-fieldwork-preview.webp",
    href: "/fieldwork/",
    description:
      "把臺南與桃園的公開店家資料整理成可用名單。Python 蒐集官方資料與店家網頁，保留來源、比對差異，再依條件查詢並匯出。",
    tags: ["Python 爬蟲", "資料整併", "CSV／JSON 匯出"],
    extra: {
      href: "/downloads/fieldwork-python.zip",
      label: "下載 Python 工具",
    },
  },
  {
    anchor: "project-08",
    title: "CHECKPOINT",
    subtitle: "瀏覽器巡檢 · 操作與證據",
    type: "BROWSER AUTOMATION & QA",
    image: "work-checkpoint-preview.webp",
    href: "/checkpoint/",
    description:
      "讓瀏覽器實際走過導覽、規格選擇與資料下載。逐步核對畫面與結果，留下桌面、手機截圖，再以巡檢結果把關每次發佈。",
    tags: ["瀏覽器自動化", "功能巡檢", "截圖報告"],
    extra: { href: "/downloads/checkpoint-python.zip", label: "下載巡檢工具" },
  },
];

export function PortfolioWorks() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <section
      id="work"
      className="portfolio-work portfolio-real-work"
      aria-label="作品集"
    >
      <div className="portfolio-real-grid">
        {projects.map((project, index) => (
          <article
            key={project.anchor}
            id={project.anchor}
            className={`portfolio-real-card${project.featured ? " portfolio-real-feature" : ""}`}
          >
            <div className="portfolio-real-meta">
              <span className="portfolio-real-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{project.type}</span>
              <span>2026</span>
            </div>
            <a
              className="portfolio-real-preview"
              href={base + project.href}
              aria-label={`進入 ${project.title}`}
            >
              <img
                src={`${base}/images/${project.image}`}
                alt={`${project.title} 網站預覽`}
                width={1264}
                height={712}
                loading="lazy"
              />
              <span>
                網站預覽 <ArrowUpRight size={17} />
              </span>
            </a>
            <div className="portfolio-real-copy">
              <p className="portfolio-real-subtitle">{project.subtitle}</p>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="portfolio-tag-row">
                {project.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="portfolio-work-actions">
                <a
                  className="portfolio-enter-button"
                  href={base + project.href}
                >
                  進入網站 <ArrowUpRight size={18} />
                </a>
                {project.admin && (
                  <a href={base + project.admin}>
                    <LayoutDashboard size={16} /> 查看後台
                  </a>
                )}
                {project.extra && (
                  <a href={base + project.extra.href}>
                    {project.extra.label} ↗
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
