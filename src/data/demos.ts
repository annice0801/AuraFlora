// 花藝師示範腳本：執行 `npm run seed:demos` 會寫入 MongoDB 的 demos 集合。
// 注意：此檔案不能 import 其他模組，因為種子腳本會直接用 Node 執行它。
//
// 方位角（度）：0 = 正前方（朝向觀看者），90 = 右，180 = 後方，270 = 左。
// 高度 h：花材高出瓶口的長度 ÷ 花器高度。比例原則是最高的枝條約 1.5 倍、主花約 1 倍。

export type DemoStem = {
  slug: string;
  anchor: [number, number];
  lean: [number, number];
  /** 高出瓶口的長度，以花器高度為單位 */
  h: number;
  spin: number;
};

export type DemoStep = {
  phase: string;
  title: string;
  narration: string;
  stems: DemoStem[];
};

export type Demo = {
  slug: string;
  title: string;
  style: "wabi" | "korean" | "french";
  vase: "dish" | "terrazzo" | "glass";
  florist: string;
  summary: string;
  steps: DemoStep[];
};

const round = (n: number) => Math.round(n * 10000) / 10000;

/** 以極座標描述插入點：距瓶口中心 r 公尺、方位角 deg 度 */
function at(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [round(Math.sin(a) * r), round(Math.cos(a) * r)];
}

let spinSeed = 0;
/** 一枝花：插入點、傾斜幅度（0 = 直立，0.7 ≈ 45°）與方向、高度倍數 */
function stem(slug: string, anchor: [number, number], lean: number, leanDeg: number, h: number): DemoStem {
  spinSeed += 1;
  return { slug, anchor, lean: at(lean, leanDeg), h, spin: round((spinSeed * 2.39996) % (Math.PI * 2)) };
}

