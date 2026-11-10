// 訂單狀態定義（伺服器與瀏覽器共用）

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "assigned"
  | "accepted"
  | "photo_submitted"
  | "photo_rejected"
  | "approved"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "expired";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "待付款",
  paid: "已付款・待派單",
  assigned: "已派單・待花店接單",
  accepted: "花店製作中",
  photo_submitted: "出貨前實拍・審核中",
  photo_rejected: "實拍未通過・重新製作",
  approved: "實拍核對通過・待出貨",
  out_for_delivery: "專車配送中",
  delivered: "已送達",
  cancelled: "已取消",
  expired: "逾時未付款",
};

/** 顧客看到的主要進度（依序） */
export const CUSTOMER_STEPS: { status: OrderStatus[]; label: string }[] = [
  { status: ["paid"], label: "付款完成" },
  { status: ["assigned", "accepted", "photo_rejected"], label: "特約花店製作中" },
  { status: ["photo_submitted", "approved"], label: "出貨前實拍核對" },
  { status: ["out_for_delivery"], label: "專車配送中" },
  { status: ["delivered"], label: "已送達" },
];

