export type Language = 'ko' | 'en' | 'zh' | 'ja';

export const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

export const translations = {
  // Common
  loading: {
    ko: '로딩 중...',
    en: 'Loading...',
    zh: '加载中...',
    ja: '読み込み中...',
  },
  confirm: {
    ko: '확인',
    en: 'OK',
    zh: '确认',
    ja: '確認',
  },
  cancel: {
    ko: '취소',
    en: 'Cancel',
    zh: '取消',
    ja: 'キャンセル',
  },
  close: {
    ko: '닫기',
    en: 'Close',
    zh: '关闭',
    ja: '閉じる',
  },

  // Landing Page
  landingHero: {
    ko: '소금빵을 터뜨려\n무료 쿠폰을 받으세요!',
    en: 'Pop Salt Bread\nGet Free Coupons!',
    zh: '打破盐面包\n获取免费优惠券！',
    ja: '塩パンを弾いて\n無料クーポンをゲット！',
  },
  landingSubtitle: {
    ko: '맛있는 빵을 모아 1+1 쿠폰으로 교환하세요',
    en: 'Collect delicious bread and exchange for 1+1 coupons',
    zh: '收集美味面包，兑换1+1优惠券',
    ja: '美味しいパンを集めて1+1クーポンに交換',
  },
  startGame: {
    ko: '게임 시작하기',
    en: 'Start Game',
    zh: '开始游戏',
    ja: 'ゲームを始める',
  },
  followInstagram: {
    ko: '인스타그램 팔로우',
    en: 'Follow on Instagram',
    zh: '关注Instagram',
    ja: 'Instagramをフォロー',
  },

  // Login
  loginTitle: {
    ko: '솔트, 빵 💥',
    en: 'Salt Bread 💥',
    zh: '盐面包 💥',
    ja: '塩パン 💥',
  },
  loginSubtitle: {
    ko: '맛있는 빵을 모아 쿠폰을 받으세요!',
    en: 'Collect bread and get coupons!',
    zh: '收集面包获得优惠券！',
    ja: 'パンを集めてクーポンをゲット！',
  },
  loginWithGoogle: {
    ko: 'Google로 시작하기',
    en: 'Continue with Google',
    zh: '使用Google登录',
    ja: 'Googleで続ける',
  },
  loginWithKakao: {
    ko: '카카오로 시작하기',
    en: 'Continue with Kakao',
    zh: '使用Kakao登录',
    ja: 'Kakaoで続ける',
  },
  loggingIn: {
    ko: '로그인 중...',
    en: 'Logging in...',
    zh: '登录中...',
    ja: 'ログイン中...',
  },
  loginNotice: {
    ko: '로그인하면 게임 기록이 저장됩니다',
    en: 'Login to save your game progress',
    zh: '登录后可保存游戏进度',
    ja: 'ログインするとゲームの記録が保存されます',
  },

  // Game
  newGame: {
    ko: '새 게임',
    en: 'New Game',
    zh: '新游戏',
    ja: '新しいゲーム',
  },
  inviteFriend: {
    ko: '친구 초대',
    en: 'Invite Friend',
    zh: '邀请好友',
    ja: '友達を招待',
  },
  inviteBubble: {
    ko: '친구를 초대하면 1+1 쿠폰을 드려요!',
    en: 'Invite friends to get 1+1 coupons!',
    zh: '邀请好友即可获得1+1优惠券！',
    ja: '友達を招待すると1+1クーポンがもらえます！',
  },
  inviteTitle: {
    ko: '친구 초대하기',
    en: 'Invite Friends',
    zh: '邀请好友',
    ja: '友達を招待',
  },
  inviteDesc: {
    ko: '친구를 초대하면 나와 친구 모두\n플레인 1+1 쿠폰을 받아요!',
    en: 'When you invite a friend,\nboth of you get a Plain 1+1 coupon!',
    zh: '邀请好友后，\n您和好友都能获得原味1+1优惠券！',
    ja: '友達を招待すると、\nあなたも友達もプレーン1+1クーポンがもらえます！',
  },
  copy: {
    ko: '복사',
    en: 'Copy',
    zh: '复制',
    ja: 'コピー',
  },
  share: {
    ko: '공유하기',
    en: 'Share',
    zh: '分享',
    ja: '共有',
  },
  invitedFriends: {
    ko: '초대한 친구',
    en: 'Invited friends',
    zh: '已邀请的好友',
    ja: '招待した友達',
  },
  linkCopied: {
    ko: '링크가 복사되었습니다!',
    en: 'Link copied!',
    zh: '链接已复制！',
    ja: 'リンクがコピーされました！',
  },

  // Game Over
  gameOver: {
    ko: '게임 오버',
    en: 'Game Over',
    zh: '游戏结束',
    ja: 'ゲームオーバー',
  },
  finalScore: {
    ko: '최종 점수',
    en: 'Final Score',
    zh: '最终得分',
    ja: '最終スコア',
  },
  totalPoints: {
    ko: '총 포인트',
    en: 'Total Points',
    zh: '总积分',
    ja: '合計ポイント',
  },
  availableCoupons: {
    ko: '사용 가능 쿠폰',
    en: 'Available Coupons',
    zh: '可用优惠券',
    ja: '利用可能クーポン',
  },
  playAgain: {
    ko: '다시 하기',
    en: 'Play Again',
    zh: '再玩一次',
    ja: 'もう一度',
  },

  // Level Up
  levelUp: {
    ko: '레벨 업!',
    en: 'Level Up!',
    zh: '升级！',
    ja: 'レベルアップ！',
  },
  level: {
    ko: '레벨',
    en: 'Level',
    zh: '等级',
    ja: 'レベル',
  },

  // Coupon
  myCoupons: {
    ko: '내 쿠폰',
    en: 'My Coupons',
    zh: '我的优惠券',
    ja: 'マイクーポン',
  },
  menuPoints: {
    ko: '메뉴별 포인트',
    en: 'Points by Menu',
    zh: '各菜单积分',
    ja: 'メニュー別ポイント',
  },
  couponHistory: {
    ko: '쿠폰 내역',
    en: 'Coupon History',
    zh: '优惠券记录',
    ja: 'クーポン履歴',
  },
  noCoupons: {
    ko: '아직 쿠폰이 없어요. 게임을 플레이하세요!',
    en: 'No coupons yet. Play the game!',
    zh: '还没有优惠券，快去玩游戏吧！',
    ja: 'まだクーポンがありません。ゲームをプレイしてください！',
  },
  gameEarned: {
    ko: '게임 획득',
    en: 'Game earned',
    zh: '游戏获得',
    ja: 'ゲーム獲得',
  },
  referralReward: {
    ko: '초대 보상',
    en: 'Referral reward',
    zh: '邀请奖励',
    ja: '招待報酬',
  },
  expiryDate: {
    ko: '유효기간',
    en: 'Expires',
    zh: '有效期',
    ja: '有効期限',
  },
  used: {
    ko: '사용됨',
    en: 'Used',
    zh: '已使用',
    ja: '使用済み',
  },
  expired: {
    ko: '만료됨',
    en: 'Expired',
    zh: '已过期',
    ja: '期限切れ',
  },
  use: {
    ko: '사용하기',
    en: 'Use',
    zh: '使用',
    ja: '使う',
  },
  couponInfo1: {
    ko: '빵 1개 매치 = 1 포인트',
    en: '1 bread match = 1 point',
    zh: '匹配1个面包 = 1积分',
    ja: 'パン1個マッチ = 1ポイント',
  },
  couponInfo2: {
    ko: '각 빵의 가격만큼 포인트를 모으면 해당 빵의 무료 쿠폰 획득!',
    en: 'Collect points equal to the bread price to get a free coupon!',
    zh: '积累与面包价格相等的积分即可获得免费优惠券！',
    ja: 'パンの価格分のポイントを貯めると無料クーポン獲得！',
  },
  couponInfo3: {
    ko: '하루에 1개 사용 가능',
    en: '1 coupon per day',
    zh: '每天可使用1张',
    ja: '1日1枚使用可能',
  },
  couponInfo4: {
    ko: '빵 구매시 함께 사용 가능',
    en: 'Can be used with bread purchase',
    zh: '购买面包时可使用',
    ja: 'パン購入時に使用可能',
  },
  useCouponConfirm: {
    ko: '을 사용하시겠습니까?',
    en: 'Do you want to use this coupon?',
    zh: '确定要使用吗？',
    ja: 'を使用しますか？',
  },
  couponUsageNote: {
    ko: '하루 1개, 빵 구매시 함께 사용 가능',
    en: '1 per day, with bread purchase',
    zh: '每天1张，购买面包时使用',
    ja: '1日1枚、パン購入時に使用',
  },
  password: {
    ko: '비밀번호',
    en: 'Password',
    zh: '密码',
    ja: 'パスワード',
  },
  passwordPlaceholder: {
    ko: '4자리 비밀번호',
    en: '4-digit password',
    zh: '4位密码',
    ja: '4桁のパスワード',
  },
  wrongPassword: {
    ko: '비밀번호가 틀렸습니다',
    en: 'Wrong password',
    zh: '密码错误',
    ja: 'パスワードが違います',
  },
  alreadyUsedToday: {
    ko: '오늘 이미 쿠폰을 사용했습니다',
    en: 'Already used a coupon today',
    zh: '今天已经使用过优惠券了',
    ja: '今日はすでにクーポンを使用しました',
  },
  alreadyUsedNote: {
    ko: '쿠폰은 하루에 1개만 사용할 수 있어요.\n내일 다시 이용해주세요!',
    en: 'You can only use 1 coupon per day.\nPlease come back tomorrow!',
    zh: '每天只能使用1张优惠券。\n明天再来吧！',
    ja: 'クーポンは1日1枚のみ使用可能です。\n明日またご利用ください！',
  },
  couponEarned: {
    ko: '쿠폰 획득!',
    en: 'Coupon Earned!',
    zh: '获得优惠券！',
    ja: 'クーポン獲得！',
  },

  // Map
  findUs: {
    ko: '솔트빵 찾아오는 길',
    en: 'Find Us',
    zh: '如何找到我们',
    ja: 'アクセス',
  },
  storeName: {
    ko: '솔트빵',
    en: 'Salt Bread',
    zh: '盐面包',
    ja: '塩パン',
  },
  storeAddress: {
    ko: '서울 마포구 동교로 39길 10 1층',
    en: '10, Donggyo-ro 39-gil, Mapo-gu, Seoul',
    zh: '首尔麻浦区东桥路39街10号1楼',
    ja: 'ソウル麻浦区東橋路39キル10 1階',
  },
  storeHours: {
    ko: '영업시간: 11:00 - 21:00 (일요일 휴무)',
    en: 'Hours: 11:00 - 21:00 (Closed Sundays)',
    zh: '营业时间: 11:00 - 21:00 (周日休息)',
    ja: '営業時間: 11:00 - 21:00 (日曜定休)',
  },
  getDirections: {
    ko: '네이버 지도에서 길찾기',
    en: 'Get Directions',
    zh: '获取路线',
    ja: '道順を見る',
  },

  // Account
  deleteAccount: {
    ko: '회원 탈퇴',
    en: 'Delete Account',
    zh: '删除账户',
    ja: 'アカウント削除',
  },
  deleteWarning: {
    ko: '탈퇴 시 모든 쿠폰과 포인트가\n삭제되며 복구할 수 없습니다.\n정말 탈퇴하시겠습니까?',
    en: 'All coupons and points will be\npermanently deleted.\nAre you sure?',
    zh: '退出后所有优惠券和积分\n将被删除且无法恢复。\n确定要退出吗？',
    ja: '退会するとすべてのクーポンとポイントが\n削除され、復元できません。\n本当に退会しますか？',
  },
  deleteConfirm: {
    ko: '탈퇴하기',
    en: 'Delete',
    zh: '删除',
    ja: '退会する',
  },
  processing: {
    ko: '처리 중...',
    en: 'Processing...',
    zh: '处理中...',
    ja: '処理中...',
  },
  logout: {
    ko: '로그아웃',
    en: 'Logout',
    zh: '退出登录',
    ja: 'ログアウト',
  },
  logoutConfirm: {
    ko: '로그아웃 하시겠습니까?',
    en: 'Are you sure you want to logout?',
    zh: '确定要退出登录吗？',
    ja: 'ログアウトしますか？',
  },

  // Ranking
  friendRanking: {
    ko: '친구 랭킹',
    en: 'Friend Ranking',
    zh: '好友排行',
    ja: '友達ランキング',
  },
  noFriends: {
    ko: '아직 친구가 없어요!\n친구를 초대해서 함께 경쟁해보세요 🎉',
    en: 'No friends yet!\nInvite friends to compete together 🎉',
    zh: '还没有好友！\n邀请好友一起比赛吧 🎉',
    ja: 'まだ友達がいません！\n友達を招待して一緒に競争しましょう 🎉',
  },
  rankingInfo1: {
    ko: '나를 초대한 사람 + 내가 초대한 친구들과 경쟁해요!',
    en: 'Compete with your referrer and people you invited!',
    zh: '与邀请你的人和你邀请的好友竞争！',
    ja: '招待してくれた人と招待した友達と競争！',
  },
  rankingInfo2: {
    ko: '쿠폰 사용 개수가 많은 순서로 정렬됩니다.',
    en: 'Ranked by number of coupons used.',
    zh: '按使用优惠券数量排序。',
    ja: 'クーポン使用数順にランキング。',
  },
  rankingInfo3: {
    ko: '친구를 초대하면 랭킹에 추가돼요.',
    en: 'Invite friends to add them to the ranking.',
    zh: '邀请好友即可添加到排行榜。',
    ja: '友達を招待するとランキングに追加されます。',
  },
  issued: {
    ko: '발행',
    en: 'Issued',
    zh: '发行',
    ja: '発行',
  },
  me: {
    ko: '나',
    en: 'Me',
    zh: '我',
    ja: '自分',
  },

  // Points saving
  savingPoints: {
    ko: '포인트 정산 중...',
    en: 'Saving points...',
    zh: '积分结算中...',
    ja: 'ポイント精算中...',
  },
  pointsSaved: {
    ko: '포인트가 저장되었습니다!',
    en: 'Points saved!',
    zh: '积分已保存！',
    ja: 'ポイントが保存されました！',
  },

  // Bread names
  breadPlain: {
    ko: '플레인',
    en: 'Plain',
    zh: '原味',
    ja: 'プレーン',
  },
  breadCream: {
    ko: '크림',
    en: 'Cream',
    zh: '奶油',
    ja: 'クリーム',
  },
  breadChoco: {
    ko: '초코',
    en: 'Chocolate',
    zh: '巧克力',
    ja: 'チョコ',
  },
  breadGarlic: {
    ko: '갈릭',
    en: 'Garlic',
    zh: '蒜香',
    ja: 'ガーリック',
  },
  coupon: {
    ko: '쿠폰',
    en: 'Coupon',
    zh: '优惠券',
    ja: 'クーポン',
  },

  // Landing Page - Game CTA
  puzzleTitle: {
    ko: '솔트, 빵 💥 퍼즐',
    en: 'Salt Bread 💥 Puzzle',
    zh: '盐面包 💥 拼图',
    ja: '塩パン 💥 パズル',
  },
  ctaDesc: {
    ko: '게임을 플레이하고 솔트빵 무료 쿠폰을 받아보세요!',
    en: 'Play the game and get free Salt Bread coupons!',
    zh: '玩游戏获取免费盐面包优惠券！',
    ja: 'ゲームをプレイして無料塩パンクーポンをゲット！',
  },
  howToPlay1: {
    ko: '같은 빵 3개를 맞추면 빵이 터져요!',
    en: 'Match 3 of the same bread to pop them!',
    zh: '匹配3个相同的面包就会爆破！',
    ja: '同じパン3つを揃えると弾けます！',
  },
  howToPlay2: {
    ko: '빵을 터뜨리면 무료 쿠폰을 드려요!',
    en: 'Pop bread to earn free coupons!',
    zh: '打破面包即可获得免费优惠券！',
    ja: 'パンを弾くと無料クーポンがもらえます！',
  },
  howToPlay3: {
    ko: '4개 이상 맞추면 특수 아이템 등장!',
    en: 'Match 4+ for special items!',
    zh: '匹配4个以上出现特殊道具！',
    ja: '4つ以上揃えると特別アイテムが登場！',
  },
  specialItemsGuide: {
    ko: '특수 아이템 가이드',
    en: 'Special Items Guide',
    zh: '特殊道具指南',
    ja: '特別アイテムガイド',
  },
  matchaCube: {
    ko: '말차 큐브',
    en: 'Matcha Cube',
    zh: '抹茶方块',
    ja: '抹茶キューブ',
  },
  matchaCubeRule: {
    ko: '4개 매치 시 생성',
    en: 'Created on 4 match',
    zh: '4个匹配时生成',
    ja: '4つマッチで生成',
  },
  matchaCubeEffect: {
    ko: '십자(+) 모양으로 폭발!',
    en: 'Cross (+) explosion!',
    zh: '十字形爆炸！',
    ja: '十字形に爆発！',
  },
  chocoCream: {
    ko: '초코 크림',
    en: 'Choco Cream',
    zh: '巧克力奶油',
    ja: 'チョコクリーム',
  },
  chocoCreamRule: {
    ko: '5개 매치 시 생성',
    en: 'Created on 5 match',
    zh: '5个匹配时生成',
    ja: '5つマッチで生成',
  },
  chocoCreamEffect: {
    ko: '3x3 범위 폭발!',
    en: '3x3 area explosion!',
    zh: '3x3范围爆炸！',
    ja: '3x3範囲爆発！',
  },
  milkTea: {
    ko: '밀크티',
    en: 'Milk Tea',
    zh: '奶茶',
    ja: 'ミルクティー',
  },
  milkTeaRule: {
    ko: '6개+ 매치 시 생성',
    en: 'Created on 6+ match',
    zh: '6个以上匹配时生成',
    ja: '6つ以上マッチで生成',
  },
  milkTeaEffect: {
    ko: '5x5 대폭발!',
    en: '5x5 mega explosion!',
    zh: '5x5大爆炸！',
    ja: '5x5大爆発！',
  },
  menu: {
    ko: '메뉴',
    en: 'Menu',
    zh: '菜单',
    ja: 'メニュー',
  },
  allRightsReserved: {
    ko: '. All rights reserved.',
    en: '. All rights reserved.',
    zh: '. 版权所有。',
    ja: '. All rights reserved.',
  },
  anonymous: {
    ko: '익명',
    en: 'Anonymous',
    zh: '匿名',
    ja: '匿名',
  },
} as const;

export type TranslationKey = keyof typeof translations;

// Get browser language
function getBrowserLanguage(): Language {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('ja')) return 'ja';
  return 'en';
}

// Get saved language or browser default
export function getDefaultLanguage(): Language {
  const saved = localStorage.getItem('saltify_language') as Language | null;
  if (saved && ['ko', 'en', 'zh', 'ja'].includes(saved)) {
    return saved;
  }
  return getBrowserLanguage();
}

// Save language preference
export function saveLanguage(lang: Language): void {
  localStorage.setItem('saltify_language', lang);
}

// Translation function
export function t(key: TranslationKey, lang: Language): string {
  return translations[key][lang];
}
