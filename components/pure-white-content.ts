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
    title: "水果、燕麥，還有一杯原味。",
    description:
      "先鋪優格，再放當季水果，最後撒上燕麥或堅果。分開的層次，讓每一口都保有口感。",
    ingredients: "原味優格 / 當季水果 / 燕麥",
    image: "ritual",
  },
  {
    id: "afternoon",
    label: "午後",
    title: "先嚐原味，再加一點喜歡的。",
    description:
      "一杯優格搭配幾顆莓果，酸香清爽。也可以什麼都不加，慢慢感受鮮乳與發酵的風味。",
    ingredients: "原味優格 / 新鮮莓果",
    image: "hero",
  },
  {
    id: "table",
    label: "餐桌",
    title: "拌一碗香草優格沾醬。",
    description:
      "把原味優格拌入橄欖油、香草與少許鹽，搭配麵包或烤蔬菜。濃厚的質地，也很適合鹹食。",
    ingredients: "原味優格 / 橄欖油 / 香草",
    image: "ritual",
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
