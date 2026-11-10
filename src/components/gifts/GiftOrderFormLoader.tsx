"use client";

import dynamic from "next/dynamic";

// 表單依賴今天日期與登入狀態，只在瀏覽器端渲染，避免預先產生的頁面日期過期
const GiftOrderForm = dynamic(() => import("./GiftOrderForm"), {
  ssr: false,
  loading: () => <div className="h-40" />,
});

export default GiftOrderForm;
