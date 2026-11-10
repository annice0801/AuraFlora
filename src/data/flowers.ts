// 花材目錄：這份資料是「種子資料」，執行 `npm run seed:flowers` 會寫入 MongoDB 的 flowers 集合。
// 網站執行時從 MongoDB 讀取（見 src/lib/flora/getFlowers.ts）。
// 注意：此檔案不能 import 其他模組，因為種子腳本會直接用 Node 執行它。

export type Layer = "skeleton" | "focal" | "secondary" | "filler";
export type StyleTag = "wabi" | "korean" | "french";
export type Form =
  | "line"
  | "cup"
  | "round"
  | "disc"
  | "ruffle"
  | "spike"
  | "spray"
  | "daisy"
  | "cluster";
export type ModelKind =
  | "willow"
  | "eucalyptus"
  | "curlyWillow"
  | "tulip"
  | "peony"
  | "sunflower"
  | "lisianthus"
  | "freesia"
  | "gypsophila"
  | "chamomile"
  | "trachelium";

export type Flower = {
  slug: string;
  name: string;
  latin: string;
  layer: Layer;
  model: ModelKind;
  /** 主色，用於配色演算法與色票 */
  color: string;
  /** 輔色（花心、枝條等），色票會一併列出 */
  accent: string;
  colorName: string;
  form: Form;
  /** 台灣花市較常見的月份 */
  months: number[];
  styles: StyleTag[];
  vaseLifeDays: number;
  /** 瓶口以上的花莖長度（公尺） */
  height: number;
  /** 花頭碰撞半徑（公尺），用來避免花朵互相穿模 */
  headRadius: number;
  care: string;
  meaning: string;
  /** 整枝去背圖（Vercel Blob），由 render-cutouts 腳本產生 */
  cutoutUrl?: string;
  /** 花頭特寫去背圖（Vercel Blob），花材清單的小圖示 */
  thumbUrl?: string;
};

const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const LAYERS: { id: Layer; name: string; hint: string }[] = [
  { id: "skeleton", name: "骨架枝葉", hint: "先決定作品的高度與輪廓" },
  { id: "focal", name: "焦點主花", hint: "視覺重心，數量以奇數為佳" },
  { id: "secondary", name: "配花次主角", hint: "銜接主花與填充，豐富層次" },
  { id: "filler", name: "填充靈魂", hint: "填補空隙，讓作品有呼吸感" },
];

export const STYLES: { id: StyleTag; name: string }[] = [
  { id: "wabi", name: "日式侘寂" },
  { id: "korean", name: "韓式簡約" },
  { id: "french", name: "法式浪漫" },
];

