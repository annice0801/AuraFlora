"use client";

import type { CheckoutForm } from "@/lib/ecpay";

/** 建立隱藏表單並送出到綠界付款頁 */
export function submitCheckout({ action, fields }: CheckoutForm) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}
