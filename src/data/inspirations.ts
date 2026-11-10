// 風格策展・場景靈感庫：執行 `npm run seed:inspirations -- <照片資料夾>` 會把照片上傳到 Vercel Blob，
// 公開資料寫入 MongoDB 的 inspirations 集合，會員限定的「花材黃金比例清單」寫入 inspiration_recipes 集合。
// 注意：此檔案不能 import 其他模組，因為種子腳本會直接用 Node 執行它。

export type CurationStyle = "wabi" | "korean" | "french" | "nordic";
export type CurationScene = "entry" | "dining" | "bedside" | "handheld";
export type CurationType = "table" | "bouquet" | "posy" | "wreath";
export type CurationSeason = "spring" | "valentine" | "autumn" | "halloween" | "winter" | "christmas";

export const CURATION_STYLES: { id: CurationStyle; name: string; hint: string }[] = [
  { id: "wabi", name: "日式侘寂", hint: "線條、留白、季節感" },
  { id: "korean", name: "韓式簡約", hint: "柔和色調、同色系層次" },
  { id: "french", name: "法式浪漫", hint: "鬆散自然、像剛從花園剪下" },
  { id: "nordic", name: "北歐極簡", hint: "一瓶一枝、與生活空間融合" },
];

export const CURATION_SCENES: { id: CurationScene; name: string; hint: string }[] = [
  { id: "entry", name: "玄關迎接桌花", hint: "第一眼的印象，高度與存在感" },
  { id: "dining", name: "6 人長餐桌低矮微景", hint: "低於 25 公分，不擋住對座的臉" },
  { id: "bedside", name: "床頭靜謐小品", hint: "小巧、無濃烈香氣、好照顧" },
  { id: "handheld", name: "手拿捧花", hint: "握感、重量、與服裝的搭配" },
];

export const CURATION_TYPES: { id: CurationType; name: string }[] = [
  { id: "table", name: "桌花" },
  { id: "bouquet", name: "捧花" },
  { id: "posy", name: "花束" },
  { id: "wreath", name: "花圈" },
];

export const CURATION_SEASONS: { id: CurationSeason; name: string }[] = [
  { id: "spring", name: "春日" },
  { id: "valentine", name: "情人節" },
  { id: "autumn", name: "秋日" },
  { id: "halloween", name: "萬聖節" },
  { id: "winter", name: "冬日" },
  { id: "christmas", name: "聖誕節" },
];

export type InspirationImage = {
  url?: string;
  width: number;
  height: number;
  alt: string;
  author: string;
  license: string;
  source: string;
};

export type Inspiration = {
  slug: string;
  title: string;
  subtitle: string;
  style: CurationStyle;
  scene: CurationScene | null;
  type: CurationType;
  season: CurationSeason | null;
  description: string;
  tips: string[];
  palette: string[];
  image: InspirationImage;
};

export type GoldenStem = {
  layer: "骨架" | "焦點" | "配花" | "填充" | "葉材";
  name: string;
  count: number;
  lengthCm: number;
  note?: string;
};