export const flowerCatalog: Flower[] = [
  // ── 骨架枝葉 ──
  {
    slug: "snow-willow",
    name: "雪柳",
    latin: "Spiraea thunbergii",
    layer: "skeleton",
    model: "willow",
    color: "#f4f1e8",
    accent: "#6b7d4f",
    colorName: "雪白",
    form: "line",
    months: [1, 2, 3, 4, 11, 12],
    styles: ["wabi", "french"],
    vaseLifeDays: 7,
    height: 0.5,
    headRadius: 0.05,
    care: "枝條末端剪十字切口幫助吸水；小花容易掉落，插好後盡量不要搬動。",
    meaning: "純潔、可愛",
  },
  {
    slug: "eucalyptus",
    name: "尤加利葉",
    latin: "Eucalyptus cinerea",
    layer: "skeleton",
    model: "eucalyptus",
    color: "#8fa59a",
    accent: "#6d7f74",
    colorName: "銀灰綠",
    form: "line",
    months: ALL_YEAR,
    styles: ["korean", "french"],
    vaseLifeDays: 14,
    height: 0.4,
    headRadius: 0.045,
    care: "葉片帶精油、耐乾燥；換水時順便斜剪，謝了也可以直接風乾成乾燥葉材。",
    meaning: "恩賜、回憶",
  },
  {
    slug: "curly-willow",
    name: "龍柳",
    latin: "Salix matsudana 'Tortuosa'",
    layer: "skeleton",
    model: "curlyWillow",
    color: "#7a5c43",
    accent: "#a7b37c",
    colorName: "枯木褐",
    form: "line",
    months: [1, 2, 3, 10, 11, 12],
    styles: ["wabi"],
    vaseLifeDays: 21,
    height: 0.55,
    headRadius: 0.04,
    care: "枝條非常耐久，泡水後可能長出新根與嫩芽；每三天換水即可。",
    meaning: "堅韌、生生不息",
  },
  // ── 焦點主花 ──
  {
    slug: "tulip-pink",
    name: "鬱金香（粉）",
    latin: "Tulipa gesneriana",
    layer: "focal",
    model: "tulip",
    color: "#e8a1b0",
    accent: "#6f8f6a",
    colorName: "櫻花粉",
    form: "cup",
    months: [12, 1, 2, 3, 4],
    styles: ["korean", "french"],
    vaseLifeDays: 6,
    height: 0.3,
    headRadius: 0.032,
    care: "剪下後仍會繼續長高並向光彎曲；水位保持淺淺 5 公分，每天轉動花瓶讓花莖站直。",
    meaning: "愛的告白、體貼",
  },
  {
    slug: "tulip-white",
    name: "鬱金香（白）",
    latin: "Tulipa gesneriana",
    layer: "focal",
    model: "tulip",
    color: "#f3efe6",
    accent: "#6f8f6a",
    colorName: "奶油白",
    form: "cup",
    months: [12, 1, 2, 3, 4],
    styles: ["wabi", "korean"],
    vaseLifeDays: 6,
    height: 0.3,
    headRadius: 0.032,
    care: "剪下後仍會繼續長高並向光彎曲；水位保持淺淺 5 公分，每天轉動花瓶讓花莖站直。",
    meaning: "純潔、新的開始",
  },
  {
    slug: "peony-coral",
    name: "芍藥（珊瑚粉）",
    latin: "Paeonia lactiflora",
    layer: "focal",
    model: "peony",
    color: "#ef8f86",
    accent: "#f6d38a",
    colorName: "珊瑚粉",
    form: "round",
    months: [4, 5, 6],
    styles: ["french", "korean"],
    vaseLifeDays: 5,
    height: 0.27,
    headRadius: 0.058,
    care: "買花苞回家，用濕紙巾輕擦花苞上的糖膠可加速綻放；避開陽光直射與冷氣出風口。",
    meaning: "富貴、深情",
  },
  {
    slug: "sunflower",
    name: "向日葵",
    latin: "Helianthus annuus",
    layer: "focal",
    model: "sunflower",
    color: "#f4b532",
    accent: "#5a3a1e",
    colorName: "暖陽黃",
    form: "disc",
    months: [5, 6, 7, 8, 9, 10],
    styles: ["french", "korean"],
    vaseLifeDays: 7,
    height: 0.32,
    headRadius: 0.062,
    care: "花頭重，需要較深的水與穩固的花器；葉片容易萎軟，只保留上方兩片即可。",
    meaning: "光輝、忠誠",
  },
  // ── 配花次主角 ──
  {
    slug: "lisianthus-purple",
    name: "桔梗（紫）",
    latin: "Eustoma grandiflorum",
    layer: "secondary",
    model: "lisianthus",
    color: "#8e6bb8",
    accent: "#7d9a7a",
    colorName: "薰衣紫",
    form: "ruffle",
    months: ALL_YEAR,
    styles: ["korean", "french", "wabi"],
    vaseLifeDays: 10,
    height: 0.24,
    headRadius: 0.042,
    care: "多分枝花材，可剪下側枝分開使用；摘掉凋謝的花，花苞會繼續開。",
    meaning: "真誠不變的愛",
  },
  {
    slug: "lisianthus-white",
    name: "桔梗（白）",
    latin: "Eustoma grandiflorum",
    layer: "secondary",
    model: "lisianthus",
    color: "#f5f2ee",
    accent: "#7d9a7a",
    colorName: "雲朵白",
    form: "ruffle",
    months: ALL_YEAR,
    styles: ["korean", "french", "wabi"],
    vaseLifeDays: 10,
    height: 0.24,
    headRadius: 0.042,
    care: "多分枝花材，可剪下側枝分開使用；摘掉凋謝的花，花苞會繼續開。",
    meaning: "純潔無瑕",
  },
  {
    slug: "freesia-yellow",
    name: "小蒼蘭（黃）",
    latin: "Freesia refracta",
    layer: "secondary",
    model: "freesia",
    color: "#f6d55c",
    accent: "#7f9a5b",
    colorName: "檸檬黃",
    form: "spike",
    months: [12, 1, 2, 3, 4],
    styles: ["korean", "french"],
    vaseLifeDays: 7,
    height: 0.24,
    headRadius: 0.035,
    care: "香氣濃郁；花穗由下往上依序開放，摘除謝掉的小花可延長觀賞期。",
    meaning: "天真、清新",
  },
  {
    slug: "freesia-white",
    name: "小蒼蘭（白）",
    latin: "Freesia refracta",
    layer: "secondary",
    model: "freesia",
    color: "#f7f3e3",
    accent: "#7f9a5b",
    colorName: "象牙白",
    form: "spike",
    months: [12, 1, 2, 3, 4],
    styles: ["wabi", "korean", "french"],
    vaseLifeDays: 7,
    height: 0.24,
    headRadius: 0.035,
    care: "香氣濃郁；花穗由下往上依序開放，摘除謝掉的小花可延長觀賞期。",
    meaning: "純真、信賴",
  },
  // ── 填充靈魂 ──
  {
    slug: "gypsophila",
    name: "滿天星",
    latin: "Gypsophila paniculata",
    layer: "filler",
    model: "gypsophila",
    color: "#fbfaf6",
    accent: "#8aa07a",
    colorName: "霧白",
    form: "spray",
    months: ALL_YEAR,
    styles: ["korean", "french"],
    vaseLifeDays: 10,
    height: 0.2,
    headRadius: 0.045,
    care: "對乙烯敏感，請遠離水果；謝了可以倒吊風乾成乾燥花。",
    meaning: "思念、真心喜歡",
  },
  {
    slug: "chamomile",
    name: "洋甘菊",
    latin: "Matricaria chamomilla",
    layer: "filler",
    model: "chamomile",
    color: "#fffdf5",
    accent: "#f2c94c",
    colorName: "白瓣黃心",
    form: "daisy",
    months: [2, 3, 4, 5],
    styles: ["french", "wabi"],
    vaseLifeDays: 5,
    height: 0.18,
    headRadius: 0.035,
    care: "莖細容易彎折，水位不要太深以免莖部腐爛；放在通風處。",
    meaning: "苦難中的力量",
  },
  {
    slug: "trachelium",
    name: "夕霧",
    latin: "Trachelium caeruleum",
    layer: "filler",
    model: "trachelium",
    color: "#7d5fa6",
    accent: "#6f8a5e",
    colorName: "暮霧紫",
    form: "cluster",
    months: [3, 4, 5, 6, 7, 8, 9],
    styles: ["korean", "french"],
    vaseLifeDays: 7,
    height: 0.2,
    headRadius: 0.04,
    care: "花頭由無數小花組成，吸水量大，需要每天補水。",
    meaning: "溫柔的思念",
  },
];
