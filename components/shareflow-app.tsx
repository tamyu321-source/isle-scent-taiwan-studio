"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowUpRight, Check, ChevronRight,
  CircleDollarSign, DatabaseZap, KeyRound, LayoutDashboard, LockKeyhole, LogOut,
  Megaphone, RefreshCw, ShieldCheck, TrendingUp, UserRoundCog,
  UsersRound, WalletCards,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Portal = "partner" | "admin";
type PartnerSection = "overview" | "campaigns" | "settlements";
type AdminSection = "overview" | "sources" | "access";
type RevenueRow = { id: string; campaign: string; source: string; gross: number; adjustment: number; state: "已確認" | "核對中" };
type Partner = { id: string; name: string; contact: string; rate: number; net: number; role: "合作夥伴" | "僅檢視"; active: boolean };

const revenueRows: RevenueRow[] = [
  { id: "SF-0926-08", campaign: "夏季品牌曝光計畫", source: "Meta Ads", gross: 126800, adjustment: 0, state: "已確認" },
  { id: "SF-0926-11", campaign: "搜尋轉換成長專案", source: "Google Ads", gross: 103200, adjustment: 4800, state: "已確認" },
  { id: "SF-0926-15", campaign: "短影音導流合作", source: "TikTok Ads", gross: 66400, adjustment: 7354, state: "核對中" },
];

const trend = [
  { month: "4月", revenue: 186000, share: 120900 }, { month: "5月", revenue: 212000, share: 137800 },
  { month: "6月", revenue: 198000, share: 128700 }, { month: "7月", revenue: 236000, share: 153400 },
  { month: "8月", revenue: 252000, share: 163800 }, { month: "9月", revenue: 284246, share: 184760 },
];

const settlements = [
  { month: "2026 年 8 月", net: 252000, rate: 65, amount: 163800, state: "已入帳", date: "2026/09/08" },
  { month: "2026 年 7 月", net: 236000, rate: 65, amount: 153400, state: "已入帳", date: "2026/08/08" },
  { month: "2026 年 6 月", net: 198000, rate: 65, amount: 128700, state: "已入帳", date: "2026/07/09" },
  { month: "2026 年 5 月", net: 212000, rate: 65, amount: 137800, state: "已入帳", date: "2026/06/10" },
];

const initialPartners: Partner[] = [
  { id: "PT-001", name: "橙光媒體", contact: "demo@shareflow.tw", rate: 65, net: 284246, role: "合作夥伴", active: true },
  { id: "PT-002", name: "暮野製作", contact: "muyo@example.com", rate: 55, net: 198400, role: "合作夥伴", active: true },
  { id: "PT-003", name: "微光創意", contact: "hello@light.example", rate: 70, net: 147800, role: "合作夥伴", active: true },
  { id: "PT-004", name: "北岸內容", contact: "finance@north.example", rate: 60, net: 164500, role: "僅檢視", active: false },
];

