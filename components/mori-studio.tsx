"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, ShoppingBag, UserRound, Minus, Plus, Trash2, Check, Clock, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useMori, updateMori } from "@/lib/mori-store";
import { addMoriCart, checkoutMori, localDate, MORI_TIMES, moriMoney, resolveCart, slotRemaining, type MoriCheckout, type MoriWorkshop } from "@/lib/mori-domain";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const moriPath = (path = "") => `${base}/mori-studio/${path}`;
export const moriImage = (name: string) => `${base}/images/mori-${name}.webp`;
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : "操作沒有完成，請再試一次。";

export function MoriHeader({ onBag }: { onBag: () => void }) {
  const data = useMori();
  return <><div className="mori-notice">給日常一點留白。陶作體驗，開放預約中。</div>
    <header className="mori-header"><a className="mori-logo" href={moriPath()}>mori<span>留白陶作</span></a>
      <nav aria-label="留白導覽"><a href={moriPath("#experiences")}>手作體驗</a><a href={moriPath("#objects")}>日常器物</a><a href={moriPath("#studio")}>關於留白</a></nav>
      <div><a href={moriPath("member/")} aria-label="會員空間"><UserRound size={20} /></a><button onClick={onBag} aria-label="開啟購物袋"><ShoppingBag size={20} /><span>{data.cart.reduce((n, i) => n + i.quantity, 0)}</span></button></div>
    </header></>;
}

export function MoriFooter() {
  return <footer className="mori-footer"><div><a className="mori-logo" href={moriPath()}>mori<span>留白陶作</span></a><p>讓日常，多一點手作的溫度。</p></div><div><a href={moriPath("member/")}>會員空間</a><a href={moriPath("admin/")}>展示管理台</a><a href={`${base}/#work`}>回到作品集 ↗</a></div><p className="mori-demo-note">互動概念作品 · 資料僅存於此瀏覽器，清除瀏覽資料會重設。預約、會員與付款皆為示範，無實際扣款或寄送。</p></footer>;
}

function BookingDialog({ workshop, onClose, onAdded }: { workshop: MoriWorkshop; onClose: () => void; onAdded: () => void }) {
  const data = useMori();
  const dates = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d; });
  const [date, setDate] = useState(localDate(dates[0]));
  const [time, setTime] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const add = () => {
    try { updateMori(d => addMoriCart(d, { id: workshop.id, kind: "workshop", quantity, date, time })); onAdded(); }
    catch (e) { setError(errorMessage(e)); }
  };
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="mori-dialog">
    <p className="mori-eyebrow">YOUR SLOW AFTERNOON</p><DialogTitle>{workshop.name}</DialogTitle><DialogDescription>{workshop.duration} · 材料、工具與燒製包含於體驗費用。示範預約不會保留實際席次。</DialogDescription>
    <h3>01 / 選一個喜歡的日子</h3><div className="mori-dates">{dates.map(d => <button key={localDate(d)} aria-pressed={date === localDate(d)} onClick={() => { setDate(localDate(d)); setTime(""); }}>{d.getMonth() + 1}月<b>{d.getDate()}</b><small>週{"日一二三四五六"[d.getDay()]}</small></button>)}</div>
    <h3>02 / 選擇時段</h3><div className="mori-times">{MORI_TIMES.map(t => { const left = slotRemaining(data, workshop.id, date, t); return <button key={t} disabled={left < quantity} aria-pressed={time === t} onClick={() => setTime(t)}>{t}<small>剩餘 {left} 席</small></button>; })}</div>
    <div className="mori-between"><h3>03 / 一起來的人數</h3><div className="mori-stepper"><button aria-label="減少人數" disabled={quantity <= 1} onClick={() => setQuantity(q => q - 1)}><Minus size={16} /></button><span>{quantity}</span><button aria-label="增加人數" disabled={quantity >= workshop.capacity} onClick={() => { setQuantity(q => q + 1); setTime(""); }}><Plus size={16} /></button></div></div>
    {error && <p className="mori-error" role="alert">{error}</p>}<div className="mori-dialog-bottom"><strong>{moriMoney(workshop.price * quantity)}</strong><button className="mori-button" disabled={!time} onClick={add}>加入購物袋 <ArrowUpRight size={18} /></button></div>
  </DialogContent></Dialog>;
}

