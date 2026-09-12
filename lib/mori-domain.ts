export type MoriProduct = { id: string; name: string; english: string; price: number; stock: number; color: string; position: string; active: boolean };
export type MoriWorkshop = { id: string; name: string; english: string; description: string; price: number; duration: string; capacity: number; active: boolean };
export type MoriCartItem = { id: string; kind: "workshop" | "product"; quantity: number; date?: string; time?: string };
export type MoriOrderItem = MoriCartItem & { name: string; price: number };
export type MoriOrder = { id: string; memberId: string; name: string; email: string; phone: string; address: string; note: string; delivery: "pickup" | "shipping"; payment: "demo" | "transfer"; status: "待確認" | "已確認" | "已完成" | "已取消"; paid: boolean; items: MoriOrderItem[]; subtotal: number; shipping: number; total: number; createdAt: string };
export type MoriData = { version: 1; products: MoriProduct[]; workshops: MoriWorkshop[]; cart: MoriCartItem[]; orders: MoriOrder[]; member: { id: string; name: string; email: string; phone: string }; signedIn: boolean };
export type MoriCheckout = { name: string; email: string; phone: string; address: string; note: string; delivery: "pickup" | "shipping"; payment: "demo" | "transfer" };
export const MORI_TIMES = ["10:00", "14:00", "16:30"];
export const moriMoney = (n: number) => `NT$ ${n.toLocaleString("zh-TW")}`;
export const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function moriSeed(): MoriData {
  return {
    version: 1, cart: [], orders: [], signedIn: false,
    member: { id: "mori-demo-member", name: "林予安", email: "member@example.com", phone: "0900000000" },
    workshops: [
      { id: "pinch", name: "手捏，一只日常的碗", english: "THE PINCH POT", description: "從一團泥開始，用指尖捏出自己的弧度。零基礎也能輕鬆完成。", price: 1280, duration: "120 分鐘", capacity: 6, active: true },
      { id: "wheel", name: "拉坯，找到自己的圓", english: "THE POTTERY WHEEL", description: "感受泥土在掌心旋轉，練習放慢力道，讓形狀慢慢發生。", price: 1680, duration: "150 分鐘", capacity: 4, active: true },
      { id: "glaze", name: "釉彩，把顏色留住", english: "COLOURS ON CLAY", description: "在素燒器皿上畫一個午後。讓喜歡的色彩，成為生活的一部分。", price: 980, duration: "90 分鐘", capacity: 8, active: true },
    ],
    products: [
      { id: "rose-mug", name: "霧玫瑰・手感馬克杯", english: "DUSTY ROSE MUG", price: 680, stock: 12, color: "#c4aea7", position: "15% 50%", active: true },
      { id: "sage-cup", name: "鼠尾草・日常小杯", english: "SAGE EVERYDAY CUP", price: 480, stock: 18, color: "#9ca794", position: "50% 50%", active: true },
      { id: "ivory-vase", name: "暖白・一枝花器", english: "IVORY SINGLE VASE", price: 880, stock: 8, color: "#d6cfc0", position: "87% 50%", active: true },
    ],
  };
}
export function slotRemaining(data: MoriData, id: string, date: string, time: string) {
  const workshop = data.workshops.find(w => w.id === id);
  if (!workshop?.active) return 0;
  const booked = data.orders.filter(o => o.status !== "已取消").flatMap(o => o.items).filter(i => i.kind === "workshop" && i.id === id && i.date === date && i.time === time).reduce((sum, i) => sum + i.quantity, 0);
  return Math.max(0, workshop.capacity - booked);
}
export function resolveCart(data: MoriData): MoriOrderItem[] {
  return data.cart.map(item => {
    const record = (item.kind === "workshop" ? data.workshops : data.products).find(r => r.id === item.id);
    if (!record?.active) throw new Error("購物袋中有已下架項目，請移除後再結帳。");
    return { ...item, name: record.name, price: record.price };
  });
}
export function validateCartItem(data: MoriData, item: MoriCartItem, now = new Date()) {
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) throw new Error("請選擇 1–20 的有效數量。");
  const record = (item.kind === "workshop" ? data.workshops : data.products).find(r => r.id === item.id);
  if (!record?.active) throw new Error("這個項目目前未開放。");
  if (item.kind === "product") {
    if ((record as MoriProduct).stock < item.quantity) throw new Error("商品庫存不足，請調整數量。");
  } else {
    if (!item.date || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || !item.time || !MORI_TIMES.includes(item.time)) throw new Error("請先選擇日期與時段。");
    const start = new Date(`${item.date}T${item.time}:00`);
    if (!Number.isFinite(start.getTime()) || localDate(start) !== item.date || start <= now) throw new Error("請選擇尚未開始的預約時段。");
    if (slotRemaining(data, item.id, item.date, item.time) < item.quantity) throw new Error("這個時段名額不足，請選擇其他時段。");
  }
}
export function addMoriCart(data: MoriData, item: MoriCartItem): MoriData {
  const matches = (i: MoriCartItem) => i.id === item.id && i.date === item.date && i.time === item.time && i.kind === item.kind;
  const existing = data.cart.find(matches);
  const combined = { ...item, quantity: item.quantity + (existing?.quantity ?? 0) };
  validateCartItem(data, combined);
  return { ...data, cart: existing ? data.cart.map(i => matches(i) ? combined : i) : [...data.cart, combined] };
}
export function checkoutMori(data: MoriData, form: MoriCheckout, id: string, now = new Date()): MoriData {
  if (data.orders.some(o => o.id === id)) return data;
  if (!data.signedIn) throw new Error("請先進入示範會員，再完成結帳。");
  if (!data.cart.length) throw new Error("購物袋裡還沒有項目。");
  if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || !/^[0-9+()\s-]{8,20}$/.test(form.phone)) throw new Error("請填寫姓名、有效 Email 與聯絡電話。");
  data.cart.forEach(item => validateCartItem(data, item, now));
  const items = resolveCart(data);
  const hasProducts = items.some(i => i.kind === "product");
  if (hasProducts && form.delivery === "shipping" && form.address.trim().length < 5) throw new Error("請填寫完整的宅配地址。");
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = hasProducts && form.delivery === "shipping" && subtotal < 1800 ? 80 : 0;
  const order: MoriOrder = { ...form, id, memberId: data.member.id, status: "待確認", paid: form.payment === "demo", items, subtotal, shipping, total: subtotal + shipping, createdAt: now.toISOString() };
  return { ...data, cart: [], orders: [order, ...data.orders], member: { ...data.member, name: form.name, phone: form.phone, email: form.email }, products: data.products.map(p => ({ ...p, stock: p.stock - items.filter(i => i.kind === "product" && i.id === p.id).reduce((sum, i) => sum + i.quantity, 0) })) };
}
export function setMoriOrderStatus(data: MoriData, id: string, status: MoriOrder["status"]): MoriData {
  const order = data.orders.find(o => o.id === id);
  if (!order || order.status === status) return data;
  if (order.status === "已取消") throw new Error("已取消的訂單無法重新啟用，請重新下單。");
  const products = status === "已取消" ? data.products.map(p => ({ ...p, stock: p.stock + order.items.filter(i => i.kind === "product" && i.id === p.id).reduce((sum, i) => sum + i.quantity, 0) })) : data.products;
  return { ...data, products, orders: data.orders.map(o => o.id === id ? { ...o, status } : o) };
}