const money = (value: number) => new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 }).format(value);
const compactMoney = (value: number) => new Intl.NumberFormat("zh-TW", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const shareOf = (net: number, rate: number) => Math.round(net * rate / 100);

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: {
        name: string; title?: string; description: string; inputSchema: Record<string, unknown>;
        annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
        execute: (input: unknown) => unknown | Promise<unknown>;
      }, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

function ShareFlowLogin({ portal, onLogin }: { portal: Portal; onLogin: () => void }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const isAdmin = portal === "admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const credentials = isAdmin ? { email: "admin@shareflow.tw", password: "admin2026" } : { email: "demo@shareflow.tw", password: "share2026" };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim().toLowerCase() === credentials.email && password === credentials.password) onLogin();
    else setError("帳號或密碼不正確，請使用下方示範帳號。");
  };
  const demo = () => { setEmail(credentials.email); setPassword(credentials.password); setError(""); };
  return <main className="shareflow-login-root">
    <section className="shareflow-login-intro">
      <a className="shareflow-login-back" href={`${basePath}/#work`}><ArrowLeft size={16} /> 返回作品集</a>
      <div className="shareflow-login-brand"><span>SF</span><strong>SHAREFLOW</strong></div>
      <div className="shareflow-login-copy">
        <p>REVENUE SHARING, MADE CLEAR.</p><h1>每一筆營收，<br />都清楚分配。</h1>
        <div className="shareflow-login-proof"><span><DatabaseZap size={18} />多來源收入整合</span><span><CircleDollarSign size={18} />自動分潤試算</span><span><ShieldCheck size={18} />分級權限管理</span></div>
      </div>
      <p className="shareflow-login-foot">廣告代理商與內容合作夥伴的營收協作空間</p>
    </section>
    <section className="shareflow-login-panel">
      <form onSubmit={submit}>
        <div className="shareflow-login-icon"><LockKeyhole size={22} /></div>
        <p className="shareflow-eyebrow">{isAdmin ? "ADMIN PORTAL" : "PARTNER PORTAL"}</p>
        <h2>{isAdmin ? "管理員登入" : "合作夥伴登入"}</h2>
        <p>登入查看{isAdmin ? "收入來源、分潤規則與帳號權限" : "廣告營收與本期分潤進度"}。</p>
        <label>Email<Input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@company.com" required /></label>
        <label>密碼<Input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
        {error && <p className="shareflow-form-error" role="alert">{error}</p>}
        <Button type="submit" className="shareflow-primary-button">登入後台 <ArrowUpRight /></Button>
        <button type="button" className="shareflow-demo-fill" onClick={demo}>填入示範帳號</button>
        <div className="shareflow-demo-account"><KeyRound size={17} /><p><strong>展示帳號</strong><br />{credentials.email}<br />密碼：{credentials.password}</p></div>
        <a className="shareflow-portal-switch" href={`${basePath}/shareflow/${isAdmin ? "" : "admin/"}`}>{isAdmin ? "前往合作夥伴登入" : "管理員入口"} <ChevronRight size={15} /></a>
      </form>
      <p className="shareflow-demo-notice">概念展示環境，不連接真實廣告帳戶，也不儲存輸入資料。</p>
    </section>
  </main>;
}

function ShareFlowShell({ portal, active, setActive, children, onLogout }: {
  portal: Portal; active: string; setActive: (value: never) => void; children: React.ReactNode; onLogout: () => void;
}) {
  const isAdmin = portal === "admin";
  const partnerItems: { id: PartnerSection; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "總覽", icon: LayoutDashboard }, { id: "campaigns", label: "廣告營收", icon: Megaphone }, { id: "settlements", label: "分潤紀錄", icon: WalletCards },
  ];
  const adminItems: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "營運總覽", icon: LayoutDashboard }, { id: "sources", label: "資料來源", icon: DatabaseZap }, { id: "access", label: "客戶與權限", icon: UserRoundCog },
  ];
  const items = isAdmin ? adminItems : partnerItems;
  return <main className={`shareflow-root ${isAdmin ? "shareflow-admin-root" : ""}`}>
    <aside className="shareflow-sidebar">
      <a className="shareflow-brand" href="#top"><span>SF</span><strong>SHAREFLOW</strong></a>
      <div className="shareflow-side-label">{isAdmin ? "ADMIN CONSOLE" : "PARTNER SPACE"}</div>
      <nav aria-label={isAdmin ? "管理員後台導覽" : "客戶後台導覽"}>{items.map(item => <button key={item.id} className={active === item.id ? "is-active" : ""} onClick={() => setActive(item.id as never)}><item.icon size={18} />{item.label}</button>)}</nav>
      <div className="shareflow-account"><span>{isAdmin ? "YH" : "CG"}</span><div><strong>{isAdmin ? "Yorke 管理台" : "橙光媒體"}</strong><small>{isAdmin ? "系統管理員" : "合作夥伴"}</small></div><button aria-label="登出" onClick={onLogout}><LogOut size={17} /></button></div>
    </aside>
    <section className="shareflow-main" id="top">
      <header className="shareflow-topbar"><div><p>{isAdmin ? "管理員後台" : "合作夥伴後台"}</p><strong>2026 年 9 月</strong></div><div className="shareflow-top-actions"><span className="shareflow-demo-chip">展示資料</span></div></header>
      {children}
    </section>
  </main>;
}

