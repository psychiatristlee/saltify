export type Language = 'ko' | 'en' | 'zh-CN' | 'zh-TW' | 'ja';

export const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

const translations = {
  storeName: {
    ko: '솔트빵',
    en: 'Salt, 0',
    'zh-CN': 'Salt, 0',
    'zh-TW': 'Salt, 0',
    ja: '塩パン',
  },
  ctaDesc: {
    ko: '게임을 플레이하고 솔트빵 무료 쿠폰을 받아보세요!',
    en: 'Play the game and get free Salt Bread coupons!',
    'zh-CN': '玩游戏获取免费盐面包优惠券！',
    'zh-TW': '玩遊戲獲取免費鹽麵包優惠券！',
    ja: 'ゲームをプレイして無料塩パンクーポンをゲット！',
  },
  startGame: {
    ko: '게임 시작하기',
    en: 'Start Game',
    'zh-CN': '开始游戏',
    'zh-TW': '開始遊戲',
    ja: 'ゲームを始める',
  },
  downloadApp: {
    ko: '앱 다운로드',
    en: 'Download App',
    'zh-CN': '下载应用',
    'zh-TW': '下載應用',
    ja: 'アプリをダウンロード',
  },
  menu: {
    ko: '메뉴',
    en: 'Menu',
    'zh-CN': '菜单',
    'zh-TW': '菜單',
    ja: 'メニュー',
  },
  currencyUnit: {
    ko: '원',
    en: '₩',
    'zh-CN': '₩',
    'zh-TW': '₩',
    ja: '₩',
  },
  findUs: {
    ko: '솔트빵 찾아오는 길',
    en: 'Find Us',
    'zh-CN': '如何找到我们',
    'zh-TW': '如何找到我們',
    ja: 'アクセス',
  },
  storeAddress: {
    ko: '서울 마포구 동교로 39길 10 1층',
    en: '10, Donggyo-ro 39-gil, Mapo-gu, Seoul',
    'zh-CN': '首尔麻浦区东桥路39街10号1楼',
    'zh-TW': '首爾麻浦區東橋路39街10號1樓',
    ja: 'ソウル麻浦区東橋路39キル10 1階',
  },
  storeHours: {
    ko: '영업시간: 11:00 - 21:00 (일요일 휴무)',
    en: 'Hours: 11:00 - 21:00 (Closed Sundays)',
    'zh-CN': '营业时间: 11:00 - 21:00 (周日休息)',
    'zh-TW': '營業時間: 11:00 - 21:00 (週日休息)',
    ja: '営業時間: 11:00 - 21:00 (日曜定休)',
  },
  getDirections: {
    ko: '네이버 지도에서 길찾기',
    en: 'Get Directions',
    'zh-CN': '获取路线',
    'zh-TW': '獲取路線',
    ja: '道順を見る',
  },
  allRightsReserved: {
    ko: '. All rights reserved.',
    en: '. All rights reserved.',
    'zh-CN': '. 版权所有。',
    'zh-TW': '. 版權所有。',
    ja: '. All rights reserved.',
  },
  // Bread names & descriptions
  breadPlainName: {
    ko: '플레인',
    en: 'Plain',
    'zh-CN': '原味',
    'zh-TW': '原味',
    ja: 'プレーン',
  },
  breadPlainDesc: {
    ko: '기본에 충실한 담백함과 바삭한 식감',
    en: 'Classic simplicity with a light, crispy texture',
    'zh-CN': '忠于基本的清淡口感和酥脆质地',
    'zh-TW': '忠於基本的清淡口感和酥脆質地',
    ja: '基本に忠実な淡白さとサクサク食感',
  },
  breadEverythingName: {
    ko: '에브리띵',
    en: 'Everything',
    'zh-CN': '全料',
    'zh-TW': '全料',
    ja: 'エブリシング',
  },
  breadEverythingDesc: {
    ko: '양파,치아시드,참깨,검은깨 등이 토핑된 고소하면서도 담백하게 즐길 수 있는 소금빵',
    en: 'Salt bread topped with onion, chia seeds, sesame, and black sesame for a savory yet light flavor',
    'zh-CN': '撒上洋葱、奇亚籽、芝麻、黑芝麻等配料的咸香面包',
    'zh-TW': '撒上洋蔥、奇亞籽、芝麻、黑芝麻等配料的鹹香麵包',
    ja: '玉ねぎ、チアシード、ごま、黒ごまをトッピングした香ばしく淡白な塩パン',
  },
  breadOliveCheeseName: {
    ko: '올리브 치즈',
    en: 'Olive Cheese',
    'zh-CN': '橄榄芝士',
    'zh-TW': '橄欖起司',
    ja: 'オリーブチーズ',
  },
  breadOliveCheeseDesc: {
    ko: '블랙올리브와 치즈의 짭짤고소한 조화',
    en: 'A savory harmony of black olives and cheese',
    'zh-CN': '黑橄榄与芝士的咸香完美搭配',
    'zh-TW': '黑橄欖與起司的鹹香完美搭配',
    ja: 'ブラックオリーブとチーズの塩味と香ばしさのハーモニー',
  },
  breadBasilTomatoName: {
    ko: '바질 토마토',
    en: 'Basil Tomato',
    'zh-CN': '罗勒番茄',
    'zh-TW': '羅勒番茄',
    ja: 'バジルトマト',
  },
  breadBasilTomatoDesc: {
    ko: '직접만든 바질버터와 선드라이 토마토의 향과 산미',
    en: 'Homemade basil butter with sun-dried tomato aroma and acidity',
    'zh-CN': '自制罗勒黄油与半干番茄的香气和酸味',
    'zh-TW': '自製羅勒奶油與半乾番茄的香氣和酸味',
    ja: '手作りバジルバターとセミドライトマトの香りと酸味',
  },
  breadGarlicButterName: {
    ko: '갈릭 버터',
    en: 'Garlic Butter',
    'zh-CN': '蒜香黄油',
    'zh-TW': '蒜香奶油',
    ja: 'ガーリックバター',
  },
  breadGarlicButterDesc: {
    ko: '마늘향과 버터소스의 달콤하고 고소함',
    en: 'Sweet and savory garlic aroma with butter sauce',
    'zh-CN': '蒜香与黄油酱的甜美浓郁风味',
    'zh-TW': '蒜香與奶油醬的甜美濃郁風味',
    ja: 'にんにくの香りとバターソースの甘く香ばしい味わい',
  },
  breadHotteokName: {
    ko: '호떡',
    en: 'Hotteok',
    'zh-CN': '糖饼',
    'zh-TW': '糖餅',
    ja: 'ホットク',
  },
  breadHotteokDesc: {
    ko: '고소한 견과류와 달콤한 시럽이 가득찬 따끈한 호떡을 느낄 수 있는 소금빵',
    en: 'Salt bread filled with savory nuts and sweet syrup, just like warm hotteok',
    'zh-CN': '充满香脆坚果和甜蜜糖浆的盐面包，如同热腾腾的糖饼',
    'zh-TW': '充滿香脆堅果和甜蜜糖漿的鹽麵包，如同熱騰騰的糖餅',
    ja: '香ばしいナッツと甘いシロップたっぷりの温かいホットクを感じられる塩パン',
  },
  landingCubeChocoName: {
    ko: '큐브 초코크림',
    en: 'Cube Choco Cream',
    'zh-CN': '方块巧克力奶油',
    'zh-TW': '方塊巧克力奶油',
    ja: 'キューブチョコクリーム',
  },
  landingCubeChocoDesc: {
    ko: '꾸덕하고 진한 초코크림과 입안에서 톡 터지는 초코칩이 가득 들어가 있는 큐브 소금빵',
    en: 'Cube salt bread filled with rich chocolate cream and crunchy chocolate chips',
    'zh-CN': '方块盐面包，内含浓郁巧克力奶油和爆裂巧克力碎片',
    'zh-TW': '方塊鹽麵包，內含濃郁巧克力奶油和爆裂巧克力碎片',
    ja: '濃厚チョコクリームと口の中で弾けるチョコチップがたっぷり入ったキューブ塩パン',
  },
  landingCubeMatchaName: {
    ko: '큐브 말차크림',
    en: 'Cube Matcha Cream',
    'zh-CN': '方块抹茶奶油',
    'zh-TW': '方塊抹茶奶油',
    ja: 'キューブ抹茶クリーム',
  },
  landingCubeMatchaDesc: {
    ko: '4면이 바삭한 귀여운 큐브소금빵 안에 꾸덕한 말차크림이 한가득 들어간 소금빵',
    en: 'Cute cube salt bread with crispy sides, filled with rich matcha cream',
    'zh-CN': '四面酥脆的可爱方块盐面包，内含满满的浓郁抹茶奶油',
    'zh-TW': '四面酥脆的可愛方塊鹽麵包，內含滿滿的濃郁抹茶奶油',
    ja: '4面がサクサクのかわいいキューブ塩パンの中に濃厚抹茶クリームがたっぷり',
  },
  viewFullMenu: {
    ko: '전체 메뉴 보기',
    en: 'View Full Menu',
    'zh-CN': '查看完整菜单',
    'zh-TW': '查看完整菜單',
    ja: 'メニュー全体を見る (PDF)',
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language = 'ko'): string {
  const entry = translations[key];
  return entry[lang] || entry['ko'];
}
