"use client";

import { useEffect, useMemo, useState } from "react";

export type OrderStatus = "新訂單" | "已確認" | "已訂貨" | "已到貨" | "待出貨" | "已出貨" | "已完成" | "已取消";

export type OrderProduct = {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  reorderAt: number;
  active: boolean;
};

export type OrderLink = {
  id: string;
  name: string;
  slug: string;
  description: string;
  productIds: string[];
  active: boolean;
  createdAt: string;
};

export type OrderItem = { productId: string; quantity: number; price: number };

export type CustomerOrder = {
  id: string;
  number: string;
  linkId: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  note: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  trackingNo: string;
};

export type OrderHubData = {
  shopName: string;
  products: OrderProduct[];
  links: OrderLink[];
  orders: CustomerOrder[];
};

const STORAGE_KEY = "order-hub-demo-v1";
export const orderStatuses: OrderStatus[] = ["新訂單", "已確認", "已訂貨", "已到貨", "待出貨", "已出貨", "已完成", "已取消"];
export const newOrderHubId = (prefix = "item") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const isoAt = (daysAgo: number, hour: number) => {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  value.setHours(hour, daysAgo * 7 % 60, 0, 0);
  return value.toISOString();
};

export function createOrderHubSeed(): OrderHubData {
  const products: OrderProduct[] = [
    { id: "product-box", name: "週末選物禮盒", sku: "DG-BOX-01", description: "三款人氣選物一次收齊，附限定包裝。", price: 880, cost: 520, stock: 18, reorderAt: 8, active: true },
    { id: "product-bag", name: "日常補充包", sku: "DG-REFILL-02", description: "輕量補充規格，適合日常使用與回購。", price: 360, cost: 190, stock: 6, reorderAt: 10, active: true },
    { id: "product-set", name: "雙入分享組", sku: "DG-DUO-03", description: "兩入優惠組合，送禮與團購都剛剛好。", price: 620, cost: 340, stock: 24, reorderAt: 8, active: true },
    { id: "product-limited", name: "季節限定款", sku: "DG-LTD-04", description: "少量到貨的本月限定選物。", price: 490, cost: 270, stock: 3, reorderAt: 5, active: true },
  ];
  const links: OrderLink[] = [
    { id: "link-weekend", name: "九月週末團購", slug: "weekend-select", description: "本週精選組合，9/20 前完成下單。", productIds: ["product-box", "product-bag", "product-set"], active: true, createdAt: isoAt(8, 10) },
    { id: "link-vip", name: "熟客限定補貨", slug: "vip-restock", description: "熟客專屬補貨單，數量有限。", productIds: ["product-bag", "product-limited"], active: true, createdAt: isoAt(3, 14) },
  ];
  const order = (id: string, number: string, linkId: string, name: string, status: OrderStatus, daysAgo: number, items: OrderItem[], trackingNo = ""): CustomerOrder => ({
    id, number, linkId, customerName: name, phone: `09${id.slice(-1)}8-23${daysAgo}0-6${daysAgo}1`, email: `${name === "林曉晴" ? "hsiao" : "buyer"}${daysAgo}@example.com`, address: `台北市中山區日常路 ${20 + daysAgo} 號`, note: daysAgo % 2 ? "管理室代收，謝謝" : "", items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0), status, createdAt: isoAt(daysAgo, 9 + daysAgo), trackingNo,
  });
  return {
    shopName: "DAILY GOODS 日日選物",
    products,
    links,
    orders: [
      order("order-a1", "DG260912-018", "link-weekend", "林曉晴", "新訂單", 0, [{ productId: "product-box", quantity: 1, price: 880 }, { productId: "product-bag", quantity: 2, price: 360 }]),
      order("order-b2", "DG260912-017", "link-weekend", "王子瑜", "已確認", 0, [{ productId: "product-set", quantity: 3, price: 620 }]),
      order("order-c3", "DG260911-016", "link-vip", "陳映彤", "已訂貨", 1, [{ productId: "product-limited", quantity: 2, price: 490 }]),
      order("order-d4", "DG260911-015", "link-weekend", "張以安", "待出貨", 1, [{ productId: "product-box", quantity: 1, price: 880 }]),
      order("order-e5", "DG260910-014", "link-vip", "許庭瑄", "已出貨", 2, [{ productId: "product-bag", quantity: 4, price: 360 }], "TCAT-90631872"),
      order("order-f6", "DG260908-013", "link-weekend", "周品妤", "已完成", 4, [{ productId: "product-set", quantity: 1, price: 620 }], "TCAT-90628411"),
    ],
  };
}

export function useOrderHubStore() {
  const seed = useMemo(() => createOrderHubSeed(), []);
  const [data, setData] = useState<OrderHubData>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setData(JSON.parse(saved) as OrderHubData);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, ready]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) setData(JSON.parse(event.newValue) as OrderHubData);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const reset = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setData(createOrderHubSeed());
  };

  return { data, setData, ready, reset };
}

export function orderHubCurrency(value: number) {
  return new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 }).format(value);
}
