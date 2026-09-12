import Image from "next/image";
import { PortfolioWorks } from "@/components/portfolio-works";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { PortfolioFooter } from "@/components/portfolio-footer";
import { PortfolioHeader } from "@/components/portfolio-header";

export const dynamic = "force-static";

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

      <PortfolioWorks />

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