export const demoCatalog: Demo[] = [
  {
    slug: "french-romance",
    title: "法式浪漫・芍藥花園",
    style: "french",
    vase: "terrazzo",
    florist: "AuraFlora 駐店花藝師",
    summary: "20 枝花材，寬口瓶讓花自然向外舒展；三朵芍藥錯落成三角，像剛從花園剪下來。",
    steps: [
      {
        phase: "骨架",
        title: "三枝尤加利拉出輪廓",
        narration:
          "先不放花。三枝尤加利葉插在後方與左右兩側、向外傾斜，最高的一枝約是花瓶高度的 1.5 倍。這三枝決定了作品的高度與寬度，之後的花都在這個輪廓裡。",
        stems: [
          stem("eucalyptus", at(0.058, 200), 0.5, 205, 1.45),
          stem("eucalyptus", at(0.058, 145), 0.55, 140, 1.25),
          stem("eucalyptus", at(0.058, 265), 0.62, 270, 1.05),
        ],
      },
      {
        phase: "骨架",
        title: "雪柳打破對稱",
        narration:
          "兩枝雪柳一高一低，一枝往右後方、一枝往左後方。法式花藝刻意避開左右對稱，線條有長有短，看起來才像自然生長。",
        stems: [
          stem("snow-willow", at(0.05, 120), 0.6, 110, 1.5),
          stem("snow-willow", at(0.05, 230), 0.55, 235, 1.25),
        ],
      },
      {
        phase: "焦點",
        title: "三朵芍藥排成三角",
        narration:
          "芍藥是焦點，第一朵放中央、高度約與瓶身同高；另外兩朵放左前與右側、稍低一些。三朵不要並排，連起來是一個不等邊三角形，視線會在三朵之間流動。",
        stems: [
          stem("peony-coral", [0, 0], 0.1, 20, 1.05),
          stem("peony-coral", at(0.03, 300), 0.35, 300, 0.82),
          stem("peony-coral", at(0.03, 80), 0.35, 75, 0.9),
        ],
      },
      {
        phase: "焦點",
        title: "鬱金香延伸高度",
        narration:
          "兩枝粉色鬱金香放在芍藥的後方與右前方，比芍藥高一些。杯形的鬱金香把視線往上帶，讓作品不會只是一團圓。",
        stems: [
          stem("tulip-pink", at(0.035, 170), 0.3, 165, 1.22),
          stem("tulip-pink", at(0.04, 30), 0.45, 35, 0.95),
        ],
      },
      {
        phase: "配花",
        title: "紫桔梗做類比色過渡",
        narration:
          "三枝紫色桔梗分散在前方、右側與左前方，高度比主花低。粉與紫是類比色，桔梗把芍藥和瓶口之間的空檔接起來，顏色由粉漸漸過渡到紫。",
        stems: [
          stem("lisianthus-purple", at(0.058, 10), 0.55, 10, 0.8),
          stem("lisianthus-purple", at(0.055, 110), 0.55, 110, 0.85),
          stem("lisianthus-purple", at(0.05, 330), 0.5, 335, 0.9),
        ],
      },
      {
        phase: "配花",
        title: "白桔梗讓畫面透氣",
        narration: "左側與後方各補一枝白桔梗。白色是中性色，能讓飽和的粉與紫稍微休息，整體看起來更輕盈。",
        stems: [
          stem("lisianthus-white", at(0.058, 240), 0.6, 245, 0.8),
          stem("lisianthus-white", at(0.04, 200), 0.35, 200, 1.0),
        ],
      },
      {
        phase: "填充",
        title: "洋甘菊帶出野趣",
        narration: "兩小把洋甘菊從瓶口左右兩側探出來，高度最低。細碎的小白花是法式風格的靈魂，讓作品多一點隨性的田野感。",
        stems: [
          stem("chamomile", at(0.058, 55), 0.65, 55, 0.68),
          stem("chamomile", at(0.058, 290), 0.65, 290, 0.62),
        ],
      },
      {
        phase: "填充",
        title: "滿天星填補空隙",
        narration:
          "最後三把滿天星填進後方與花和花之間的空隙，像一層薄霧把所有花材連在一起。完成後退後兩步，瞇起眼睛看整體輪廓：高、中、低三層都要看得到。",
        stems: [
          stem("gypsophila", at(0.045, 150), 0.45, 150, 0.95),
          stem("gypsophila", at(0.05, 350), 0.55, 0, 0.7),
          stem("gypsophila", at(0.04, 250), 0.5, 250, 0.8),
        ],
      },
    ],
  },
  {
    slug: "wabi-sabi",
    title: "日式侘寂・天地人",
    style: "wabi",
    vase: "dish",
    florist: "AuraFlora 駐店花藝師",
    summary: "11 枝花材，以「天、地、人」三主枝構成不等邊三角形，用短葉材遮住花泥，再把留白當作作品的一部分。",
    steps: [
      {
        phase: "天",
        title: "「天」：最長的主枝",
        narration:
          "日式盛花從三根主枝開始。第一根「天」最長，約是花器寬加高的 1.5 倍；插在花泥左後方，向左傾約 15 度，代表向上生長的力量。",
        stems: [stem("curly-willow", [-0.03, -0.025], 0.26, 270, 1.9)],
      },
      {
        phase: "人",
        title: "「人」：中間的枝",
        narration: "第二根「人」長度約為「天」的四分之三，向右前方傾約 45 度。人位於天與地之間，把兩者連在一起。",
        stems: [stem("snow-willow", [-0.01, -0.025], 0.7, 55, 1.4)],
      },
      {
        phase: "地",
        title: "「地」：最短、最低",
        narration:
          "「地」最短，約為「人」的一半，幾乎貼著花泥向右前方伸出。天、人、地三點連起來是一個不等邊三角形，這是花道最基本的構圖。",
        stems: [stem("tulip-white", [0.02, 0], 0.85, 100, 0.75)],
      },
      {
        phase: "從枝",
        title: "兩朵鬱金香呼應主枝",
        narration:
          "在主枝旁加兩朵白鬱金香當「從枝」，一朵靠近天、一朵靠近人，長度都比所呼應的主枝短。從枝只是陪襯，不能搶過主枝的線條。",
        stems: [
          stem("tulip-white", [-0.02, 0], 0.3, 300, 1.05),
          stem("tulip-white", [0, -0.01], 0.45, 30, 0.88),
        ],
      },
      {
        phase: "根締",
        title: "收攏根部",
        narration:
          "在三根主枝的根部補兩朵白桔梗。花泥上的所有花莖要像從同一點長出來，這叫「根締」，讓作品重心低而穩。",
        stems: [
          stem("lisianthus-white", [-0.025, 0.02], 0.4, 330, 0.55),
          stem("lisianthus-white", [0.005, 0.02], 0.55, 80, 0.5),
        ],
      },
      {
        phase: "遮蓋",
        title: "短葉材遮住花泥",
        narration:
          "花泥是工具，不該被看見。用三枝剪短的尤加利葉幾乎水平地插在花泥的左、右與正前方，蓋住海綿的頂面與邊緣，也讓底部有自然的過渡。實際操作時，露出的側面還可以再鋪一層青苔。",
        stems: [
          stem("eucalyptus", [-0.045, 0.02], 0.88, 230, 0.38),
          stem("eucalyptus", [0.04, 0.025], 0.88, 40, 0.34),
          stem("eucalyptus", [-0.01, 0.04], 0.92, 350, 0.3),
        ],
      },
      {
        phase: "留白",
        title: "停在這裡",
        narration:
          "最後一小枝洋甘菊點在前方，然後就停手。剩下的空間不再填滿，侘寂的美在於不完整，留白讓每一枝的姿態都被看見。",
        stems: [stem("chamomile", [0.02, 0.03], 0.6, 20, 0.48)],
      },
    ],
  },
  {
    slug: "korean-minimal",
    title: "韓式簡約・粉白鬱金香",
    style: "korean",
    vase: "glass",
    florist: "AuraFlora 駐店花藝師",
    summary: "12 枝花材，窄口玻璃瓶把花束收得乾淨俐落，花頭聚成柔和的半圓；透過水看得到交錯的花莖。",
    steps: [
      {
        phase: "骨架",
        title: "兩枝葉材當背景",
        narration:
          "韓式簡約的骨架很輕，兩枝尤加利葉插在後方與右側就夠了，最高約瓶高的 1.3 倍。銀灰綠是很好的背景色，讓粉色更柔和。",
        stems: [
          stem("eucalyptus", at(0.033, 200), 0.45, 200, 1.35),
          stem("eucalyptus", at(0.033, 110), 0.4, 110, 1.15),
        ],
      },
      {
        phase: "焦點",
        title: "三朵粉鬱金香聚在中央",
        narration:
          "三朵粉色鬱金香高度接近、彼此靠攏，中間那朵最高。窄口瓶的瓶口只有 8 公分，花莖能傾斜的角度很有限，花頭自然會聚成一團。",
        stems: [
          stem("tulip-pink", [0, 0], 0.05, 0, 1.0),
          stem("tulip-pink", at(0.019, 60), 0.3, 60, 0.92),
          stem("tulip-pink", at(0.019, 300), 0.3, 300, 0.95),
        ],
      },
      {
        phase: "焦點",
        title: "白鬱金香圍成半圓",
        narration:
          "兩朵白鬱金香放在後方與右前方，靠著瓶口邊緣往外傾。注意看花莖靠在瓶口的位置，這就是窄口瓶的「自然傾斜角」。同一種花、兩種顏色，是韓式最常用的配色。",
        stems: [
          stem("tulip-white", at(0.019, 180), 0.35, 180, 1.05),
          stem("tulip-white", at(0.033, 20), 0.45, 15, 0.85),
        ],
      },
      {
        phase: "配花",
        title: "小蒼蘭打破杯形",
        narration: "兩枝白色小蒼蘭插在左右兩側，彎曲的花穗打破鬱金香整齊的杯形線條，也帶來淡淡的香氣。",
        stems: [
          stem("freesia-white", at(0.033, 80), 0.5, 85, 0.95),
          stem("freesia-white", at(0.033, 250), 0.5, 255, 0.9),
        ],
      },
      {
        phase: "填充",
        title: "滿天星霧感收尾",
        narration:
          "最後三把滿天星低低地圍在花頭下緣，像一圈霧。完成後從側面看看玻璃瓶，水裡的花莖會因為折射而微微錯位，這也是透明花器的樂趣。",
        stems: [
          stem("gypsophila", at(0.033, 330), 0.5, 330, 0.75),
          stem("gypsophila", at(0.033, 140), 0.5, 140, 0.8),
          stem("gypsophila", at(0.019, 240), 0.4, 240, 0.7),
        ],
      },
    ],
  },
];
