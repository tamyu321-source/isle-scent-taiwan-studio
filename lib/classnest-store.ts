"use client";
import { useEffect, useState, useCallback } from "react";
import {
  applyCommand,
  extendSchedule,
  parseNest,
  seedNest,
} from "./classnest-domain";
import type { Actor, Command, NestState } from "./classnest-domain";

const DB = "classnest-demo-v1";
const STORE = "state";
let connection: Promise<IDBDatabase> | undefined;
function database() {
  if (!connection)
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onerror = () => {
        connection = undefined;
        reject(new Error("無法開啟本機儲存，請允許瀏覽器儲存資料後重試。"));
      };
      request.onblocked = () => {
        connection = undefined;
        reject(new Error("請關閉其他課伴視窗後重試。"));
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          connection = undefined;
        };
        resolve(db);
      };
    });
  const pending = connection;
  // Synchronous browser policy errors must also permit a later retry.
  void pending.catch(() => {
    if (connection === pending) connection = undefined;
  });
  return pending;
}
async function transact(
  transform?: (s: NestState, now: number) => NestState,
  reset = false,
): Promise<NestState> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    let result: NestState;
    let failure: unknown;
    const request = store.get("current");
    request.onsuccess = () => {
      try {
        const now = Date.now();
        const state =
          reset || request.result === undefined
            ? seedNest(now)
            : parseNest(request.result);
        extendSchedule(state, now);
        state.holds = state.holds.filter((v) => v.expires > now);
        result = transform ? transform(state, now) : state;
        store.put(result, "current");
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = () =>
      reject(failure ?? new Error("本機儲存失敗，操作未成立；請重試。"));
    tx.onerror = () => {
      failure ??= new Error(
        "瀏覽器無法寫入資料，操作未成立；請檢查可用空間後重試。",
      );
    };
  });
}
export function useClassnest() {
  const [data, setData] = useState<NestState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setData(await transact());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    let alive = true;
    const sync = () => {
      if (alive) void refresh();
    };
    const channel =
      typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(DB) : null;
    if (channel) channel.onmessage = sync;
    sync();
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    const timer = setInterval(sync, 15_000);
    return () => {
      alive = false;
      channel?.close();
      clearInterval(timer);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [refresh]);
  const dispatch = useCallback(
    async (command: Command, actor: Actor, operationId: string) => {
      setBusy(true);
      try {
        if (command.type === "reset" && actor.role !== "admin")
          throw new Error("請由管理員重設展示。");
        const next = await transact(
          (s, now) => applyCommand(s, command, actor, operationId, now),
          command.type === "reset",
        );
        setData(next);
        setError("");
        if (typeof BroadcastChannel !== "undefined") {
          const channel = new BroadcastChannel(DB);
          channel.postMessage({ revision: next.revision });
          channel.close();
        }
        return next;
      } catch (e) {
        setError((e as Error).message);
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [],
  );
  return { data, error, busy, refresh, dispatch };
}