function PartnerDashboard({ onLogout }: { onLogout: () => void }) {
  const [active, setActive] = useState<PartnerSection>("overview");
  const totalGross = revenueRows.reduce((sum, row) => sum + row.gross, 0);
  const totalAdjustments = revenueRows.reduce((sum, row) => sum + row.adjustment, 0);
  const net = totalGross - totalAdjustments;
  const share = shareOf(net, 65);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try { void Promise.resolve(context.registerTool({ name: "read_revenue_summary", title: "讀取本月分潤摘要", description: "讀取目前合作夥伴畫面上的本月淨營收、分潤比例與預估分潤。", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: () => ({ month: "2026-09", grossRevenue: totalGross, adjustments: totalAdjustments, netRevenue: net, shareRate: 65, estimatedShare: share }) }, { signal: lifecycle.signal })).catch(() => undefined); } catch { /* Unsupported preview browser. */ }
    return () => lifecycle.abort();
  }, [net, share, totalAdjustments, totalGross]);
  return <ShareFlowShell portal="partner" active={active} setActive={setActive as never} onLogout={onLogout}>
    <div className="shareflow-content">
      {active === "overview" && <>
        <div className="shareflow-title-row"><div><p className="shareflow-eyebrow">SEPTEMBER PERFORMANCE</p><h1>本月分潤總覽</h1><p>收入更新至 09/12 18:40</p></div><span className="shareflow-sync-state">資料已同步</span></div>
        <section className="shareflow-hero-card"><div><span>預估可分潤金額</span><strong>{money(share)}</strong><p>依可分潤淨額 × 65% 自動計算</p></div><div className="shareflow-rate-ring"><span>65<small>%</small></span><p>合約分潤比例</p></div></section>
        <section className="shareflow-metrics" aria-label="本月營收摘要">
          <article><span>廣告總營收</span><strong>{money(totalGross)}</strong><small className="is-up"><TrendingUp />較上月 +12.8%</small></article>
          <article><span>平台與調整費</span><strong>{money(totalAdjustments)}</strong><small><ArrowDownRight />已扣除退刷與平台費</small></article>
          <article><span>可分潤淨額</span><strong>{money(net)}</strong><small><Activity />3 個廣告來源</small></article>
        </section>
        <section className="shareflow-dashboard-grid">
          <article className="shareflow-panel shareflow-chart-panel"><div className="shareflow-panel-head"><div><p className="shareflow-eyebrow">SIX-MONTH TREND</p><h2>收入與分潤趨勢</h2></div><span>NTD</span></div><div className="shareflow-chart" aria-label="近六個月收入與分潤趨勢圖"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}><defs><linearGradient id="shareFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9acb17" stopOpacity={.3}/><stop offset="100%" stopColor="#9acb17" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e6eae3"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#788079", fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tickFormatter={compactMoney} tick={{ fill: "#788079", fontSize: 11 }}/><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 10, borderColor: "#dce1da", fontSize: 12 }}/><Area type="monotone" dataKey="revenue" name="淨營收" stroke="#172019" strokeWidth={2} fill="transparent"/><Area type="monotone" dataKey="share" name="分潤" stroke="#8fbd18" strokeWidth={2.5} fill="url(#shareFill)"/></AreaChart></ResponsiveContainer></div><div className="shareflow-chart-legend"><span><i />淨營收</span><span><i />預估分潤</span></div></article>
          <article className="shareflow-panel shareflow-settlement-card"><div className="shareflow-panel-head"><div><p className="shareflow-eyebrow">NEXT SETTLEMENT</p><h2>下一次結算</h2></div><WalletCards size={22} /></div><strong>10 月 8 日</strong><p>本期將在收入確認後，自動建立結算單。</p><div><span>目前進度</span><span>3 / 4</span></div><progress value="75" max="100">75%</progress><ol><li className="is-done"><Check />收入匯入完成</li><li className="is-done"><Check />平台費核對完成</li><li className="is-done"><Check />分潤試算完成</li><li>等待財務確認</li></ol></article>
        </section>
      </>}
      {active === "campaigns" && <RevenueTable />}{active === "settlements" && <SettlementTable />}
    </div>
  </ShareFlowShell>;
}

