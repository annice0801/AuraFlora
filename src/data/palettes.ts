// 配色花譜：依色系（婚禮配色、季節節慶）整理捧花、桌花、花束分別用哪些花、各幾枝、要買幾束。
// 執行 `npm run render:palettes`（需開發伺服器）會把各色花材渲染成去背圖上傳到 Vercel Blob，
// 並把配色資料與圖片網址寫入 MongoDB 的 palettes 集合。
// 注意：此檔案不能 import 其他模組，因為腳本會直接用 Node 執行它。

/** 花材色版：以互動花室的 3D 花材為基礎重新上色（base 對應 flowers.ts 的 slug） */
export type FlowerVariant = { id: string; base: string; name: string; color?: string; accent?: string };

export const VARIANTS: FlowerVariant[] = [
  { id: "peony-champagne", base: "peony-coral", name: "芍藥（香檳）", color: "#efd9b4", accent: "#f3d48a" },
  { id: "peony-dusty", base: "peony-coral", name: "芍藥（灰粉）", color: "#d4a3a3", accent: "#f0cf8a" },
  { id: "peony-burgundy", base: "peony-coral", name: "芍藥（酒紅）", color: "#7e2433", accent: "#d9a54a" },
  { id: "peony-red", base: "peony-coral", name: "芍藥（正紅）", color: "#b51f2e", accent: "#f2c44f" },
  { id: "peony-coral", base: "peony-coral", name: "芍藥（珊瑚粉）" },
  { id: "tulip-pink", base: "tulip-pink", name: "鬱金香（粉）" },
  { id: "tulip-white", base: "tulip-white", name: "鬱金香（白）" },
  { id: "tulip-burgundy", base: "tulip-pink", name: "鬱金香（酒紅）", color: "#6e1f2c" },
  { id: "tulip-orange", base: "tulip-pink", name: "鬱金香（橘）", color: "#e8742a" },
  { id: "lisianthus-white", base: "lisianthus-white", name: "桔梗（白）" },
  { id: "lisianthus-purple", base: "lisianthus-purple", name: "桔梗（紫）" },
  { id: "lisianthus-champagne", base: "lisianthus-white", name: "桔梗（香檳）", color: "#ead9bd" },
  { id: "lisianthus-mauve", base: "lisianthus-purple", name: "桔梗（藕紫）", color: "#b897b0" },
  { id: "freesia-white", base: "freesia-white", name: "小蒼蘭（白）" },
  { id: "freesia-yellow", base: "freesia-yellow", name: "小蒼蘭（黃）" },
  { id: "sunflower", base: "sunflower", name: "向日葵" },
  { id: "trachelium", base: "trachelium", name: "夕霧" },
  { id: "chamomile", base: "chamomile", name: "洋甘菊" },
  { id: "gypsophila", base: "gypsophila", name: "滿天星" },
  { id: "eucalyptus", base: "eucalyptus", name: "尤加利葉" },
  { id: "snow-willow", base: "snow-willow", name: "雪柳" },
  { id: "curly-willow", base: "curly-willow", name: "龍柳" },
];

/** 台灣花市常見的一束枝數（依花種） */
export const BUNCH_SIZE: Record<string, number> = {
  "peony-coral": 10,
  "tulip-pink": 10,
  "tulip-white": 10,
  "lisianthus-white": 10,
  "lisianthus-purple": 10,
  "freesia-white": 10,
  "freesia-yellow": 10,
  sunflower: 10,
  trachelium: 10,
  chamomile: 15,
  gypsophila: 10,
  eucalyptus: 10,
  "snow-willow": 10,
  "curly-willow": 10,
};

export type Arrangement = {
  /** 捧花、桌花、花束、伴娘手花、玄關花… */
  label: string;
  /** 用量說明，例如「新娘捧花 × 1」「6 人長桌 × 2 盆」 */
  scope: string;
  note: string;
  items: { variant: string; stems: number }[];
};

export type Palette = {
  slug: string;
  category: "wedding" | "season";
  name: string;
  nameEn: string;
  mood: string;
  colors: { name: string; hex: string }[];
  /** 卡片背景漸層的兩個顏色 */
  tint: [string, string];
  /** 卡片上的花材組合（由後到前） */
  lineup: string[];
  arrangements: Arrangement[];
};

const item = (variant: string, stems: number) => ({ variant, stems });

