// 3D 場景共用的靜態資產（存放於 Vercel Blob，由 scripts/upload-env.mjs 上傳）

/** 攝影棚 HDRI：Poly Haven「Studio Small 08」，作者 Sergej Majboroda，CC0 授權 */
export const HDRI_URL =
  "https://ifauvxomzuej4ozz.public.blob.vercel-storage.com/env/studio_small_08_1k.hdr";

/** 首頁與各頁裝飾用的花材去背圖（3D 程序化花材渲染，scripts/render-hero.mjs 產生） */
export const HERO_FLORA = {
  eucalyptus: { src: "https://ifauvxomzuej4ozz.public.blob.vercel-storage.com/flora/hero/eucalyptus.png?v=2", width: 2153, height: 715 },
  snowWillow: { src: "https://ifauvxomzuej4ozz.public.blob.vercel-storage.com/flora/hero/snow-willow.png?v=2", width: 2036, height: 1050 },
  peony: { src: "https://ifauvxomzuej4ozz.public.blob.vercel-storage.com/flora/hero/peony-coral.png?v=2", width: 1997, height: 957 },
  tulip: { src: "https://ifauvxomzuej4ozz.public.blob.vercel-storage.com/flora/hero/tulip-white.png?v=2", width: 2111, height: 606 },
  lisianthus: { src: "https://ifauvxomzuej4ozz.public.blob.vercel-storage.com/flora/hero/lisianthus-white.png?v=2", width: 2103, height: 1036 },
  chamomile: { src: "https://ifauvxomzuej4ozz.public.blob.vercel-storage.com/flora/hero/chamomile.png?v=2", width: 2086, height: 1047 },
  curlyWillow: { src: "https://ifauvxomzuej4ozz.public.blob.vercel-storage.com/flora/hero/curly-willow.png?v=2", width: 2198, height: 500 },
} as const;

export type HeroFlora = keyof typeof HERO_FLORA;
