"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, Package, ArrowUpRight, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useMori, updateMori } from "@/lib/mori-store";
import { localDate, moriMoney, setMoriOrderStatus, type MoriOrder, type MoriProduct, type MoriWorkshop } from "@/lib/mori-domain";
import { MoriBag, MoriFooter, MoriHeader, moriPath, moriImage, errorMessage } from "@/components/mori-studio";

function CancelOrder({ id, close, report }: { id: string; close: () => void; report: (s: string) => void }) {
  return <AlertDialog open onOpenChange={open => !open && close()}><AlertDialogContent className="mori-dialog"><AlertDialogTitle>取消整筆訂單？</AlertDialogTitle><AlertDialogDescription>這會取消 {id} 的所有器物與預約，並釋出庫存與席次。已取消的訂單無法復原。此為示範，不涉及實際退款。</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>保留訂單</AlertDialogCancel><AlertDialogAction className="mori-button" onClick={() => { try { updateMori(d => setMoriOrderStatus(d, id, "已取消")); report("訂單已取消，庫存與席次已釋出。"); } catch(e) { report(errorMessage(e)); } close(); }}>確認取消</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

function OrderCard({ order, onCancel }: { order: MoriOrder; onCancel: () => void }) {
  return <article className="mori-order-card"><div className="mori-between"><span>{order.id}</span><span className={`mori-status ${order.status === "已取消" ? "mori-status-muted" : ""}`}>{order.status}</span></div>{order.items.map((item, i) => <div className="mori-order-item" key={i}>{item.kind === "workshop" ? <CalendarDays size={21} /> : <Package size={21} />}<div><h3>{item.name}</h3><p>{item.kind === "workshop" ? `${item.date} · ${item.time} · ${item.quantity} 位` : `${item.quantity} 件 · ${order.delivery === "shipping" ? "宅配" : "工作室自取"}`}</p></div><span>{moriMoney(item.price * item.quantity)}</span></div>)}<div className="mori-between"><span>{order.status === "已取消" ? "已取消 · 無實際金流" : order.paid ? "已付款（示範）" : "待付款"} · 合計 {moriMoney(order.total)}</span>{order.status === "待確認" && <button className="mori-text-button" onClick={onCancel}>取消整筆訂單</button>}</div></article>;
}

export function MoriMember() {
  const data = useMori();
  const [bag, setBag] = useState(false);
  const [cancel, setCancel] = useState("");
  const [message, setMessage] = useState("");
  const act = (fn: () => void) => { try { fn(); } catch(e) { setMessage(errorMessage(e)); } };
  const saveProfile = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); act(() => { updateMori(d => ({ ...d, member: { ...d.member, name: String(f.get("name")).trim(), email: String(f.get("email")).trim(), phone: String(f.get("phone")).trim() } })); setMessage("會員資料已儲存在此瀏覽器。"); }); };
  const orders = data.orders.filter(o => o.memberId === data.member.id);
  return <main className="mori-root"><MoriHeader onBag={() => setBag(true)} /><section className="mori-account">
    <p className="mori-eyebrow">YOUR LITTLE CORNER</p><h1>{data.signedIn ? `${data.member.name}，歡迎回來。` : "留一個角落，給自己。"}</h1><p>你的手作時光，與每一件喜歡的器物，都在這裡。</p>
    {!data.signedIn ? <div className="mori-signin"><img src={moriImage("objects")} alt="莫蘭迪色系手作陶器" /><div><UserRound size={28} /><h2>體驗會員空間</h2><p>使用內建示範會員，探索預約與訂單紀錄。<br />不需註冊或密碼，也不是正式帳號驗證。</p><button className="mori-button" onClick={() => act(() => updateMori(d => ({ ...d, signedIn: true })))}>進入示範會員 <ArrowUpRight size={18} /></button></div></div> :
      <Tabs defaultValue="bookings" className="mori-tabs"><TabsList><TabsTrigger value="bookings">我的預約</TabsTrigger><TabsTrigger value="orders">我的訂單</TabsTrigger><TabsTrigger value="profile">會員資料</TabsTrigger></TabsList>
        <TabsContent value="bookings">{orders.some(o => o.items.some(i => i.kind === "workshop")) ? orders.filter(o => o.items.some(i => i.kind === "workshop")).map(o => <OrderCard key={o.id} order={o} onCancel={() => setCancel(o.id)} />) : <div className="mori-empty"><CalendarDays size={32} /><h2>下一段手作時光，等你安排。</h2><p>還沒有預約，從一堂體驗開始。</p><a className="mori-button" href={moriPath("#experiences")}>挑選手作體驗</a></div>}</TabsContent>
        <TabsContent value="orders">{orders.length ? orders.map(o => <OrderCard key={o.id} order={o} onCancel={() => setCancel(o.id)} />) : <div className="mori-empty"><Package size={32} /><h2>還沒有訂單紀錄。</h2><a className="mori-button" href={moriPath("#objects")}>逛逛日常器物</a></div>}</TabsContent>
        <TabsContent value="profile"><form className="mori-form mori-profile" onSubmit={saveProfile} key={data.member.id}><h2>關於你的小小資料</h2><p>請勿填入真實個人資料。本展示不提供跨裝置同步。</p><label>姓名<input required name="name" maxLength={40} defaultValue={data.member.name} /></label><label>Email<input required type="email" name="email" defaultValue={data.member.email} /></label><label>聯絡電話<input required type="tel" name="phone" defaultValue={data.member.phone} /></label><div className="mori-between"><button className="mori-button">儲存資料</button><button type="button" className="mori-text-button" onClick={() => act(() => updateMori(d => ({ ...d, signedIn: false })))}>離開示範會員</button></div></form></TabsContent>
      </Tabs>}
    {message && <p className="mori-feedback" role="status">{message}</p>}
  </section><MoriFooter />{bag && <MoriBag onClose={() => setBag(false)} />}{cancel && <CancelOrder id={cancel} close={() => setCancel("")} report={setMessage} />}</main>;
}

