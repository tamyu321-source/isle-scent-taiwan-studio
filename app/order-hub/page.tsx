import type { Metadata } from "next";
import { OrderPublic } from "@/components/order-public";

export const metadata: Metadata = {
  title: "日日選物｜專屬訂單",
  description: "由訂單中台建立的專屬下單頁面。",
};
export const dynamic = "force-static";

export default function OrderHubPage() {
  return <OrderPublic />;
}