export function MoriBag({ onClose }: { onClose: () => void }) {
  const data = useMori();
  const [stage, setStage] = useState<"bag" | "checkout" | "done">("bag");
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState("");
  const [form, setForm] = useState<MoriCheckout>({ ...data.member, address: "", note: "", delivery: "pickup", payment: "demo" });
  const submitting = useRef(false);
  let items: ReturnType<typeof resolveCart> = [];
  let invalid = false;
  try { items = resolveCart(data); } catch { invalid = true; }
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const hasProducts = items.some(i => i.kind === "product");
  const shipping = hasProducts && form.delivery === "shipping" && subtotal < 1800 ? 80 : 0;
  const field = (name: keyof MoriCheckout, value: string) => setForm(f => ({ ...f, [name]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    try { const id = `MR-${Date.now().toString(36).toUpperCase()}`; updateMori(d => checkoutMori(d, form, id)); setCompleted(id); setStage("done"); }
    catch (e) { setError(errorMessage(e)); } finally { submitting.current = false; }
  };
  const startCheckout = () => { try { updateMori(d => ({ ...d, signedIn: true })); setStage("checkout"); setError(""); } catch (e) { setError(errorMessage(e)); } };
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="mori-dialog mori-bag">
    <p className="mori-eyebrow">LITTLE THINGS, WELL CHOSEN.</p><DialogTitle>{stage === "bag" ? "你的購物袋" : stage === "checkout" ? "把喜歡的，帶回日常。" : "已收到你的示範訂單。"}</DialogTitle>
    <DialogDescription>{stage === "done" ? "訂單與預約已同步到本瀏覽器的會員空間及管理台。" : "此為互動作品。請使用示範聯絡資料，不會收款或寄送通知。"}</DialogDescription>
    {stage === "done" ? <div className="mori-success"><Check size={38} /><h3>{completed}</h3><p>{form.payment === "demo" ? "示範付款完成 · 等待管理台確認" : "已登記待付款 · 請勿實際匯款"}</p><a className="mori-button" href={moriPath("member/")}>查看我的紀錄 <ArrowUpRight size={18} /></a><button className="mori-text-button" onClick={onClose}>繼續逛逛</button></div> : <>
      {stage === "bag" && <>{data.cart.length ? <>{data.cart.map((item, index) => { const record = (item.kind === "workshop" ? data.workshops : data.products).find(i => i.id === item.id); return <div className="mori-bag-line" key={`${item.id}-${index}`}><img src={moriImage(item.kind === "workshop" ? "hands" : "objects")} alt="" /><div><h3>{record?.name ?? "已下架項目"}</h3><p>{item.kind === "workshop" ? `${item.date} · ${item.time}` : "手工製作 · 每一件都不一樣"}</p><span>{item.quantity} {item.kind === "workshop" ? "位" : "件"} · {moriMoney((record?.price ?? 0) * item.quantity)}</span></div><button aria-label={`移除${record?.name ?? "項目"}`} onClick={() => { try { updateMori(d => ({ ...d, cart: d.cart.filter((_, i) => i !== index) })); } catch(e) { setError(errorMessage(e)); } }}><Trash2 size={18} /></button></div>; })}<div className="mori-between"><span>小計</span><strong>{moriMoney(subtotal)}</strong></div><button className="mori-button mori-full" disabled={invalid} onClick={startCheckout}>以示範會員結帳 <ArrowUpRight size={18} /></button>{invalid && <p className="mori-error">請先移除已下架項目。</p>}</> : <div className="mori-empty"><ShoppingBag size={34} /><h3>還留著一點空間。</h3><p>去挑一堂體驗，或一件日常器物吧。</p><button className="mori-button" onClick={onClose}>繼續探索</button></div>}</>}
      {stage === "checkout" && <form className="mori-form" onSubmit={submit}><button type="button" className="mori-text-button" onClick={() => setStage("bag")}>← 返回購物袋</button><h3>01 / 聯絡資料</h3><div className="mori-form-grid"><label>姓名<input required maxLength={40} value={form.name} onChange={e => field("name", e.target.value)} /></label><label>聯絡電話<input required type="tel" value={form.phone} onChange={e => field("phone", e.target.value)} /></label></div><label>Email<input required type="email" value={form.email} onChange={e => field("email", e.target.value)} /></label>
        {hasProducts && <><h3>02 / 收件方式</h3><div className="mori-options"><label><input type="radio" name="delivery" checked={form.delivery === "pickup"} onChange={() => field("delivery", "pickup")} /> 工作室自取 · 免運</label><label><input type="radio" name="delivery" checked={form.delivery === "shipping"} onChange={() => field("delivery", "shipping")} /> 宅配 NT$ 80 · 滿 1,800 免運</label></div>{form.delivery === "shipping" && <label>收件地址<input required minLength={5} value={form.address} onChange={e => field("address", e.target.value)} /></label>}</>}
        <h3>{hasProducts ? "03" : "02"} / 付款方式</h3><div className="mori-options"><label><input type="radio" name="payment" checked={form.payment === "demo"} onChange={() => field("payment", "demo")} /> 模擬付款成功（不收集卡號、不扣款）</label><label><input type="radio" name="payment" checked={form.payment === "transfer"} onChange={() => field("payment", "transfer")} /> 登記待付款（請勿實際匯款）</label></div><label>想告訴我們的事<textarea maxLength={500} value={form.note} onChange={e => field("note", e.target.value)} placeholder="例如：希望和朋友坐在一起" /></label><div className="mori-total"><div><span>小計</span><span>{moriMoney(subtotal)}</span></div><div><span>運費</span><span>{moriMoney(shipping)}</span></div><div><strong>合計</strong><strong>{moriMoney(subtotal + shipping)}</strong></div></div><button className="mori-button mori-full">確認送出示範訂單 <ArrowUpRight size={18} /></button></form>}
      {error && <p className="mori-error" role="alert">{error}</p>}
    </>}
  </DialogContent></Dialog>;
}

export function MoriStudio() {
  const data = useMori();
  const [booking, setBooking] = useState<MoriWorkshop | null>(null);
  const [bag, setBag] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const addProduct = (id: string) => { try { updateMori(d => addMoriCart(d, { id, kind: "product", quantity: quantities[id] ?? 1 })); setBag(true); setError(""); } catch(e) { setError(errorMessage(e)); } };
  return <main className="mori-root"><MoriHeader onBag={() => setBag(true)} />
    <section className="mori-hero"><div className="mori-hero-copy"><p className="mori-eyebrow">A LITTLE SLOWER. A LITTLE CLOSER.</p><h1>把時間，<br />揉進<em>日常。</em></h1><p>一點泥土，一雙手。<br />在不趕時間的午後，做一件屬於自己的器物。</p><a className="mori-button" href="#experiences">找到你的手作時光 <ArrowUpRight size={18} /></a><span className="mori-hero-foot">TAIPEI, TAIWAN <i /> POTTERY & EVERYDAY OBJECTS</span></div><div className="mori-hero-photo"><img src={moriImage("studio")} alt="柔和午後光線中的陶作工作室與手作花器" /><div><span>THE STUDIO, IN A QUIET AFTERNOON.</span><span>01 / 03</span></div></div></section>
    <div className="mori-values"><span>SMALL MOMENTS, MADE BY HAND.</span><span>小班教學</span><span>零基礎友善</span><span>每件作品，都是唯一</span></div>
    <section id="experiences" className="mori-section"><div className="mori-section-head"><div><p className="mori-eyebrow">01 / THE EXPERIENCES</p><h2>手作，也是一種休息。</h2></div><p>不需要經驗，只需要帶著好奇。<br />從第一下觸碰泥土，慢慢找到自己的節奏。</p></div><div className="mori-card-grid">{data.workshops.filter(w => w.active).map((w, i) => <article className="mori-experience" key={w.id}><div className={`mori-card-image mori-crop-${i}`}><img loading="lazy" src={moriImage(i === 2 ? "objects" : "hands")} alt={w.name} /><span>0{i + 1} / {w.english}</span></div><div className="mori-card-copy"><h3>{w.name}</h3><p>{w.description}</p><div className="mori-card-meta"><span><Clock size={14} />{w.duration}</span><span><Users size={14} />最多 {w.capacity} 位</span></div><div className="mori-card-action"><strong>{moriMoney(w.price)} <small>/ 人</small></strong><button onClick={() => setBooking(w)}>預約體驗 <ArrowUpRight size={17} /></button></div></div></article>)}</div></section>
    <section id="studio" className="mori-story"><div><img loading="lazy" src={moriImage("studio")} alt="木桌上的手作陶器與自然光" /></div><div className="mori-story-copy"><p className="mori-eyebrow">A SPACE TO SIMPLY BE.</p><h2>不必完美，<br />只要是<em>你的樣子。</em></h2><p>我們喜歡手作留下的小小痕跡。<br />不那麼對稱的邊緣，意想不到的釉色，<br />都是雙手與泥土之間，獨有的對話。</p><p>留一個下午給自己。<br />在這裡，把生活的步調，調慢一點。</p><a className="mori-text-button" href="#experiences">來做一件自己的器物 ↗</a></div></section>
    <section id="objects" className="mori-section"><div className="mori-section-head"><div><p className="mori-eyebrow">02 / EVERYDAY OBJECTS</p><h2>把喜歡的，放進生活。</h2></div><p>掌心的溫度，餐桌的風景。<br />慢慢製作，也值得慢慢使用。</p></div><div className="mori-card-grid">{data.products.filter(p => p.active).map(p => <article className="mori-product" key={p.id}><div className="mori-product-photo" style={{ backgroundColor: p.color }}><img loading="lazy" src={moriImage("objects")} alt={p.name} style={{ objectPosition: p.position, transform: "scale(1.65)", transformOrigin: p.position }} /><span>{p.english}</span></div><div className="mori-between"><h3>{p.name}</h3><span>{moriMoney(p.price)}</span></div><p>手工陶器 · {p.stock ? `現有 ${p.stock} 件` : "暫時售完"}</p><div className="mori-card-action"><div className="mori-stepper"><button aria-label={`減少${p.name}數量`} disabled={(quantities[p.id] ?? 1) <= 1} onClick={() => setQuantities(q => ({ ...q, [p.id]: (q[p.id] ?? 1) - 1 }))}><Minus size={14} /></button><span>{quantities[p.id] ?? 1}</span><button aria-label={`增加${p.name}數量`} disabled={(quantities[p.id] ?? 1) >= Math.min(p.stock, 20)} onClick={() => setQuantities(q => ({ ...q, [p.id]: (q[p.id] ?? 1) + 1 }))}><Plus size={14} /></button></div><button disabled={!p.stock} onClick={() => addProduct(p.id)}>加入購物袋 <Plus size={17} /></button></div></article>)}</div>{error && <p className="mori-error" role="alert">{error}</p>}</section>
    <section className="mori-member-invite"><p className="mori-eyebrow">YOUR LITTLE CORNER</p><h2>收藏每一次，<br />與日常相遇的時光。</h2><p>在會員空間，查看你的手作預約與器物訂單。</p><a className="mori-button" href={moriPath("member/")}>走進會員空間 <ArrowUpRight size={18} /></a></section>
    <MoriFooter />{booking && <BookingDialog workshop={booking} onClose={() => setBooking(null)} onAdded={() => { setBooking(null); setBag(true); }} />}{bag && <MoriBag onClose={() => setBag(false)} />}
  </main>;
}