function CatalogEditor({ record, kind, report }: { record: MoriProduct | MoriWorkshop; kind: "product" | "workshop"; report: (s: string) => void }) {
  const [active, setActive] = useState(record.active ? "true" : "false");
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const f = new FormData(e.currentTarget); const price = Number(f.get("price")), count = Number(f.get("count"));
    try {
      if (!Number.isInteger(price) || price < 1 || !Number.isInteger(count) || count < (kind === "workshop" ? 1 : 0)) throw new Error("請填寫有效的正整數價格與數量。");
      updateMori(d => kind === "product" ? { ...d, products: d.products.map(p => p.id === record.id ? { ...p, price, stock: count, active: active === "true" } : p) } : { ...d, workshops: d.workshops.map(w => w.id === record.id ? { ...w, price, capacity: count, active: active === "true" } : w) });
      report(`${record.name} 已更新，前台會同步顯示。`);
    } catch(e) { report(errorMessage(e)); }
  };
  return <form className="mori-catalog-editor mori-form" onSubmit={submit}><h3>{record.name}</h3><div className="mori-form-grid"><label>價格 NT$<input name="price" type="number" min={1} step={1} required defaultValue={record.price} /></label><label>{kind === "product" ? "現有庫存" : "每時段總席次"}<input name="count" type="number" min={kind === "product" ? 0 : 1} max={kind === "product" ? 9999 : 20} step={1} required defaultValue={kind === "product" ? (record as MoriProduct).stock : (record as MoriWorkshop).capacity} /></label></div><div className="mori-between"><Select value={active} onValueChange={setActive}><SelectTrigger aria-label={`${record.name}上架狀態`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">上架中</SelectItem><SelectItem value="false">暫停上架</SelectItem></SelectContent></Select><button className="mori-button">儲存</button></div></form>;
}

