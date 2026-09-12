import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { PortfolioFooter } from "@/components/portfolio-footer";
import { PortfolioHeader } from "@/components/portfolio-header";

export const dynamic = "force-static";

const systemProjects = [
  {
    index: "02",
    title: "Ledger Flow",
    type: "Desktop Finance System",
    year: "2026",
    className: "portfolio-project-ledger",
    description: "把多頁籤、申報表、憑證與列印流程，收斂成一致而可長期維護的桌面產品體驗。",
    tags: ["PRODUCT UI", "ELECTRON", "DESIGN SYSTEM"],
    words: ["CLEAR", "STABLE", "SCALABLE"],
  },
  {
    index: "03",
    title: "Signal Desk",
    type: "Risk-first Trading Automation",
    year: "2026",
    className: "portfolio-project-signal",
    description: "讓線上狀態、資產辨識、交易前驗證與重試紀錄都能被清楚看見的自動化工作台。",
    tags: ["AUTOMATION", "RISK GUARD", "OBSERVABILITY"],
    words: ["CHECK", "DECIDE", "TRACE"],
  },
  {
    index: "04",
    title: "Tax Flow",
    type: "Browser Workflow Automation",
    year: "2026",
    className: "portfolio-project-tax",
    description: "處理多分頁生命週期、低規格環境與人工確認節點，讓複雜申報流程可靠交棒。",
    tags: ["RPA", "BROWSER LIFECYCLE", "SAFE HANDOFF"],
    words: ["PREPARE", "VERIFY", "HAND OFF"],
  },
];

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
          <p className="portfolio-label">01—04 / SELECTED WORK</p>
          <h2 id="work-title">作品不只被觀看。<br />它也必須能運作。</h2>
          <p>品牌體驗、產品介面與自動化系統。以下包含概念作品與經過匿名化的實務專案。</p>
        </div>

        <article className="portfolio-featured">
          <a className="portfolio-featured-visual" href={`${basePath}/work/isle-scent/`} aria-label="查看 Isle / Scent 專案案例">
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
            <span className="portfolio-featured-open">VIEW CASE <ArrowUpRight size={17} /></span>
          </a>
          <div className="portfolio-featured-copy">
            <div className="portfolio-project-meta"><span>BRAND EXPERIENCE</span><span>2026</span></div>
            <h3>Isle / Scent</h3>
            <p>從品牌概念、視覺語言到 11 頁響應式網站，以電影式多場景時間軸，讓台灣島嶼香氣成為可感受的數位體驗。</p>
            <div className="portfolio-tag-row"><span>ART DIRECTION</span><span>INTERACTIVE FRONT-END</span><span>DEPLOYMENT</span></div>
            <a className="portfolio-text-link" href={`${basePath}/work/isle-scent/`}>閱讀完整案例 <ArrowUpRight size={18} /></a>
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
              </div>
              <div className="portfolio-system-visual" aria-hidden="true">
                <div className="portfolio-system-rail"><i /><i /><i /></div>
                <div className="portfolio-system-words">
                  {project.words.map((word, index) => <span key={word}><b>0{index + 1}</b>{word}</span>)}
                </div>
                <div className="portfolio-system-status"><span>ACTIVE SYSTEM</span><span>●</span></div>
              </div>
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
          <a href="https://github.com/tamyu321-source" target="_blank" rel="noreferrer">VIEW GITHUB <ArrowUpRight size={20} /></a>
        </div>
      </section>

      <PortfolioFooter />
    </main>
  );
}
