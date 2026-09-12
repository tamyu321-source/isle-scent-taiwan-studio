"use client";

import Image from "next/image";
import {
  ArrowLeft, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3,
  ExternalLink, ImagePlus, Images, LayoutDashboard, LogOut, MessageSquare,
  PackageOpen, PawPrint, Pencil, Plus, RotateCcw, Search, Settings, Trash2,
  Upload, Users, WalletCards,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BookingStatus, newPigletId, PaymentStatus, PigletBooking,
  PigletCustomer, PigletFee, PigletPlan, readPigletImage, usePigletStore,
} from "@/lib/piglet-store";

type AdminView = "overview" | "bookings" | "customers" | "fees" | "albums" | "plans" | "messages" | "settings";

const navItems: { id: AdminView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "今日總覽", icon: LayoutDashboard },
  { id: "bookings", label: "預約管理", icon: CalendarDays },
  { id: "customers", label: "客戶資料", icon: Users },
  { id: "fees", label: "費用資料", icon: WalletCards },
  { id: "albums", label: "日常記錄", icon: Images },
  { id: "plans", label: "價格方案", icon: PackageOpen },
  { id: "messages", label: "留言管理", icon: MessageSquare },
  { id: "settings", label: "網站設定", icon: Settings },
];

const bookingStatuses: BookingStatus[] = ["待確認", "已確認", "已取消"];
const paymentStatuses: PaymentStatus[] = ["待付款", "已付款", "已取消"];

function monthCells(value: Date) {
  const year = value.getFullYear();
  const month = value.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
}