export type GoldenRecipe = {
  slug: string;
  vessel: string;
  /** 依黃金比例 φ = 1.618 計算的尺寸 */
  proportion: { label: string; value: string }[];
  /** 主色 61.8%・輔色 23.6%・點綴 14.6% */
  colors: { name: string; hex: string; percent: number }[];
  stems: GoldenStem[];
  budgetTwd: number;
};

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file.replace(/ /g, "_")}`;
const img = (w: number, h: number, alt: string, author: string, file: string, license = "CC0"): InspirationImage => ({
  width: w,
  height: h,
  alt,
  author,
  license,
  source: commons(file),
});

export const inspirationCatalog: Inspiration[] = [
  {
    slug: "entry-camellia-wabi",
    title: "山茶與南天竹・玄關迎客",
    subtitle: "一枝冬山茶，搭配紅果點出季節",
    style: "wabi",
    scene: "entry",
    type: "table",
    season: "winter",
    description:
      "玄關是客人進門的第一眼。高瓶插一枝線條清楚的山茶，旁邊斜出幾串南天竹紅果，枝葉之間刻意留白，安靜卻有存在感。",
    tips: ["花高約為花器的 1.6 倍，站著也能平視花頭", "紅果只佔畫面一小角，是冬天的點綴色"],
    palette: ["#2f4a2e", "#f3efe6", "#c4462a"],
    image: img(1800, 1349, "高瓶中插著山茶與紅果的日式花道作品", "Gryffindor", "Ikebana exhibition at Meguro Gajoen 2018 22.jpg"),
  },
  {
    slug: "entry-alcove-wabi",
    title: "床之間的秋色・盛花",
    subtitle: "黃綠枝葉與小菊，像把庭院搬進屋內",
    style: "wabi",
    scene: "entry",
    type: "table",
    season: "autumn",
    description:
      "以日式「盛花」的手法，在淺盆中插出高低錯落的枝葉與小菊。放在玄關的木台或鞋櫃上，是很有溫度的迎賓角落。",
    tips: ["主枝向左、副枝向右，構成不等邊三角形", "盆口露出一點水面，增加清涼感"],
    palette: ["#6f7d3c", "#e2c25b", "#3a2f22"],
    image: img(1800, 1439, "木造凹室中的日式盛花作品", "Gryffindor", "Ikebana exhibition at Meguro Gajoen 2018 06.jpg"),
  },
  {
    slug: "entry-berries-french",
    title: "野莓與粉玫瑰・法式玄關花",
    subtitle: "鬆散的線條，像剛從花園剪下",
    style: "french",
    scene: "entry",
    type: "table",
    season: null,
    description:
      "粉玫瑰、野莓與細長的草花隨性插進陶瓶，高低參差、不對稱。法式玄關花不追求整齊，要的是「不經意」的優雅。",
    tips: ["保留枝條原本的彎曲，不要全部剪齊", "果實類花材增加層次，也比較耐放"],
    palette: ["#e8a79a", "#7d8f5a", "#f4ece3"],
    image: img(1800, 1202, "陶瓶中鬆散插著粉玫瑰與野莓的法式花藝", "chuttersnap", "Sweet-scented bouquet (Unsplash).jpg"),
  },
  {
    slug: "dining-white-roses-french",
    title: "白玫瑰長桌花・6 人晚宴",
    subtitle: "低矮橫向延伸，賓客之間看得見彼此",
    style: "french",
    scene: "dining",
    type: "table",
    season: null,
    description:
      "長桌花沿著桌面中線延伸，高度壓在 25 公分以下，6 位賓客交談時不會被擋住。白玫瑰搭配深綠葉材，與餐具、玻璃杯的質感相互呼應。",
    tips: ["長度約為桌長的 0.618 倍，兩端留出放菜的空間", "避開香氣濃烈的花材，以免干擾食物風味"],
    palette: ["#f4f1ea", "#3f5a3a", "#d9c7b8"],
    image: img(
      1800,
      1201,
      "宴會長桌上低矮的白玫瑰桌花",
      "Bhullargraphic",
      "Legant table setting with white floral centerpiece.jpg",
      "CC BY-SA 4.0",
    ),
  },
  {
    slug: "spring-peony-abundance",
    title: "芍藥滿盆・春日餐桌",
    subtitle: "一整盆盛開的粉芍藥，春天最奢侈的份量",
    style: "french",
    scene: "dining",
    type: "table",
    season: "spring",
    description:
      "芍藥一年只有短短幾週，盛開時花瓣層層疊疊、香氣柔和。把整盆芍藥壓低放在餐桌中央，讓花頭彼此依偎，就是春天最有份量的風景。",
    tips: ["花頭緊密排列，高度壓在 25 公分以下", "買半開的花苞，上桌當天正好盛開"],
    palette: ["#e7a3c4", "#f6dbe8", "#7d9a6a"],
    image: img(1800, 1200, "滿版盛開的粉紅色芍藥", "Irina", "Pions (Unsplash).jpg"),
  },
  {
    slug: "bedside-blossom-wabi",
    title: "一枝春櫻・床頭小品",
    subtitle: "暗色背景裡，一枝花就是整個季節",
    style: "wabi",
    scene: "bedside",
    type: "table",
    season: "spring",
    description:
      "床頭不需要大量花材。窄口小瓶插一枝粉色花枝，在柔和的燈光下就很安靜。花朵小、香氣淡，不會影響睡眠。",
    tips: ["花器高度 10～15 公分，花枝高出約 1.6 倍", "選擇香氣淡的花材，避免百合等濃香"],
    palette: ["#e7a3ae", "#2c3a2e", "#6b4a3a"],
    image: img(1800, 2697, "深色背景前小瓶中的一枝粉色花", "Kristina M M", "Modest pink flowers in a vase (Unsplash).jpg"),
  },
  {
    slug: "bedside-daisy-korean",
    title: "黃色小雛菊・晨光床頭",
    subtitle: "白牆、透明瓶、一小把黃色",
    style: "korean",
    scene: "bedside",
    type: "table",
    season: null,
    description:
      "韓式簡約常用「單一色系＋大量留白」。一小把黃色雛菊插在透明玻璃罐，放在白色床頭櫃上，早上醒來就看到陽光的顏色。",
    tips: ["透明花器讓花莖也成為畫面的一部分", "每天換水，保持玻璃清澈"],
    palette: ["#f2c53d", "#f7f5f0", "#7a8f4e"],
    image: img(1800, 2700, "白牆前玻璃罐中的一小把黃色花", "NordWood Themes", "Pink and yellow flower vase (Unsplash).jpg"),
  },
  {
    slug: "bedside-window-nordic",
    title: "晨光花束・北歐窗邊",
    subtitle: "一個透明高瓶，一大把明亮的黃橘色",
    style: "nordic",
    scene: "bedside",
    type: "table",
    season: null,
    description: "北歐風重視自然光。把一整把黃橘色的花插進透明高瓶，放在靠窗的床頭或邊桌，早晨的光一照進來，整個房間都亮了。",
    tips: ["花材高度約為瓶高的 1.6 倍", "透明瓶每天換水，花莖也是畫面的一部分"],
    palette: ["#f2b632", "#e8742a", "#eceae6"],
    image: img(1800, 1192, "白色百葉窗前透明高瓶中的一大束黃橘色花", "Math", "Flower Vase (Unsplash).jpg"),
  },
  {
    slug: "bouquet-bride-french",
    title: "珍珠灰與玫瑰・新娘圓形捧花",
    subtitle: "經典圓形，搭配任何禮服都不出錯",
    style: "french",
    scene: "handheld",
    type: "bouquet",
    season: null,
    description:
      "粉玫瑰、紫色小花與銀灰色果實組成的圓形捧花，直徑約與新娘肩寬的 0.618 倍相當，握起來剛好，也不會遮住禮服的腰線。",
    tips: ["握把長度約一個拳頭半，用緞帶包覆", "捧花重量控制在 1 公斤以內，拍照時才不會累"],
    palette: ["#f0c3cf", "#9a8fb5", "#c9ccc6"],
    image: img(1800, 2761, "新娘手持粉色與紫色的圓形捧花", "Beatriz Pérez Moya", "Bride with a regal bouquet (Unsplash).jpg"),
  },
  {
    slug: "bouquet-bridesmaid-french",
    title: "暖橘玫瑰・伴娘捧花",
    subtitle: "比新娘捧花小一號，顏色更大膽",
    style: "french",
    scene: "handheld",
    type: "bouquet",
    season: null,
    description: "伴娘捧花通常比新娘小、色彩更鮮明。白玫瑰為底，加入橘紅色玫瑰作為跳色，與深色伴娘服形成對比。",
    tips: ["尺寸約為新娘捧花的 0.618 倍", "顏色可以呼應伴娘服或婚禮主色"],
    palette: ["#f6efe4", "#e0643c", "#5a2a2a"],
    image: img(1800, 1200, "伴娘手持白色與橘紅色玫瑰捧花", "Désirée Fawn", "Bridesmaid Bouquet (Unsplash).jpg"),
  },
  {
    slug: "bouquet-meadow-french",
    title: "野花原・田園手綁捧花",
    subtitle: "小花、草花與香草，像散步時隨手摘的",
    style: "french",
    scene: "handheld",
    type: "bouquet",
    season: "spring",
    description:
      "結合小玫瑰、藍色小花、蓍草與枝條的田園捧花，高低參差、邊緣不規則。適合戶外婚禮或春天的求婚。",
    tips: ["以螺旋花腳手綁，花莖斜向同一方向", "保留部分枝條向外伸出，輪廓才自然"],
    palette: ["#e6b7a8", "#7f9cc7", "#e5c96a"],
    image: img(1800, 1247, "手持色彩豐富的田園風小花束", "Ivan Jevtic", "Woman with a small bouquet (Unsplash).jpg"),
  },
  {
    slug: "bouquet-dried-wabi",
    title: "乾燥繡球・秋日侘寂",
    subtitle: "褪色之後，另一種耐看的美",
    style: "wabi",
    scene: "handheld",
    type: "posy",
    season: "autumn",
    description:
      "整束自然風乾的繡球，花色從粉紫褪成奶茶與枯葉色。侘寂的美在於接受時間的痕跡，乾燥花束可以保存數個月，越放越有味道。",
    tips: ["避免陽光直射，顏色才不會褪得太快", "用牛皮紙或麻繩包裝，呼應材質"],
    palette: ["#b9a08a", "#e3d6c6", "#6b5444"],
    image: img(1800, 1200, "大量自然風乾的繡球花", "Alisa Anton", "Alisa Anton 2017-01-16 (Unsplash).jpg"),
  },
  {
    slug: "bouquet-paper-korean",
    title: "牛皮紙玫瑰・韓式花束",
    subtitle: "霧面包裝紙，顏色溫柔不張揚",
    style: "korean",
    scene: "handheld",
    type: "posy",
    season: null,
    description: "橘粉色玫瑰搭配白色康乃馨與大片葉材，以霧面牛皮紙包裝。韓式花束的重點是柔和色調與乾淨的包裝線條，送禮最安全。",
    tips: ["包裝紙高度約為花材的 0.618", "花頭朝同一方向微微傾斜，拿起來更好看"],
    palette: ["#e98c6b", "#f6f1ea", "#c9b9a6"],
    image: img(1800, 2700, "以牛皮紙包裝的玫瑰與康乃馨花束", "Lizzie", "Paper-wrapped bouquet (Unsplash).jpg"),
  },
  {
    slug: "spring-tulip-gift",
    title: "橘紅鬱金香・春日贈禮",
    subtitle: "一種花、一個顏色，最簡單也最有力",
    style: "korean",
    scene: "handheld",
    type: "posy",
    season: "spring",
    description: "春天是鬱金香的季節。整束只用橘紅色鬱金香，簡單用紙包起來，就是最有誠意的春日禮物。",
    tips: ["鬱金香剪下後還會長高，買花苞較耐放", "同色系單一花種，數量用奇數"],
    palette: ["#e2552e", "#7a9a5f", "#f2e6da"],
    image: img(1800, 2700, "手中握著一束橘紅色鬱金香", "Brigitte Tohm", "Giving the gift of graceful tulips (Unsplash).jpg"),
  },
  {
    slug: "spring-tulip-desk",
    title: "工作桌上的鬱金香",
    subtitle: "一瓶花，讓工作日也有季節感",
    style: "nordic",
    scene: null,
    type: "table",
    season: "spring",
    description: "黃紅色鬱金香插在小瓶，放在電腦旁邊。花不必多，桌面上一點顏色就能讓人心情變好。",
    tips: ["花器選有重量的，避免被碰倒", "鬱金香會向光彎曲，每天轉一下瓶子"],
    palette: ["#f0b429", "#d9412b", "#e9eef0"],
    image: img(1800, 1202, "筆電旁小瓶中的黃紅色鬱金香", "Alexander Filonchik", "Tulips on a computer desk (Unsplash).jpg"),
  },
  {
    slug: "valentine-tulips",
    title: "Love 卡片與鬱金香・情人節",
    subtitle: "紫與橘的對比，比紅玫瑰更有個性",
    style: "korean",
    scene: null,
    type: "posy",
    season: "valentine",
    description: "情人節不一定要紅玫瑰。紫色與橘色的鬱金香互為對比色，搭配一張手寫卡片，簡單卻很有心意。",
    tips: ["對比色以 6：4 的比例搭配，不要一半一半", "手寫卡片比印刷卡片更打動人"],
    palette: ["#e2742e", "#9b7cb3", "#f4f1ec"],
    image: img(1800, 1200, "紫色與橘色鬱金香旁放著手寫 Love 卡片", "Brigitte Tohm", "Tulips from a lover (Unsplash).jpg"),
  },
  {
    slug: "halloween-pumpkins",
    title: "暮紫大理花・萬聖夜餐桌",
    subtitle: "深紫與黑的花團，萬聖夜也可以很優雅",
    style: "french",
    scene: "dining",
    type: "table",
    season: "halloween",
    description:
      "用深紫色的大理花與菊花堆出濃密的花團，搭配黑色或南瓜色的花器，就是成熟版的萬聖節餐桌。不需要鬼臉裝飾，顏色本身就有神祕感。",
    tips: ["深色花材搭配暖色燭光，層次最好", "可用挖空的小南瓜當花器，內放玻璃杯裝水"],
    palette: ["#5c1f4a", "#2b1a2a", "#e8742a"],
    image: img(1800, 1184, "深色背景前一團盛開的深紫色大理花", "Kristina Flour", "Grandmother's flowers (Unsplash).jpg"),
  },
  {
    slug: "christmas-wreath",
    title: "聖誕紅盆花・節日迎賓",
    subtitle: "一盆就有滿滿的節慶感",
    style: "nordic",
    scene: "entry",
    type: "table",
    season: "christmas",
    description: "聖誕紅的紅色苞片層層展開，比花圈更有份量。用緞帶與麻布包住盆器，放在玄關或客廳角落，就是最直接的聖誕氣氛。",
    tips: ["聖誕紅怕冷也怕悶，放在明亮但不直曬的地方", "盆土表面乾了再澆水，避免積水"],
    palette: ["#b51f2e", "#2f5a35", "#f2efe8"],
    image: img(1800, 2400, "桌上一大盆紅色聖誕紅", "Sarah Stierch", "Euphorbia pulcherrima - December 2024 - Sarah Stierch.jpg"),
  },
  {
    slug: "winter-white-branches",
    title: "紅白花海・聖誕配色",
    subtitle: "紅與白交錯的小花，像節日的包裝紙",
    style: "french",
    scene: null,
    type: "table",
    season: "christmas",
    description: "紅色與白色的小花大量交錯，不需要聖誕樹也能營造節日感。插成低矮的大盆，放在派對長桌或甜點桌旁最適合。",
    tips: ["紅：白大約 6：4，紅色比例多一點更有節慶感", "點綴少量深綠葉材，讓紅白更鮮明"],
    palette: ["#c0242c", "#f7f4ee", "#3f5a3a"],
    image: img(1800, 1200, "俯拍滿版紅色與白色的小花", "Annie Spratt", "Red and white flowers from above (Unsplash).jpg"),
  },
  {
    slug: "autumn-hydrangea",
    title: "秋色繡球・古典轉色",
    subtitle: "繡球在秋天轉成藍綠與酒紅，是最美的時候",
    style: "french",
    scene: null,
    type: "table",
    season: "autumn",
    description: "秋天的「古典繡球」顏色會從藍轉成藍綠、酒紅，帶著復古的層次。一兩朵放在陶罐裡就很有份量，也能自然風乾保存。",
    tips: ["繡球很會喝水，花頭垂下時整朵泡水 30 分鐘", "風乾時倒吊在陰涼通風處"],
    palette: ["#4f8a9a", "#c9a24a", "#7a3b3f"],
    image: img(1800, 1200, "秋天轉色的藍綠色繡球花", "Zara Walker", "Hydrangea in autumn (Unsplash).jpg"),
  },
];

// ───────────── 會員限定：花材黃金比例清單 ─────────────

const PHI = 1.618;
const cm = (n: number) => Math.round(n);
const colors = (a: [string, string], b: [string, string], c: [string, string]) => [
  { name: a[0], hex: a[1], percent: 61.8 },
  { name: b[0], hex: b[1], percent: 23.6 },
  { name: c[0], hex: c[1], percent: 14.6 },
];
const vaseProportion = (vesselH: number) => [
  { label: "花器高度", value: `${vesselH} 公分` },
  { label: "花材高出瓶口（× φ）", value: `${cm(vesselH * PHI)} 公分` },
  { label: "作品總高", value: `${cm(vesselH * (1 + PHI))} 公分` },
  { label: "焦點花高度（總高 × 0.618）", value: `${cm(vesselH * (1 + PHI) * 0.618)} 公分` },
];
const st = (layer: GoldenStem["layer"], name: string, count: number, lengthCm: number, note?: string): GoldenStem => ({
  layer,
  name,
  count,
  lengthCm,
  ...(note ? { note } : {}),
});

export const recipeCatalog: GoldenRecipe[] = [
  {
    slug: "entry-camellia-wabi",
    vessel: "直筒陶瓶 高 30 cm／口徑 9 cm＋劍山",
    proportion: vaseProportion(30),
    colors: colors(["深綠", "#2f4a2e"], ["米白", "#f3efe6"], ["果紅", "#c4462a"]),
    stems: [
      st("骨架", "山茶枝（帶花苞）", 1, 78, "天枝，向左傾 15°"),
      st("焦點", "山茶花", 1, 48, "總高的 0.618 處"),
      st("配花", "南天竹果枝", 2, 36, "右前方斜出"),
      st("葉材", "山茶葉（修剪）", 3, 20, "收攏根部"),
    ],
    budgetTwd: 980,
  },
  {
    slug: "entry-alcove-wabi",
    vessel: "淺水盤 直徑 36 cm／高 6 cm＋劍山",
    proportion: [
      { label: "花器寬＋高", value: "42 公分" },
      { label: "天枝長度（× φ）", value: "68 公分" },
      { label: "人枝長度（天 × 0.618）", value: "42 公分" },
      { label: "地枝長度（人 × 0.618）", value: "26 公分" },
    ],
    colors: colors(["黃綠", "#6f7d3c"], ["芥末黃", "#e2c25b"], ["深褐", "#3a2f22"]),
    stems: [
      st("骨架", "楓枝", 1, 68, "天"),
      st("骨架", "黃櫨枝", 1, 42, "人"),
      st("焦點", "小菊", 3, 26, "地，及其從枝"),
      st("配花", "女郎花", 5, 30),
      st("葉材", "芒草", 8, 35, "穿插在枝條間"),
    ],
    budgetTwd: 1280,
  },
  {
    slug: "entry-berries-french",
    vessel: "粗陶寬口瓶 高 22 cm／口徑 12 cm",
    proportion: vaseProportion(22),
    colors: colors(["灰粉", "#e8a79a"], ["橄欖綠", "#7d8f5a"], ["奶油白", "#f4ece3"]),
    stems: [
      st("骨架", "尤加利葉", 3, 55),
      st("焦點", "粉色庭園玫瑰", 3, 38, "三角形配置"),
      st("配花", "野莓果枝", 5, 45, "向外垂墜"),
      st("填充", "星芹", 8, 32),
      st("葉材", "迷迭香", 5, 30, "增加香氣"),
    ],
    budgetTwd: 1680,
  },
  {
    slug: "dining-white-roses-french",
    vessel: "長型花泥盤 60 × 12 cm（桌長 240 cm 的 1/4）",
    proportion: [
      { label: "桌長", value: "240 公分（6 人座）" },
      { label: "桌花長度（桌長 × 0.618）", value: "148 公分" },
      { label: "最高點", value: "≤ 25 公分（不擋視線）" },
      { label: "寬度（長度 × 0.618²）", value: "57 公分" },
    ],
    colors: colors(["象牙白", "#f4f1ea"], ["墨綠", "#3f5a3a"], ["奶茶", "#d9c7b8"]),
    stems: [
      st("骨架", "銀葉尤加利", 13, 30, "沿中線鋪底"),
      st("焦點", "白色庭園玫瑰", 8, 18, "分散在三段"),
      st("配花", "白色洋桔梗", 13, 20),
      st("填充", "白色滿天星", 21, 15),
      st("葉材", "常春藤垂枝", 5, 45, "兩端自然垂下"),
    ],
    budgetTwd: 4880,
  },
  {
    slug: "spring-peony-abundance",
    vessel: "低矮陶盆 直徑 30 cm／高 10 cm＋花泥",
    proportion: [
      { label: "花器直徑", value: "30 公分" },
      { label: "作品直徑（× φ）", value: "49 公分" },
      { label: "最高點", value: "≤ 25 公分（不擋視線）" },
    ],
    colors: colors(["芍藥粉", "#e7a3c4"], ["淡粉", "#f6dbe8"], ["葉綠", "#7d9a6a"]),
    stems: [
      st("焦點", "粉色芍藥", 13, 18, "花頭緊密排列成微微隆起的弧面"),
      st("配花", "淡粉芍藥花苞", 5, 20, "穿插在縫隙，隔天陸續綻放"),
      st("葉材", "芍藥葉", 8, 15, "收邊、遮住花泥"),
    ],
    budgetTwd: 3280,
  },
  {
    slug: "bedside-blossom-wabi",
    vessel: "墨綠窄口小瓶 高 12 cm／口徑 2.5 cm",
    proportion: vaseProportion(12),
    colors: colors(["墨綠", "#2c3a2e"], ["櫻粉", "#e7a3ae"], ["樹皮褐", "#6b4a3a"]),
    stems: [
      st("骨架", "櫻花枝或桃花枝", 1, 32, "一枝就好"),
      st("葉材", "枝上原有嫩葉", 1, 0, "保留 2–3 片"),
    ],
    budgetTwd: 380,
  },
  {
    slug: "bedside-daisy-korean",
    vessel: "透明玻璃罐 高 10 cm／口徑 7 cm",
    proportion: vaseProportion(10),
    colors: colors(["白", "#f7f5f0"], ["向日黃", "#f2c53d"], ["草綠", "#7a8f4e"]),
    stems: [
      st("焦點", "黃色小雛菊", 5, 24),
      st("填充", "白色洋甘菊", 3, 20),
      st("葉材", "小葉尤加利", 2, 22),
    ],
    budgetTwd: 450,
  },
  {
    slug: "bedside-window-nordic",
    vessel: "透明玻璃高瓶 高 25 cm／口徑 7 cm",
    proportion: vaseProportion(25),
    colors: colors(["暖陽黃", "#f2b632"], ["橘", "#e8742a"], ["霧白", "#eceae6"]),
    stems: [
      st("焦點", "黃色玫瑰或非洲菊", 5, 40),
      st("配花", "橘色小蒼蘭", 5, 42),
      st("填充", "黃色金杖球", 3, 38),
      st("葉材", "高山羊齒", 3, 40),
    ],
    budgetTwd: 980,
  },
  {
    slug: "bouquet-bride-french",
    vessel: "圓形手綁捧花 直徑 26 cm（肩寬 42 cm × 0.618）",
    proportion: [
      { label: "捧花直徑", value: "26 公分" },
      { label: "花面高度（直徑 × 0.618）", value: "16 公分" },
      { label: "握把長度", value: "16 公分" },
      { label: "總重", value: "≤ 900 公克" },
    ],
    colors: colors(["嫩粉", "#f0c3cf"], ["薰衣紫", "#9a8fb5"], ["珍珠灰", "#c9ccc6"]),
    stems: [
      st("焦點", "粉色庭園玫瑰", 5, 32),
      st("配花", "紫色洋桔梗", 8, 32),
      st("配花", "粉色小玫瑰", 8, 30),
      st("填充", "銀灰色胡椒果", 13, 28),
      st("葉材", "銀葉尤加利", 5, 32, "外圈收邊"),
    ],
    budgetTwd: 3680,
  },
  {
    slug: "bouquet-bridesmaid-french",
    vessel: "圓形手綁捧花 直徑 18 cm（新娘捧花 × 0.618）",
    proportion: [
      { label: "捧花直徑", value: "18 公分" },
      { label: "花面高度", value: "11 公分" },
      { label: "握把長度", value: "14 公分" },
    ],
    colors: colors(["白", "#f6efe4"], ["橘紅", "#e0643c"], ["酒紅", "#5a2a2a"]),
    stems: [
      st("焦點", "白色玫瑰", 5, 28),
      st("配花", "橘紅色玫瑰", 3, 28, "跳色，三角配置"),
      st("填充", "白色蠟花", 5, 25),
      st("葉材", "茶樹葉", 3, 28),
    ],
    budgetTwd: 1680,
  },
  {
    slug: "bouquet-meadow-french",
    vessel: "自然手綁捧花 直徑 22 cm，輪廓不規則",
    proportion: [
      { label: "捧花直徑", value: "22 公分" },
      { label: "向外伸出的枝條", value: "直徑 × 0.382 ≈ 8 公分" },
      { label: "握把長度", value: "15 公分" },
    ],
    colors: colors(["暖粉", "#e6b7a8"], ["矢車菊藍", "#7f9cc7"], ["蜂蜜黃", "#e5c96a"]),
    stems: [
      st("焦點", "粉色小玫瑰", 3, 30),
      st("配花", "矢車菊", 5, 32),
      st("配花", "蓍草", 5, 32),
      st("填充", "洋甘菊", 8, 30),
      st("葉材", "迷迭香與橄欖枝", 5, 34, "向外伸出"),
    ],
    budgetTwd: 1980,
  },
  {
    slug: "bouquet-dried-wabi",
    vessel: "牛皮紙包裝花束 高 45 cm",
    proportion: [
      { label: "花束總高", value: "45 公分" },
      { label: "花面高度（× 0.382）", value: "17 公分" },
      { label: "包裝紙高度（× 0.618）", value: "28 公分" },
    ],
    colors: colors(["奶茶", "#b9a08a"], ["燕麥", "#e3d6c6"], ["枯葉褐", "#6b5444"]),
    stems: [
      st("焦點", "乾燥繡球", 5, 40, "大小花頭錯落"),
      st("配花", "乾燥星辰花", 8, 42),
      st("填充", "兔尾草", 13, 44),
      st("葉材", "乾燥尤加利", 3, 45),
    ],
    budgetTwd: 1680,
  },
  {
    slug: "bouquet-paper-korean",
    vessel: "霧面牛皮紙花束 高 50 cm",
    proportion: [
      { label: "花束總高", value: "50 公分" },
      { label: "包裝紙高度（× 0.618）", value: "31 公分" },
      { label: "花面寬度（× 0.618）", value: "31 公分" },
    ],
    colors: colors(["奶油白", "#f6f1ea"], ["珊瑚橘", "#e98c6b"], ["卡其", "#c9b9a6"]),
    stems: [
      st("焦點", "珊瑚橘玫瑰", 3, 45),
      st("配花", "白色康乃馨", 5, 42),
      st("葉材", "春雪木或龜背芋葉", 2, 50, "背景"),
    ],
    budgetTwd: 1280,
  },
  {
    slug: "spring-tulip-gift",
    vessel: "單色紙包花束 高 45 cm",
    proportion: [
      { label: "花束總高", value: "45 公分" },
      { label: "包裝紙高度（× 0.618）", value: "28 公分" },
    ],
    colors: colors(["橘紅", "#e2552e"], ["葉綠", "#7a9a5f"], ["紙白", "#f2e6da"]),
    stems: [st("焦點", "橘紅色鬱金香", 13, 42, "費氏數 13，奇數更自然")],
    budgetTwd: 1280,
  },
  {
    slug: "spring-tulip-desk",
    vessel: "陶瓷小瓶 高 14 cm／口徑 5 cm",
    proportion: vaseProportion(14),
    colors: colors(["霧白", "#e9eef0"], ["鬱金黃", "#f0b429"], ["火焰紅", "#d9412b"]),
    stems: [
      st("焦點", "黃紅雙色鬱金香", 5, 34),
      st("葉材", "鬱金香原生葉", 3, 25),
    ],
    budgetTwd: 580,
  },
  {
    slug: "valentine-tulips",
    vessel: "雙色紙包花束 高 42 cm",
    proportion: [
      { label: "花束總高", value: "42 公分" },
      { label: "橘：紫", value: "1.618 : 1（不要一半一半）" },
    ],
    colors: colors(["卡片白", "#f4f1ec"], ["暖橘", "#e2742e"], ["丁香紫", "#9b7cb3"]),
    stems: [
      st("焦點", "橘色鬱金香", 8, 40),
      st("配花", "紫色鬱金香", 5, 40),
      st("葉材", "尤加利", 3, 42),
    ],
    budgetTwd: 1580,
  },
  {
    slug: "halloween-pumpkins",
    vessel: "黑色陶盆 直徑 24 cm＋花泥（或挖空南瓜 × 3）",
    proportion: [
      { label: "花器直徑", value: "24 公分" },
      { label: "作品直徑（× φ）", value: "39 公分" },
      { label: "最高點", value: "≤ 25 公分" },
    ],
    colors: colors(["暮紫", "#5c1f4a"], ["夜黑", "#2b1a2a"], ["南瓜橘", "#e8742a"]),
    stems: [
      st("焦點", "深紫大理花", 5, 18),
      st("配花", "深紫乒乓菊", 8, 18),
      st("填充", "橘色小菊", 5, 16, "少量點綴，提亮暗色"),
      st("葉材", "黑葉尤加利或紫葉", 3, 20),
    ],
    budgetTwd: 1880,
  },
  {
    slug: "christmas-wreath",
    vessel: "聖誕紅盆栽 6 吋盆＋麻布與緞帶包裝",
    proportion: [
      { label: "盆高", value: "15 公分" },
      { label: "植株高度（× φ）", value: "24 公分" },
      { label: "包裝布高度（盆高 × 1.2）", value: "18 公分" },
    ],
    colors: colors(["聖誕紅", "#b51f2e"], ["常綠", "#2f5a35"], ["米白", "#f2efe8"]),
    stems: [
      st("焦點", "聖誕紅（6 吋盆，苞片 5 枝以上）", 1, 0),
      st("葉材", "雪松枝", 3, 20, "插在盆緣增加層次"),
      st("填充", "松果", 3, 0),
    ],
    budgetTwd: 980,
  },
  {
    slug: "winter-white-branches",
    vessel: "淺口陶盆 直徑 28 cm＋花泥",
    proportion: [
      { label: "花器直徑", value: "28 公分" },
      { label: "作品直徑（× φ）", value: "45 公分" },
      { label: "紅：白", value: "1.618 : 1" },
    ],
    colors: colors(["聖誕紅", "#c0242c"], ["雪白", "#f7f4ee"], ["深綠", "#3f5a3a"]),
    stems: [
      st("焦點", "紅色小菊", 13, 16),
      st("配花", "白色小菊", 8, 16),
      st("填充", "白色蕾絲花", 5, 18),
      st("葉材", "深綠尤加利", 5, 18),
    ],
    budgetTwd: 1580,
  },
  {
    slug: "autumn-hydrangea",
    vessel: "陶罐 高 16 cm／口徑 11 cm",
    proportion: vaseProportion(16),
    colors: colors(["藍綠", "#4f8a9a"], ["芥末金", "#c9a24a"], ["酒紅", "#7a3b3f"]),
    stems: [
      st("焦點", "古典轉色繡球", 2, 32),
      st("配花", "酒紅色千日紅", 5, 30),
      st("葉材", "黃櫨葉", 3, 35),
    ],
    budgetTwd: 1180,
  },
];
