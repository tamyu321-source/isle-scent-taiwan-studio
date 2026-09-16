"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
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
  admin?: string;
  extra?: { href: string; label: string };
};

const projects: Project[] = [
  {
    anchor: "project-10",
    title: "ClassNest 課伴",
    subtitle: "多老師選課 · 家庭學習計畫",
    type: "EDUCATION & BOOKING",
    image: "work-classnest-preview.jpg",
    href: "/classnest/",
    admin: "/classnest/admin/",
    extra: { href: "/classnest/teacher/", label: "老師端" },
    description:
      "跨老師安排一對一與團體課，連續週次預約、限時保留名額與堂數帳本，串起家長選課、老師點名和教務管理。",
    tags: ["交易與狀態管理", "多角色預約", "堂數帳本"],
  },
  {
    anchor: "project-09",
    title: "VECTOR",
    subtitle: "3D 感知標註 · 資料生產工作台",
    type: "3D PERCEPTION & DATA TOOLS",
    image: "work-vector-preview.jpg",
    href: "/vector/",
    description:
      "旋轉點雲場景、拖曳與框選物件，完成 3D 邊界框標註。串連任務排序、品質覆核與分析，以可實際操作的合成資料，展示 React、TypeScript 與 Three.js 的整合。",
    tags: ["Three.js / WebGL", "3D 標註", "資料生產平台"],
  },
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
  const [category, setCategory] = useState("全部");
  const categoryFor = (project: Project) =>
    ["project-01", "project-05"].includes(project.anchor)
      ? "品牌網站"
      : ["project-07", "project-08", "project-09"].includes(project.anchor)
        ? "自動化工具"
        : "應用系統";
  useEffect(() => {
    const reveal = () => {
      if (/^#project-/.test(window.location.hash)) {
        setCategory("全部");
        requestAnimationFrame(() =>
          document
            .getElementById(window.location.hash.slice(1))
            ?.scrollIntoView(),
        );
      }
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);

  return (
    <section
      id="work"
      className="portfolio-work portfolio-real-work"
      aria-label="作品集"
    >
      <div className="portfolio-work-heading">
        <div>
          <p>SELECTED WORK / 2026</p>
          <h2>不同題目，同樣專注。</h2>
        </div>
        <span aria-live="polite">
          {
            projects.filter(
              (p) => category === "全部" || categoryFor(p) === category,
            ).length
          }{" "}
          / {projects.length} 件作品
        </span>
      </div>
      <div className="portfolio-work-filters" aria-label="作品分類">
        {["全部", "品牌網站", "應用系統", "自動化工具"].map((value) => (
          <button
            key={value}
            aria-pressed={category === value}
            onClick={() => setCategory(value)}
          >
            {value}
            <span>
              {
                projects.filter(
                  (p) => value === "全部" || categoryFor(p) === value,
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      <div className="portfolio-real-grid">
        {projects.map((project, index) => (
          <article
            key={project.anchor}
            id={project.anchor}
            hidden={category !== "全部" && categoryFor(project) !== category}
            className="portfolio-real-card"
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
              <Image
                unoptimized
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