export function PigletAdmin() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const { data, setData, ready, reset } = usePigletStore(basePath);
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [view, setView] = useState<AdminView>("overview");
  const [month, setMonth] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setAuthed(sessionStorage.getItem("piglet-admin-demo") === "yes"), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const customerName = (id: string) => data.customers.find((customer) => customer.id === id)?.name ?? "未指定客戶";
  const planName = (id: string) => data.plans.find((plan) => plan.id === id)?.name ?? "未指定方案";
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const cells = monthCells(month);
  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return data.customers;
    return data.customers.filter((customer) => [customer.name, customer.phone, customer.petName, customer.species].some((value) => value.toLowerCase().includes(keyword)));
  }, [data.customers, search]);

  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2400); };
  const updateBookingStatus = (id: string, status: BookingStatus) => setData((current) => ({ ...current, bookings: current.bookings.map((booking) => booking.id === id ? { ...booking, status } : booking) }));
  const updateFeeStatus = (id: string, status: PaymentStatus) => setData((current) => ({ ...current, fees: current.fees.map((fee) => fee.id === id ? { ...fee, status } : fee) }));

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("account") === "admin" && form.get("password") === "piglet2026") {
      sessionStorage.setItem("piglet-admin-demo", "yes");
      setAuthed(true);
    } else setLoginError("帳號或密碼不正確，請使用下方示範帳號。 ");
  }

  function logout() {
    sessionStorage.removeItem("piglet-admin-demo");
    setAuthed(false);
  }

  function addBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const booking: PigletBooking = { id: newPigletId(), customerId: String(values.get("customerId")), planId: String(values.get("planId")), date: String(values.get("date")), time: String(values.get("time")), status: String(values.get("status")) as BookingStatus, note: String(values.get("note")) };
    setData((current) => ({ ...current, bookings: [...current.bookings, booking] }));
    form.reset();
    flash("預約已新增");
  }

  function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const customer: PigletCustomer = { id: newPigletId(), name: String(values.get("name")), phone: String(values.get("phone")), petName: String(values.get("petName")), species: String(values.get("species")), notes: String(values.get("notes")) };
    setData((current) => ({ ...current, customers: [customer, ...current.customers] }));
    form.reset();
    flash("客戶資料已新增");
  }

  function editCustomer(customer: PigletCustomer) {
    const phone = window.prompt("聯絡電話", customer.phone);
    if (phone === null) return;
    const petName = window.prompt("毛孩名字", customer.petName);
    if (petName === null) return;
    const notes = window.prompt("備註", customer.notes);
    if (notes === null) return;
    setData((current) => ({ ...current, customers: current.customers.map((item) => item.id === customer.id ? { ...item, phone, petName, notes } : item) }));
    flash("客戶資料已更新");
  }

  function deleteCustomer(id: string) {
    if (!window.confirm("刪除客戶後，相關預約與費用也會一併刪除。確定嗎？")) return;
    setData((current) => ({ ...current, customers: current.customers.filter((item) => item.id !== id), bookings: current.bookings.filter((item) => item.customerId !== id), fees: current.fees.filter((item) => item.customerId !== id) }));
  }

  function addFee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const fee: PigletFee = { id: newPigletId(), customerId: String(values.get("customerId")), item: String(values.get("item")), amount: Number(values.get("amount")), date: String(values.get("date")), status: String(values.get("status")) as PaymentStatus, note: String(values.get("note")) };
    setData((current) => ({ ...current, fees: [fee, ...current.fees] }));
    form.reset();
    flash("費用資料已新增");
  }

  function addPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const plan: PigletPlan = { id: newPigletId(), name: String(values.get("name")), price: Number(values.get("price")), unit: String(values.get("unit")), description: String(values.get("description")), recommended: false };
    setData((current) => ({ ...current, plans: [...current.plans, plan] }));
    form.reset();
    flash("價格方案已新增");
  }

  function editPlan(plan: PigletPlan) {
    const name = window.prompt("方案名稱", plan.name);
    if (name === null) return;
    const price = window.prompt("價格", String(plan.price));
    if (price === null || Number.isNaN(Number(price))) return;
    const description = window.prompt("方案說明", plan.description);
    if (description === null) return;
    setData((current) => ({ ...current, plans: current.plans.map((item) => item.id === plan.id ? { ...item, name, price: Number(price), description } : item) }));
    flash("方案已更新");
  }

  function addAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setData((current) => ({ ...current, albums: [{ id: newPigletId(), title: String(values.get("title")), date: String(values.get("date")), cover: `${basePath}/images/daycare-hero.webp`, photos: [] }, ...current.albums] }));
    form.reset();
    flash("相簿資料夾已建立");
  }

  async function addAlbumPhotos(albumId: string, files: FileList | null) {
    if (!files?.length) return;
    const photos = await Promise.all(Array.from(files).map((file) => readPigletImage(file)));
    setData((current) => ({ ...current, albums: current.albums.map((album) => album.id === albumId ? { ...album, photos: [...album.photos, ...photos], cover: album.photos.length ? album.cover : photos[0] } : album) }));
    flash(`${photos.length} 張照片已上傳`);
  }

  async function updateHero(file?: File) {
    if (!file?.size) return;
    const heroImage = await readPigletImage(file, 1800);
    setData((current) => ({ ...current, heroImage }));
    flash("首頁大圖已更新");
  }

  if (!ready) return <main className="piglet-admin-loading"><PawPrint /><p>載入管理資料…</p></main>;

  if (!authed) return (
    <main className="piglet-login">
      <a href={`${basePath}/piglet-daycare/`}><ArrowLeft size={17} /> 回公開網站</a>
      <section>
        <div className="piglet-login-brand"><PawPrint /><p>豬仔仔幼兒園</p><span>ADMIN</span></div>
        <h1>歡迎回來，<br />小瑀。</h1>
        <form onSubmit={login}>
          <label>帳號<input name="account" autoComplete="username" required defaultValue="admin" /></label>
          <label>密碼<input name="password" type="password" autoComplete="current-password" required defaultValue="piglet2026" /></label>
          {loginError && <p>{loginError}</p>}
          <button type="submit">登入管理後台</button>
        </form>
        <div className="piglet-demo-account"><span>DEMO ACCOUNT</span><p>admin / piglet2026</p></div>
      </section>
    </main>
  );

  const renderOverview = () => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = [...data.bookings].filter((item) => item.date >= today && item.status !== "已取消").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
    const unpaid = data.fees.filter((fee) => fee.status === "待付款").reduce((sum, fee) => sum + fee.amount, 0);
    return <>
      <div className="piglet-admin-title"><div><p>TODAY AT A GLANCE</p><h1>嗨，小瑀！</h1><span>今天也一起把每個孩子照顧好。</span></div><a href={`${basePath}/piglet-daycare/`} target="_blank">查看前台 <ExternalLink size={17} /></a></div>
      <div className="piglet-admin-metrics"><article><Clock3 /><span>待確認預約</span><strong>{data.bookings.filter((item) => item.status === "待確認").length}</strong><small>筆需要處理</small></article><article><CheckCircle2 /><span>已確認預約</span><strong>{data.bookings.filter((item) => item.status === "已確認").length}</strong><small>筆目前排程</small></article><article><WalletCards /><span>待收款</span><strong>NT$ {unpaid.toLocaleString()}</strong><small>{data.fees.filter((fee) => fee.status === "待付款").length} 筆費用</small></article><article><Images /><span>日常照片</span><strong>{data.albums.reduce((sum, album) => sum + album.photos.length, 0)}</strong><small>{data.albums.length} 本相簿</small></article></div>
      <div className="piglet-admin-overview-grid"><section><div className="piglet-admin-panel-heading"><h2>近期預約</h2><button onClick={() => setView("bookings")}>查看月曆</button></div><div className="piglet-upcoming-list">{upcoming.map((booking) => <article key={booking.id}><time>{booking.date.slice(5).replace("-", "/")}<small>{booking.time}</small></time><div><strong>{customerName(booking.customerId)}</strong><span>{data.customers.find((item) => item.id === booking.customerId)?.petName} · {planName(booking.planId)}</span></div><b data-status={booking.status}>{booking.status}</b></article>)}</div></section><section className="piglet-admin-quick"><h2>快速操作</h2><button onClick={() => setView("bookings")}><Plus />新增預約</button><button onClick={() => setView("customers")}><Users />新增客戶</button><button onClick={() => setView("albums")}><ImagePlus />上傳日常</button></section></div>
    </>;
  };

  const renderBookings = () => <>
    <div className="piglet-admin-title"><div><p>BOOKING MANAGEMENT</p><h1>預約管理</h1><span>月曆、客戶與方案資料保持串聯。</span></div></div>
    <form className="piglet-admin-inline-form" onSubmit={addBooking}><select name="customerId" required defaultValue=""><option value="" disabled>選擇客戶</option>{data.customers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.petName}</option>)}</select><select name="planId" required defaultValue=""><option value="" disabled>選擇方案</option>{data.plans.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input name="date" type="date" required /><input name="time" type="time" required defaultValue="10:00" /><select name="status" defaultValue="待確認">{bookingStatuses.map((status) => <option key={status}>{status}</option>)}</select><input name="note" placeholder="備註" /><button type="submit"><Plus size={17} />新增預約</button></form>
    <div className="piglet-booking-layout"><section className="piglet-calendar"><div className="piglet-calendar-head"><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))} aria-label="上個月"><ChevronLeft /></button><h2>{month.getFullYear()} 年 {month.getMonth() + 1} 月</h2><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))} aria-label="下個月"><ChevronRight /></button></div><div className="piglet-calendar-week">{["日", "一", "二", "三", "四", "五", "六"].map((day) => <span key={day}>{day}</span>)}</div><div className="piglet-calendar-grid">{cells.map((day, index) => { const date = day ? `${monthKey}-${String(day).padStart(2, "0")}` : ""; const items = data.bookings.filter((booking) => booking.date === date); return <div className={day ? "" : "is-empty"} key={`${day}-${index}`}><b>{day}</b>{items.map((booking) => <button key={booking.id} onClick={() => updateBookingStatus(booking.id, booking.status === "待確認" ? "已確認" : booking.status)} data-status={booking.status}><span>{booking.time}</span>{data.customers.find((item) => item.id === booking.customerId)?.petName}</button>)}</div>; })}</div></section><section className="piglet-booking-list"><h2>本月預約</h2>{data.bookings.filter((item) => item.date.startsWith(monthKey)).map((booking) => <article key={booking.id}><div><strong>{customerName(booking.customerId)} · {data.customers.find((item) => item.id === booking.customerId)?.petName}</strong><span>{booking.date} {booking.time} · {planName(booking.planId)}</span><small>{booking.note}</small></div><select value={booking.status} onChange={(event) => updateBookingStatus(booking.id, event.target.value as BookingStatus)} data-status={booking.status}>{bookingStatuses.map((status) => <option key={status}>{status}</option>)}</select><button onClick={() => setData((current) => ({ ...current, bookings: current.bookings.filter((item) => item.id !== booking.id) }))} aria-label="刪除預約"><Trash2 size={17} /></button></article>)}</section></div>
  </>;

  const renderCustomers = () => <>
    <div className="piglet-admin-title"><div><p>CUSTOMER DATABASE</p><h1>客戶資料</h1><span>同時串聯預約、費用與毛孩資料。</span></div><label className="piglet-admin-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋姓名、電話或毛孩" /></label></div>
    <form className="piglet-admin-inline-form piglet-customer-form" onSubmit={addCustomer}><input name="name" required placeholder="客戶姓名" /><input name="phone" required placeholder="聯絡電話" /><input name="petName" required placeholder="毛孩名字" /><input name="species" required placeholder="品種／物種" /><input name="notes" placeholder="照顧備註" /><button type="submit"><Plus size={17} />新增客戶</button></form>
    <div className="piglet-admin-table"><div className="piglet-admin-table-head"><span>客戶 / 毛孩</span><span>聯絡方式</span><span>照顧備註</span><span>關聯資料</span><span>操作</span></div>{filteredCustomers.map((customer) => <article key={customer.id}><span><strong>{customer.name}</strong><small>{customer.petName} · {customer.species}</small></span><span>{customer.phone}</span><span>{customer.notes || "—"}</span><span>{data.bookings.filter((item) => item.customerId === customer.id).length} 筆預約<br />{data.fees.filter((item) => item.customerId === customer.id).length} 筆費用</span><span className="piglet-row-actions"><button onClick={() => editCustomer(customer)} aria-label="編輯客戶"><Pencil size={16} /></button><button onClick={() => deleteCustomer(customer.id)} aria-label="刪除客戶"><Trash2 size={16} /></button></span></article>)}</div>
  </>;

  const renderFees = () => <>
    <div className="piglet-admin-title"><div><p>PAYMENT RECORDS</p><h1>費用資料</h1><span>掌握每一筆待付款與已完成費用。</span></div></div>
    <form className="piglet-admin-inline-form" onSubmit={addFee}><select name="customerId" required defaultValue=""><option value="" disabled>選擇客戶</option>{data.customers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.petName}</option>)}</select><input name="item" required placeholder="費用品項" /><input name="amount" type="number" min="0" required placeholder="金額" /><input name="date" type="date" required /><select name="status" defaultValue="待付款">{paymentStatuses.map((status) => <option key={status}>{status}</option>)}</select><input name="note" placeholder="備註" /><button type="submit"><Plus size={17} />新增費用</button></form>
    <div className="piglet-fee-list">{data.fees.map((fee) => <article key={fee.id}><div className="piglet-fee-icon"><WalletCards /></div><div><strong>{fee.item}</strong><span>{customerName(fee.customerId)} · {data.customers.find((item) => item.id === fee.customerId)?.petName}</span><small>{fee.date} · {fee.note}</small></div><b>NT$ {fee.amount.toLocaleString()}</b><select value={fee.status} onChange={(event) => updateFeeStatus(fee.id, event.target.value as PaymentStatus)} data-status={fee.status}>{paymentStatuses.map((status) => <option key={status}>{status}</option>)}</select><button onClick={() => setData((current) => ({ ...current, fees: current.fees.filter((item) => item.id !== fee.id) }))} aria-label="刪除費用"><Trash2 size={17} /></button></article>)}</div>
  </>;

  const renderAlbums = () => <>
    <div className="piglet-admin-title"><div><p>DAILY ALBUMS</p><h1>日常記錄</h1><span>建立資料夾、一次上傳多張照片並選擇封面。</span></div></div>
    <form className="piglet-admin-inline-form piglet-album-form" onSubmit={addAlbum}><input name="title" required placeholder="相簿名稱" /><input name="date" type="date" required /><button type="submit"><Plus size={17} />新增資料夾</button></form>
    <div className="piglet-admin-albums">{data.albums.map((album) => <article key={album.id}><div className="piglet-admin-album-cover"><Image src={album.cover} alt={`${album.title}封面`} fill unoptimized={album.cover.startsWith("data:")} className="object-cover" /></div><div className="piglet-admin-album-title"><div><strong>{album.title}</strong><span>{album.date} · {album.photos.length} 張照片</span></div><label><Upload size={16} />上傳照片<input type="file" multiple accept="image/*" onChange={(event) => addAlbumPhotos(album.id, event.target.files)} /></label><button onClick={() => { const title = window.prompt("相簿名稱", album.title); if (title) setData((current) => ({ ...current, albums: current.albums.map((item) => item.id === album.id ? { ...item, title } : item) })); }} aria-label="編輯相簿名稱"><Pencil size={16} /></button><button onClick={() => { if (window.confirm("確定刪除整本相簿？")) setData((current) => ({ ...current, albums: current.albums.filter((item) => item.id !== album.id) })); }} aria-label="刪除相簿"><Trash2 size={16} /></button></div>{album.photos.length > 0 && <div className="piglet-admin-thumbs">{album.photos.map((photo, index) => <button key={`${photo}-${index}`} onClick={() => setData((current) => ({ ...current, albums: current.albums.map((item) => item.id === album.id ? { ...item, cover: photo } : item) }))} className={photo === album.cover ? "is-cover" : ""} title="設為封面"><Image src={photo} alt="相簿照片" fill unoptimized={photo.startsWith("data:")} className="object-cover" /></button>)}</div>}</article>)}</div>
  </>;

  const renderPlans = () => <>
    <div className="piglet-admin-title"><div><p>PRICE PLANS</p><h1>價格方案</h1><span>前台會立即顯示這裡設定的內容。</span></div></div>
    <form className="piglet-admin-inline-form piglet-plan-form" onSubmit={addPlan}><input name="name" required placeholder="方案名稱" /><input name="price" type="number" min="0" required placeholder="價格" /><input name="unit" required placeholder="單位，例如：晚" /><input name="description" required placeholder="方案說明" /><button type="submit"><Plus size={17} />新增方案</button></form>
    <div className="piglet-admin-plans">{data.plans.map((plan) => <article key={plan.id} className={plan.recommended ? "is-recommended" : ""}><div><span>{plan.recommended ? "RECOMMENDED" : "STAY PLAN"}</span><h2>{plan.name}</h2><p>{plan.description}</p></div><strong>NT$ {plan.price.toLocaleString()} <small>/ {plan.unit}</small></strong><div><button onClick={() => setData((current) => ({ ...current, plans: current.plans.map((item) => ({ ...item, recommended: item.id === plan.id ? !item.recommended : false })) }))}><CheckCircle2 size={16} />{plan.recommended ? "取消推薦" : "設為推薦"}</button><button onClick={() => editPlan(plan)}><Pencil size={16} />編輯</button><button onClick={() => setData((current) => ({ ...current, plans: current.plans.filter((item) => item.id !== plan.id), bookings: current.bookings.filter((item) => item.planId !== plan.id) }))}><Trash2 size={16} />刪除</button></div></article>)}</div>
  </>;

  const renderMessages = () => <>
    <div className="piglet-admin-title"><div><p>GUESTBOOK</p><h1>留言管理</h1><span>查看公開留言與照片，需要時可直接移除。</span></div></div>
    <div className="piglet-admin-messages">{data.messages.map((message) => <article key={message.id}>{message.photo ? <span className="piglet-admin-message-photo"><Image src={message.photo} alt="留言照片" fill unoptimized className="object-cover" /></span> : <span className="piglet-admin-message-icon"><MessageSquare /></span>}<div><strong>{message.name}</strong><time>{message.date}</time><p>{message.message}</p></div><button onClick={() => setData((current) => ({ ...current, messages: current.messages.filter((item) => item.id !== message.id) }))}><Trash2 size={17} />刪除留言</button></article>)}</div>
  </>;

  const renderSettings = () => <>
    <div className="piglet-admin-title"><div><p>WEBSITE SETTINGS</p><h1>網站設定</h1><span>管理首頁大圖與 LINE 預約入口。</span></div></div>
    <div className="piglet-settings-grid"><section><h2>首頁大圖</h2><div className="piglet-settings-hero"><Image src={data.heroImage} alt="目前首頁大圖" fill unoptimized={data.heroImage.startsWith("data:")} className="object-cover" /></div><label className="piglet-upload-button"><Upload size={17} />更換首頁照片<input type="file" accept="image/*" onChange={(event) => updateHero(event.target.files?.[0])} /></label></section><section><h2>LINE 預約連結</h2><p>將按鈕連到店家的 LINE 官方帳號或個人加好友網址。</p><form onSubmit={(event) => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get("lineUrl")); setData((current) => ({ ...current, lineUrl: value })); flash("LINE 連結已儲存"); }}><label>LINE URL<input name="lineUrl" type="url" required defaultValue={data.lineUrl} /></label><button type="submit">儲存連結</button></form><div className="piglet-reset-box"><RotateCcw /><div><strong>還原示範資料</strong><p>會清除目前瀏覽器內新增的預約、照片與留言。</p></div><button onClick={() => { if (window.confirm("確定還原所有示範資料？")) { reset(); flash("示範資料已還原"); } }}>立即還原</button></div></section></div>
  </>;

  const views: Record<AdminView, () => React.ReactNode> = { overview: renderOverview, bookings: renderBookings, customers: renderCustomers, fees: renderFees, albums: renderAlbums, plans: renderPlans, messages: renderMessages, settings: renderSettings };

  return (
    <main className="piglet-admin-shell">
      <aside className="piglet-admin-sidebar">
        <a className="piglet-admin-brand" href={`${basePath}/piglet-daycare/`}><span><PawPrint /></span><div><strong>豬仔仔幼兒園</strong><small>MANAGEMENT</small></div></a>
        <nav aria-label="後台管理功能">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setView(item.id)} className={view === item.id ? "is-active" : ""}><Icon size={19} /><span>{item.label}</span>{item.id === "bookings" && data.bookings.some((booking) => booking.status === "待確認") && <b>{data.bookings.filter((booking) => booking.status === "待確認").length}</b>}</button>; })}</nav>
        <div className="piglet-admin-user"><span>游</span><div><strong>游小瑀</strong><small>管理者</small></div><button onClick={logout} aria-label="登出"><LogOut size={17} /></button></div>
      </aside>
      <section className="piglet-admin-content">{notice && <div className="piglet-admin-notice"><CheckCircle2 />{notice}</div>}{views[view]()}</section>
      <nav className="piglet-admin-mobile-nav" aria-label="行動版後台導覽">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setView(item.id)} className={view === item.id ? "is-active" : ""}><Icon /><span>{item.label.slice(0, 2)}</span></button>; })}</nav>
    </main>
  );
}