function RevenueTable() {
  return <><div className="shareflow-title-row"><div><p className="shareflow-eyebrow">REVENUE STREAMS</p><h1>廣告營收</h1><p>依 API 來源彙整的有效收入與調整項目。</p></div><span className="shareflow-sync-state">3 個來源正常</span></div><section className="shareflow-panel shareflow-full-panel"><div className="shareflow-panel-head"><div><h2>2026 年 9 月明細</h2><p>分潤金額以本期 65% 合約比例計算。</p></div></div><Table className="shareflow-data-table"><TableHeader><TableRow><TableHead>廣告活動</TableHead><TableHead>來源</TableHead><TableHead>原始營收</TableHead><TableHead>調整</TableHead><TableHead>有效營收</TableHead><TableHead>預估分潤</TableHead><TableHead>狀態</TableHead></TableRow></TableHeader><TableBody>{revenueRows.map(row => { const net = row.gross - row.adjustment; return <TableRow key={row.id}><TableCell><strong>{row.campaign}</strong><small>{row.id}</small></TableCell><TableCell>{row.source}</TableCell><TableCell>{money(row.gross)}</TableCell><TableCell>{row.adjustment ? `−${money(row.adjustment)}` : "—"}</TableCell><TableCell><strong>{money(net)}</strong></TableCell><TableCell className="shareflow-share-cell">{money(shareOf(net, 65))}</TableCell><TableCell><span className={`shareflow-status ${row.state === "核對中" ? "is-pending" : ""}`}>{row.state}</span></TableCell></TableRow>; })}</TableBody></Table></section></>;
}

function SettlementTable() {
  return <><div className="shareflow-title-row"><div><p className="shareflow-eyebrow">SETTLEMENT HISTORY</p><h1>分潤紀錄</h1><p>已完成的月結金額與入帳日期。</p></div></div><section className="shareflow-panel shareflow-full-panel"><div className="shareflow-panel-head"><div><h2>歷史結算</h2><p>每期金額皆保留當時適用的分潤比例。</p></div></div><Table className="shareflow-data-table"><TableHeader><TableRow><TableHead>結算月份</TableHead><TableHead>可分潤淨額</TableHead><TableHead>分潤比例</TableHead><TableHead>實際分潤</TableHead><TableHead>入帳日</TableHead><TableHead>狀態</TableHead></TableRow></TableHeader><TableBody>{settlements.map(row => <TableRow key={row.month}><TableCell><strong>{row.month}</strong></TableCell><TableCell>{money(row.net)}</TableCell><TableCell>{row.rate}%</TableCell><TableCell className="shareflow-share-cell"><strong>{money(row.amount)}</strong></TableCell><TableCell>{row.date}</TableCell><TableCell><span className="shareflow-status">{row.state}</span></TableCell></TableRow>)}</TableBody></Table></section></>;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [active, setActive] = useState<AdminSection>("overview");
  const [partners, setPartners] = useState(initialPartners);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("09/12 18:40");
  const [notice, setNotice] = useState("");
  const totals = useMemo(() => ({ net: partners.reduce((sum, p) => sum + p.net, 0), share: partners.reduce((sum, p) => sum + shareOf(p.net, p.rate), 0) }), [partners]);
  const syncSources = useCallback(async () => {
    if (syncing) return { status: "already_running" };
    setSyncing(true); setNotice(""); await new Promise(resolve => setTimeout(resolve, 850));
    setLastSync("剛剛"); setSyncing(false); setNotice("4 個來源同步完成，沒有發現重複收入。");
    return { status: "complete", sources: 4, duplicateRows: 0 };
  }, [syncing]);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try { void Promise.resolve(context.registerTool({ name: "sync_revenue_sources", title: "同步廣告收入", description: "同步所有已啟用的廣告 API 來源，並更新畫面上的同步狀態。", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: syncSources }, { signal: lifecycle.signal })).catch(() => undefined); } catch { /* Unsupported preview browser. */ }
    return () => lifecycle.abort();
  }, [syncSources]);
  const updatePartner = (id: string, patch: Partial<Partner>, message: string) => { setPartners(items => items.map(item => item.id === id ? { ...item, ...patch } : item)); setNotice(message); };
  const addPartner = (partner: Omit<Partner, "id" | "net" | "active">) => { setPartners(items => [...items, { ...partner, id: `PT-${String(items.length + 1).padStart(3, "0")}`, net: 0, active: true }]); setNotice(`${partner.name}的示範帳號已建立。`); };
  return <ShareFlowShell portal="admin" active={active} setActive={setActive as never} onLogout={onLogout}>
    <div className="shareflow-content">
      {notice && <div className="shareflow-notice" role="status"><Check size={17} />{notice}<button onClick={() => setNotice("")} aria-label="關閉通知">×</button></div>}
      {active === "overview" && <>
        <div className="shareflow-title-row"><div><p className="shareflow-eyebrow">OPERATIONS OVERVIEW</p><h1>分潤營運總覽</h1><p>集中掌握收入匯入、計算結果與客戶狀態。</p></div><Button className="shareflow-sync-button" onClick={() => void syncSources()} disabled={syncing}><RefreshCw className={syncing ? "is-spinning" : ""}/>{syncing ? "同步中…" : "同步 API 資料"}</Button></div>
        <section className="shareflow-admin-metrics"><article><span>本月有效營收</span><strong>{money(totals.net)}</strong><small>4 個合作夥伴</small></article><article><span>預估分潤支出</span><strong>{money(totals.share)}</strong><small>依各客戶合約自動計算</small></article><article><span>啟用帳號</span><strong>{partners.filter(p => p.active).length}<em> / {partners.length}</em></strong><small>1 個帳號已停用</small></article><article><span>資料來源</span><strong>4<em> / 4</em></strong><small>最後同步：{lastSync}</small></article></section>
        <section className="shareflow-admin-grid"><article className="shareflow-panel"><div className="shareflow-panel-head"><div><p className="shareflow-eyebrow">PARTNER PAYOUTS</p><h2>本月分潤分布</h2></div><button onClick={() => setActive("access")}>管理客戶 <ArrowUpRight /></button></div><div className="shareflow-payout-list">{partners.map((p, i) => <div key={p.id}><span className={`shareflow-avatar tone-${i + 1}`}>{p.name.slice(0, 1)}</span><div><strong>{p.name}</strong><small>{p.rate}% 分潤</small></div><b>{money(shareOf(p.net, p.rate))}</b></div>)}</div></article><article className="shareflow-panel shareflow-source-summary"><div className="shareflow-panel-head"><div><p className="shareflow-eyebrow">SOURCE HEALTH</p><h2>資料來源狀態</h2></div><DatabaseZap /></div>{["Meta Ads", "Google Ads", "TikTok Ads", "聯盟廣告 API"].map((source, index) => <div key={source}><span><i />{source}</span><small>{index === 3 ? "19 分鐘前" : "剛剛"}</small></div>)}<Button variant="outline" onClick={() => setActive("sources")}>查看串接設定</Button></article></section>
      </>}
      {active === "sources" && <SourceManagement syncing={syncing} lastSync={lastSync} sync={() => void syncSources()} />}
      {active === "access" && <AccessManagement partners={partners} update={updatePartner} add={addPartner} />}
    </div>
  </ShareFlowShell>;
}

