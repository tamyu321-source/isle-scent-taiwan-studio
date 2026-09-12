"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShieldCheck, ShoppingBag } from "lucide-react";
import { CustomerOrder, newOrderHubId, orderHubCurrency, useOrderHubStore } from "@/lib/order-store";

type CustomerForm = { name: string; phone: string; email: string; address: string; note: string };
const emptyCustomer: CustomerForm = { name: "", phone: "", email: "", address: "", note: "" };

export function OrderPublic() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const { data, setData, ready } = useOrderHubStore();
  const [slug] = useState(() => typeof window === "undefined" ? "weekend-select" : new URLSearchParams(window.location.search).get("link") ?? "weekend-select");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customer, setCustomer] = useState<CustomerForm>(emptyCustomer);
  const [submitted, setSubmitted] = useState<CustomerOrder | null>(null);

  const activeLink = data.links.find((item) => item.slug === slug && item.active) ?? data.links.find((item) => item.active);
  const products = useMemo(() => data.products.filter((product) => activeLink?.productIds.includes(product.id) && product.active), [activeLink, data.products]);
  const itemCount = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
  const total = products.reduce((sum, product) => sum + product.price * (quantities[product.id] ?? 0), 0);

  const changeQuantity = (productId: string, amount: number, stock: number) => {
    setQuantities((current) => ({ ...current, [productId]: Math.max(0, Math.min(stock, (current[productId] ?? 0) + amount)) }));
  };

  const submitOrder = (event: FormEvent) => {
    event.preventDefault();
    if (!activeLink || itemCount === 0 || !customer.name || !customer.phone || !customer.address) return;
    const now = new Date();
    const order: CustomerOrder = {
      id: newOrderHubId("order"),
      number: `DG${now.toISOString().slice(2, 10).replaceAll("-", "")}-${String(Date.now()).slice(-3)}`,
      linkId: activeLink.id,
      customerName: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      note: customer.note,
      items: products.filter((product) => quantities[product.id]).map((product) => ({ productId: product.id, quantity: quantities[product.id], price: product.price })),
      total,
      status: "新訂單",
      createdAt: now.toISOString(),
      trackingNo: "",
    };
    setData((current) => ({ ...current, orders: [order, ...current.orders] }));
    setSubmitted(order);
    setQuantities({});
    setCustomer(emptyCustomer);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <main className="oh-shop oh-confirmation">
        <section className="oh-confirm-card">
          <div className="oh-confirm-icon"><Check size={38} /></div>
          <p className="oh-kicker">ORDER RECEIVED</p>
          <h1>收到你的訂單了。</h1>
          <p>我們會確認品項與到貨時間，再透過你留下的聯絡方式通知。</p>
          <dl><div><dt>訂單編號</dt><dd>{submitted.number}</dd></div><div><dt>訂單金額</dt><dd>{orderHubCurrency(submitted.total)}</dd></div><div><dt>目前狀態</dt><dd><span className="oh-status is-new">新訂單</span></dd></div></dl>
          <button className="oh-btn oh-btn-dark" onClick={() => setSubmitted(null)}><ArrowLeft size={17} /> 返回下單頁</button>
          <a className="oh-demo-admin" href={`${basePath}/order-hub/admin/`}>作品展示：開啟管理後台 <ArrowRight size={15} /></a>
        </section>
      </main>
    );
  }

  return (
    <main className="oh-shop">
      <header className="oh-shop-header">
        <a href={`${basePath}/`} className="oh-shop-logo"><span>DG</span><strong>{data.shopName}</strong></a>
        <div className="oh-secure"><ShieldCheck size={16} /> 安全下單</div>
      </header>

      <div className="oh-campaign-band"><span>PRIVATE ORDER LINK</span><span>•</span><span>{activeLink?.slug ?? "ORDER CLOSED"}</span></div>

      <section className="oh-order-shell">
        <div className="oh-order-main">
          <div className="oh-order-intro">
            <p className="oh-kicker">CURATED ORDER · 09/2026</p>
            <h1>{activeLink?.name ?? "這個訂單連結目前未開放"}</h1>
            <p>{activeLink?.description ?? "請向商家索取新的專屬連結。"}</p>
          </div>

          <div className="oh-products">
            {products.map((product, index) => (
              <article className="oh-product" key={product.id}>
                <div className="oh-product-index">{String(index + 1).padStart(2, "0")}</div>
                <div className="oh-product-mark" aria-hidden="true"><span>{product.sku.slice(-2)}</span></div>
                <div className="oh-product-copy"><p>{product.sku}</p><h2>{product.name}</h2><span>{product.description}</span><strong>{orderHubCurrency(product.price)}</strong></div>
                <div className="oh-stepper" aria-label={`${product.name}數量`}>
                  <button type="button" aria-label="減少數量" onClick={() => changeQuantity(product.id, -1, product.stock)}><Minus size={16} /></button>
                  <output>{quantities[product.id] ?? 0}</output>
                  <button type="button" aria-label="增加數量" onClick={() => changeQuantity(product.id, 1, product.stock)}><Plus size={16} /></button>
                </div>
              </article>
            ))}
          </div>

          <form id="customer-order" className="oh-customer-form" onSubmit={submitOrder}>
            <div className="oh-form-heading"><span>02</span><div><h2>收件資料</h2><p>標示 * 為必填欄位</p></div></div>
            <div className="oh-field-grid">
              <label><span>姓名 *</span><input required value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} placeholder="收件人姓名" /></label>
              <label><span>手機 *</span><input required value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} placeholder="09xx-xxx-xxx" /></label>
              <label><span>Email</span><input type="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} placeholder="接收訂單通知" /></label>
              <label className="oh-field-wide"><span>收件地址 *</span><input required value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} placeholder="縣市、區域、街道與門牌" /></label>
              <label className="oh-field-wide"><span>訂單備註</span><textarea value={customer.note} onChange={(event) => setCustomer({ ...customer, note: event.target.value })} placeholder="配送時間或其他需求" rows={4} /></label>
            </div>
          </form>
        </div>

        <aside className="oh-order-summary">
          <div className="oh-summary-head"><ShoppingBag size={19} /><span>YOUR ORDER</span><b>{itemCount}</b></div>
          <div className="oh-summary-lines">
            {products.filter((product) => quantities[product.id]).map((product) => <div key={product.id}><span>{product.name} × {quantities[product.id]}</span><strong>{orderHubCurrency(product.price * quantities[product.id])}</strong></div>)}
            {!itemCount && <p>選擇商品後，品項會顯示在這裡。</p>}
          </div>
          <div className="oh-summary-total"><span>總計</span><strong>{orderHubCurrency(total)}</strong></div>
          <button form="customer-order" disabled={!ready || !itemCount} className="oh-btn oh-btn-lime" type="submit">送出訂單 <ArrowRight size={18} /></button>
          <p className="oh-summary-note">送出後商家將確認庫存與出貨時間。此頁為作品集互動展示版。</p>
        </aside>
      </section>
    </main>
  );
}
