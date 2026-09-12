"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight, BarChart3, Check, ChevronRight, ClipboardList, Copy, ExternalLink,
  LayoutDashboard, Link2, LogOut, Menu, Package, PackageCheck, PackagePlus, Plus, RotateCcw,
  Search, Settings2, Trash2, Truck, X,
} from "lucide-react";
import {
  CustomerOrder, newOrderHubId, OrderHubData, OrderProduct, OrderStatus, orderHubCurrency,
  orderStatuses, useOrderHubStore,
} from "@/lib/order-store";

type AdminView = "overview" | "links" | "orders" | "purchase" | "shipping" | "products";

const adminNav: { id: AdminView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "營運總覽", icon: LayoutDashboard },
  { id: "links", label: "訂單連結", icon: Link2 },
  { id: "orders", label: "全部訂單", icon: ClipboardList },
  { id: "purchase", label: "訂貨管理", icon: PackagePlus },
  { id: "shipping", label: "出貨管理", icon: Truck },
  { id: "products", label: "商品庫存", icon: Package },
];

const statusClass: Record<OrderStatus, string> = {
  新訂單: "is-new", 已確認: "is-confirmed", 已訂貨: "is-ordered", 已到貨: "is-arrived",
  待出貨: "is-packing", 已出貨: "is-shipped", 已完成: "is-done", 已取消: "is-cancelled",
};

const formatDate = (value: string, includeTime = false) => new Intl.DateTimeFormat("zh-TW", {
  month: "2-digit", day: "2-digit", ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
}).format(new Date(value));

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (account === "admin" && password === "order2026") onLogin();
    else setError("帳號或密碼不正確，請使用下方展示帳號。 ");
  };
  return (
    <main className="oh-login">
      <section className="oh-login-brand"><div className="oh-login-grid" aria-hidden="true" /><a href="../" className="oh-login-logo"><span>OF</span> ORDER FLOW</a><div><p>FROM LINK</p><p>TO SHIPMENT</p></div><small>把散落在 Excel、訊息與出貨單裡的工作，集中到同一條訂單流程。</small></section>
      <section className="oh-login-panel">
        <form onSubmit={submit}>
          <p className="oh-kicker">ADMIN CONSOLE / 2026</p><h1>登入訂單中台</h1><p>管理訂單連結、訂貨進度、庫存與出貨。</p>
          <label><span>管理帳號</span><input autoComplete="username" value={account} onChange={(event) => setAccount(event.target.value)} placeholder="輸入帳號" /></label>
          <label><span>密碼</span><input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="輸入密碼" /></label>
          {error && <div className="oh-login-error">{error}</div>}
          <button className="oh-btn oh-btn-lime" type="submit">進入管理後台 <ArrowRight size={18} /></button>
          <div className="oh-demo-credentials"><span>作品展示帳號</span><button type="button" onClick={() => { setAccount("admin"); setPassword("order2026"); setError(""); }}>admin / order2026 <Copy size={14} /></button></div>
        </form>
      </section>
    </main>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`oh-status ${statusClass[status]}`}>{status}</span>;
}