function SourceManagement({ syncing, lastSync, sync }: { syncing: boolean; lastSync: string; sync: () => void }) {
  const sources = [
    { name: "Meta Ads", account: "act_5720•••184", rows: 18 }, { name: "Google Ads", account: "客戶中心 892-•••-1102", rows: 12 },
    { name: "TikTok Ads", account: "ADV-7284•••", rows: 9 }, { name: "聯盟廣告 API", account: "partner-feed-v2", rows: 6 },
  ];
  return <><div className="shareflow-title-row"><div><p className="shareflow-eyebrow">API CONNECTIONS</p><h1>資料來源</h1><p>收入資料經來源識別碼去重後再進入分潤計算。</p></div><Button className="shareflow-sync-button" onClick={sync} disabled={syncing}><RefreshCw className={syncing ? "is-spinning" : ""}/>{syncing ? "同步中…" : "全部同步"}</Button></div><section className="shareflow-source-grid">{sources.map(source => <article className="shareflow-panel" key={source.name}><div className="shareflow-source-icon"><DatabaseZap /></div><span className="shareflow-status">正常</span><h2>{source.name}</h2><p>{source.account}</p><dl><div><dt>本次匯入</dt><dd>{source.rows} 筆</dd></div><div><dt>最後同步</dt><dd>{lastSync}</dd></div></dl><span className="shareflow-source-scope"><ShieldCheck />收入讀取權限</span></article>)}</section><div className="shareflow-api-note"><ShieldCheck /><div><strong>API 金鑰不會顯示於前端</strong><p>正式環境應存放於伺服器端機密設定，並以來源交易 ID 防止重複計入。</p></div></div></>;
}

