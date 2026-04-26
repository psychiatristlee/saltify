export type Language = 'ko' | 'en' | 'zh-CN' | 'ja';

export const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

const translations = {
  storeName: {
    ko: '솔트빵',
    en: 'Salt, 0',
    'zh-CN': 'Salt, 0',
    ja: 'ソルトパン',
  },
  ctaDesc: {
    ko: '게임을 플레이하고 솔트빵 무료 쿠폰을 받아보세요!',
    en: 'Play the game and get free Salt Bread coupons!',
    'zh-CN': '玩游戏获取免费盐面包优惠券！',
    ja: 'ゲームをプレイして無料塩パンクーポンをゲット！',
  },
  startGame: {
    ko: '게임 시작하기',
    en: 'Start Game',
    'zh-CN': '开始游戏',
    ja: 'ゲームを始める',
  },
  downloadApp: {
    ko: '앱 다운로드',
    en: 'Download App',
    'zh-CN': '下载应用',
    ja: 'アプリをダウンロード',
  },
  menu: {
    ko: '메뉴',
    en: 'Menu',
    'zh-CN': '菜单',
    ja: 'メニュー',
  },
  drinks: {
    ko: '음료',
    en: 'Drinks',
    'zh-CN': '饮品',
    ja: 'お飲み物',
  },
  currencyUnit: {
    ko: '원',
    en: '₩',
    'zh-CN': '₩',
    ja: '₩',
  },
  findUs: {
    ko: '솔트빵 찾아오는 길',
    en: 'Find Us',
    'zh-CN': '如何找到我们',
    ja: 'アクセス',
  },
  storeAddress: {
    ko: '서울 마포구 동교로 39길 10 1층',
    en: '10, Donggyo-ro 39-gil, Mapo-gu, Seoul',
    'zh-CN': '首尔麻浦区东桥路39街10号1楼',
    ja: 'ソウル麻浦区東橋路39キル10 1階',
  },
  storeHours: {
    ko: '영업시간: 11:00 - 19:30 (일요일 휴무, 소진시 마감)',
    en: 'Hours: 11:00 - 19:30 (Closed Sundays, until sold out)',
    'zh-CN': '营业时间: 11:00 - 19:30 (周日休息, 售完即止)',
    ja: '営業時間: 11:00 - 19:30 (日曜定休, 売り切れ次第終了)',
  },
  getDirections: {
    ko: '네이버 지도에서 길찾기',
    en: 'Get Directions',
    'zh-CN': '获取路线',
    ja: '道順を見る',
  },
  allRightsReserved: {
    ko: '. All rights reserved.',
    en: '. All rights reserved.',
    'zh-CN': '. 版权所有。',
    ja: '. All rights reserved.',
  },
  // ===== Bread: Plain =====
  breadPlainName: {
    ko: '플레인',
    en: 'Plain',
    'zh-CN': '原味',
    ja: 'プレーン',
  },
  breadPlainDesc: {
    ko: '기본에 충실한 담백함과 바삭한 식감',
    en: 'Classic simplicity with a light, crispy texture',
    'zh-CN': '忠于基本的清淡口感和酥脆质地',
    ja: '基本に忠実。淡白な味わいと、外はパリッ、中はしっとりの食感',
  },
  // ===== Bread: Everything =====
  breadEverythingName: {
    ko: '에브리띵',
    en: 'Everything',
    'zh-CN': '全料',
    ja: 'エブリシング',
  },
  breadEverythingDesc: {
    ko: '양파, 치아시드, 참깨, 검은깨 등이 토핑된 고소하면서도 담백하게 즐길 수 있는 소금빵',
    en: 'Salt bread topped with onion, chia seeds, sesame, and black sesame for a savory yet light flavor',
    'zh-CN': '撒上洋葱、奇亚籽、芝麻、黑芝麻等配料的咸香面包',
    ja: '玉ねぎ、チアシード、白ごま、黒ごまをトッピング。香ばしく、淡白に楽しめる一つ',
  },
  // ===== Bread: Olive Cheese =====
  breadOliveCheeseName: {
    ko: '올리브 치즈',
    en: 'Olive Cheese',
    'zh-CN': '橄榄芝士',
    ja: 'オリーブチーズ',
  },
  breadOliveCheeseDesc: {
    ko: '블랙올리브와 치즈의 짭짤고소한 조화',
    en: 'A savory harmony of black olives and cheese',
    'zh-CN': '黑橄榄与芝士的咸香完美搭配',
    ja: 'ブラックオリーブとチーズの、しょっぱくて香ばしいハーモニー',
  },
  // ===== Bread: Basil Tomato =====
  breadBasilTomatoName: {
    ko: '바질 토마토',
    en: 'Basil Tomato',
    'zh-CN': '罗勒番茄',
    ja: 'バジルトマト',
  },
  breadBasilTomatoDesc: {
    ko: '직접 만든 바질버터와 선드라이 토마토의 향과 산미',
    en: 'Homemade basil butter with sun-dried tomato aroma and acidity',
    'zh-CN': '自制罗勒黄油与半干番茄的香气和酸味',
    ja: '自家製バジルバターと、サンドライトマトの香りと酸味',
  },
  // ===== Bread: Garlic Butter =====
  breadGarlicButterName: {
    ko: '갈릭 버터',
    en: 'Garlic Butter',
    'zh-CN': '蒜香黄油',
    ja: 'ガーリックバター',
  },
  breadGarlicButterDesc: {
    ko: '마늘향과 버터소스의 달콤하고 고소함',
    en: 'Sweet and savory garlic aroma with butter sauce',
    'zh-CN': '蒜香与黄油酱的甜美浓郁风味',
    ja: 'ガーリックの香りと、バターソースの甘く香ばしい味わい',
  },
  // ===== Bread: Almond =====
  breadAlmondName: {
    ko: '아몬드 소금빵',
    en: 'Almond Salt Bread',
    'zh-CN': '杏仁盐面包',
    ja: 'アーモンド塩パン',
  },
  breadAlmondDesc: {
    ko: '바삭한 아몬드 슬라이스 토핑과 달콤한 풍미가 어우러진 소금빵',
    en: 'Salt bread topped with crispy sliced almonds for a sweet and nutty flavor',
    'zh-CN': '香脆杏仁片配上甜美风味的盐面包',
    ja: 'カリッと香ばしいアーモンドスライスをトッピングした甘く香ばしい塩パン',
  },
  // ===== Bread: Seed Hotteok =====
  breadHotteokName: {
    ko: '씨앗호떡',
    en: 'Seed Hotteok',
    'zh-CN': '坚果糖饼',
    ja: 'シアッホットク',
  },
  breadHotteokDesc: {
    ko: '한국 전통 간식 호떡을 소금빵에. 고소한 견과류와 달콤한 시럽이 따끈하게 퍼집니다',
    en: 'Korean traditional hotteok in salt bread. Savory nuts and sweet syrup spread warmly inside',
    'zh-CN': '韩国传统小吃糖饼与盐面包的结合。香脆坚果和甜蜜糖浆温暖地融化其中',
    ja: '韓国伝統おやつ「ホットク」を塩パンに。香ばしいナッツと甘いシロップが温かく広がります',
  },
  // ===== Bread: Chive Cream Cheese =====
  breadChiveCreamCheeseName: {
    ko: '쪽파크림치즈',
    en: 'Chive Cream Cheese',
    'zh-CN': '香葱奶油芝士',
    ja: 'チャイブクリームチーズ',
  },
  breadChiveCreamCheeseDesc: {
    ko: '쪽파와 크림치즈가 듬뿍. 틀림없는 조합',
    en: 'Packed with chives and cream cheese. A perfect combination',
    'zh-CN': '满满的香葱与奶油芝士，完美组合',
    ja: 'チャイブ(細ねぎ)とクリームチーズがたっぷり。間違いない組み合わせ',
  },
  // ===== Bread: Salt Butter Tteok =====
  breadSaltButterTteokName: {
    ko: '소금버터떡',
    en: 'Salt Butter Tteok',
    'zh-CN': '盐黄油年糕',
    ja: '塩バター餅',
  },
  breadSaltButterTteokDesc: {
    ko: '말돈 소금을 올린 쫀득한 식감과 달콤짭짤함이 절묘한 한국 떡. 4개 1세트',
    en: 'Chewy Korean rice cake topped with Maldon salt. Sweet and salty perfection. 4 pieces per set',
    'zh-CN': '撒上莫尔顿盐的Q弹韩国年糕，甜咸绝配。4个一组',
    ja: 'モルドン塩をのせた、もちもち食感と甘塩っぱさが絶妙な韓国餅。4個セット',
  },
  // ===== Bread: Choco Cream =====
  breadChocoName: {
    ko: '초코크림',
    en: 'Choco Cream',
    'zh-CN': '巧克力奶油',
    ja: 'チョコクリーム',
  },
  breadChocoDesc: {
    ko: '꾸덕하고 진한 초코크림과 입안에서 톡 터지는 초코칩이 가득 들어가 있는 소금빵',
    en: 'Salt bread filled with rich chocolate cream and crunchy chocolate chips',
    'zh-CN': '盐面包内含浓郁巧克力奶油和爆裂巧克力碎片',
    ja: '濃厚チョコクリームと、口の中で弾けるチョコチップがたっぷり詰まった一つ',
  },
  // ===== Bread: Matcha Cream =====
  breadMatchaName: {
    ko: '말차크림',
    en: 'Matcha Cream',
    'zh-CN': '抹茶奶油',
    ja: '抹茶クリーム',
  },
  breadMatchaDesc: {
    ko: '소금빵 안에 꾸덕하고 진한 말차크림을 한가득 넣어',
    en: 'Salt bread generously filled with rich, creamy matcha',
    'zh-CN': '盐面包中满满的浓郁抹茶奶油',
    ja: '塩パンの中に、濃厚でとろりとした抹茶クリームをたっぷり詰めて',
  },
  // ===== Drink: Cold Brew =====
  drinkColdBrewName: {
    ko: '콜드브루 커피',
    en: 'Cold Brew Coffee',
    'zh-CN': '冷萃咖啡',
    ja: 'コールドブリューコーヒー',
  },
  drinkColdBrewDesc: {
    ko: '저온에서 천천히 추출한 부드럽고 진한 콜드브루. 아메리카노 스타일',
    en: 'Smooth and rich cold brew, slowly extracted at low temperature. Americano style',
    'zh-CN': '低温慢萃的醇厚冷萃咖啡，美式风格',
    ja: 'ゆっくりと低温で抽出した、まろやかで濃いコールドブリュー。アメリカーノスタイル',
  },
  // ===== Drink: Cold Brew Latte =====
  drinkColdBrewLatteName: {
    ko: '콜드브루 라떼',
    en: 'Cold Brew Latte',
    'zh-CN': '冷萃拿铁',
    ja: 'コールドブリューラテ',
  },
  drinkColdBrewLatteDesc: {
    ko: '부드럽고 진한 콜드브루에 우유를 듬뿍. 소금빵과의 궁합이 최고',
    en: 'Smooth cold brew generously topped with milk. Perfect pairing with salt bread',
    'zh-CN': '醇厚冷萃配满满牛奶，与盐面包绝配',
    ja: 'まろやかで濃いコールドブリューに、ミルクをたっぷりと。塩パンとの相性は抜群',
  },
  // ===== Drink: Zero Sugar Milk Tea =====
  drinkMilkTeaName: {
    ko: '제로슈가 밀크티',
    en: 'Zero Sugar Milk Tea',
    'zh-CN': '零糖奶茶',
    ja: 'ゼロシュガーミルクティー',
  },
  drinkMilkTeaDesc: {
    ko: '설탕 없이, 홍차(얼그레이+아쌈)와 우유의 밸런스만으로 완성한 자체 페어링 음료. 300ml',
    en: 'Zero sugar, balanced with Earl Grey + Assam black tea and milk. House-made pairing drink. 300ml',
    'zh-CN': '不加糖，仅用红茶（伯爵+阿萨姆）与牛奶调和的自制配对饮品。300ml',
    ja: '砂糖を一切使わず、紅茶(アールグレイ+アッサム)とミルクのバランスだけで仕上げた自家製ペアリングドリンク。300ml',
  },
  viewFullMenu: {
    ko: '전체 메뉴 보기',
    en: 'View Full Menu',
    'zh-CN': '查看完整菜单',
    ja: 'メニュー全体を見る (PDF)',
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language = 'ko'): string {
  const entry = translations[key];
  return entry[lang] || entry['ko'];
}