function OrderTable({ data, orders, setData }: { data: OrderHubData; orders: CustomerOrder[]; setData: React.Dispatch<React.SetStateAction<OrderHubData>> }) {
  const updateStatus = (id: string, status: OrderStatus) => setData((current) => ({ ...current, orders: current.orders.map((order) => order.id === id ? { ...order, status } : order) }));
  const productName = (id: string) => data.products.find((product) => product.id === id)?.name ?? "已刪除商品";
  return (
    <div className="oh-table-wrap">
      <table className="oh-table">
        <thead><tr><th>訂單</th><th>客戶</th><th>品項</th><th>建立時間</th><th>金額</th><th>狀態</th></tr></thead>
        <tbody>{orders.map((order) => <tr key={order.id}>
          <td><strong>{order.number}</strong><small>{data.links.find((link) => link.id === order.linkId)?.name ?? "一般訂單"}</small></td>
          <td><strong>{order.customerName}</strong><small>{order.phone}</small></td>
          <td><strong>{order.items.reduce((sum, item) => sum + item.quantity, 0)} 件商品</strong><small>{order.items.map((item) => `${productName(item.productId)} × ${item.quantity}`).join("、")}</small></td>
          <td><strong>{formatDate(order.createdAt, true)}</strong><small>{order.address}</small></td>
          <td><strong>{orderHubCurrency(order.total)}</strong></td>
          <td><select aria-label="訂單狀態" className={`oh-status-select ${statusClass[order.status]}`} value={order.status} onChange={(event) => updateStatus(order.id, event.target.value as OrderStatus)}>{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select></td>
        </tr>)}</tbody>
      </table>
      {!orders.length && <div className="oh-empty"><ClipboardList size={26} /><p>目前沒有符合條件的訂單。</p></div>}
    </div>
  );
}

function Overview({ data, setData, goTo }: { data: OrderHubData; setData: React.Dispatch<React.SetStateAction<OrderHubData>>; goTo: (view: AdminView) => void }) {
  const activeOrders = data.orders.filter((order) => !["已完成", "已取消"].includes(order.status));
  const revenue = data.orders.filter((order) => order.status !== "已取消").reduce((sum, order) => sum + order.total, 0);
  const needsPurchase = data.orders.filter((order) => ["已確認", "已訂貨"].includes(order.status)).length;
  const needsShip = data.orders.filter((order) => ["已到貨", "待出貨"].includes(order.status)).length;
  const cards = [
    { label: "處理中訂單", value: String(activeOrders.length).padStart(2, "0"), note: `今日新增 ${data.orders.filter((order) => formatDate(order.createdAt) === formatDate(new Date().toISOString())).length} 筆`, icon: ClipboardList },
    { label: "待訂貨", value: String(needsPurchase).padStart(2, "0"), note: "已確認／訂貨中", icon: PackagePlus },
    { label: "待出貨", value: String(needsShip).padStart(2, "0"), note: "到貨／包裝中", icon: Truck },
    { label: "累計訂單額", value: orderHubCurrency(revenue), note: "不含取消訂單", icon: BarChart3 },
  ];
  const stages: { label: OrderStatus; color: string }[] = [
    { label: "新訂單", color: "#2f5cff" }, { label: "已確認", color: "#8e55ff" }, { label: "已訂貨", color: "#e4962a" },
    { label: "待出貨", color: "#d6ff3f" }, { label: "已出貨", color: "#51c6a8" }, { label: "已完成", color: "#8b948c" },
  ];
  const maxStage = Math.max(1, ...stages.map((stage) => data.orders.filter((order) => order.status === stage.label).length));
  return <>
    <div className="oh-admin-heading"><div><p className="oh-kicker">OPERATIONS / TODAY</p><h1>營運總覽</h1></div><button className="oh-btn oh-btn-dark" onClick={() => goTo("links")}><Plus size={17} /> 建立訂單連結</button></div>
    <div className="oh-metric-grid">{cards.map(({ label, value, note, icon: Icon }) => <article key={label}><div><span>{label}</span><Icon size={19} /></div><strong>{value}</strong><p>{note}</p></article>)}</div>
    <div className="oh-overview-grid">
      <section className="oh-panel oh-order-flow"><div className="oh-panel-head"><div><p className="oh-kicker">ORDER PIPELINE</p><h2>訂單進度</h2></div><button onClick={() => goTo("orders")}>查看全部 <ChevronRight size={16} /></button></div>
        <div className="oh-stage-chart">{stages.map((stage) => { const count = data.orders.filter((order) => order.status === stage.label).length; return <div key={stage.label}><span>{stage.label}</span><div><i style={{ width: `${Math.max(8, count / maxStage * 100)}%`, background: stage.color }} /></div><strong>{count}</strong></div>; })}</div>
      </section>
      <section className="oh-panel oh-action-panel"><div className="oh-panel-head"><div><p className="oh-kicker">NEXT ACTIONS</p><h2>下一步工作</h2></div></div>
        <button onClick={() => goTo("purchase")}><span><PackagePlus size={20} /><i>{needsPurchase}</i></span><div><strong>整理訂貨品項</strong><small>彙總已確認訂單的商品數量</small></div><ChevronRight size={18} /></button>
        <button onClick={() => goTo("shipping")}><span><Truck size={20} /><i>{needsShip}</i></span><div><strong>完成包裝出貨</strong><small>填寫物流單號並通知客戶</small></div><ChevronRight size={18} /></button>
        <button onClick={() => goTo("products")}><span><Package size={20} /><i>{data.products.filter((p) => p.stock <= p.reorderAt).length}</i></span><div><strong>檢查低庫存</strong><small>低於安全量的商品需要補貨</small></div><ChevronRight size={18} /></button>
      </section>
    </div>
    <section className="oh-panel"><div className="oh-panel-head"><div><p className="oh-kicker">LATEST ORDERS</p><h2>最新訂單</h2></div><button onClick={() => goTo("orders")}>完整清單 <ChevronRight size={16} /></button></div><OrderTable data={data} orders={data.orders.slice(0, 5)} setData={setData} /></section>
  </>;
}

function LinkManager({ data, setData }: { data: OrderHubData; setData: React.Dispatch<React.SetStateAction<OrderHubData>> }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", description: "", productIds: [] as string[] });
  const buildUrl = (slug: string) => typeof window === "undefined" ? "" : `${window.location.origin}${basePath}/order-hub/?link=${slug}`;
  const copy = async (slug: string) => { await navigator.clipboard.writeText(buildUrl(slug)); setCopied(slug); window.setTimeout(() => setCopied(""), 1400); };
  const add = (event: FormEvent) => {
    event.preventDefault(); if (!form.name || !form.slug || !form.productIds.length) return;
    setData((current) => ({ ...current, links: [{ id: newOrderHubId("link"), ...form, slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"), active: true, createdAt: new Date().toISOString() }, ...current.links] }));
    setForm({ name: "", slug: "", description: "", productIds: [] }); setShowForm(false);
  };
  return <>
    <div className="oh-admin-heading"><div><p className="oh-kicker">SALES CHANNELS</p><h1>訂單連結</h1><p>依團購、客群或活動建立不同下單頁，不再逐筆抄寫訂單。</p></div><button className="oh-btn oh-btn-dark" onClick={() => setShowForm(true)}><Plus size={17} /> 新增連結</button></div>
    {showForm && <form className="oh-panel oh-create-link" onSubmit={add}><div className="oh-panel-head"><div><p className="oh-kicker">NEW ORDER LINK</p><h2>建立專屬下單頁</h2></div><button type="button" onClick={() => setShowForm(false)}><X size={19} /></button></div>
      <div className="oh-admin-form-grid"><label><span>連結名稱</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例：十月熟客團購" /></label><label><span>網址代碼</span><div className="oh-slug-input"><small>?link=</small><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="october-vip" /></div></label><label className="oh-field-wide"><span>頁面說明</span><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="顯示在下單頁的截止日或活動說明" /></label></div>
      <fieldset className="oh-product-checks"><legend>可下單商品</legend>{data.products.filter((p) => p.active).map((product) => <label key={product.id}><input type="checkbox" checked={form.productIds.includes(product.id)} onChange={(e) => setForm({ ...form, productIds: e.target.checked ? [...form.productIds, product.id] : form.productIds.filter((id) => id !== product.id) })} /><span><strong>{product.name}</strong><small>{product.sku} · {orderHubCurrency(product.price)}</small></span></label>)}</fieldset>
      <div className="oh-form-actions"><button type="button" className="oh-btn oh-btn-ghost" onClick={() => setShowForm(false)}>取消</button><button className="oh-btn oh-btn-lime" type="submit">建立並啟用 <ArrowRight size={17} /></button></div>
    </form>}
    <div className="oh-link-list">{data.links.map((link) => <article key={link.id} className="oh-link-card"><div className="oh-link-card-top"><div className="oh-link-icon"><Link2 size={21} /></div><span className={`oh-live-dot ${link.active ? "is-live" : ""}`}>{link.active ? "OPEN" : "PAUSED"}</span></div><h2>{link.name}</h2><p>{link.description}</p><code>/order-hub/?link={link.slug}</code><div className="oh-link-products">{link.productIds.map((id) => <span key={id}>{data.products.find((p) => p.id === id)?.name}</span>)}</div><div className="oh-link-stats"><div><small>訂單數</small><strong>{data.orders.filter((order) => order.linkId === link.id).length}</strong></div><div><small>訂單額</small><strong>{orderHubCurrency(data.orders.filter((order) => order.linkId === link.id).reduce((sum, order) => sum + order.total, 0))}</strong></div></div><div className="oh-card-actions"><button onClick={() => copy(link.slug)}>{copied === link.slug ? <Check size={16} /> : <Copy size={16} />} {copied === link.slug ? "已複製" : "複製連結"}</button><a href={`${basePath}/order-hub/?link=${link.slug}`} target="_blank">預覽 <ExternalLink size={15} /></a><button aria-label="切換開放狀態" onClick={() => setData((current) => ({ ...current, links: current.links.map((item) => item.id === link.id ? { ...item, active: !item.active } : item) }))}><Settings2 size={16} /></button><button aria-label="刪除連結" onClick={() => setData((current) => ({ ...current, links: current.links.filter((item) => item.id !== link.id) }))}><Trash2 size={16} /></button></div></article>)}</div>
  </>;
}

function OrdersView({ data, setData }: { data: OrderHubData; setData: React.Dispatch<React.SetStateAction<OrderHubData>> }) {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState<"全部" | OrderStatus>("全部");
  const filtered = data.orders.filter((order) => (status === "全部" || order.status === status) && `${order.number}${order.customerName}${order.phone}`.toLowerCase().includes(query.toLowerCase()));
  return <><div className="oh-admin-heading"><div><p className="oh-kicker">ORDER DATABASE</p><h1>全部訂單</h1><p>客人送出後直接進入此清單，狀態會一路串到訂貨與出貨。</p></div></div><div className="oh-toolbar"><label><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜尋訂單編號、客戶或電話" /></label><div className="oh-filter-tabs">{(["全部", "新訂單", "已確認", "已訂貨", "待出貨", "已出貨"] as const).map((item) => <button className={status === item ? "is-active" : ""} key={item} onClick={() => setStatus(item)}>{item}</button>)}</div></div><section className="oh-panel"><OrderTable data={data} orders={filtered} setData={setData} /></section></>;
}

function PurchaseView({ data, setData }: { data: OrderHubData; setData: React.Dispatch<React.SetStateAction<OrderHubData>> }) {
  const relevant = data.orders.filter((order) => ["已確認", "已訂貨"].includes(order.status));
  const rows = data.products.map((product) => ({ product, quantity: relevant.flatMap((order) => order.items).filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0) })).filter((row) => row.quantity);
  const changeAll = (from: OrderStatus, to: OrderStatus) => setData((current) => ({ ...current, orders: current.orders.map((order) => order.status === from ? { ...order, status: to } : order) }));
  return <><div className="oh-admin-heading"><div><p className="oh-kicker">PURCHASE CONTROL</p><h1>訂貨管理</h1><p>依已確認訂單自動彙總需求，不再另外整理 Excel 數量。</p></div><button disabled={!relevant.some((o) => o.status === "已確認")} className="oh-btn oh-btn-dark" onClick={() => changeAll("已確認", "已訂貨")}><PackagePlus size={17} /> 全部標記已訂貨</button></div><div className="oh-purchase-summary"><div><span>待採購品項</span><strong>{String(rows.length).padStart(2, "0")}</strong></div><div><span>待處理訂單</span><strong>{String(relevant.length).padStart(2, "0")}</strong></div><div><span>預估採購成本</span><strong>{orderHubCurrency(rows.reduce((sum, row) => sum + row.quantity * row.product.cost, 0))}</strong></div></div><section className="oh-panel"><div className="oh-panel-head"><div><p className="oh-kicker">CONSOLIDATED LIST</p><h2>採購彙總單</h2></div></div><div className="oh-purchase-list">{rows.map(({ product, quantity }) => <article key={product.id}><div className="oh-product-token">{product.sku.slice(-2)}</div><div><small>{product.sku}</small><strong>{product.name}</strong><span>現有庫存 {product.stock} · 安全量 {product.reorderAt}</span></div><div><small>訂單需求</small><strong>{quantity}</strong></div><div><small>建議採購</small><strong>{Math.max(quantity - product.stock, product.reorderAt - product.stock, 0)}</strong></div><div><small>預估成本</small><strong>{orderHubCurrency(product.cost * Math.max(quantity - product.stock, 0))}</strong></div></article>)}</div>{!rows.length && <div className="oh-empty"><PackageCheck size={28} /><p>目前沒有需要訂貨的已確認訂單。</p></div>}</section><section className="oh-panel oh-receive-panel"><div><PackageCheck size={23} /><span><strong>供應商已到貨？</strong><small>會把所有「已訂貨」訂單推進到待包裝流程。</small></span></div><button disabled={!relevant.some((o) => o.status === "已訂貨")} onClick={() => changeAll("已訂貨", "已到貨")}>批次標記已到貨 <ArrowRight size={16} /></button></section></>;
}

function ShippingView({ data, setData }: { data: OrderHubData; setData: React.Dispatch<React.SetStateAction<OrderHubData>> }) {
  const orders = data.orders.filter((order) => ["已到貨", "待出貨", "已出貨"].includes(order.status));
  const update = (id: string, patch: Partial<CustomerOrder>) => setData((current) => ({ ...current, orders: current.orders.map((order) => order.id === id ? { ...order, ...patch } : order) }));
  return <><div className="oh-admin-heading"><div><p className="oh-kicker">FULFILLMENT</p><h1>出貨管理</h1><p>核對地址、填入物流單號，並保留每筆訂單的出貨狀態。</p></div></div><div className="oh-shipping-board">{orders.map((order) => <article key={order.id} className="oh-shipping-card"><div className="oh-shipping-top"><StatusPill status={order.status} /><strong>{order.number}</strong><span>{formatDate(order.createdAt, true)}</span></div><div className="oh-shipping-customer"><div className="oh-initial">{order.customerName.slice(0, 1)}</div><div><h2>{order.customerName}</h2><p>{order.phone}</p></div></div><address>{order.address}</address><div className="oh-shipping-items">{order.items.map((item) => <div key={item.productId}><span>{data.products.find((product) => product.id === item.productId)?.name}</span><strong>× {item.quantity}</strong></div>)}</div><label><span>物流單號</span><input value={order.trackingNo} onChange={(e) => update(order.id, { trackingNo: e.target.value })} placeholder="輸入宅配／超商物流單號" /></label><div className="oh-shipping-actions">{order.status === "已到貨" && <button onClick={() => update(order.id, { status: "待出貨" })}>完成包裝 <PackageCheck size={16} /></button>}{order.status === "待出貨" && <button disabled={!order.trackingNo} className="is-primary" onClick={() => update(order.id, { status: "已出貨" })}>確認出貨 <Truck size={16} /></button>}{order.status === "已出貨" && <button onClick={() => update(order.id, { status: "已完成" })}>完成訂單 <Check size={16} /></button>}</div></article>)}</div>{!orders.length && <div className="oh-panel oh-empty"><Truck size={28} /><p>目前沒有待處理的出貨訂單。</p></div>}</>;
}

function ProductsView({ data, setData }: { data: OrderHubData; setData: React.Dispatch<React.SetStateAction<OrderHubData>> }) {
  const empty: Omit<OrderProduct, "id"> = { name: "", sku: "", description: "", price: 0, cost: 0, stock: 0, reorderAt: 5, active: true };
  const [showForm, setShowForm] = useState(false); const [form, setForm] = useState(empty);
  const add = (event: FormEvent) => { event.preventDefault(); setData((current) => ({ ...current, products: [...current.products, { id: newOrderHubId("product"), ...form }] })); setForm(empty); setShowForm(false); };
  const stock = (id: string, amount: number) => setData((current) => ({ ...current, products: current.products.map((product) => product.id === id ? { ...product, stock: Math.max(0, product.stock + amount) } : product) }));
  return <><div className="oh-admin-heading"><div><p className="oh-kicker">PRODUCT MASTER</p><h1>商品與庫存</h1><p>訂單連結與訂貨彙總共用同一份商品資料。</p></div><button className="oh-btn oh-btn-dark" onClick={() => setShowForm(true)}><Plus size={17} /> 新增商品</button></div>{showForm && <form className="oh-panel oh-product-form" onSubmit={add}><div className="oh-panel-head"><div><p className="oh-kicker">NEW PRODUCT</p><h2>新增商品</h2></div><button type="button" onClick={() => setShowForm(false)}><X size={19} /></button></div><div className="oh-admin-form-grid"><label><span>商品名稱</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label><span>SKU</span><input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></label><label className="oh-field-wide"><span>商品說明</span><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label><span>售價</span><input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></label><label><span>成本</span><input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></label><label><span>目前庫存</span><input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></label><label><span>安全庫存</span><input type="number" min="0" value={form.reorderAt} onChange={(e) => setForm({ ...form, reorderAt: Number(e.target.value) })} /></label></div><div className="oh-form-actions"><button type="button" className="oh-btn oh-btn-ghost" onClick={() => setShowForm(false)}>取消</button><button className="oh-btn oh-btn-lime" type="submit">儲存商品</button></div></form>}<section className="oh-panel"><div className="oh-product-table-head"><span>商品資料</span><span>售價</span><span>成本</span><span>庫存調整</span><span>狀態</span></div><div className="oh-product-rows">{data.products.map((product) => <article key={product.id}><div><div className="oh-product-token">{product.sku.slice(-2)}</div><span><strong>{product.name}</strong><small>{product.sku}</small></span></div><strong>{orderHubCurrency(product.price)}</strong><span>{orderHubCurrency(product.cost)}</span><div className={`oh-stock-control ${product.stock <= product.reorderAt ? "is-low" : ""}`}><button onClick={() => stock(product.id, -1)}>-</button><strong>{product.stock}</strong><button onClick={() => stock(product.id, 1)}>+</button>{product.stock <= product.reorderAt && <small>LOW</small>}</div><button className={`oh-product-state ${product.active ? "is-active" : ""}`} onClick={() => setData((current) => ({ ...current, products: current.products.map((item) => item.id === product.id ? { ...item, active: !item.active } : item) }))}>{product.active ? "上架" : "停用"}</button></article>)}</div></section></>;
}

export function OrderAdmin() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const { data, setData, ready, reset } = useOrderHubStore();
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState<AdminView>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const newCount = data.orders.filter((order) => order.status === "新訂單").length;
  const title = adminNav.find((item) => item.id === view)?.label;
  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  return (
    <main className={`oh-admin ${ready ? "is-ready" : ""}`}>
      <aside className={`oh-sidebar ${mobileNav ? "is-open" : ""}`}>
        <div className="oh-sidebar-brand"><a href={`${basePath}/`}><span>OF</span><strong>ORDER FLOW<small>OPERATIONS</small></strong></a><button onClick={() => setMobileNav(false)}><X size={20} /></button></div>
        <nav>{adminNav.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "is-active" : ""} onClick={() => { setView(id); setMobileNav(false); }}><Icon size={19} /><span>{label}</span>{id === "orders" && newCount > 0 && <b>{newCount}</b>}</button>)}</nav>
        <div className="oh-sidebar-foot"><div><span>ADMIN</span><strong>游小瑀</strong></div><button title="登出" onClick={() => setLoggedIn(false)}><LogOut size={18} /></button></div>
      </aside>
      {mobileNav && <button className="oh-nav-shade" aria-label="關閉選單" onClick={() => setMobileNav(false)} />}
      <section className="oh-admin-main">
        <header className="oh-admin-topbar"><button className="oh-menu-button" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div><span>ORDER FLOW</span><ChevronRight size={14} /><strong>{title}</strong></div><div><span className="oh-system-live"><i /> SYSTEM ONLINE</span><a href={`${basePath}/order-hub/?link=weekend-select`} target="_blank">客戶下單頁 <ExternalLink size={15} /></a></div></header>
        <div className="oh-admin-content">
          {view === "overview" && <Overview data={data} setData={setData} goTo={setView} />}
          {view === "links" && <LinkManager data={data} setData={setData} />}
          {view === "orders" && <OrdersView data={data} setData={setData} />}
          {view === "purchase" && <PurchaseView data={data} setData={setData} />}
          {view === "shipping" && <ShippingView data={data} setData={setData} />}
          {view === "products" && <ProductsView data={data} setData={setData} />}
        </div>
        <footer className="oh-admin-footer"><span>作品集互動展示版 · 資料儲存在目前瀏覽器</span><button onClick={reset}><RotateCcw size={14} /> 重設展示資料</button></footer>
      </section>
    </main>
  );
}