export const PALETTES: Palette[] = [
  // ───────────── 婚禮配色 ─────────────
  {
    slug: "champagne-cream",
    category: "wedding",
    name: "香檳奶油",
    nameEn: "Champagne Cream",
    mood: "溫潤、典雅，適合飯店與教堂婚禮",
    colors: [
      { name: "香檳", hex: "#e9d8b8" },
      { name: "奶油白", hex: "#f6f1ea" },
      { name: "鼠尾草綠", hex: "#9fae8c" },
    ],
    tint: ["#fbf6ee", "#efe3cf"],
    lineup: ["eucalyptus", "freesia-white", "lisianthus-white", "peony-champagne", "gypsophila"],
    arrangements: [
      {
        label: "新娘捧花",
        scope: "圓形捧花 × 1（直徑約 25 cm）",
        note: "香檳芍藥放中心三角，白桔梗包圍，外圈以尤加利收邊。",
        items: [item("peony-champagne", 5), item("lisianthus-white", 7), item("freesia-white", 3), item("eucalyptus", 3), item("gypsophila", 2)],
      },
      {
        label: "主桌桌花",
        scope: "6 人長桌 × 2 盆（每盆長 60 cm、高 ≤ 25 cm）",
        note: "沿桌面中線低矮延伸，兩盆之間留出放菜的空間。",
        items: [item("peony-champagne", 6), item("lisianthus-white", 10), item("eucalyptus", 8), item("gypsophila", 4)],
      },
      {
        label: "伴娘手花",
        scope: "小型手綁花 × 4",
        note: "每束用 2 枝白桔梗、1 枝小蒼蘭、少量尤加利。",
        items: [item("lisianthus-white", 8), item("freesia-white", 4), item("eucalyptus", 4)],
      },
    ],
  },
  {
    slug: "dusty-rose",
    category: "wedding",
    name: "莫蘭迪灰粉",
    nameEn: "Dusty Rose",
    mood: "低彩度、柔霧感，適合戶外與森林系婚禮",
    colors: [
      { name: "灰粉", hex: "#c9a2a2" },
      { name: "藕紫", hex: "#b897b0" },
      { name: "灰綠", hex: "#a3ad9c" },
    ],
    tint: ["#f8f1f0", "#e7d6d6"],
    lineup: ["eucalyptus", "trachelium", "lisianthus-mauve", "tulip-pink", "peony-dusty"],
    arrangements: [
      {
        label: "新娘捧花",
        scope: "自然手綁捧花 × 1（直徑約 28 cm）",
        note: "花頭高低錯落 3–5 cm，避免整齊的半球；夕霧點綴在邊緣。",
        items: [item("peony-dusty", 5), item("tulip-pink", 5), item("lisianthus-mauve", 5), item("trachelium", 2), item("eucalyptus", 4)],
      },
      {
        label: "主桌桌花",
        scope: "6 人長桌 × 2 盆",
        note: "灰粉與藕紫交錯排列，尤加利向兩端自然垂下。",
        items: [item("peony-dusty", 6), item("lisianthus-mauve", 8), item("trachelium", 4), item("eucalyptus", 10)],
      },
      {
        label: "賓客桌小品",
        scope: "圓桌 × 6（每桌一瓶）",
        note: "每瓶 1 枝鬱金香＋1 枝桔梗，玻璃小瓶即可。",
        items: [item("tulip-pink", 6), item("lisianthus-mauve", 6)],
      },
    ],
  },
  {
    slug: "ivory-green",
    category: "wedding",
    name: "純白綠意",
    nameEn: "Ivory & Green",
    mood: "乾淨、清新，適合證婚與小型婚禮",
    colors: [
      { name: "象牙白", hex: "#f5f2ea" },
      { name: "嫩綠", hex: "#c9d3b5" },
      { name: "葉綠", hex: "#6f7d5c" },
    ],
    tint: ["#f8faf5", "#e1e8d6"],
    lineup: ["snow-willow", "eucalyptus", "lisianthus-white", "tulip-white", "chamomile"],
    arrangements: [
      {
        label: "新娘捧花",
        scope: "垂墜型捧花 × 1",
        note: "雪柳向下自然垂墜，白鬱金香與桔梗集中在上方。",
        items: [item("tulip-white", 7), item("lisianthus-white", 5), item("snow-willow", 3), item("chamomile", 5)],
      },
      {
        label: "簽到桌花",
        scope: "玄關簽到桌 × 1（寬 50 cm）",
        note: "雪柳拉出向上的線條，洋甘菊在底部收攏。",
        items: [item("snow-willow", 5), item("tulip-white", 7), item("lisianthus-white", 5), item("eucalyptus", 5)],
      },
      {
        label: "新郎胸花",
        scope: "胸花 × 3",
        note: "每朵用 1 枝洋甘菊＋一小段尤加利。",
        items: [item("chamomile", 3), item("eucalyptus", 1)],
      },
    ],
  },
  {
    slug: "burgundy-autumn",
    category: "wedding",
    name: "酒紅秋意",
    nameEn: "Burgundy Autumn",
    mood: "濃郁、成熟，適合秋冬晚宴婚禮",
    colors: [
      { name: "酒紅", hex: "#7e2433" },
      { name: "焦糖", hex: "#c98a5a" },
      { name: "胡桃木", hex: "#5c4a3a" },
    ],
    tint: ["#f6eeea", "#e3cfc6"],
    lineup: ["curly-willow", "eucalyptus", "trachelium", "tulip-burgundy", "peony-burgundy"],
    arrangements: [
      {
        label: "新娘捧花",
        scope: "圓形捧花 × 1",
        note: "酒紅芍藥為主，酒紅鬱金香與夕霧加深層次。",
        items: [item("peony-burgundy", 5), item("tulip-burgundy", 5), item("trachelium", 3), item("eucalyptus", 3)],
      },
      {
        label: "主桌桌花",
        scope: "6 人長桌 × 2 盆",
        note: "龍柳的捲曲線條橫向延伸，搭配燭台更有晚宴氛圍。",
        items: [item("peony-burgundy", 6), item("tulip-burgundy", 8), item("curly-willow", 4), item("eucalyptus", 8)],
      },
    ],
  },
  {
    slug: "golden-garden",
    category: "wedding",
    name: "暖陽金黃",
    nameEn: "Golden Garden",
    mood: "明亮、活潑，適合白天的戶外草地婚禮",
    colors: [
      { name: "暖陽黃", hex: "#f2b632" },
      { name: "奶白", hex: "#f6efe0" },
      { name: "橄欖綠", hex: "#7a8f4e" },
    ],
    tint: ["#fcf7ea", "#f1e2bd"],
    lineup: ["eucalyptus", "chamomile", "lisianthus-white", "freesia-yellow", "sunflower"],
    arrangements: [
      {
        label: "新娘捧花",
        scope: "田園手綁捧花 × 1",
        note: "向日葵只用 3 朵當焦點，小蒼蘭與洋甘菊讓輪廓輕盈。",
        items: [item("sunflower", 3), item("freesia-yellow", 5), item("lisianthus-white", 3), item("chamomile", 8), item("eucalyptus", 3)],
      },
      {
        label: "長桌桌花",
        scope: "戶外長桌 × 3（玻璃瓶群組）",
        note: "每桌 5 個小瓶高低錯落，各插 1–2 枝花。",
        items: [item("sunflower", 6), item("freesia-yellow", 9), item("chamomile", 15)],
      },
    ],
  },
  {
    slug: "lavender-dream",
    category: "wedding",
    name: "薰衣藍紫",
    nameEn: "Lavender Dream",
    mood: "浪漫、夢幻，適合夜間與燈光婚禮",
    colors: [
      { name: "薰衣紫", hex: "#8e6bb8" },
      { name: "霧紫", hex: "#d9cfe8" },
      { name: "灰綠", hex: "#a3ad9c" },
    ],
    tint: ["#f4f1f8", "#ddd3ea"],
    lineup: ["eucalyptus", "gypsophila", "tulip-white", "trachelium", "lisianthus-purple"],
    arrangements: [
      {
        label: "新娘捧花",
        scope: "圓形捧花 × 1",
        note: "紫桔梗由中心深到外圍淺，白鬱金香讓畫面透氣。",
        items: [item("lisianthus-purple", 7), item("trachelium", 3), item("tulip-white", 5), item("gypsophila", 2)],
      },
      {
        label: "主桌桌花",
        scope: "6 人長桌 × 2 盆",
        note: "滿天星像一層霧鋪在底部，搭配暖色燈光。",
        items: [item("lisianthus-purple", 10), item("trachelium", 6), item("gypsophila", 6), item("eucalyptus", 6)],
      },
    ],
  },
  // ───────────── 季節節慶 ─────────────
  {
    slug: "spring-bloom",
    category: "season",
    name: "春日",
    nameEn: "Spring Bloom",
    mood: "3–5 月・粉色系的球根花材最美",
    colors: [
      { name: "櫻花粉", hex: "#e8a1b0" },
      { name: "檸檬黃", hex: "#f6d55c" },
      { name: "嫩綠", hex: "#c9d3b5" },
    ],
    tint: ["#fdf3f4", "#f3dde1"],
    lineup: ["snow-willow", "chamomile", "freesia-yellow", "tulip-pink", "tulip-white"],
    arrangements: [
      {
        label: "花束",
        scope: "贈禮花束 × 1",
        note: "粉白鬱金香各半，小蒼蘭帶來香氣。",
        items: [item("tulip-pink", 7), item("tulip-white", 5), item("freesia-yellow", 3)],
      },
      {
        label: "餐桌桌花",
        scope: "4 人餐桌 × 1",
        note: "雪柳拉出春天的線條，洋甘菊低低圍在瓶口。",
        items: [item("snow-willow", 3), item("tulip-pink", 5), item("chamomile", 5)],
      },
    ],
  },
  {
    slug: "valentine",
    category: "season",
    name: "情人節",
    nameEn: "Valentine",
    mood: "2 月 14 日・紅與粉的經典組合",
    colors: [
      { name: "正紅", hex: "#b51f2e" },
      { name: "櫻花粉", hex: "#e8a1b0" },
      { name: "霧白", hex: "#fbfaf6" },
    ],
    tint: ["#fdf1f1", "#f2d4d6"],
    lineup: ["eucalyptus", "gypsophila", "tulip-pink", "peony-red"],
    arrangements: [
      {
        label: "告白花束",
        scope: "花束 × 1",
        note: "11 朵紅芍藥代表一心一意，滿天星像一層薄霧。",
        items: [item("peony-red", 11), item("gypsophila", 3), item("eucalyptus", 3)],
      },
      {
        label: "燭光晚餐桌花",
        scope: "2 人餐桌 × 1（高 ≤ 20 cm）",
        note: "低矮小盆，不擋住彼此的視線。",
        items: [item("peony-red", 3), item("tulip-pink", 5), item("gypsophila", 2)],
      },
    ],
  },
  {
    slug: "harvest-night",
    category: "season",
    name: "萬聖節",
    nameEn: "Harvest Night",
    mood: "10 月底・南瓜橘與暮紫的豐收感",
    colors: [
      { name: "南瓜橘", hex: "#e8742a" },
      { name: "暮霧紫", hex: "#7d5fa6" },
      { name: "枯木褐", hex: "#7a5c43" },
    ],
    tint: ["#fbf0e6", "#ecd5c0"],
    lineup: ["curly-willow", "trachelium", "sunflower", "tulip-orange"],
    arrangements: [
      {
        label: "南瓜桌花",
        scope: "挖空南瓜花器 × 3",
        note: "南瓜內放玻璃杯裝水；夕霧與橘鬱金香互為對比色。",
        items: [item("tulip-orange", 9), item("trachelium", 3), item("sunflower", 3)],
      },
      {
        label: "玄關花",
        scope: "高瓶 × 1",
        note: "龍柳的捲曲枝條像秋夜的樹影。",
        items: [item("curly-willow", 3), item("tulip-orange", 5), item("trachelium", 2)],
      },
    ],
  },
  {
    slug: "noel",
    category: "season",
    name: "聖誕節",
    nameEn: "Noël",
    mood: "12 月・酒紅、純白與常綠",
    colors: [
      { name: "聖誕紅", hex: "#7e2433" },
      { name: "雪白", hex: "#f5f2ea" },
      { name: "常綠", hex: "#4f6f45" },
    ],
    tint: ["#f6f1ee", "#e2d6cf"],
    lineup: ["curly-willow", "snow-willow", "eucalyptus", "tulip-white", "peony-burgundy"],
    arrangements: [
      {
        label: "聖誕餐桌花",
        scope: "6 人長桌 × 1（長 80 cm）",
        note: "酒紅芍藥分三段配置，尤加利與雪柳交錯鋪底，中間留位置放蠟燭。",
        items: [item("peony-burgundy", 5), item("tulip-white", 7), item("eucalyptus", 10), item("snow-willow", 3)],
      },
      {
        label: "玄關迎賓花",
        scope: "高瓶 × 1",
        note: "雪柳像落雪，龍柳增加冬日的線條。",
        items: [item("snow-willow", 5), item("curly-willow", 3), item("tulip-white", 5)],
      },
    ],
  },
];
