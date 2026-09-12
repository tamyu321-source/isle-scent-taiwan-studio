"use client";
import { useSyncExternalStore } from "react";
import { MoriData, moriSeed } from "./mori-domain";

// Isolated, explicitly device-local portfolio demo. No real account or payment data.
const KEY = "mori-portfolio-demo-v1";
const initial = moriSeed();
let snapshot = initial;
let loaded = false;
const listeners = new Set<() => void>();
function read(): MoriData {
  const text = window.localStorage.getItem(KEY);
  if (!text) return initial;
  const parsed = JSON.parse(text);
  if (parsed.version !== 1 || !Array.isArray(parsed.orders) || !Array.isArray(parsed.cart) || !Array.isArray(parsed.products) || !Array.isArray(parsed.workshops) || !parsed.member) throw new Error("儲存的展示資料無法讀取。");
  return parsed;
}
function getSnapshot() {
  if (typeof window !== "undefined" && !loaded) {
    try { snapshot = read(); } catch { snapshot = initial; }
    loaded = true;
  }
  return snapshot;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const sync = (event: StorageEvent) => {
    if (event.key === KEY) { loaded = false; getSnapshot(); listeners.forEach(fn => fn()); }
  };
  window.addEventListener("storage", sync);
  return () => { listeners.delete(listener); window.removeEventListener("storage", sync); };
}
export function updateMori(update: (current: MoriData) => MoriData) {
  try {
    const next = update(read());
    window.localStorage.setItem(KEY, JSON.stringify(next));
    snapshot = next; loaded = true;
    listeners.forEach(fn => fn());
    return next;
  } catch (error) {
    if (error instanceof DOMException) throw new Error("瀏覽器無法儲存，請允許網站儲存資料後再試。你的輸入仍保留在畫面上。");
    throw error;
  }
}
export function useMori() { return useSyncExternalStore(subscribe, getSnapshot, () => initial); }
