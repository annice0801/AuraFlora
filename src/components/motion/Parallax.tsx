"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// ── 共用的滾動迴圈：所有視差元素只用一個 requestAnimationFrame 更新 ──

type Item = { outer: HTMLElement; inner: HTMLElement; speed: number; rotate: number; scale: number };
const items = new Set<Item>();
let ticking = false;
let listening = false;

function update() {
  ticking = false;
  const vh = window.innerHeight;
  for (const it of items) {
    const r = it.outer.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) continue; // 畫面外不計算
    // 元素中心相對於視窗中心的距離：在畫面正中央時位移為 0
    const offset = r.top + r.height / 2 - vh / 2;
    const y = -offset * it.speed;
    const rot = it.rotate ? (offset / vh) * it.rotate : 0;
    const sc = it.scale ? 1 + Math.max(-1, Math.min(1, offset / vh)) * -it.scale : 1;
    it.inner.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
  }
}

function request() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}

function ensureListening() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * 滾動視差：speed > 0 比捲動慢（遠景），speed < 0 比捲動快（近景）。
 * rotate：離開畫面中央時的旋轉角度；scale：靠近中央時的縮放幅度。
 */
export default function Parallax({
  children,
  speed = 0.15,
  rotate = 0,
  scale = 0,
  className,
  innerClassName,
  style,
}: {
  children: ReactNode;
  speed?: number;
  rotate?: number;
  scale?: number;
  className?: string;
  innerClassName?: string;
  style?: CSSProperties;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!outer.current || !inner.current || reducedMotion()) return;
    const item: Item = { outer: outer.current, inner: inner.current, speed, rotate, scale };
    items.add(item);
    ensureListening();
    request();
    return () => {
      items.delete(item);
    };
  }, [speed, rotate, scale]);

  return (
    <div ref={outer} className={className} style={style}>
      <div ref={inner} className={innerClassName} style={{ willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}
