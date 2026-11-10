// 自用送禮：送禮代客送花（模式 A）與自用每日限量花材包（模式 B）的商品與設定。
// 商品資料執行 `npm run seed:gifts -- <照片資料夾>` 寫入 MongoDB 的 gift_products 集合（照片上傳到 Vercel Blob）。
// 注意：此檔案不能 import 其他模組，因為種子腳本會直接用 Node 執行它。

export type Occasion = "opening" | "birthday" | "anniversary" | "exhibition";

export const OCCASIONS: { id: Occasion; name: string; caption: string; from: number }[] = [
  { id: "opening", name: "新店開幕／誌慶盆花", caption: "蝴蝶蘭、誌慶花道，開幕吉時準時送達", from: 3880 },
  { id: "birthday", name: "生日祝福花束", caption: "手綁花束＋代寫手寫感卡片", from: 2500 },
  { id: "anniversary", name: "紀念日奢華禮盒", caption: "精選進口玫瑰，霧面硬盒包裝", from: 4880 },
  { id: "exhibition", name: "空間微型展覽策劃", caption: "店面櫥窗、接待大廳的花藝裝置", from: 3000 },
];

export type RecipeStem = { layer: "骨架" | "焦點" | "配花" | "填充" | "葉材"; name: string; count: number; lengthCm?: number; note?: string };

/** 給合作花店的規格化花藝配方卡（Floral Recipe） */
export type FloralRecipe = {
  vessel: string;
  dimensions: string;
  colors: { name: string; hex: string }[];
  stems: RecipeStem[];
  wrapping: string;
  notes: string[];
};

export type GiftTier = { id: string; name: string; priceTwd: number; spec: string; factor: number };

