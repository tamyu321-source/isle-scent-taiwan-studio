import type { Metadata } from "next";
import { OrderAdmin } from "@/components/order-admin";

export const metadata: Metadata = {
  title: "Order Flow｜訂單中台",
  description: "訂單連結、訂貨、庫存與出貨管理後台。",
};
export const dynamic = "force-static";

export default function OrderHubAdminPage() {
  return <OrderAdmin />;
}
