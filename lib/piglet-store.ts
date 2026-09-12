"use client";

import { useEffect, useMemo, useState } from "react";

export type BookingStatus = "待確認" | "已確認" | "已取消";
export type PaymentStatus = "待付款" | "已付款" | "已取消";

export type PigletPlan = { id: string; name: string; price: number; unit: string; description: string; recommended: boolean };
export type PigletCustomer = { id: string; name: string; phone: string; petName: string; species: string; notes: string };
export type PigletBooking = { id: string; customerId: string; planId: string; date: string; time: string; status: BookingStatus; note: string };
export type PigletFee = { id: string; customerId: string; item: string; amount: number; date: string; status: PaymentStatus; note: string };
export type PigletAlbum = { id: string; title: string; date: string; cover: string; photos: string[] };
export type PigletMessage = { id: string; name: string; message: string; date: string; photo?: string };

export type PigletData = {
  heroImage: string;
  lineUrl: string;
  plans: PigletPlan[];
  customers: PigletCustomer[];
  bookings: PigletBooking[];
  fees: PigletFee[];
  albums: PigletAlbum[];
  messages: PigletMessage[];
};

const STORAGE_KEY = "piglet-daycare-demo-v1";
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const newPigletId = makeId;

const toDate = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export function createPigletSeed(basePath: string): PigletData {
  const plans: PigletPlan[] = [
    { id: "plan-day", name: "日托玩耍班", price: 680, unit: "天", description: "白天盡情放電，含兩次散步與每日照片。", recommended: false },
    { id: "plan-night", name: "安心住宿班", price: 980, unit: "晚", description: "獨立舒適睡眠區、活動紀錄與晚安回報。", recommended: true },
    { id: "plan-cat", name: "貓貓靜心房", price: 880, unit: "晚", description: "狗貓分區，保留躲藏、攀高與安靜休息空間。", recommended: false },
  ];
  const customers: PigletCustomer[] = [
    { id: "customer-lin", name: "林怡君", phone: "0912-345-678", petName: "麻糬", species: "柴犬", notes: "對雞肉過敏" },
    { id: "customer-chen", name: "陳柏宇", phone: "0988-120-520", petName: "乳酪", species: "金吉拉", notes: "怕生，需要慢慢接近" },
    { id: "customer-wu", name: "吳思妤", phone: "0966-588-031", petName: "豆花", species: "貴賓犬", notes: "睡前需要自己的小毯子" },
  ];
  return {
    heroImage: `${basePath}/images/daycare-hero.webp`,
    lineUrl: "https://line.me/",
    plans,
    customers,
    bookings: [
      { id: "booking-1", customerId: "customer-lin", planId: "plan-night", date: toDate(2), time: "10:00", status: "已確認", note: "住宿兩晚" },
      { id: "booking-2", customerId: "customer-chen", planId: "plan-cat", date: toDate(5), time: "14:30", status: "待確認", note: "第一次入住" },
      { id: "booking-3", customerId: "customer-wu", planId: "plan-day", date: toDate(8), time: "09:30", status: "已確認", note: "日托" },
    ],
    fees: [
      { id: "fee-1", customerId: "customer-lin", item: "住宿兩晚", amount: 1960, date: toDate(2), status: "已付款", note: "LINE Pay" },
      { id: "fee-2", customerId: "customer-chen", item: "貓貓靜心房", amount: 880, date: toDate(5), status: "待付款", note: "入住時付款" },
    ],
    albums: [
      { id: "album-cheese", title: "乳酪的一天", date: toDate(0), cover: `${basePath}/images/daycare-cheese-closeup.webp`, photos: [`${basePath}/images/daycare-cheese-closeup.webp`, `${basePath}/images/daycare-cheese-portrait.webp`] },
      { id: "album-play", title: "今天一起放電", date: toDate(-1), cover: `${basePath}/images/daycare-play.webp`, photos: [`${basePath}/images/daycare-play.webp`, `${basePath}/images/daycare-hero.webp`] },
      { id: "album-nap", title: "午睡時間到", date: toDate(-3), cover: `${basePath}/images/daycare-nap.webp`, photos: [`${basePath}/images/daycare-nap.webp`] },
      { id: "album-new", title: "新朋友見面會", date: toDate(-7), cover: `${basePath}/images/daycare-hero.webp`, photos: [`${basePath}/images/daycare-hero.webp`, `${basePath}/images/daycare-play.webp`] },
    ],
    messages: [
      { id: "message-1", name: "麻糬媽媽", message: "第一次過夜本來超擔心，結果每天收到照片都在玩，回家直接睡翻！", date: toDate(-2) },
      { id: "message-2", name: "乳酪爸爸", message: "貓咪區很安靜，乳酪第二天就願意出來撒嬌了，謝謝小瑀。", date: toDate(-5) },
    ],
  };
}

export function usePigletStore(basePath: string) {
  const seed = useMemo(() => createPigletSeed(basePath), [basePath]);
  const [data, setData] = useState<PigletData>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setData(JSON.parse(saved) as PigletData);
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* Browser quota can be reached after many large uploads. */ }
  }, [data, ready]);

  useEffect(() => {
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) setData(JSON.parse(event.newValue) as PigletData);
    };
    window.addEventListener("storage", syncAcrossTabs);
    return () => window.removeEventListener("storage", syncAcrossTabs);
  }, []);

  const reset = () => {
    setData(seed);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return { data, setData, ready, reset };
}

export function readPigletImage(file: File, maxWidth = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("檔案讀取失敗"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("圖片格式無法使用"));
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("圖片處理失敗"));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", .78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
