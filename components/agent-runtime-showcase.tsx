"use client";

import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, CircleX, Download, Fingerprint, GitBranch, LockKeyhole, ShieldCheck } from "lucide-react";
import evidence from "@/public/data/agent-runtime/demo.json";

const modules = [
  { index: "01", name: "MISSION RUNTIME", zh: "任務執行", detail: "請求去重、狀態轉移、交易內執行", icon: GitBranch },
  { index: "02", name: "AUTHORITY GRAPH", zh: "權限關係", detail: "主體 × 角色 × 資源 × 有效期", icon: LockKeyhole },
  { index: "03", name: "POLICY ENGINE", zh: "策略判斷", detail: "金額門檻、目標限制、雙人覆核", icon: ShieldCheck },
  { index: "04", name: "EXECUTION TOKEN", zh: "執行憑證", detail: "短效、單任務、一次性使用", icon: Fingerprint },
  { index: "05", name: "AUDIT CHAIN", zh: "審計鏈", detail: "事件逐筆串接並驗證雜湊", icon: GitBranch },
];

const eventNames: Record<string, string> = {
  MISSION_SUBMITTED: "任務已提交", POLICY_DECISION: "策略已判斷",
  MISSION_APPROVED: "獨立覆核通過", TOKEN_ISSUED: "短效憑證已簽發",
  EXECUTION_COMPLETED: "準備指令已記錄", EXECUTION_REJECTED: "重放執行遭拒",
};
const reasons: Record<string, string> = {
  WITHIN_LIMIT: "金額在自動處理限額內", TWO_PERSON_REVIEW: "超過自動限額，需另一人覆核",
  NO_AUTHORITY: "操作者沒有此資源的權限", BLOCKED_DESTINATION: "目標位於策略封鎖清單",
  POLICY_LIMIT: "金額超過允許上限", TOKEN_AUTHORITY_OR_STATE: "憑證、權限或任務狀態不再有效",
};

