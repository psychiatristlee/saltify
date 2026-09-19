import { STORE } from './storeInfo';

export type Language = 'ko' | 'en' | 'zh-CN' | 'zh-Hant' | 'ja';

export const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-Hant', name: '繁體中文', flag: '🇹🇼' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

// Traditional Chinese is written for Taiwan/HK, not machine-converted from the
// Simplified copy: salt bread is 鹽可頌 there (the term arrived via Japanese
// 塩パン), cheese is 起司 rather than 芝士, and butter is 奶油 rather than 黄油.
const translations = {
  storeName: {
    ko: '솔트빵 Salt,θ',
    en: 'Salt,θ (Salt Bread)',
    'zh-CN': 'Salt,θ (Salt Bread)',
    'zh-Hant': 'Salt,θ (Salt Bread)',
    ja: 'ソルトパン Salt,θ (Salt Bread)',
  },
  menu: {
    ko: '메뉴',
    en: 'Menu',
    'zh-CN': '菜单',
    'zh-Hant': '菜單',
    ja: 'メニュー',
  },
  drinks: {
    ko: '음료',
    en: 'Drinks',
    'zh-CN': '饮品',
    'zh-Hant': '飲品',
    ja: 'お飲み物',
  },
  currencyUnit: {
    ko: '원',
    en: '₩',
    'zh-CN': '₩',
    'zh-Hant': '₩',
    ja: '₩',
  },
  findUs: {
    ko: '솔트빵 찾아오는 길',
    en: 'Find Us',
    'zh-CN': '如何找到我们',
    'zh-Hant': '如何找到我們',
    ja: 'アクセス',
  },
  storeAddress: {
    ko: '서울 마포구 동교로 39길 10 1층',
    en: '10, Donggyo-ro 39-gil, Mapo-gu, Seoul',
    'zh-CN': '首尔麻浦区东桥路39街10号1楼',
    'zh-Hant': '首爾麻浦區東橋路39街10號1樓',
    ja: 'ソウル麻浦区東橋路39キル10 1階',
  },
  // Derived from STORE so the hours are stated in exactly one place.
  storeHours: {
    ko: `영업시간: ${STORE.hoursText}`,
    en: `Hours: ${STORE.hoursTextEn}`,
    'zh-CN': `营业时间: ${STORE.hoursTextZh}`,
    'zh-Hant': `營業時間: ${STORE.hoursTextZhHant}`,
    ja: `営業時間: ${STORE.hoursTextJa}`,
  },
  openEveryDay: {
    ko: '연중무휴 · 휴무일 없음',
    en: 'Open 7 days a week — no closing day',
    'zh-CN': '全年无休 · 无固定休息日',
    'zh-Hant': '全年無休 · 無固定公休日',
    ja: '年中無休 ・ 定休日なし',
  },
  storeAddressRoman: {
    ko: STORE.addressEn,
    en: STORE.addressEn,
    'zh-CN': STORE.addressEn,
    'zh-Hant': STORE.addressEn,
    ja: STORE.addressEn,
  },
  storePhone: {
    ko: '전화',
    en: 'Phone',
    'zh-CN': '电话',
    'zh-Hant': '電話',
    ja: '電話',
  },
  gettingHere: {
    ko: STORE.nearestStation,
    en: STORE.nearestStationEn,
    'zh-CN': STORE.nearestStationZh,
    'zh-Hant': STORE.nearestStationZhHant,
    ja: STORE.nearestStationJa,
  },
  getDirections: {
    ko: '네이버 지도에서 길찾기',
    en: 'Get Directions',
    'zh-CN': '获取路线',
    'zh-Hant': '查看路線',
    ja: '道順を見る',
  },
  allRightsReserved: {
    ko: '. All rights reserved.',
    en: '. All rights reserved.',
    'zh-CN': '. 版权所有。',
    'zh-Hant': '. 版權所有。',
    ja: '. All rights reserved.',
  },
  // ===== Bread: Plain =====
  breadPlainName: {
    ko: '플레인',
    en: 'Plain',
    'zh-CN': '原味',
    'zh-Hant': '原味',
    ja: 'プレーン',
  },
  breadPlainDesc: {
    ko: '기본에 충실한 담백함과 바삭한 식감',
    en: 'Clean and crisp — the classic',
    'zh-CN': '忠于基本的清淡口感和酥脆质地',
    'zh-Hant': '忠於基本的清爽風味與酥脆口感',
    ja: '基本に忠実。淡白な味わいと、外はパリッ、中はしっとりの食感',
  },
  // ===== Bread: Everything =====
  breadEverythingName: {
    ko: '에브리띵',
    en: 'Everything',
    'zh-CN': '全料',
    'zh-Hant': '全料',
    ja: 'エブリシング',
  },
  breadEverythingDesc: {
    ko: '양파 · 치아시드 · 참깨 · 검은깨 토핑',
    en: 'Onion, chia and sesame',
    'zh-CN': '洋葱 · 奇亚籽 · 白芝麻 · 黑芝麻配料',
    'zh-Hant': '洋蔥 · 奇亞籽 · 白芝麻 · 黑芝麻',
    ja: '玉ねぎ・チアシード・白ごま・黒ごまをトッピング',
  },
  // ===== Bread: Corn Cheese =====
  breadCornCheeseName: {
    ko: '콘치즈',
    en: 'Corn Cheese',
    'zh-CN': '玉米芝士',
    'zh-Hant': '玉米起司',
    ja: 'コーンチーズ',
  },
  breadCornCheeseDesc: {
    ko: '옥수수가 톡톡 씹히는 고소하고 달큰한 소금빵',
    en: 'Sweet corn and melted cheese',
    'zh-CN': '玉米粒颗颗弹牙，香浓微甜的盐面包',
    'zh-Hant': '玉米粒粒分明，香濃微甜的鹽可頌',
    ja: 'プチッと弾けるコーンが香ばしく、ほんのり甘い塩パン',
  },
  // ===== Bread: Olive Cheese =====
  breadOliveCheeseName: {
    ko: '올리브 치즈',
    en: 'Olive Cheese',
    'zh-CN': '橄榄芝士',
    'zh-Hant': '橄欖起司',
    ja: 'オリーブチーズ',
  },
  breadOliveCheeseDesc: {
    ko: '블랙올리브와 치즈의 짭짤고소한 조화',
    en: 'Black olive and cheese',
    'zh-CN': '黑橄榄与芝士的咸香完美搭配',
    'zh-Hant': '黑橄欖與起司的鹹香組合',
    ja: 'ブラックオリーブとチーズの、しょっぱくて香ばしいハーモニー',
  },
  // ===== Bread: Basil Tomato =====
  breadBasilTomatoName: {
    ko: '바질 토마토',
    en: 'Basil Tomato',
    'zh-CN': '罗勒番茄',
    'zh-Hant': '羅勒番茄',
    ja: 'バジルトマト',
  },
  breadBasilTomatoDesc: {
    ko: '직접 만든 바질버터와 선드라이 토마토',
    en: 'House basil butter, sun-dried tomato',
    'zh-CN': '自制罗勒黄油与半干番茄',
    'zh-Hant': '自製羅勒奶油與半乾番茄',
    ja: '自家製バジルバターとサンドライトマト',
  },
  // ===== Bread: Garlic Butter =====
  breadGarlicButterName: {
    ko: '갈릭 버터',
    en: 'Garlic Butter',
    'zh-CN': '蒜香黄油',
    'zh-Hant': '蒜香奶油',
    ja: 'ガーリックバター',
  },
  breadGarlicButterDesc: {
    ko: '마늘향과 버터소스의 달콤하고 고소함',
    en: 'Garlic and sweet butter sauce',
    'zh-CN': '蒜香与黄油酱的甜美浓郁风味',
    'zh-Hant': '蒜香與奶油醬的香甜濃郁',
    ja: 'ガーリックの香りと、バターソースの甘く香ばしい味わい',
  },
  // ===== Bread: Choco Bun (covered with chocolate-bun dough) =====
  breadChocoBunName: {
    ko: '초코번',
    en: 'Choco Bun',
    'zh-CN': '巧克力球盐面包',
    'zh-Hant': '巧克力鹽可頌',
    ja: 'チョコバン',
  },
  breadChocoBunDesc: {
    ko: '달콤하고 꾸덕한 초코크림이 가득',
    en: 'Rich chocolate cream',
    'zh-CN': '满满香甜浓郁的巧克力奶油',
    'zh-Hant': '滿滿香甜濃郁的巧克力奶油',
    ja: '甘く濃厚なチョコクリームがたっぷり',
  },
  // ===== Bread: Matcha Cream =====
  breadMatchaName: {
    ko: '말차크림 소금빵',
    en: 'Matcha Cream Salt Bread',
    'zh-CN': '抹茶奶油盐面包',
    'zh-Hant': '抹茶奶油鹽可頌',
    ja: '抹茶クリーム塩パン',
  },
  breadMatchaDesc: {
    ko: '소금빵 안에 진하고 꾸덕한 말차크림이 한가득',
    en: 'Salt bread generously filled with rich, creamy matcha',
    'zh-CN': '盐面包中满满的浓郁抹茶奶油',
    'zh-Hant': '鹽可頌裡滿滿的濃郁抹茶奶油',
    ja: '塩パンの中に、濃厚な抹茶クリームをたっぷり詰めて',
  },
  // ===== Bread: Seed Hotteok =====
  breadHotteokName: {
    ko: '씨앗호떡',
    en: 'Hotteok',
    'zh-CN': '坚果糖饼',
    'zh-Hant': '堅果糖餅',
    ja: 'シアッホットク',
  },
  breadHotteokDesc: {
    ko: '고소한 견과류와 달콤한 시럽이 가득',
    en: 'Nuts and sweet syrup, hotteok style',
    'zh-CN': '满满香脆坚果与甜蜜糖浆，韩式糖饼风味',
    'zh-Hant': '滿滿香脆堅果與甜蜜糖漿，韓式糖餅風味',
    ja: '香ばしいナッツと甘いシロップがたっぷり。韓国のおやつ「ホットク」風',
  },
  // ===== Bread: Jalapeño Ham Cheese =====
  breadJalapenoHamCheeseName: {
    ko: '할라피뇨 햄치즈',
    en: 'Jalapeño Ham Cheese',
    'zh-CN': '墨西哥辣椒火腿芝士',
    'zh-Hant': '墨西哥辣椒火腿起司',
    ja: 'ハラペーニョハムチーズ',
  },
  breadJalapenoHamCheeseDesc: {
    ko: '느끼할 틈 없는 단짠',
    en: 'Sweet, salty, a little heat',
    'zh-CN': '甜咸交织，带一点辣，一点也不腻',
    'zh-Hant': '甜鹹交織帶點辣，一點也不膩',
    ja: '甘じょっぱさにピリッと辛み。最後まで飽きない味',
  },
  // ===== Drink: Cold Brew =====
  drinkColdBrewName: {
    ko: '콜드브루 커피',
    en: 'Cold Brew',
    'zh-CN': '冷萃咖啡',
    'zh-Hant': '冷萃咖啡',
    ja: 'コールドブリューコーヒー',
  },
  drinkColdBrewDesc: {
    ko: '저온에서 천천히 추출한 부드럽고 진한 콜드브루. 아메리카노 스타일',
    en: 'Smooth and rich cold brew, slowly extracted at low temperature. Americano style',
    'zh-CN': '低温慢萃的醇厚冷萃咖啡，美式风格',
    'zh-Hant': '低溫慢萃的醇厚冷萃咖啡，美式風格',
    ja: 'ゆっくりと低温で抽出した、まろやかで濃いコールドブリュー。アメリカーノスタイル',
  },
  // ===== Drink: Cold Brew Latte =====
  drinkColdBrewLatteName: {
    ko: '콜드브루 라떼',
    en: 'Cold Brew Latte',
    'zh-CN': '冷萃拿铁',
    'zh-Hant': '冷萃拿鐵',
    ja: 'コールドブリューラテ',
  },
  drinkColdBrewLatteDesc: {
    ko: '부드럽고 진한 콜드브루에 우유를 듬뿍. 소금빵과의 궁합이 최고',
    en: 'Smooth cold brew generously topped with milk. Perfect pairing with salt bread',
    'zh-CN': '醇厚冷萃配满满牛奶，与盐面包绝配',
    'zh-Hant': '醇厚冷萃配上滿滿鮮奶，與鹽可頌絕配',
    ja: 'まろやかで濃いコールドブリューに、ミルクをたっぷりと。塩パンとの相性は抜群',
  },
  // ===== Drink: Cold Brew Bottle =====
  drinkColdBrewBottleName: {
    ko: '콜드브루 보틀',
    en: 'Cold Brew Bottle',
    'zh-CN': '瓶装冷萃咖啡',
    'zh-Hant': '瓶裝冷萃咖啡',
    ja: 'コールドブリューボトル',
  },
  drinkColdBrewBottleDesc: {
    ko: '솔트빵 콜드브루를 그대로 보틀에 담았어요',
    en: 'Our cold brew, bottled',
    'zh-CN': '本店冷萃咖啡的瓶装版',
    'zh-Hant': '本店冷萃咖啡的瓶裝版',
    ja: '当店のコールドブリューをボトルに詰めて',
  },
  // ===== Drink: Zero Cola =====
  drinkZeroColaName: {
    ko: '제로 콜라',
    en: 'Zero Cola',
    'zh-CN': '零度可乐',
    'zh-Hant': '零卡可樂',
    ja: 'ゼロコーラ',
  },
  drinkZeroColaDesc: {
    ko: '시원하고 깔끔한 제로 슈가 콜라',
    en: 'Crisp, refreshing zero-sugar cola',
    'zh-CN': '清爽无糖的零度可乐',
    'zh-Hant': '清爽無糖的零卡可樂',
    ja: 'すっきり爽やかなゼロシュガーコーラ',
  },
  // ===== Drink: Zero Peach Iced Tea =====
  drinkPeachIcedTeaName: {
    ko: '제로 복숭아 아이스티',
    en: 'Zero Peach Iced Tea',
    'zh-CN': '零糖桃子冰茶',
    'zh-Hant': '無糖水蜜桃冰茶',
    ja: 'ゼロ ピーチアイスティー',
  },
  drinkPeachIcedTeaDesc: {
    ko: '달콤한 복숭아 향이 가득한 제로 슈가 아이스티',
    en: 'Zero-sugar iced tea bursting with sweet peach aroma',
    'zh-CN': '充满甜美桃子香气的无糖冰茶',
    'zh-Hant': '充滿香甜水蜜桃香氣的無糖冰茶',
    ja: '甘い桃の香りが広がるゼロシュガーアイスティー',
  },
  viewFullMenu: {
    ko: '메뉴판 보기',
    en: 'View Menu Board',
    'zh-CN': '查看菜单',
    'zh-Hant': '查看菜單',
    ja: 'メニュー表を見る',
  },
};

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language = 'ko'): string {
  const entry = translations[key];
  return entry[lang] || entry['ko'];
}