function AccessManagement({ partners, update, add }: { partners: Partner[]; update: (id: string, patch: Partial<Partner>, message: string) => void; add: (partner: Omit<Partner, "id" | "net" | "active">) => void }) {
  const [open, setOpen] = useState(false);
  const [rate, setRate] = useState("60");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); add({ name: String(form.get("name")).trim(), contact: String(form.get("email")).trim(), rate: Number(rate), role: "合作夥伴" }); setOpen(false); setRate("60"); };
  return <><div className="shareflow-title-row"><div><p className="shareflow-eyebrow">CLIENT & ACCESS</p><h1>客戶與權限</h1><p>管理登入狀態、檢視範圍與各自的分潤比例。</p></div><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="shareflow-primary-button"><UsersRound />新增合作夥伴</Button></DialogTrigger><DialogContent className="shareflow-dialog"><DialogHeader><DialogTitle>新增合作夥伴</DialogTitle><DialogDescription>建立示範帳號與預設分潤比例。正式環境會另寄啟用信。</DialogDescription></DialogHeader><form onSubmit={submit}><label>客戶名稱<Input name="name" maxLength={40} required /></label><label>登入 Email<Input name="email" type="email" required /></label><label>預設分潤比例<Select value={rate} onValueChange={setRate}><SelectTrigger aria-label="新客戶分潤比例"><SelectValue /></SelectTrigger><SelectContent>{[50,55,60,65,70,75].map(value => <SelectItem key={value} value={String(value)}>{value}%</SelectItem>)}</SelectContent></Select></label><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button><Button type="submit" className="shareflow-primary-button">建立示範帳號</Button></DialogFooter></form></DialogContent></Dialog></div><section className="shareflow-panel shareflow-full-panel"><div className="shareflow-panel-head"><div><h2>合作夥伴帳號</h2><p>比例調整只套用於尚未結算的月份。</p></div></div><Table className="shareflow-data-table shareflow-access-table"><TableHeader><TableRow><TableHead>客戶</TableHead><TableHead>本月淨營收</TableHead><TableHead>分潤比例</TableHead><TableHead>本月預估分潤</TableHead><TableHead>權限</TableHead><TableHead>登入狀態</TableHead></TableRow></TableHeader><TableBody>{partners.map((partner, index) => <TableRow key={partner.id}><TableCell><div className="shareflow-client-cell"><span className={`shareflow-avatar tone-${index % 4 + 1}`}>{partner.name.slice(0, 1)}</span><div><strong>{partner.name}</strong><small>{partner.contact} · {partner.id}</small></div></div></TableCell><TableCell>{money(partner.net)}</TableCell><TableCell><Select value={String(partner.rate)} onValueChange={value => update(partner.id, { rate: Number(value) }, `${partner.name}的分潤比例已更新為 ${value}%。`)}><SelectTrigger aria-label={`${partner.name}分潤比例`}><SelectValue /></SelectTrigger><SelectContent>{[50,55,60,65,70,75].map(value => <SelectItem key={value} value={String(value)}>{value}%</SelectItem>)}</SelectContent></Select></TableCell><TableCell className="shareflow-share-cell"><strong>{money(shareOf(partner.net, partner.rate))}</strong></TableCell><TableCell><Select value={partner.role} onValueChange={value => update(partner.id, { role: value as Partner["role"] }, `${partner.name}的權限已更新。`)}><SelectTrigger aria-label={`${partner.name}帳號權限`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="合作夥伴">合作夥伴</SelectItem><SelectItem value="僅檢視">僅檢視</SelectItem></SelectContent></Select></TableCell><TableCell><button className={`shareflow-access-toggle ${partner.active ? "is-active" : ""}`} onClick={() => update(partner.id, { active: !partner.active }, `${partner.name}的帳號已${partner.active ? "停用" : "啟用"}。`)}><i />{partner.active ? "可登入" : "已停用"}</button></TableCell></TableRow>)}</TableBody></Table></section></>;
}

export function ShareFlowApp({ portal = "partner" }: { portal?: Portal }) {
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => { const requested = new URLSearchParams(window.location.search).get("demo"); if (requested === portal) setAuthenticated(true); }, [portal]);
  if (!authenticated) return <ShareFlowLogin portal={portal} onLogin={() => setAuthenticated(true)} />;
  return portal === "admin" ? <AdminDashboard onLogout={() => setAuthenticated(false)} /> : <PartnerDashboard onLogout={() => setAuthenticated(false)} />;
}
