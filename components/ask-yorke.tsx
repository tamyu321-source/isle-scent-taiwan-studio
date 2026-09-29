"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Bot, Check, Copy, Mail, MessageCircle, Send, Trash2, X } from "lucide-react";
import type { AskYorkeBrief, AskYorkeMessage, AskYorkeMode, AskYorkeReply } from "@/lib/ask-yorke";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      execute: (id: string) => void;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const apiUrl = process.env.NEXT_PUBLIC_ASK_YORKE_API_URL ?? "";
const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const storageKey = "ask-yorke-v1";
const visitorKey = "ask-yorke-visitor-v1";
const prompts: Record<AskYorkeMode, string[]> = {
  works: ["我想做預約系統，有哪些相關作品？", "你做過哪些自動化工具？"],
  brief: ["我想做一個可以讓客戶線上預約的網站。", "我想減少人工整理訂單的時間。"],
};

let scriptPromise: Promise<void> | undefined;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { scriptPromise = undefined; reject(new Error("turnstile_load")); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

function summary(brief: AskYorkeBrief) {
  return [
    "AI 整理初稿：請核對推測與建議後再使用",
    `目標：${brief.goal || "待確認"}`,
    `可能使用者（待確認）：${brief.audience || "待確認"}`,
    `可能流程（待確認）：${brief.flows.length ? brief.flows.join("、") : "待確認"}`,
    `建議優先事項（待確認）：${brief.priorities.length ? brief.priorities.join("、") : "待確認"}`,
    `待確認問題：${brief.questions.length ? brief.questions.join("；") : "無"}`,
  ].join("\n");
}

function AskYorkeExperience({ fullPage = false }: { fullPage?: boolean }) {
  const [mode, setMode] = useState<AskYorkeMode>("works");
  const [history, setHistory] = useState<Record<AskYorkeMode, AskYorkeMessage[]>>({ works: [], brief: [] });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const widgetContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const tokenResolve = useRef<((token: string) => void) | null>(null);
  const tokenReject = useRef<((error: Error) => void) | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messages = history[mode];
  const configured = Boolean(apiUrl && siteKey);
  const latestBrief = [...history.brief].reverse().find((item) => item.brief)?.brief;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved && Array.isArray(saved.works) && Array.isArray(saved.brief)) {
        queueMicrotask(() => setHistory({ works: saved.works.slice(-20), brief: saved.brief.slice(-20) }));
      }
    } catch { /* Invalid browser data starts a clean conversation. */ }
  }, []);
  useEffect(() => {
    if (history.works.length || history.brief.length) localStorage.setItem(storageKey, JSON.stringify(history));
  }, [history]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [messages.length, busy]);
  useEffect(() => () => {
    if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
  }, []);

  async function challenge() {
    if (!widgetContainer.current || !siteKey) throw new Error("not_configured");
    await loadTurnstile();
    if (!window.turnstile) throw new Error("turnstile_load");
    if (!widgetId.current) {
      widgetId.current = window.turnstile.render(widgetContainer.current, {
        sitekey: siteKey,
        action: "ask_yorke",
        execution: "execute",
        appearance: "interaction-only",
        callback: (token: string) => tokenResolve.current?.(token),
        "error-callback": () => tokenReject.current?.(new Error("turnstile_error")),
        "expired-callback": () => tokenReject.current?.(new Error("turnstile_expired")),
      });
    }
    const id = widgetId.current;
    return new Promise<string>((resolve, reject) => {
      const timeout = window.setTimeout(() => { tokenResolve.current = null; tokenReject.current = null; reject(new Error("turnstile_timeout")); }, 20000);
      tokenResolve.current = (token) => { window.clearTimeout(timeout); tokenResolve.current = null; tokenReject.current = null; resolve(token); };
      tokenReject.current = (reason) => { window.clearTimeout(timeout); tokenResolve.current = null; tokenReject.current = null; reject(reason); };
      window.turnstile!.reset(id);
      window.turnstile!.execute(id);
    });
  }

  async function submit(event?: FormEvent, suggested?: string) {
    event?.preventDefault();
    const content = (suggested ?? draft).trim();
    if (!content || busy) return;
    if (!apiUrl || !siteKey) { setError("AI 服務尚未上線；目前可先瀏覽作品並透過 LINE 或郵件聯絡我。"); return; }
    setBusy(true);
    setError("");
    const next: AskYorkeMessage[] = [...messages, { role: "user" as const, content }].slice(-9);
    setHistory((current) => ({ ...current, [mode]: [...current[mode], { role: "user", content }].slice(-20) }));
    setDraft("");
    try {
      const turnstileToken = await challenge();
      let visitorId = localStorage.getItem(visitorKey);
      if (!visitorId || !/^[0-9a-f-]{36}$/i.test(visitorId)) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(visitorKey, visitorId);
      }
      const response = await fetch(apiUrl, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, visitorId, turnstileToken, messages: next.map(({ role, content: text }) => ({ role, content: text })) }),
      });
      const data = await response.json() as AskYorkeReply & { error?: string };
      if (!response.ok) {
        if (data.error === "daily_limit") throw new Error("今天的免費試用次數已用完。你仍可複製需求摘要，透過 LINE 或郵件聯絡我。");
        if (data.error === "monthly_limit") throw new Error("本月公開試用額度已用完。歡迎透過 LINE 或郵件聯絡我。");
        if (data.error === "verification_failed") throw new Error("安全驗證未通過，請稍後再試。");
        throw new Error("AI 服務暫時無法回應，請稍後再試或直接聯絡我。");
      }
      setRemaining(data.remaining);
      setHistory((current) => ({ ...current, [mode]: [...current[mode], {
        role: "assistant", content: data.answer,
        projectIds: data.projects.map((item) => item.id), brief: data.brief,
      }].slice(-20) }));
    } catch (reason) {
      setError(reason instanceof Error && /[\u3400-\u9fff]/.test(reason.message)
        ? reason.message : "驗證或連線未完成，請稍後再試。");
    } finally { setBusy(false); }
  }

  async function copyBrief() {
    if (!latestBrief) return;
    try {
      await navigator.clipboard.writeText(summary(latestBrief));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch { setError("無法自動複製，請手動選取摘要內容。"); }
  }

  function clearHistory() {
    setHistory({ works: [], brief: [] });
    localStorage.removeItem(storageKey);
    setError(""); setRemaining(null);
  }

  return (
    <div className={`ay-experience ${fullPage ? "ay-full-experience" : ""}`}>
      <div className="ay-mode-tabs" role="tablist" aria-label="AI 工具模式">
        <button type="button" role="tab" aria-selected={mode === "works"} onClick={() => { setMode("works"); setError(""); }}>找相關作品</button>
        <button type="button" role="tab" aria-selected={mode === "brief"} onClick={() => { setMode("brief"); setError(""); }}>整理專案需求</button>
      </div>
      {!configured && <p className="ay-service-note" role="status">AI 呼叫服務正在設定中。你仍可瀏覽作品，或透過 LINE、郵件聯絡我。</p>}
      <div className="ay-messages" role="log" aria-label="AI 對話" aria-live="polite">
        {messages.length === 0 && <div className="ay-empty">
          <Bot size={30} strokeWidth={1.5} />
          <h3>{mode === "works" ? "從你的問題，找到對的作品。" : "把初步想法，整理成清楚的需求。"}</h3>
          <p>{mode === "works" ? "告訴我你想做的網站或系統，我會從 Yorke 的真實作品中找出可參考的案例。" : "用自己的話描述想法；我會整理目標、流程、優先事項和還需要確認的問題。"}</p>
          <div className="ay-prompts">{prompts[mode].map((prompt) => <button key={prompt} type="button" disabled={!configured} onClick={() => void submit(undefined, prompt)}>{prompt} <ArrowRight size={15} /></button>)}</div>
        </div>}
        {messages.map((item, index) => <div className={`ay-message ay-${item.role}`} key={`${mode}-${index}`}>
          <span>{item.role === "user" ? "YOU" : "ASK YORKE"}</span>
          <p>{item.content}</p>
          {item.projectIds && item.projectIds.length > 0 && <div className="ay-projects">{item.projectIds.map((id) => {
            const project = askYorkeProjectMap[id];
            return project ? <a key={id} href={`${base}${project.href}`}>{project.title} <ArrowRight size={14} /></a> : null;
          })}</div>}
          {item.brief && <div className="ay-brief"><strong>需求摘要</strong><pre>{summary(item.brief)}</pre></div>}
        </div>)}
        {busy && <p className="ay-thinking">正在整理回覆…</p>}
        <div ref={endRef} />
      </div>
      <form className="ay-composer" onSubmit={(event) => void submit(event)}>
        <label htmlFor={fullPage ? "ay-full-input" : "ay-widget-input"}>描述你的問題或專案想法</label>
        <div><textarea id={fullPage ? "ay-full-input" : "ay-widget-input"} value={draft} maxLength={1500} rows={3} onChange={(event) => setDraft(event.target.value)} placeholder={mode === "works" ? "例如：你做過哪些需要後台管理的作品？" : "例如：我想讓客戶自行預約並收到確認通知…"} disabled={busy || !configured} /><button type="submit" disabled={busy || !configured || !draft.trim()} aria-label="送出問題"><Send size={18} /></button></div>
        <div className="ay-composer-meta"><span>勿輸入敏感資料 · 對話送至 Qwen 處理，僅在本機保存</span><span>{!configured ? "等待公開啟用" : remaining === null ? "每日 5 次免費試用" : `今日剩餘 ${remaining} 次`}</span></div>
      </form>
      <div className="ay-turnstile" ref={widgetContainer} />
      {error && <p className="ay-error" role="alert">{error}</p>}
      <div className="ay-actions">
        {latestBrief && <button type="button" onClick={() => void copyBrief()}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "已複製" : "複製需求摘要"}</button>}
        <a href="https://line.me/ti/p/um2wrmZxsN" target="_blank" rel="noreferrer"><MessageCircle size={15} /> LINE</a>
        <a href={`mailto:tamyu321@gmail.com?subject=${encodeURIComponent("從 ASK YORKE 聯絡")}${latestBrief ? `&body=${encodeURIComponent(summary(latestBrief))}` : ""}`}><Mail size={15} /> 郵件</a>
        {(history.works.length > 0 || history.brief.length > 0) && <button type="button" onClick={clearHistory}><Trash2 size={15} /> 清除對話</button>}
      </div>
    </div>
  );
}