export function MoriAdmin() {
  const data = useMori();
  const [bag, setBag] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [cancel, setCancel] = useState("");
  const [month, setMonth] = useState(() => new Date());
  const [date, setDate] = useState("");
  const orders = data.orders.filter(o => (status === "all" || o.status === status) && `${o.id} ${o.name} ${o.email}`.toLowerCase().includes(search.toLowerCase()));
  const activeOrders = data.orders.filter(o => o.status !== "已取消");
  const bookings = activeOrders.flatMap(o => o.items.filter(i => i.kind === "workshop").map(i => ({ ...i, order: o })));
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const changeStatus = (id: string, value: string) => { if (value === "已取消") { setCancel(id); return; } try { updateMori(d => setMoriOrderStatus(d, id, value as MoriOrder["status"])); setMessage("訂單狀態已更新。"); } catch(e) { setMessage(errorMessage(e)); } };
  return <main className="mori-root"><MoriHeader onBag={() => setBag(true)} /><section className="mori-admin">
    <div className="mori-section-head"><div><p className="mori-eyebrow">MORI / STUDIO OPERATIONS</p><h1>工作室管理台</h1><p>預約、訂單與器物，放在同一張工作桌上。</p></div><a className="mori-text-button" href={moriPath()}>查看前台 ↗</a></div>
    <div className="mori-admin-notice">公開展示管理台 · 無登入權限保護 · 只操作此瀏覽器的示範資料，請勿輸入真實客戶資料。</div>
    <div className="mori-metrics"><div><span>待確認訂單</span><strong>{activeOrders.filter(o => o.status === "待確認").length}<small>筆</small></strong></div><div><span>已登記體驗人次</span><strong>{bookings.reduce((n, i) => n + i.quantity, 0)}<small>位</small></strong></div><div><span>示範已付款總額</span><strong>{moriMoney(activeOrders.filter(o => o.paid).reduce((n, o) => n + o.total, 0))}</strong></div></div>
    <Tabs defaultValue="orders" className="mori-tabs"><TabsList><TabsTrigger value="orders">訂單管理</TabsTrigger><TabsTrigger value="calendar">預約月曆</TabsTrigger><TabsTrigger value="catalog">器物與課程</TabsTrigger></TabsList>
      <TabsContent value="orders"><div className="mori-filter"><label>搜尋訂單<input value={search} onChange={e => setSearch(e.target.value)} placeholder="編號、姓名或 Email" /></label><Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="篩選訂單狀態"><SelectValue /></SelectTrigger><SelectContent>{[["all", "所有狀態"], ...["待確認", "已確認", "已完成", "已取消"].map(s => [s, s])].map(([v, t]) => <SelectItem key={v} value={v}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div className="mori-table"><Table><TableHeader><TableRow>{["訂單 / 客戶", "項目", "金額 / 付款", "訂單狀態"].map(t => <TableHead key={t}>{t}</TableHead>)}</TableRow></TableHeader><TableBody>{orders.map(o => <TableRow key={o.id}><TableCell><strong>{o.id}</strong><p>{o.name} · {o.phone}</p><p>{o.email}</p>{o.address && <p>地址：{o.address}</p>}{o.note && <p>備註：{o.note}</p>}</TableCell><TableCell>{o.items.map((i, n) => <p key={n}>{i.name} × {i.quantity}{i.date && <small>{i.date} {i.time}</small>}</p>)}</TableCell><TableCell><strong>{moriMoney(o.total)}</strong><p>{o.paid ? "已付款（示範）" : "待付款"}</p>{!o.paid && o.status !== "已取消" && <button className="mori-text-button" onClick={() => { try { updateMori(d => ({ ...d, orders: d.orders.map(r => r.id === o.id ? { ...r, paid: true } : r) })); setMessage("已標記示範款項收到。"); } catch(e) { setMessage(errorMessage(e)); } }}>標記已付款</button>}</TableCell><TableCell><Select value={o.status} disabled={o.status === "已取消"} onValueChange={v => changeStatus(o.id, v)}><SelectTrigger aria-label={`${o.id}訂單狀態`}><SelectValue /></SelectTrigger><SelectContent>{["待確認", "已確認", "已完成", "已取消"].map(s => <SelectItem value={s} key={s}>{s}</SelectItem>)}</SelectContent></Select></TableCell></TableRow>)}{!orders.length && <TableRow><TableCell colSpan={4}><div className="mori-empty"><Package size={30} /><h3>{data.orders.length ? "沒有符合條件的訂單" : "工作桌準備好了。"}</h3><p>{data.orders.length ? "試試其他關鍵字或狀態。" : "在前台完成一筆示範結帳，訂單就會出現在這裡。"}</p><a className="mori-text-button" href={moriPath()}>前往前台 ↗</a></div></TableCell></TableRow>}</TableBody></Table></div>
      </TabsContent>
      <TabsContent value="calendar"><div className="mori-calendar-layout"><div><div className="mori-calendar-title"><button aria-label="上個月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button><h2>{month.getFullYear()} 年 {month.getMonth() + 1} 月</h2><button aria-label="下個月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button></div><div className="mori-calendar">{"日一二三四五六".split("").map(d => <span key={d}>{d}</span>)}{Array.from({ length: start.getDay() }, (_, i) => <i key={`blank${i}`} />)}{Array.from({ length: days }, (_, i) => { const key = localDate(new Date(month.getFullYear(), month.getMonth(), i + 1)); const count = bookings.filter(b => b.date === key).reduce((n, b) => n + b.quantity, 0); return <button key={key} aria-pressed={date === key} onClick={() => setDate(key)}>{i + 1}{count > 0 && <small>{count} 位</small>}</button>; })}</div></div><div className="mori-schedule"><h2>{date || "選擇日期"}</h2><p>{date ? "當日體驗安排" : "點選月曆查看預約。"}</p>{bookings.filter(b => b.date === date).map((b, i) => <article key={i}><strong>{b.time} · {b.name}</strong><p>{b.order.name} · {b.quantity} 位 · {b.order.status}</p></article>)}{date && !bookings.some(b => b.date === date) && <p className="mori-empty">當日沒有已登記的體驗。</p>}</div></div></TabsContent>
      <TabsContent value="catalog"><h2 className="mori-admin-subheading">課程與每時段總席次</h2><p>調低席次不會取消既有預約；已成立訂單保留原價。</p><div className="mori-card-grid">{data.workshops.map(w => <CatalogEditor key={`${w.id}-${w.price}-${w.capacity}-${w.active}`} record={w} kind="workshop" report={setMessage} />)}</div><h2 className="mori-admin-subheading">日常器物與現有庫存</h2><div className="mori-card-grid">{data.products.map(p => <CatalogEditor key={`${p.id}-${p.price}-${p.stock}-${p.active}`} record={p} kind="product" report={setMessage} />)}</div></TabsContent>
    </Tabs>{message && <p className="mori-feedback" role="status">{message}</p>}
  </section><MoriFooter />{bag && <MoriBag onClose={() => setBag(false)} />}{cancel && <CancelOrder id={cancel} close={() => setCancel("")} report={setMessage} />}</main>;
}
