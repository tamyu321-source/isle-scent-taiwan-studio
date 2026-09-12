import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { PortfolioFooter } from "@/components/portfolio-footer";
import { PortfolioHeader } from "@/components/portfolio-header";

export const dynamic = "force-static";

type SystemProject = {
  index: string;
  title: string;
  type: string;
  year: string;
  className: string;
  description: string;
  tags: string[];
  words: string[];
  image?: string;
  href?: string;
};

const systemProjects: SystemProject[] = [
  {
    index: "02",
    title: "豬仔仔幼兒園",
    type: "Pet Boarding Web App",
    year: "2026",
    className: "portfolio-project-piglet",
    description: "活潑的狗狗貓貓寄宿前台，串聯可操作的預約、客戶、費用、相簿、方案與留言管理後台。",
    tags: ["BRAND WEB", "ADMIN SYSTEM", "LOCAL DATA"],
    words: ["PLAY", "STAY", "MANAGE"],
    image: "/images/daycare-cheese-closeup.webp",
    href: "/piglet-daycare/",
  },
  {
    index: "03",
    title: "Order Flow",
    type: "Order Operations Platform",
    year: "2026",
    className: "portfolio-project-order",
    description: "從專屬下單連結到訂貨、到貨、庫存與出貨，把原本散落在 Excel 和訊息裡的訂單工作串成同一條流程。",
    tags: ["ORDER LINK", "OPERATIONS", "FULFILLMENT"],
    words: ["LINK", "ORDER", "SHIP"],
    href: "/order-hub/",
  },
  {
    index: "04",
    title: "Ledger Flow",
    type: "Desktop Finance System",
    year: "2026",
    className: "portfolio-project-ledger",
    description: "把多頁籤、申報表、憑證與列印流程，收斂成一致而可長期維護的桌面產品體驗。",
    tags: ["PRODUCT UI", "ELECTRON", "DESIGN SYSTEM"],
    words: ["CLEAR", "STABLE", "SCALABLE"],
    href: "/work/ledger-flow/",
  },
  {
    index: "05",
    title: "Signal Desk",
    type: "Risk-first Trading Automation",
    year: "2026",
    className: "portfolio-project-signal",
    description: "讓線上狀態、資產辨識、交易前驗證與重試紀錄都能被清楚看見的自動化工作台。",
    tags: ["AUTOMATION", "RISK GUARD", "OBSERVABILITY"],
    words: ["CHECK", "DECIDE", "TRACE"],
    href: "/work/signal-desk/",
  },
  {
    index: "06",
    title: "Tax Flow",
    type: "Browser Workflow Automation",
    year: "2026",
    className: "portfolio-project-tax",
    description: "處理多分頁生命週期、低規格環境與人工確認節點，讓複雜申報流程可靠交棒。",
    tags: ["RPA", "BROWSER LIFECYCLE", "SAFE HANDOFF"],
    words: ["PREPARE", "VERIFY", "HAND OFF"],
    href: "/work/tax-flow/",
  },
];

function SystemProjectVisual({ project, basePath }: { project: SystemProject; basePath: string }) {
  const content = <>
    {project.image && <Image src={`${basePath}${project.image}`} alt="" fill className="portfolio-system-image object-cover" sizes="(max-width: 900px) 100vw, 55vw" />}
    <div className="portfolio-system-rail"><i /><i /><i /></div>
    <div className="portfolio-system-words">
      {project.words.map((word, index) => <span key={word}><b>0{index + 1}</b>{word}</span>)}
    </div>
    <div className="portfolio-system-status"><span>ACTIVE SYSTEM</span><span>●</span></div>
    <span className="portfolio-visual-enter">OPEN WORK <ArrowUpRight size={16} /></span>
  </>;
  return <a className="portfolio-system-visual" href={`${basePath}${project.href}`} aria-label={`開啟 ${project.title} 作品`}>{content}</a>;
}

