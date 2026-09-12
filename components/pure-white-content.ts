const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const yogurtHome = `${base}/pure-white/`;
export const yogurtProduct = `${yogurtHome}original/`;
export const portfolioHome = `${base}/#work`;
export const yogurtImage = (name: string) =>
  `${base}/images/pure-white-${name}.webp`;

export const yogurtSizes = [
  {
    id: "cup",
    name: "日常杯",
    weight: "150g",
    occasion: "留給自己的一杯。",
    description:
      "一人享用的份量。早餐加一把燕麥，或在午後配幾顆莓果；打開一杯，就能開始。",
  },
  {
    id: "jar",
    name: "分享罐",
    weight: "450g",
    occasion: "餐桌上，多一種可能。",
    description:
      "適合分裝分享，也方便料理取用。今天搭水果，明天拌香草沾醬，依照自己的習慣安排份量。",
  },
] as const;

export type YogurtSize = (typeof yogurtSizes)[number]["id"];
export const isYogurtSize = (value: string | null): value is YogurtSize =>
  value === "cup" || value === "jar";

export const yogurtFacts = [
  ["配方概念", "鮮乳、乳酸菌。原味配方不額外添加糖，乳品本身仍含天然乳糖。"],
  [
    "風味與口感",
    "入口是柔和乳香，接著帶出發酵的細緻酸香。質地濃厚，適合直接吃，也能拌入料理。",
  ],
  ["過敏原", "含乳製品。搭配堅果、穀物等食材時，請一併留意配料的過敏原。"],
  [
    "保存與取用",
    "依實際包裝標示冷藏。使用乾淨餐具取用，吃多少、取多少，避免長時間放在室溫。",
  ],
];

export const craftSteps = [
  {
    label: "鮮乳",
    title: "從原料開始。",
    body: "鮮乳提供乳香，乳酸菌帶來發酵風味。原味配方保留這兩個起點，讓酸香與乳香都能被嚐到。",
  },
  {
    label: "發酵",
    title: "讓風味慢慢成形。",
    body: "發酵改變鮮乳的質地，也帶出溫和的酸香。細心照料每一批，等待風味與口感達到平衡。",
  },
  {
    label: "過濾",
    title: "留下看得見的濃厚。",
    body: "透過濾布分離部分乳清，讓優格更集中、更細緻。湯匙劃過的紋路，是這道工序留下的印記。",
  },
];

export const servingIdeas = [
  {
    id: "breakfast",
    label: "早餐",
    title: "藍莓香蕉燕麥碗",
    description:
      "香蕉的柔軟、藍莓的酸甜，和燕麥的嚼感。一杯原味，就能裝下早餐的不同層次。",
    servings: "1 人份",
    time: "5 分鐘",
    ingredients: [
      ["原味希臘優格", "150g"],
      ["即食燕麥", "20g"],
      ["香蕉", "50g"],
      ["藍莓", "40g"],
    ],
    steps: [
      "藍莓洗淨、瀝乾；香蕉去皮後切片。",
      "把優格盛入碗中，拌入一半即食燕麥。",
      "排上香蕉與藍莓，撒上剩下的燕麥，保留不同口感。",
    ],
    tip: "喜歡柔軟的燕麥，可以先和優格拌勻，冷藏浸泡後再加水果。",
    allergens: "含乳製品與燕麥；如需避免麩質，請確認燕麥包裝標示。",
    image: "recipe-breakfast",
    alt: "鈷藍碗中的原味優格，搭配香蕉片、藍莓與燕麥",
  },
  {
    id: "afternoon",
    label: "午後",
    title: "蜜橙杏仁優格杯",
    description:
      "把多汁的橙肉藏進優格層裡。蜂蜜收尾，杏仁添一點酥脆，留給午後慢慢吃。",
    servings: "1 人份",
    time: "5 分鐘",
    ingredients: [
      ["原味希臘優格", "150g"],
      ["去皮橙肉", "80g"],
      ["蜂蜜", "8g"],
      ["杏仁片", "10g"],
    ],
    steps: [
      "橙子去皮、去籽，取橙肉切成方便入口的小塊。",
      "透明杯中交替放入優格與橙肉，最後留一層優格。",
      "淋上蜂蜜，撒上即食杏仁片；上桌前再加配料，口感更清楚。",
    ],
    tip: "橙子本身夠甜時，可以減少或省略蜂蜜。杏仁也可以另外盛裝，吃的時候再撒。",
    allergens: "含乳製品與堅果類（杏仁）。",
    image: "recipe-afternoon",
    alt: "透明杯中分層的優格與香橙，上面淋有蜂蜜並撒上杏仁片",
  },
  {
    id: "table",
    label: "餐桌",
    title: "檸檬香草優格沾醬",
    description:
      "原味也能走向鹹食。檸檬帶來清香，巴西里與橄欖油拌出一盤適合分享的沾醬。",
    servings: "4 人份",
    time: "10 分鐘",
    ingredients: [
      ["原味希臘優格", "300g"],
      ["檸檬汁", "10ml"],
      ["橄欖油", "10ml"],
      ["新鮮巴西里", "3g"],
      ["鹽／黑胡椒", "1g／少許"],
      ["小黃瓜與紅蘿蔔", "共 200g"],
    ],
    steps: [
      "巴西里洗淨、擦乾後切碎；小黃瓜與紅蘿蔔洗淨，切成長條。",
      "將優格、檸檬汁、一半橄欖油、巴西里與鹽拌勻。",
      "試味後撒少許黑胡椒，盛入淺盤，淋上剩下的橄欖油。",
      "蔬菜棒放在一旁，取適量沾醬分裝享用；未上桌的部分保持冷藏。",
    ],
    tip: "分享罐取用 300g，剩下的 150g 剛好留作下一次早餐。請用乾淨湯匙分裝，保存依產品標示。",
    allergens: "含乳製品。",
    image: "recipe-savory",
    alt: "檸檬巴西里優格沾醬與橄欖油，搭配小黃瓜及紅蘿蔔棒",
  },
];

export const yogurtQuestions = [
  [
    "希臘優格，為什麼比較濃厚？",
    "發酵後多一道過濾程序，分離部分乳清，留下更濃厚、細緻的質地。這也是它能承托水果、適合用來拌醬的原因。",
  ],
  [
    "無加糖，就是完全沒有糖嗎？",
    "不是。無加糖指配方不額外添加糖，乳品本身仍含天然乳糖。實際糖含量請以商品包裝的營養標示為準。",
  ],
  [
    "150g 和 450g，配方有什麼不同？",
    "兩種規格使用相同的原味配方。150g 適合一人享用，450g 適合分享、分裝或料理，差別在份量與使用情境。",
  ],
  [
    "開封後應該怎麼保存？",
    "保持冷藏，使用乾淨餐具，取用後隨即蓋好。保存溫度、期限及開封後的食用建議，請依實際包裝標示。",
  ],
];
