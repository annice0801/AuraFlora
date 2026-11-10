"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Check, Loader2, Send, Trash2, Truck, X } from "lucide-react";
import {
  acceptOrder,
  assignOrder,
  cancelOrder,
  dispatchOrder,
  markDelivered,
  removePhoto,
  reviewPhotoCheck,
  submitPhotoCheck,
  toggleCheck,
  uploadPhoto,
} from "@/app/actions/fulfillment";
import type { SerializedOrder } from "@/lib/orders";

type Role = "admin" | "florist";
type Florist = { id: string; name: string; email: string };

/** 上傳前在瀏覽器端縮圖（長邊 1600px、JPEG），避免手機原圖過大 */
async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.82));
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

function useAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "操作失敗");
    });
  return { pending, error, run };
}

function Btn({
  children,
  onClick,
  tone = "dark",
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "dark" | "rose" | "line";
  disabled?: boolean;
}) {
  const cls =
    tone === "rose"
      ? "bg-rose text-white"
      : tone === "line"
        ? "border border-line bg-surface text-foreground"
        : "bg-foreground text-background";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40 ${cls}`}
    >
      {children}
    </button>
  );
}

export default function WorkOrderPanel({ order, role, florists = [], selfId }: { order: SerializedOrder; role: Role; florists?: Florist[]; selfId?: string }) {
  const { pending, error, run } = useAction();
  const [floristId, setFloristId] = useState(order.workOrder?.floristId ?? florists[0]?.id ?? "");
  const [reviewNote, setReviewNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const kindRef = useRef<"pre_ship" | "delivery">("pre_ship");
  const w = order.workOrder;
  const s = order.status;
  const editable = s === "accepted" || s === "photo_rejected";
  const preShip = w?.photos.filter((p) => p.kind === "pre_ship") ?? [];
  const delivery = w?.photos.filter((p) => p.kind === "delivery") ?? [];
  const doneCount = w?.checklist.filter((c) => c.done).length ?? 0;

  const pick = (kind: "pre_ship" | "delivery") => {
    kindRef.current = kind;
    fileRef.current?.click();
  };
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("orderId", order.id);
      fd.append("kind", kindRef.current);
      fd.append("file", await shrink(f));
      await new Promise<void>((resolve) => run(async () => {
        const r = await uploadPhoto(fd);
        resolve();
        return r;
      }));
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const photoTiles = (list: typeof preShip, removable: boolean) => (
    <div className="grid grid-cols-3 gap-2">
      {list.map((p) => (
        <div key={p.url} className="group relative overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- 花店上傳的實拍照 */}
          <img src={p.url} alt="實拍" className="aspect-square w-full object-cover" />
          {removable && (
            <button
              onClick={() => run(() => removePhoto(order.id, p.url))}
              className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100"
              aria-label="刪除照片"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => onFiles(e.target.files)} />

      {/* 管理員：派單 */}
      {role === "admin" && (s === "paid" || s === "assigned") && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="font-medium">派單給合作花店</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <select value={floristId} onChange={(e) => setFloristId(e.target.value)} className="min-w-56 rounded-xl border border-line bg-background px-3 py-2 text-sm">
              {florists.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}（{f.email}）
                </option>
              ))}
              {order.kind === "kit" && selfId && <option value={selfId}>AuraFlora 工作室（自行出貨）</option>}
            </select>
            <Btn onClick={() => run(() => assignOrder(order.id, floristId))} disabled={pending || !floristId}>
              <Send className="size-4" />
              {s === "assigned" ? "改派" : "派單"}
            </Btn>
          </div>
          {!florists.length && <p className="mt-2 text-xs text-muted">還沒有合作花店，請先到「會員與權限」把花店的帳號設為合作花店。</p>}
        </section>
      )}

      {/* 花店：接單 */}
      {s === "assigned" && (
        <section className="rounded-2xl border border-rose/30 bg-rose-soft/40 p-5">
          <p className="text-sm">
            已派給 <strong>{w?.floristName}</strong>，請確認可以在 {order.delivery.date} {order.delivery.slot} 送達。
          </p>
          <div className="mt-3">
            <Btn tone="rose" onClick={() => run(() => acceptOrder(order.id))} disabled={pending}>
              <Check className="size-4" />
              確認接單
            </Btn>
          </div>
        </section>
      )}

      {/* 出貨前檢查表 + 實拍 */}
      {w && ["accepted", "photo_rejected", "photo_submitted", "approved", "out_for_delivery", "delivered"].includes(s) && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">出貨前檢查表</h3>
            <span className="text-xs text-muted">
              {doneCount}/{w.checklist.length}
            </span>
          </div>
          {s === "photo_rejected" && w.review?.note && (
            <p className="mt-3 rounded-xl bg-rose-soft px-3 py-2 text-sm text-rose">審核退回：{w.review.note}</p>
          )}
          <ul className="mt-3 space-y-2">
            {w.checklist.map((c) => (
              <li key={c.id}>
                <label className={`flex items-start gap-2 text-sm ${editable ? "cursor-pointer" : ""}`}>
                  <input
                    type="checkbox"
                    checked={c.done}
                    disabled={!editable || pending}
                    onChange={(e) => run(() => toggleCheck(order.id, c.id, e.target.checked))}
                    className="mt-0.5 accent-[#6f7d5c]"
                  />
                  <span className={c.done ? "" : "text-muted"}>{c.label}</span>
                </label>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 font-medium">
              <Camera className="size-4 text-rose" />
              出貨前實拍（至少 2 張：正面、側面）
            </h3>
            {editable && (
              <Btn tone="line" onClick={() => pick("pre_ship")} disabled={uploading}>
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                拍照／上傳
              </Btn>
            )}
          </div>
          <div className="mt-3">{preShip.length ? photoTiles(preShip, editable) : <p className="text-sm text-muted">尚未上傳</p>}</div>

          {editable && (
            <div className="mt-5">
              <Btn tone="rose" onClick={() => run(() => submitPhotoCheck(order.id))} disabled={pending}>
                <Send className="size-4" />
                送出 Photo-Check 審核
              </Btn>
            </div>
          )}
        </section>
      )}

      {/* 管理員：審核實拍 */}
      {role === "admin" && s === "photo_submitted" && (
        <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
          <h3 className="font-medium">審核出貨前實拍</h3>
          <p className="mt-1 text-xs text-muted">對照配方卡的枝數、尺寸、色票與卡片內容。</p>
          <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            rows={2}
            placeholder="退回時請寫下需要修正的地方"
            className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm"
          />
          <div className="mt-3 flex gap-2">
            <Btn onClick={() => run(() => reviewPhotoCheck(order.id, true, reviewNote))} disabled={pending}>
              <Check className="size-4" />
              通過，可以出貨
            </Btn>
            <Btn tone="line" onClick={() => run(() => reviewPhotoCheck(order.id, false, reviewNote))} disabled={pending}>
              <X className="size-4" />
              退回重做
            </Btn>
          </div>
        </section>
      )}

      {/* 出貨與送達 */}
      {s === "approved" && (
        <Btn tone="rose" onClick={() => run(() => dispatchOrder(order.id))} disabled={pending}>
          <Truck className="size-4" />
          {order.kind === "gift" ? "專車出發" : "冷鏈出貨"}
        </Btn>
      )}
      {s === "out_for_delivery" && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">送達照片</h3>
            <Btn tone="line" onClick={() => pick("delivery")} disabled={uploading}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              拍照／上傳
            </Btn>
          </div>
          <div className="mt-3">{delivery.length ? photoTiles(delivery, true) : <p className="text-sm text-muted">尚未上傳</p>}</div>
          <div className="mt-4">
            <Btn tone="rose" onClick={() => run(() => markDelivered(order.id))} disabled={pending}>
              <Check className="size-4" />
              確認已送達
            </Btn>
          </div>
        </section>
      )}

      {role === "admin" && !["delivered", "cancelled", "expired", "out_for_delivery"].includes(s) && (
        <button
          onClick={() => {
            const reason = window.prompt("取消原因（會記錄在訂單紀錄中）");
            if (reason !== null) run(() => cancelOrder(order.id, reason));
          }}
          className="text-xs text-muted underline underline-offset-2 hover:text-rose"
        >
          取消訂單
        </button>
      )}

      {(pending || uploading) && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" />
          處理中…
        </p>
      )}
      {error && <p className="text-sm text-rose">{error}</p>}
    </div>
  );
}