export function AgentRuntimeShowcase() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const [selected, setSelected] = useState(0);
  const scenario = evidence.cases[selected];
  const passed = scenario.state === "COMPLETED";

  return (
    <main className="ar-page">
      <div className="ar-topbar">
        <a href={`${base}/#work`}><ArrowLeft size={17} /> 返回作品集</a>
        <span>YORKE HSU <i /> SYSTEMS LAB / 001</span>
        <a href={`${base}/downloads/agent-runtime-python.zip`}><Download size={16} /> 下載 Python 原型</a>
      </div>

      <header className="ar-hero">
        <div className="ar-hero-copy">
          <p className="ar-kicker"><span className="ar-pulse" /> PYTHON SYSTEMS PROTOTYPE · 2026</p>
          <h1>讓 Agent 的每一步，<br /><em>都有權限與依據。</em></h1>
          <p className="ar-intro">一個模擬金融支付指令準備流程的 Agent Runtime。任務先經權限與策略檢查，必要時由另一人覆核，最後憑短效授權執行；每個決策都留下可核驗的事件。</p>
          <div className="ar-hero-actions"><a href="#lab">探索執行實驗 <ArrowUpRight size={18} /></a><a href="#architecture">查看架構設計 ↓</a></div>
          <p className="ar-disclaimer">合成資料與本機原型 · 不處理真實付款 · 不是正式金融系統</p>
        </div>
        <div className="ar-signal" aria-label="任務控制流程：請求、權限、策略、執行、審計">
          <div className="ar-signal-top"><span>RUNTIME CONTROL PLANE</span><span className="ar-live"><span /> TRACE VERIFIED</span></div>
          <div className="ar-signal-graph">
            <div className="ar-graph-node ar-node-main"><small>INPUT / 01</small><strong>MISSION</strong><span>payment.prepare</span></div>
            <div className="ar-graph-line" />
            <div className="ar-graph-pair"><div className="ar-graph-node"><small>CHECK / 02</small><strong>AUTHORITY</strong><span>actor → role → resource</span></div><div className="ar-graph-node"><small>CHECK / 03</small><strong>POLICY</strong><span>limit · target · approval</span></div></div>
            <div className="ar-graph-line" />
            <div className="ar-graph-node ar-node-token"><small>GATE / 04</small><strong>EXECUTION TOKEN</strong><span>one mission · one use · 120s</span></div>
            <div className="ar-graph-line" />
            <div className="ar-graph-node ar-node-audit"><small>RECORD / 05</small><strong>AUDIT CHAIN</strong><span>SHA-256 · linked events</span></div>
          </div>
          <div className="ar-signal-bottom"><span>DENY BY DEFAULT</span><span>NO DIRECT TRANSFER</span><span>REPLAY REJECTED</span></div>
        </div>
      </header>

      <section className="ar-strip" aria-label="系統特性"><span><Check size={16} /> 5 個核心模組</span><span><Check size={16} /> 7 組 Python 與 API 測試</span><span><Check size={16} /> 5 個真實運行產生的情境</span><span><Check size={16} /> SQLite 交易與事件鏈</span></section>

      <section id="lab" className="ar-lab ar-container">
        <div className="ar-section-heading"><p>01 / EXECUTION LAB</p><h2>選一個情境，<br />看決策如何形成。</h2><span>以下紀錄由 Python 核心執行後輸出。切換情境只讀取已產生的證據快照。</span></div>
        <div className="ar-lab-layout">
          <div className="ar-scenarios" role="group" aria-label="執行情境">
            {evidence.cases.map((item, index) => <button key={item.key} className={selected === index ? "active" : ""} onClick={() => setSelected(index)} aria-pressed={selected === index}>
              <span className="ar-scenario-index">{String(index + 1).padStart(2, "0")}</span><span><strong>{item.title}</strong><small>{item.amount} USD · {item.destination}</small></span><span className={item.state === "COMPLETED" ? "ar-mini-pass" : "ar-mini-deny"}>{item.state === "COMPLETED" ? "執行" : "拒絕"}</span>
            </button>)}
          </div>
          <div className="ar-trace">
            <div className="ar-trace-head"><div><p>LIVE TRACE / SNAPSHOT</p><h3>{scenario.title}</h3></div><span className={passed ? "ar-status-pass" : "ar-status-deny"}>{passed ? <ShieldCheck size={16} /> : <CircleX size={16} />}{scenario.state}</span></div>
            <dl className="ar-facts"><div><dt>資源</dt><dd>ledger-us</dd></div><div><dt>金額</dt><dd>${scenario.amount.toLocaleString()} USD</dd></div><div><dt>目標</dt><dd>{scenario.destination}</dd></div></dl>
            <ol className="ar-events">{scenario.events.map((event) => <li key={event.seq}><span className="ar-event-dot" /><div><div className="ar-event-title"><strong>{eventNames[event.event] ?? event.event}</strong><code>#{String(event.seq).padStart(3, "0")}</code></div><p>{"reason" in event.details ? reasons[String(event.details.reason)] ?? String(event.details.reason) : event.actor + " · " + event.event}</p><small>SHA-256 {event.hash}…</small></div></li>)}</ol>
            <div className="ar-trace-foot"><span>{scenario.checks.length ? scenario.checks.join(" · ") : "權限或策略檢查阻止執行"}</span><span>{scenario.events.length} EVENTS</span></div>
          </div>
        </div>
        <div className="ar-verification"><span><ShieldCheck size={21} /> 全局審計鏈驗證</span><strong>{evidence.chain.valid ? "VALID" : "FAILED"}</strong><code>{evidence.chain.checked} events · head {evidence.chain.head.slice(0, 16)}…</code></div>
      </section>

      <section id="architecture" className="ar-architecture"><div className="ar-container"><div className="ar-section-heading"><p>02 / SYSTEM ARCHITECTURE</p><h2>職缺提到的五個模組，<br />各自負責什麼？</h2><span>介面背後有實際 Python 實作、SQLite 狀態與可重現測試。</span></div><div className="ar-module-grid">{modules.map(({ index, name, zh, detail, icon: Icon }) => <article key={index}><div><span>{index} / 05</span><Icon size={21} strokeWidth={1.5} /></div><h3>{name}</h3><strong>{zh}</strong><p>{detail}</p></article>)}</div><div className="ar-architecture-bottom"><p><strong>安全邊界</strong>：此原型只寫入「付款指令已準備」的模擬紀錄。API 用自報身分方便本機測試，正式環境必須接入身分驗證、不可變審計儲存及外部交易控制。</p><a href={`${base}/downloads/agent-runtime-python.zip`}>下載原始碼與測試 <ArrowUpRight size={17} /></a></div></div></section>
      <footer className="ar-footer"><span>AUTHORITY / AGENT RUNTIME PROTOTYPE</span><a href={`${base}/#work`}>返回所有作品 <ArrowUpRight size={16} /></a><span>DESIGNED & ENGINEERED BY YORKE HSU</span></footer>
    </main>
  );
}
