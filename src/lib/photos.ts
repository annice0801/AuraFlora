// 圖片來源：Wikimedia Commons（多數為 CC0，部分需標註作者，見 license 欄位）
// 原始檔案與授權資訊另存於 public/images/blog/credits.json

export type Photo = {
  src: string;
  width: number;
  height: number;
  alt: string;
  author: string;
  license: "CC0" | "CC BY 2.0" | "CC BY-SA 4.0";
  source: string;
};

const commons = (file: string) =>
  `https://commons.wikimedia.org/wiki/File:${file}`;

export const photos = {
  blogHero: {
    src: "/images/blog/blog-hero.jpg",
    width: 1600,
    height: 1067,
    alt: "放在木頭上的粉色玫瑰捧花",
    author: "Sweet Ice Cream Photography",
    license: "CC0",
    source: commons("The_Bouquet_(Unsplash).jpg"),
  },
  visualCover: {
    src: "/images/blog/visual-cover.jpg",
    width: 1600,
    height: 2405,
    alt: "粉色花器中插著玫瑰、蔥花與紫色花材的高型花藝",
    author: "Koderir60",
    license: "CC0",
    source: commons("Elegant_Flower_Arrangement_in_Vase.jpg"),
  },
  visualDiverse: {
    src: "/images/blog/visual-diverse.jpg",
    width: 1600,
    height: 2279,
    alt: "多種花材混插的花瓶",
    author: "Annie Spratt",
    license: "CC0",
    source: commons("Diverse_flower_vase_(Unsplash).jpg"),
  },
  visualMinimal: {
    src: "/images/blog/visual-minimal.jpg",
    width: 1600,
    height: 2681,
    alt: "極簡風格的單瓶花藝",
    author: "Imani Clovis",
    license: "CC0",
    source: commons("Minimal_flower_vase_(Unsplash).jpg"),
  },
  stylesIkebana: {
    src: "/images/blog/styles-ikebana.jpg",
    width: 1600,
    height: 1279,
    alt: "日式花道作品，劍形葉片與梅枝形成不對稱構圖",
    author: "Gryffindor",
    license: "CC0",
    source: commons("Ikebana_exhibition_at_Meguro_Gajoen_2018_10.jpg"),
  },
  stylesMinimal: {
    src: "/images/blog/styles-western.jpg",
    width: 1600,
    height: 1060,
    alt: "窗邊桌上的玻璃瓶插著一束綠色枝葉",
    author: "Dominik Martin",
    license: "CC0",
    source: commons("Flowers_in_a_glass_vase_(Unsplash).jpg"),
  },
  stylesNatural: {
    src: "/images/blog/styles-natural.jpg",
    width: 1600,
    height: 1067,
    alt: "質樸花器中自然隨性的花藝",
    author: "Alisa Anton",
    license: "CC0",
    source: commons("Rustic_flower_vase_(Unsplash).jpg"),
  },
  typesTable: {
    src: "/images/blog/types-table.jpg",
    width: 1600,
    height: 1067,
    alt: "宴會長桌上低矮橫向延伸的白色玫瑰桌花",
    author: "Bhullargraphic",
    license: "CC BY-SA 4.0",
    source: commons("Legant_table_setting_with_white_floral_centerpiece.jpg"),
  },
  typesBridal: {
    src: "/images/blog/types-bridal.jpg",
    width: 1600,
    height: 1067,
    alt: "新娘手持粉色系圓形捧花",
    author: "Tamara Menzi",
    license: "CC0",
    source: commons("Bridal_bouquet_(Unsplash).jpg"),
  },
  typesHandTied: {
    src: "/images/blog/types-handtied.jpg",
    width: 1600,
    height: 2400,
    alt: "以牛皮紙包裝的玫瑰與康乃馨花束",
    author: "Lizzie",
    license: "CC0",
    source: commons("Paper-wrapped_bouquet_(Unsplash).jpg"),
  },
  carePeony: {
    src: "/images/blog/care-peony.jpg",
    width: 1600,
    height: 2400,
    alt: "插在花瓶中的芍藥",
    author: "Alexandra Seinet",
    license: "CC0",
    source: commons("Peony_vase_(Unsplash).jpg"),
  },
  careFlorist: {
    src: "/images/blog/care-florist.jpg",
    width: 1600,
    height: 1067,
    alt: "花店店員正在整理一束天堂鳥與玫瑰",
    author: "direct2Florist",
    license: "CC BY 2.0",
    source: commons("Florist_putting_a_bouquet_together.jpg"),
  },
  seasonCover: {
    src: "/images/blog/season-cover.jpg",
    width: 1600,
    height: 1200,
    alt: "芍藥與野花混搭的季節花束",
    author: "Gerda Arendt",
    license: "CC0",
    source: commons("Peony_and_wildflowers,_Ehrenbach.jpg"),
  },
  seasonYellow: {
    src: "/images/blog/season-yellow.jpg",
    width: 1600,
    height: 1067,
    alt: "白色小瓶中的黃色金槌花",
    author: "Danielle MacInnes",
    license: "CC0",
    source: commons("Round_yellow_flowers_(Unsplash).jpg"),
  },
  seasonSingleStem: {
    src: "/images/blog/season-agapanthus.jpg",
    width: 1600,
    height: 1067,
    alt: "玻璃瓶中斜插的一枝紫色花",
    author: "NordWood Themes",
    license: "CC0",
    source: commons("Lily_of_the_Nile_in_a_vase_(Unsplash).jpg"),
  },
} satisfies Record<string, Photo>;