export default function Home() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <main id="top" className="portfolio-root overflow-clip bg-[#f1eee6] text-[#151515]">
      <PortfolioHeader />

      <section className="portfolio-hero" aria-labelledby="portfolio-title">
        <div className="portfolio-grid" aria-hidden="true" />
        <div className="portfolio-orbit" aria-hidden="true"><span>AVAILABLE FOR SELECTED PROJECTS · TAIWAN · </span></div>
        <div className="portfolio-hero-meta">
          <p>CREATIVE DEVELOPER</p>
          <p>FRONT-END / SYSTEMS / AUTOMATION</p>
        </div>
        <h1 id="portfolio-title" className="portfolio-wordmark" aria-label="Yorke Hsu">
          <span>YORKE</span><span>HSU</span>
        </h1>
        <div className="portfolio-hero-bottom">
          <p className="portfolio-hero-statement">把複雜的系統，做成<br />清楚、好用、會被記住的體驗。</p>
          <a href="#work" className="portfolio-round-link" aria-label="前往精選作品">
            <span>SELECTED<br />WORK</span><ArrowDown size={22} strokeWidth={1.5} />
          </a>
        </div>
      </section>

      <section id="work" className="portfolio-work" aria-labelledby="work-title">
        <div className="portfolio-section-heading">
          <p className="portfolio-label">01—06 / SELECTED WORK</p>
          <h2 id="work-title">作品不只被觀看。<br />它也必須能運作。</h2>
          <p>品牌體驗、產品介面與自動化系統。以下包含概念作品與經過匿名化的實務專案。</p>
        </div>

        <article className="portfolio-featured">
          <a className="portfolio-featured-visual" href={`${basePath}/collections/o-01/`} aria-label="直接進入 Isle / Scent 品牌網站">
            <Image
              src={`${basePath}/images/coast-bottle.webp`}
              alt="Isle / Scent O-01 香氛網站主視覺"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 900px) 100vw, 62vw"
            />
            <div className="portfolio-featured-shade" aria-hidden="true" />
            <span className="portfolio-featured-number">01</span>
            <span className="portfolio-featured-open">ENTER SITE <ArrowUpRight size={17} /></span>
          </a>
          <div className="portfolio-featured-copy">
            <div className="portfolio-project-meta"><span>BRAND EXPERIENCE</span><span>2026</span></div>
            <h3>Isle / Scent</h3>
            <p>從品牌概念、視覺語言到 11 頁響應式網站，以電影式多場景時間軸，讓台灣島嶼香氣成為可感受的數位體驗。</p>
            <div className="portfolio-tag-row"><span>ART DIRECTION</span><span>INTERACTIVE FRONT-END</span><span>DEPLOYMENT</span></div>
            <div className="portfolio-link-row"><a className="portfolio-text-link" href={`${basePath}/collections/o-01/`}>直接進入網站 <ArrowUpRight size={18} /></a><a className="portfolio-case-note-link" href={`${basePath}/work/isle-scent/`}>閱讀案例說明</a></div>
          </div>
        </article>

        <div className="portfolio-project-list">
          {systemProjects.map((project) => (
            <article className={`portfolio-system-project ${project.className}`} key={project.index}>
              <div className="portfolio-system-copy">
                <div className="portfolio-project-meta"><span>{project.index} / {project.type}</span><span>{project.year}</span></div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="portfolio-tag-row">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                {project.href && <a className="portfolio-text-link" href={`${basePath}${project.href}`}>進入完整作品 <ArrowUpRight size={18} /></a>}
              </div>
              <SystemProjectVisual project={project} basePath={basePath} />
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="portfolio-about" aria-labelledby="about-title">
        <div>
          <p className="portfolio-label">ABOUT / APPROACH</p>
          <h2 id="about-title">設計感，<br />不該犧牲可靠性。</h2>
        </div>
        <div className="portfolio-about-copy">
          <p>我在互動前端、產品系統與流程自動化之間工作。喜歡先理解真實操作，再用清楚的資訊層級、恰到好處的動態與可維護的程式，把複雜度留在畫面背後。</p>
          <p>從第一個視覺瞬間，到例外狀態、手機體驗與正式部署，都視為同一件作品的一部分。</p>
        </div>
        <ol className="portfolio-capabilities">
          <li><span>01</span><strong>Interactive Front-end</strong><small>動態敘事、RWD、設計落地</small></li>
          <li><span>02</span><strong>Product Systems</strong><small>複雜介面、桌面應用、設計系統</small></li>
          <li><span>03</span><strong>Workflow Automation</strong><small>RPA、風險防護、可觀測流程</small></li>
          <li><span>04</span><strong>Launch &amp; Handoff</strong><small>建置、部署、維護與交付</small></li>
        </ol>
      </section>

      <section id="contact" className="portfolio-contact" aria-labelledby="contact-title">
        <p className="portfolio-label">HAVE A PROJECT IN MIND?</p>
        <h2 id="contact-title">LET&apos;S MAKE<br /><em>IT WORK.</em></h2>
        <div className="portfolio-contact-bottom">
          <p>適合品牌網站、互動前端、產品介面與自動化專案。<br />Taiwan · Available remotely</p>
          <div className="portfolio-contact-actions">
            <Image src={`${basePath}/images/line-contact-qr.png`} alt="加入 Yorke Hsu LINE 的 QR Code" width={128} height={128} />
            <div><a href="https://line.me/ti/p/um2wrmZxsN" target="_blank" rel="noreferrer">ADD LINE <ArrowUpRight size={18} /></a><a href="mailto:tamyu321@gmail.com">tamyu321@gmail.com <ArrowUpRight size={18} /></a><a href="https://github.com/tamyu321-source" target="_blank" rel="noreferrer">VIEW GITHUB <ArrowUpRight size={18} /></a></div>
          </div>
        </div>
      </section>

      <PortfolioFooter />
    </main>
  );
}
