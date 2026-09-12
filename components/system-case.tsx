import type { CSSProperties } from "react";
import { ArrowLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { PortfolioFooter } from "@/components/portfolio-footer";
import { PortfolioHeader } from "@/components/portfolio-header";

export type SystemCaseData = {
  index: string;
  title: string;
  eyebrow: string;
  statement: string;
  intro: string;
  accent: string;
  roles: string[];
  stages: { label: string; title: string; body: string }[];
  outcomes: string[];
};

export function SystemCase({ data }: { data: SystemCaseData }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return <main className="portfolio-root portfolio-system-case" style={{ "--case-accent": data.accent } as CSSProperties}>
    <PortfolioHeader />
    <section className="portfolio-system-case-hero">
      <div className="portfolio-case-back"><a href={`${basePath}/#work`}><ArrowLeft size={16} /> BACK TO WORK</a><span>CASE {data.index} / 2026</span></div>
      <p className="portfolio-case-kicker">{data.eyebrow}</p>
      <h1>{data.title}</h1>
      <div className="portfolio-system-case-lead"><p>{data.statement}</p><span>ANONYMIZED<br />PRODUCTION WORK</span></div>
    </section>
    <section className="portfolio-system-case-brief">
      <p className="portfolio-label">01 / THE BRIEF</p>
      <h2>{data.intro}</h2>
      <div>{data.roles.map((role) => <span key={role}>{role}</span>)}</div>
    </section>
    <section className="portfolio-system-case-flow">
      <div><p className="portfolio-label">02 / SYSTEM FLOW</p><h2>把複雜流程，<br />拆成可確認的節點。</h2></div>
      <ol>{data.stages.map((stage, index) => <li key={stage.label}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{stage.label}</small><h3>{stage.title}</h3><p>{stage.body}</p></div></li>)}</ol>
    </section>
    <section className="portfolio-system-case-results">
      <div><p className="portfolio-label">03 / OUTCOME</p><h2>可靠，必須<br />在畫面上被看見。</h2></div>
      <ul>{data.outcomes.map((outcome) => <li key={outcome}><CheckCircle2 size={20} /><span>{outcome}</span></li>)}</ul>
    </section>
    <section className="portfolio-system-case-next"><p>LOOKING FOR A RELIABLE PRODUCT PARTNER?</p><a href="mailto:tamyu321@gmail.com">START A CONVERSATION <ArrowUpRight size={20} /></a></section>
    <PortfolioFooter />
  </main>;
}
