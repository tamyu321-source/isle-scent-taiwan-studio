import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { PortfolioFooter } from "@/components/portfolio-footer";
import { PortfolioHeader } from "@/components/portfolio-header";

export const metadata: Metadata = {
  title: "Isle / Scent Case Study",
  description: "Isle / Scent 概念香氛品牌網站：視覺方向、互動前端與電影式 Canvas 動畫。",
};
export const dynamic = "force-static";

export default function IsleScentCaseStudy() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const demoHref = `${basePath}/isle-scent/`;

  return (
    <main id="top" className="portfolio-root portfolio-case-root bg-[#f1eee6] text-[#151515]">
      <PortfolioHeader />

      <section className="portfolio-case-hero">
        <div className="portfolio-case-back"><a href={`${basePath}/#work`}><ArrowLeft size={16} /> BACK TO WORK</a><span>CASE 01 / 2026</span></div>
        <p className="portfolio-case-kicker">BRAND EXPERIENCE · CONCEPT PROJECT</p>
        <h1>ISLE <em>/</em><br />SCENT</h1>
        <div className="portfolio-case-lead">
          <p>讓一座島嶼，<br />被聞見，也被看見。</p>
          <a href={demoHref}>OPEN LIVE EXPERIENCE <ArrowUpRight size={19} /></a>
        </div>
      </section>

      <figure className="portfolio-case-cover">
        <Image src={`${basePath}/images/coast-bottle.webp`} alt="岩岸上的 O-01 深潮香水" fill priority className="object-cover" sizes="100vw" />
        <div aria-hidden="true" />
        <figcaption><span>O-01 / 深潮</span><span>TAIWAN ISLAND LANDSCAPE</span></figcaption>
      </figure>

      <section className="portfolio-case-overview">
        <p className="portfolio-label">01 / OVERVIEW</p>
        <h2>一個從零建立、<br />可以真的走完的品牌世界。</h2>
        <div className="portfolio-case-overview-copy">
          <p>Isle / Scent 是以台灣山海地景為題的概念香氛品牌。我負責品牌方向、內容架構、視覺語言、互動前端與部署，讓它不只是一張漂亮首頁，而是完整的數位體驗。</p>
          <dl>
            <div><dt>SCOPE</dt><dd>Art Direction<br />UX / UI<br />Front-end<br />Deployment</dd></div>
            <div><dt>STACK</dt><dd>React<br />TypeScript<br />Tailwind CSS<br />Canvas 2D</dd></div>
            <div><dt>DELIVERABLE</dt><dd>11 Pages<br />Responsive Web<br />Interactive Film<br />Live Deployment</dd></div>
          </dl>
        </div>
      </section>

      <section className="portfolio-case-film">
        <div className="portfolio-case-film-copy">
          <p className="portfolio-label">02 / INTERACTION</p>
          <h2>不追著滾輪跑，<br />而是在對的時刻開場。</h2>
          <p>動畫進入視窗後自動播放，將海岸、瓶身微距、16 角度產品旋轉與收束主視覺串成四段電影式場景。使用者可以暫停或重播，離開畫面時也會自動節省運算。</p>
          <ul><li>Intersection-aware playback</li><li>10-second cinematic timeline</li><li>Mobile &amp; reduced-motion support</li></ul>
        </div>
        <figure className="portfolio-case-macro">
          <Image src={`${basePath}/images/o01-glass-macro.webp`} alt="O-01 香水玻璃瓶身微距" fill className="object-cover" sizes="(max-width: 900px) 100vw, 55vw" />
        </figure>
      </section>

      <section className="portfolio-case-system">
        <div className="portfolio-case-system-title"><p className="portfolio-label">03 / SYSTEM</p><h2>從主視覺，<br />延伸成 11 個頁面。</h2></div>
        <div className="portfolio-case-page-grid">
          {["HOME / FILM", "COLLECTION", "PRODUCT / O-01", "BRAND STORY", "CRAFT", "INGREDIENTS", "SPACE SCENT", "JOURNAL", "FIELD NOTE", "STOCKISTS", "CONTACT"].map((page, index) => <div key={page}><span>{String(index + 1).padStart(2, "0")}</span><p>{page}</p></div>)}
        </div>
      </section>

      <section className="portfolio-case-outro">
        <p className="portfolio-label">LIVE EXPERIENCE</p>
        <h2>現在，進入深潮。</h2>
        <p>案例說明到這裡；真正的作品，請親自滑進去看。</p>
        <a href={demoHref}>VIEW O-01 EXPERIENCE <ArrowUpRight size={21} /></a>
      </section>

      <PortfolioFooter />
    </main>
  );
}