import { askYorkeProjects } from "@/lib/ask-yorke-knowledge";
const askYorkeProjectMap = Object.fromEntries(askYorkeProjects.map((item) => [item.id, item])) as Record<string, (typeof askYorkeProjects)[number]>;

export function AskYorkeWidget() {
  const [open, setOpen] = useState(false);
  const [hide, setHide] = useState(false);
  useEffect(() => { queueMicrotask(() => setHide(/\/ask-yorke\/?$/.test(window.location.pathname))); }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  if (hide) return null;
  return <div className="ay-widget">
    <button className="ay-launcher" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="ask-yorke-panel"><Bot size={19} /> <span>ASK YORKE</span>{open ? <X size={16} /> : <span className="ay-launcher-dot" />}</button>
    <section id="ask-yorke-panel" className="ay-panel" hidden={!open} aria-label="ASK YORKE AI 工具">
      <div className="ay-panel-head"><div><small>ALWAYS HERE / AI TOOL</small><strong>你好，我是 ASK YORKE。</strong></div><button type="button" onClick={() => setOpen(false)} aria-label="關閉 AI 工具"><X size={19} /></button></div>
      <AskYorkeExperience />
      <a className="ay-full-link" href={`${base}/ask-yorke/`}>查看完整作品與設計說明 <ArrowRight size={15} /></a>
    </section>
  </div>;
}

export function AskYorkePageContent() {
  return <main className="ay-page">
    <header className="ay-page-header"><a href={`${base}/`}>Y/H <span>返回作品集</span></a><span>PROJECT 12 / LIVE AI TOOL</span></header>
    <section className="ay-hero"><p>ASK YORKE / 2026</p><h1>讓作品回答問題，<br /><em>讓想法開始成形。</em></h1><span>一個始終在場的作品導覽與需求整理工具。從真實案例出發，幫你找到參考，也把初步構想變成可討論的摘要。</span></section>
    <section className="ay-workspace" aria-label="ASK YORKE 操作區"><div className="ay-workspace-heading"><span>01 / TRY IT</span><h2>現在，試著描述你的想法。</h2></div><AskYorkeExperience fullPage /></section>
    <section className="ay-evidence"><div><span>02 / HOW IT WORKS</span><h2>一個可實際使用的 AI 作品。</h2><a className="ay-code-link" href="https://github.com/tamyu321-source/isle-scent-taiwan-studio/blob/main/workers/ask-yorke/index.ts" target="_blank" rel="noreferrer">查看 Worker 實作 <ArrowRight size={16} /></a></div><div className="ay-evidence-grid"><article><strong>有根據的作品推薦</strong><p>Qwen 選出候選作品後，服務端只回傳核對過的公開作品事實與站內連結。</p></article><article><strong>可帶走的需求摘要</strong><p>把目標、使用者、流程、優先事項與待確認問題整理成待核對的初稿，由訪客自己複製並聯絡。</p></article><article><strong>公開使用的成本控制</strong><p>Qwen 密鑰留在服務端；Turnstile、每日限額及全站每月 500 次上限保護公開接口。服務端只保存匿名限額計數。</p></article></div></section>
    <footer className="ay-page-footer"><a href={`${base}/#work`}>← 返回所有作品</a><span>YORKE HSU / AI INTERACTION & SYSTEMS</span></footer>
  </main>;
}