export type GiftProduct = {
  slug: string;
  occasion: Occasion;
  name: string;
  tagline: string;
  description: string;
  includes: string[];
  /** 最早可配送：今天 + leadDays 天 */
  leadDays: number;
  tiers: GiftTier[];
  recipe: FloralRecipe;
  image: { url?: string; width: number; height: number; alt: string; author: string; license: string; source: string };
};

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file.replace(/ /g, "_")}`;
const photo = (w: number, h: number, alt: string, author: string, file: string) => ({
  width: w,
  height: h,
  alt,
  author,
  license: "CC0",
  source: commons(file),
});

export const giftCatalog: GiftProduct[] = [
  {
    slug: "opening-orchid-five",
    occasion: "opening",
    name: "鴻運當頭・白色蝴蝶蘭",
    tagline: "開幕誌慶最穩重的選擇，花期可達兩個月",
    description:
      "精選大輪白色蝴蝶蘭，每株 2 梗以上、花苞飽滿，以霧面陶盆與青苔收邊。附金色緞帶與誌慶立牌，開幕吉時準時送達。",
    includes: ["霧面陶盆＋青苔收邊", "金色緞帶與誌慶立牌（代印賀詞）", "出貨前實拍核對", "專車避震配送"],
    leadDays: 2,
    tiers: [
      { id: "s", name: "三株", priceTwd: 3880, spec: "寬 35 × 高 70 cm", factor: 0.6 },
      { id: "m", name: "五株（推薦）", priceTwd: 5880, spec: "寬 50 × 高 80 cm", factor: 1 },
      { id: "l", name: "八株", priceTwd: 8880, spec: "寬 70 × 高 90 cm", factor: 1.6 },
    ],
    recipe: {
      vessel: "霧面白陶盆 直徑 30 cm",
      dimensions: "寬 50 × 高 80 cm（五株）",
      colors: [
        { name: "純白", hex: "#f8f6f2" },
        { name: "青苔綠", hex: "#6b7d3a" },
        { name: "香檳金", hex: "#c9a24a" },
      ],
      stems: [
        { layer: "焦點", name: "白色大輪蝴蝶蘭（2 梗以上／株）", count: 5, note: "花朵朝同一方向，形成瀑布弧線" },
        { layer: "葉材", name: "水苔＋青苔", count: 1, note: "完全覆蓋盆土" },
        { layer: "骨架", name: "竹製支架", count: 5, note: "隱藏在花梗後方" },
      ],
      wrapping: "金色雙面緞帶＋誌慶立牌",
      notes: ["蘭花梗不可有折痕", "花苞與開花比例約 4：6，送達後持續綻放", "立牌賀詞需與訂單一致，送出前拍照核對"],
    },
    image: photo(1800, 1202, "白色蝴蝶蘭特寫", "Joanna Kosinska", "White orchids (Unsplash).jpg"),
  },
  {
    slug: "opening-crimson-ikebana",
    occasion: "opening",
    name: "紅運誌慶・東方花道",
    tagline: "紅果與百合的東方構圖，適合精品店與餐廳",
    description:
      "以紅色果枝拉出向上的線條，搭配白色百合與綠葉，置於深色淺盆。比傳統花籃更有質感，擺在櫃台或接待區都不佔空間。",
    includes: ["深色陶盆＋劍山", "代印誌慶卡片", "出貨前實拍核對", "專車避震配送"],
    leadDays: 2,
    tiers: [
      { id: "m", name: "標準", priceTwd: 4880, spec: "寬 45 × 高 75 cm", factor: 1 },
      { id: "l", name: "大型", priceTwd: 7880, spec: "寬 70 × 高 110 cm", factor: 1.6 },
    ],
    recipe: {
      vessel: "深褐色淺陶盆 直徑 36 cm＋劍山",
      dimensions: "寬 45 × 高 75 cm",
      colors: [
        { name: "朱紅", hex: "#a8312c" },
        { name: "百合白", hex: "#f4f1e6" },
        { name: "深綠", hex: "#3f5a3a" },
      ],
      stems: [
        { layer: "骨架", name: "紅色果枝（山歸來或南天竹）", count: 3, lengthCm: 75, note: "天枝向右上" },
        { layer: "焦點", name: "白色東方百合", count: 3, lengthCm: 45, note: "花藥需先摘除" },
        { layer: "配花", name: "白色小菊", count: 5, lengthCm: 30 },
        { layer: "葉材", name: "電信蘭葉", count: 3, lengthCm: 40, note: "根部收攏、遮住劍山" },
      ],
      wrapping: "不包裝，附固定木箱運送",
      notes: ["百合花藥全部摘除，避免沾染", "劍山完全被葉材覆蓋", "天、人、地三枝成不等邊三角形"],
    },
    image: photo(1800, 2400, "格窗前以紅色果枝與白百合構成的東方花道", "Gryffindor", "Ikebana exhibition at Meguro Gajoen 2018 11.jpg"),
  },
  {
    slug: "birthday-sunrise-roses",
    occasion: "birthday",
    name: "晨光・橘玫瑰花束",
    tagline: "明亮溫暖的橘色，送給正在發光的人",
    description: "以暖橘色玫瑰為主角，搭配少量綠葉，用霧面白紙包裝。顏色單純、份量剛好，最適合生日或升遷祝賀。",
    includes: ["霧面白色包裝紙＋緞帶", "代印手寫感卡片", "保水處理", "出貨前實拍核對"],
    leadDays: 1,
    tiers: [
      { id: "s", name: "11 朵", priceTwd: 2500, spec: "高 45 cm", factor: 1 },
      { id: "m", name: "21 朵", priceTwd: 3800, spec: "高 50 cm", factor: 1.9 },
      { id: "l", name: "33 朵", priceTwd: 5600, spec: "高 55 cm", factor: 3 },
    ],
    recipe: {
      vessel: "手綁花束（螺旋花腳）",
      dimensions: "高 45 × 寬 30 cm（11 朵）",
      colors: [
        { name: "暖橘", hex: "#ef8a3c" },
        { name: "霧白", hex: "#f4f1ec" },
        { name: "葉綠", hex: "#6f8a4f" },
      ],
      stems: [
        { layer: "焦點", name: "橘色玫瑰（Free Spirit 或同等）", count: 11, lengthCm: 45 },
        { layer: "葉材", name: "尤加利葉", count: 3, lengthCm: 45 },
        { layer: "填充", name: "白色小蠟花", count: 3, lengthCm: 40 },
      ],
      wrapping: "霧面白紙兩層＋米色緞帶",
      notes: ["花頭高度一致、呈微弧形", "花腳剪齊，保水棉＋保水袋", "卡片內容送出前拍照核對"],
    },
    image: photo(1800, 1200, "白色背景前的一束橘色玫瑰", "Melinda Pack", "Orange rose bouquet (Unsplash).jpg"),
  },
  {
    slug: "birthday-vintage-garden",
    occasion: "birthday",
    name: "復古花園・莫蘭迪花束",
    tagline: "灰粉、奶茶與香檳色，低調又有層次",
    description: "多種玫瑰與草花組成的莫蘭迪色系花束，像一座小型復古花園。適合喜歡低彩度、耐看配色的收禮人。",
    includes: ["牛皮紙與霧面紙雙層包裝", "代印手寫感卡片", "保水處理", "出貨前實拍核對"],
    leadDays: 1,
    tiers: [
      { id: "m", name: "標準", priceTwd: 3200, spec: "高 50 cm", factor: 1 },
      { id: "l", name: "豐盛", priceTwd: 4800, spec: "高 55 cm", factor: 1.6 },
    ],
    recipe: {
      vessel: "手綁花束（螺旋花腳）",
      dimensions: "高 50 × 寬 35 cm",
      colors: [
        { name: "灰粉", hex: "#c9a2a2" },
        { name: "奶茶", hex: "#d8c3a8" },
        { name: "香檳", hex: "#efe2c8" },
      ],
      stems: [
        { layer: "焦點", name: "灰粉色玫瑰", count: 5, lengthCm: 48 },
        { layer: "配花", name: "奶茶色玫瑰", count: 5, lengthCm: 48 },
        { layer: "配花", name: "白色庭園玫瑰", count: 3, lengthCm: 46 },
        { layer: "填充", name: "落新婦", count: 3, lengthCm: 45 },
        { layer: "葉材", name: "銀葉尤加利", count: 3, lengthCm: 50 },
      ],
      wrapping: "牛皮紙＋霧面灰粉紙＋麻繩",
      notes: ["花頭高低錯落 3–5 cm，避免整齊的半球", "顏色由中心深到外圍淺"],
    },
    image: photo(1800, 1202, "灰粉與奶茶色的莫蘭迪玫瑰花束", "Jez Timms", "Pastel rose bouquet (Unsplash).jpg"),
  },
  {
    slug: "anniversary-noir-roses",
    occasion: "anniversary",
    name: "夜幕玫瑰・黑金禮盒",
    tagline: "深色硬盒裡的粉色玫瑰，打開的瞬間最動人",
    description:
      "黑色霧面硬盒，內襯保水花泥，滿鋪精選粉色玫瑰並以金色細節點綴。不需要花瓶，放在桌上就是一份完整的禮物。",
    includes: ["黑色霧面硬盒（燙金 LOGO）", "代印手寫感卡片", "保水花泥（可維持 5–7 天）", "出貨前實拍核對", "專車避震配送"],
    leadDays: 1,
    tiers: [
      { id: "m", name: "16 朵", priceTwd: 4880, spec: "20 × 20 × 15 cm", factor: 1 },
      { id: "l", name: "36 朵", priceTwd: 8800, spec: "30 × 30 × 15 cm", factor: 2.25 },
    ],
    recipe: {
      vessel: "黑色霧面方形硬盒＋保水花泥",
      dimensions: "20 × 20 × 15 cm",
      colors: [
        { name: "夜黑", hex: "#1f1b1a" },
        { name: "玫瑰粉", hex: "#e9a3a8" },
        { name: "金", hex: "#c9a24a" },
      ],
      stems: [
        { layer: "焦點", name: "粉色玫瑰（大花頭 6 cm 以上）", count: 16, lengthCm: 8, note: "4 × 4 排列，花面齊平" },
        { layer: "填充", name: "金色乾燥小果", count: 5, note: "點綴於縫隙" },
      ],
      wrapping: "盒外黑色緞帶＋燙金封籤",
      notes: ["花泥需完全浸透後再插", "花頭高度與盒口齊平，不可突出", "盒內不得看見花泥"],
    },
    image: photo(1800, 1013, "深色背景前滿版盛開的紅色花朵", "Teo Duldulao", "Red flowers from above (Unsplash).jpg"),
  },
  {
    slug: "anniversary-blush-box",
    occasion: "anniversary",
    name: "初戀粉・圓筒花盒",
    tagline: "柔和的粉色系花盒，適合第一個紀念日",
    description: "粉色玫瑰與當季芍藥滿鋪在白色圓筒花盒中，附手寫感卡片。溫柔不張揚，也很適合送給媽媽。",
    includes: ["白色圓筒花盒＋緞帶", "代印手寫感卡片", "保水花泥", "出貨前實拍核對"],
    leadDays: 1,
    tiers: [
      { id: "m", name: "標準", priceTwd: 5280, spec: "直徑 20 cm", factor: 1 },
      { id: "l", name: "大型", priceTwd: 7880, spec: "直徑 26 cm", factor: 1.7 },
    ],
    recipe: {
      vessel: "白色圓筒花盒 直徑 20 cm＋保水花泥",
      dimensions: "直徑 20 × 高 22 cm",
      colors: [
        { name: "蜜桃粉", hex: "#f2b4a8" },
        { name: "奶油白", hex: "#f6efe6" },
        { name: "鼠尾草綠", hex: "#8fa37a" },
      ],
      stems: [
        { layer: "焦點", name: "蜜桃粉玫瑰", count: 15, lengthCm: 10 },
        { layer: "配花", name: "白色小玫瑰", count: 5, lengthCm: 10 },
        { layer: "葉材", name: "銀葉菊", count: 3, lengthCm: 8, note: "收邊" },
      ],
      wrapping: "盒蓋＋米白緞帶蝴蝶結",
      notes: ["花面呈微微隆起的弧形", "邊緣以銀葉菊遮住花泥"],
    },
    image: photo(1800, 1200, "滿版盛開的粉色芍藥", "Irina", "Pions (Unsplash).jpg"),
  },
  {
    slug: "exhibition-storefront",
    occasion: "exhibition",
    name: "櫥窗微型花藝展",
    tagline: "為店面、櫥窗策劃一檔 7 天的花藝小展",
    description:
      "由 AuraFlora 花藝師到場丈量，依品牌色與檔期主題策劃 3–5 件花藝作品，含進場佈置與撤場。下單後先支付諮詢訂金，正式報價可全額折抵。",
    includes: ["到場丈量與主題提案", "3–5 件花藝作品", "進場佈置與撤場", "展期中途一次補花", "訂金全額折抵正式報價"],
    leadDays: 7,
    tiers: [{ id: "deposit", name: "諮詢訂金", priceTwd: 3000, spec: "正式報價約 NT$ 18,000 起", factor: 1 }],
    recipe: {
      vessel: "依現場提案",
      dimensions: "依現場丈量",
      colors: [
        { name: "依品牌色", hex: "#b5525c" },
        { name: "中性白", hex: "#f4f1ea" },
        { name: "葉綠", hex: "#6f7d5c" },
      ],
      stems: [{ layer: "骨架", name: "依提案內容", count: 1, note: "花店接單後先回報可到場丈量的時段" }],
      wrapping: "現場佈置",
      notes: ["先到場丈量並拍攝空間照片", "提案確認後再採購花材"],
    },
    image: photo(1800, 1349, "屏風前的花藝作品展示", "Gryffindor", "Nagoya Ikebana Art Exhibition Sakae Nov 2018 05.jpg"),
  },
  {
    slug: "exhibition-zen-corner",
    occasion: "exhibition",
    name: "接待大廳・季節花藝裝置",
    tagline: "一件花量飽滿的主作品，讓大廳一進門就有記憶點",
    description: "為接待大廳或會議室入口設計一件大型季節花藝裝置，以當季盛開的花材堆疊出飽滿的量體，每週更換一次。適合企業與精品空間。",
    includes: ["空間丈量與提案", "主作品一件（每週更換）", "專人維護", "訂金全額折抵正式報價"],
    leadDays: 7,
    tiers: [{ id: "deposit", name: "諮詢訂金", priceTwd: 3000, spec: "月費方案約 NT$ 12,000 起", factor: 1 }],
    recipe: {
      vessel: "依現場提案",
      dimensions: "依現場丈量",
      colors: [
        { name: "依空間色調", hex: "#3f5a3a" },
        { name: "暖光米", hex: "#efe2c8" },
        { name: "枯木褐", hex: "#7a5c43" },
      ],
      stems: [{ layer: "骨架", name: "依提案內容", count: 1, note: "先到場評估光線與動線" }],
      wrapping: "現場佈置",
      notes: ["確認空間光源方向，作品影子也是設計的一部分"],
    },
    image: photo(1800, 1200, "大量盛開的粉紫色繡球花", "Veri Ivanova", "Pink hydrangea clusters (Unsplash).jpg"),
  },
];

// ───────────── 配送設定 ─────────────

export const SERVICE_AREAS: Record<string, string[]> = {
  台北市: ["中正區", "大同區", "中山區", "松山區", "大安區", "萬華區", "信義區", "士林區", "北投區", "內湖區", "南港區", "文山區"],
  新北市: ["板橋區", "三重區", "中和區", "永和區", "新莊區", "新店區", "土城區", "蘆洲區", "汐止區", "樹林區", "林口區", "淡水區"],
  桃園市: ["桃園區", "中壢區", "龜山區", "蘆竹區", "八德區", "平鎮區"],
  台中市: ["西屯區", "南屯區", "北屯區", "西區", "北區", "南區", "東區", "中區"],
  高雄市: ["前鎮區", "苓雅區", "新興區", "前金區", "鼓山區", "左營區", "三民區"],
};

export const TIME_SLOTS = ["09:00–12:00", "12:00–15:00", "15:00–18:00", "18:00–21:00"];

/** 品質履約承諾標章 */
export const QUALITY_BADGES = [
  { id: "shock", title: "專車避震配送", text: "不與一般包裹混裝，花禮固定於避震架上，由專車直送。" },
  { id: "photo", title: "出貨前實拍核對（Photo-Check）", text: "花店完成後拍照上傳，經平台審核才出貨；你也能在訂單頁看到實拍照。" },
  { id: "partner", title: "特約花店品質協議", text: "合作花店簽署品質協議：花材新鮮度、配方枝數與尺寸皆依規格化配方卡製作。" },
];

/** 出貨前檢查表（花店需全部勾選並上傳實拍，才能送審） */
export const PRESHIP_CHECKLIST = [
  { id: "fresh", label: "花材新鮮：花瓣無褐斑、無垂頭、無折損" },
  { id: "recipe", label: "配方核對：各層花材枝數與配方卡一致" },
  { id: "size", label: "尺寸核對：高度與寬度符合規格（±5%）" },
  { id: "color", label: "色彩核對：與配方卡色票一致" },
  { id: "card", label: "卡片核對：代印卡片內容與訂單一致、無錯字" },
  { id: "water", label: "保水處理：花泥浸透／保水棉與保水袋完成" },
  { id: "pack", label: "避震包裝：固定架與緩衝材完成" },
];

// ───────────── 模式 B：每日限量時令花材包 ─────────────

export const WEEKLY_KIT = {
  slug: "weekly-misty-morning",
  title: "靜謐晨霧・洋甘菊與白洋桔梗",
  description: "白色洋桔梗與洋甘菊，搭配銀葉尤加利。附花器尺寸建議與插花步驟卡，週末一小時就能完成。",
  priceTwd: 890,
  dailyLimit: 20,
  stems: [
    { layer: "焦點", name: "白色洋桔梗", count: 5 },
    { layer: "填充", name: "洋甘菊", count: 8 },
    { layer: "葉材", name: "銀葉尤加利", count: 3 },
  ] as RecipeStem[],
};

export const RECIPE_KIT_PRICE = 890;
