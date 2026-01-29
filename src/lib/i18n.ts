export type Language = 'ko' | 'en' | 'zh-CN' | 'zh-TW' | 'ja';

export const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

export const translations = {
  // Common
  loading: {
    ko: '로딩 중...',
    en: 'Loading...',
    'zh-CN': '加载中...',
    'zh-TW': '載入中...',
    ja: '読み込み中...',
  },
  confirm: {
    ko: '확인',
    en: 'OK',
    'zh-CN': '确认',
    'zh-TW': '確認',
    ja: '確認',
  },
  cancel: {
    ko: '취소',
    en: 'Cancel',
    'zh-CN': '取消',
    'zh-TW': '取消',
    ja: 'キャンセル',
  },
  close: {
    ko: '닫기',
    en: 'Close',
    'zh-CN': '关闭',
    'zh-TW': '關閉',
    ja: '閉じる',
  },

  // Landing Page
  landingHero: {
    ko: '소금빵을 터뜨려\n무료 쿠폰을 받으세요!',
    en: 'Pop Salt Bread\nGet Free Coupons!',
    'zh-CN': '打破盐面包\n获取免费优惠券！',
    'zh-TW': '打破鹽麵包\n獲取免費優惠券！',
    ja: '塩パンを弾いて\n無料クーポンをゲット！',
  },
  landingSubtitle: {
    ko: '맛있는 빵을 모아 무료 쿠폰으로 교환하세요',
    en: 'Collect delicious bread and exchange for free coupons',
    'zh-CN': '收集美味面包，兑换免费优惠券',
    'zh-TW': '收集美味麵包，兌換免費優惠券',
    ja: '美味しいパンを集めて無料クーポンに交換',
  },
  startGame: {
    ko: '게임 시작하기',
    en: 'Start Game',
    'zh-CN': '开始游戏',
    'zh-TW': '開始遊戲',
    ja: 'ゲームを始める',
  },
  followInstagram: {
    ko: '인스타그램 팔로우',
    en: 'Follow on Instagram',
    'zh-CN': '关注Instagram',
    'zh-TW': '關注Instagram',
    ja: 'Instagramをフォロー',
  },

  // Login
  loginTitle: {
    ko: '솔트, 빵 💥',
    en: 'Salt Bread 💥',
    'zh-CN': '盐面包 💥',
    'zh-TW': '鹽麵包 💥',
    ja: '塩パン 💥',
  },
  loginSubtitle: {
    ko: '맛있는 빵을 모아 쿠폰을 받으세요!',
    en: 'Collect bread and get coupons!',
    'zh-CN': '收集面包获得优惠券！',
    'zh-TW': '收集麵包獲得優惠券！',
    ja: 'パンを集めてクーポンをゲット！',
  },
  loginWithGoogle: {
    ko: 'Google로 시작하기',
    en: 'Continue with Google',
    'zh-CN': '使用Google登录',
    'zh-TW': '使用Google登錄',
    ja: 'Googleで続ける',
  },
  loginWithKakao: {
    ko: '카카오로 시작하기',
    en: 'Continue with Kakao',
    'zh-CN': '使用Kakao登录',
    'zh-TW': '使用Kakao登錄',
    ja: 'Kakaoで続ける',
  },
  loggingIn: {
    ko: '로그인 중...',
    en: 'Logging in...',
    'zh-CN': '登录中...',
    'zh-TW': '登錄中...',
    ja: 'ログイン中...',
  },
  loginNotice: {
    ko: '로그인하면 게임 기록이 저장됩니다',
    en: 'Login to save your game progress',
    'zh-CN': '登录后可保存游戏进度',
    'zh-TW': '登錄後可保存遊戲進度',
    ja: 'ログインするとゲームの記録が保存されます',
  },

  // Game
  remainingMoves: {
    ko: '남은 이동',
    en: 'Moves',
    'zh-CN': '剩余步数',
    'zh-TW': '剩餘步數',
    ja: '残り移動',
  },
  copied: {
    ko: '복사됨!',
    en: 'Copied!',
    'zh-CN': '已复制！',
    'zh-TW': '已複製！',
    ja: 'コピー済！',
  },
  couponUsedMessage: {
    ko: '쿠폰이 사용되었습니다!',
    en: 'Coupon has been used!',
    'zh-CN': '优惠券已使用！',
    'zh-TW': '優惠券已使用！',
    ja: 'クーポンが使用されました！',
  },
  people: {
    ko: '명',
    en: '',
    'zh-CN': '人',
    'zh-TW': '人',
    ja: '人',
  },
  newGame: {
    ko: '새 게임',
    en: 'New Game',
    'zh-CN': '新游戏',
    'zh-TW': '新遊戲',
    ja: '新しいゲーム',
  },
  inviteFriend: {
    ko: '친구 초대',
    en: 'Invite Friend',
    'zh-CN': '邀请好友',
    'zh-TW': '邀請好友',
    ja: '友達を招待',
  },
  inviteBubble: {
    ko: '친구를 초대하면 무료 쿠폰을 드려요!',
    en: 'Invite friends to get free coupons!',
    'zh-CN': '邀请好友即可获得免费优惠券！',
    'zh-TW': '邀請好友即可獲得免費優惠券！',
    ja: '友達を招待すると無料クーポンがもらえます！',
  },
  inviteTitle: {
    ko: '친구 초대하기',
    en: 'Invite Friends',
    'zh-CN': '邀请好友',
    'zh-TW': '邀請好友',
    ja: '友達を招待',
  },
  inviteDesc: {
    ko: '친구를 초대하면 나와 친구 모두\n플레인 무료 쿠폰을 받아요!',
    en: 'When you invite a friend,\nboth of you get a free Plain coupon!',
    'zh-CN': '邀请好友后，\n您和好友都能获得原味免费优惠券！',
    'zh-TW': '邀請好友後，\n您和好友都能獲得原味免費優惠券！',
    ja: '友達を招待すると、\nあなたも友達もプレーン無料クーポンがもらえます！',
  },
  copy: {
    ko: '복사',
    en: 'Copy',
    'zh-CN': '复制',
    'zh-TW': '複製',
    ja: 'コピー',
  },
  share: {
    ko: '공유하기',
    en: 'Share',
    'zh-CN': '分享',
    'zh-TW': '分享',
    ja: '共有',
  },
  invitedFriends: {
    ko: '초대한 친구',
    en: 'Invited friends',
    'zh-CN': '已邀请的好友',
    'zh-TW': '已邀請的好友',
    ja: '招待した友達',
  },
  linkCopied: {
    ko: '링크가 복사되었습니다!',
    en: 'Link copied!',
    'zh-CN': '链接已复制！',
    'zh-TW': '連結已複製！',
    ja: 'リンクがコピーされました！',
  },

  // Game Over
  gameOver: {
    ko: '게임 오버',
    en: 'Game Over',
    'zh-CN': '游戏结束',
    'zh-TW': '遊戲結束',
    ja: 'ゲームオーバー',
  },
  finalScore: {
    ko: '최종 점수',
    en: 'Final Score',
    'zh-CN': '最终得分',
    'zh-TW': '最終得分',
    ja: '最終スコア',
  },
  totalPoints: {
    ko: '총 포인트',
    en: 'Total Points',
    'zh-CN': '总积分',
    'zh-TW': '總積分',
    ja: '合計ポイント',
  },
  availableCoupons: {
    ko: '사용 가능 쿠폰',
    en: 'Available Coupons',
    'zh-CN': '可用优惠券',
    'zh-TW': '可用優惠券',
    ja: '利用可能クーポン',
  },
  playAgain: {
    ko: '다시 하기',
    en: 'Play Again',
    'zh-CN': '再玩一次',
    'zh-TW': '再玩一次',
    ja: 'もう一度',
  },

  // Level Up
  levelUp: {
    ko: '레벨 업!',
    en: 'Level Up!',
    'zh-CN': '升级！',
    'zh-TW': '升級！',
    ja: 'レベルアップ！',
  },
  level: {
    ko: '레벨',
    en: 'Level',
    'zh-CN': '等级',
    'zh-TW': '等級',
    ja: 'レベル',
  },

  // Coupon
  myCoupons: {
    ko: '내 쿠폰',
    en: 'My Coupons',
    'zh-CN': '我的优惠券',
    'zh-TW': '我的優惠券',
    ja: 'マイクーポン',
  },
  menuPoints: {
    ko: '메뉴별 포인트',
    en: 'Points by Menu',
    'zh-CN': '各菜单积分',
    'zh-TW': '各菜單積分',
    ja: 'メニュー別ポイント',
  },
  couponHistory: {
    ko: '쿠폰 내역',
    en: 'Coupon History',
    'zh-CN': '优惠券记录',
    'zh-TW': '優惠券記錄',
    ja: 'クーポン履歴',
  },
  noCoupons: {
    ko: '아직 쿠폰이 없어요. 게임을 플레이하세요!',
    en: 'No coupons yet. Play the game!',
    'zh-CN': '还没有优惠券，快去玩游戏吧！',
    'zh-TW': '還沒有優惠券，快去玩遊戲吧！',
    ja: 'まだクーポンがありません。ゲームをプレイしてください！',
  },
  gameEarned: {
    ko: '게임 획득',
    en: 'Game earned',
    'zh-CN': '游戏获得',
    'zh-TW': '遊戲獲得',
    ja: 'ゲーム獲得',
  },
  referralReward: {
    ko: '초대 보상',
    en: 'Referral reward',
    'zh-CN': '邀请奖励',
    'zh-TW': '邀請獎勵',
    ja: '招待報酬',
  },
  expiryDate: {
    ko: '유효기간',
    en: 'Expires',
    'zh-CN': '有效期',
    'zh-TW': '有效期',
    ja: '有効期限',
  },
  used: {
    ko: '사용됨',
    en: 'Used',
    'zh-CN': '已使用',
    'zh-TW': '已使用',
    ja: '使用済み',
  },
  expired: {
    ko: '만료됨',
    en: 'Expired',
    'zh-CN': '已过期',
    'zh-TW': '已過期',
    ja: '期限切れ',
  },
  use: {
    ko: '사용하기',
    en: 'Use',
    'zh-CN': '使用',
    'zh-TW': '使用',
    ja: '使う',
  },
  couponInfo1: {
    ko: '빵 1개 매치 = 1 포인트',
    en: '1 bread match = 1 point',
    'zh-CN': '匹配1个面包 = 1积分',
    'zh-TW': '配對1個麵包 = 1積分',
    ja: 'パン1個マッチ = 1ポイント',
  },
  couponInfo2: {
    ko: '각 빵의 가격만큼 포인트를 모으면 해당 빵의 무료 쿠폰 획득!',
    en: 'Collect points equal to the bread price to get a free coupon!',
    'zh-CN': '积累与面包价格相等的积分即可获得免费优惠券！',
    'zh-TW': '累積與麵包價格相等的積分即可獲得免費優惠券！',
    ja: 'パンの価格分のポイントを貯めると無料クーポン獲得！',
  },
  couponInfo3: {
    ko: '하루에 1개 사용 가능',
    en: '1 coupon per day',
    'zh-CN': '每天可使用1张',
    'zh-TW': '每天可使用1張',
    ja: '1日1枚使用可能',
  },
  couponInfo4: {
    ko: '빵 구매시 함께 사용 가능',
    en: 'Can be used with bread purchase',
    'zh-CN': '购买面包时可使用',
    'zh-TW': '購買麵包時可使用',
    ja: 'パン購入時に使用可能',
  },
  useCouponConfirm: {
    ko: '을 사용하시겠습니까?',
    en: 'Do you want to use this coupon?',
    'zh-CN': '确定要使用吗？',
    'zh-TW': '確定要使用嗎？',
    ja: 'を使用しますか？',
  },
  couponUsageNote: {
    ko: '하루 1개, 빵 구매시 함께 사용 가능',
    en: '1 per day, with bread purchase',
    'zh-CN': '每天1张，购买面包时使用',
    'zh-TW': '每天1張，購買麵包時使用',
    ja: '1日1枚、パン購入時に使用',
  },
  password: {
    ko: '비밀번호',
    en: 'Password',
    'zh-CN': '密码',
    'zh-TW': '密碼',
    ja: 'パスワード',
  },
  passwordPlaceholder: {
    ko: '4자리 비밀번호',
    en: '4-digit password',
    'zh-CN': '4位密码',
    'zh-TW': '4位密碼',
    ja: '4桁のパスワード',
  },
  wrongPassword: {
    ko: '비밀번호가 틀렸습니다',
    en: 'Wrong password',
    'zh-CN': '密码错误',
    'zh-TW': '密碼錯誤',
    ja: 'パスワードが違います',
  },
  alreadyUsedToday: {
    ko: '오늘 이미 쿠폰을 사용했습니다',
    en: 'Already used a coupon today',
    'zh-CN': '今天已经使用过优惠券了',
    'zh-TW': '今天已經使用過優惠券了',
    ja: '今日はすでにクーポンを使用しました',
  },
  alreadyUsedNote: {
    ko: '쿠폰은 하루에 1개만 사용할 수 있어요.\n내일 다시 이용해주세요!',
    en: 'You can only use 1 coupon per day.\nPlease come back tomorrow!',
    'zh-CN': '每天只能使用1张优惠券。\n明天再来吧！',
    'zh-TW': '每天只能使用1張優惠券。\n明天再來吧！',
    ja: 'クーポンは1日1枚のみ使用可能です。\n明日またご利用ください！',
  },
  couponEarned: {
    ko: '쿠폰 획득!',
    en: 'Coupon Earned!',
    'zh-CN': '获得优惠券！',
    'zh-TW': '獲得優惠券！',
    ja: 'クーポン獲得！',
  },

  // Map
  findUs: {
    ko: '솔트빵 찾아오는 길',
    en: 'Find Us',
    'zh-CN': '如何找到我们',
    'zh-TW': '如何找到我們',
    ja: 'アクセス',
  },
  storeName: {
    ko: '솔트빵',
    en: 'Salt, 0',
    'zh-CN': '盐面包',
    'zh-TW': '鹽麵包',
    ja: '塩パン',
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

  // Account
  deleteAccount: {
    ko: '회원 탈퇴',
    en: 'Delete Account',
    'zh-CN': '删除账户',
    'zh-TW': '刪除帳戶',
    ja: 'アカウント削除',
  },
  deleteWarning: {
    ko: '탈퇴 시 모든 쿠폰과 포인트가\n삭제되며 복구할 수 없습니다.\n정말 탈퇴하시겠습니까?',
    en: 'All coupons and points will be\npermanently deleted.\nAre you sure?',
    'zh-CN': '退出后所有优惠券和积分\n将被删除且无法恢复。\n确定要退出吗？',
    'zh-TW': '退出後所有優惠券和積分\n將被刪除且無法恢復。\n確定要退出嗎？',
    ja: '退会するとすべてのクーポンとポイントが\n削除され、復元できません。\n本当に退会しますか？',
  },
  deleteConfirm: {
    ko: '탈퇴하기',
    en: 'Delete',
    'zh-CN': '删除',
    'zh-TW': '刪除',
    ja: '退会する',
  },
  processing: {
    ko: '처리 중...',
    en: 'Processing...',
    'zh-CN': '处理中...',
    'zh-TW': '處理中...',
    ja: '処理中...',
  },
  logout: {
    ko: '로그아웃',
    en: 'Logout',
    'zh-CN': '退出登录',
    'zh-TW': '登出',
    ja: 'ログアウト',
  },
  logoutConfirm: {
    ko: '로그아웃 하시겠습니까?',
    en: 'Are you sure you want to logout?',
    'zh-CN': '确定要退出登录吗？',
    'zh-TW': '確定要登出嗎？',
    ja: 'ログアウトしますか？',
  },

  // Ranking
  friendRanking: {
    ko: '친구 랭킹',
    en: 'Friend Ranking',
    'zh-CN': '好友排行',
    'zh-TW': '好友排行',
    ja: '友達ランキング',
  },
  noFriends: {
    ko: '아직 친구가 없어요!\n친구를 초대해서 함께 경쟁해보세요 🎉',
    en: 'No friends yet!\nInvite friends to compete together 🎉',
    'zh-CN': '还没有好友！\n邀请好友一起比赛吧 🎉',
    'zh-TW': '還沒有好友！\n邀請好友一起比賽吧 🎉',
    ja: 'まだ友達がいません！\n友達を招待して一緒に競争しましょう 🎉',
  },
  rankingInfo1: {
    ko: '나를 초대한 사람 + 내가 초대한 친구들과 경쟁해요!',
    en: 'Compete with your referrer and people you invited!',
    'zh-CN': '与邀请你的人和你邀请的好友竞争！',
    'zh-TW': '與邀請你的人和你邀請的好友競爭！',
    ja: '招待してくれた人と招待した友達と競争！',
  },
  rankingInfo2: {
    ko: '쿠폰 사용 개수가 많은 순서로 정렬됩니다.',
    en: 'Ranked by number of coupons used.',
    'zh-CN': '按使用优惠券数量排序。',
    'zh-TW': '按使用優惠券數量排序。',
    ja: 'クーポン使用数順にランキング。',
  },
  rankingInfo3: {
    ko: '친구를 초대하면 랭킹에 추가돼요.',
    en: 'Invite friends to add them to the ranking.',
    'zh-CN': '邀请好友即可添加到排行榜。',
    'zh-TW': '邀請好友即可添加到排行榜。',
    ja: '友達を招待するとランキングに追加されます。',
  },
  issued: {
    ko: '발행',
    en: 'Issued',
    'zh-CN': '发行',
    'zh-TW': '發行',
    ja: '発行',
  },
  me: {
    ko: '나',
    en: 'Me',
    'zh-CN': '我',
    'zh-TW': '我',
    ja: '自分',
  },

  // Points saving
  savingPoints: {
    ko: '포인트 정산 중...',
    en: 'Saving points...',
    'zh-CN': '积分结算中...',
    'zh-TW': '積分結算中...',
    ja: 'ポイント精算中...',
  },
  pointsSaved: {
    ko: '포인트가 저장되었습니다!',
    en: 'Points saved!',
    'zh-CN': '积分已保存！',
    'zh-TW': '積分已保存！',
    ja: 'ポイントが保存されました！',
  },

  // Bread names
  breadPlain: {
    ko: '플레인',
    en: 'Plain',
    'zh-CN': '原味',
    'zh-TW': '原味',
    ja: 'プレーン',
  },
  breadCream: {
    ko: '크림',
    en: 'Cream',
    'zh-CN': '奶油',
    'zh-TW': '奶油',
    ja: 'クリーム',
  },
  breadChoco: {
    ko: '초코',
    en: 'Chocolate',
    'zh-CN': '巧克力',
    'zh-TW': '巧克力',
    ja: 'チョコ',
  },
  breadGarlic: {
    ko: '갈릭',
    en: 'Garlic',
    'zh-CN': '蒜香',
    'zh-TW': '蒜香',
    ja: 'ガーリック',
  },
  coupon: {
    ko: '쿠폰',
    en: 'Coupon',
    'zh-CN': '优惠券',
    'zh-TW': '優惠券',
    ja: 'クーポン',
  },

  // Landing Page - Game CTA
  puzzleTitle: {
    ko: '솔트, 빵 💥 퍼즐',
    en: 'Salt Bread 💥 Puzzle',
    'zh-CN': '盐面包 💥 拼图',
    'zh-TW': '鹽麵包 💥 拼圖',
    ja: '塩パン 💥 パズル',
  },
  ctaDesc: {
    ko: '게임을 플레이하고 솔트빵 무료 쿠폰을 받아보세요!',
    en: 'Play the game and get free Salt Bread coupons!',
    'zh-CN': '玩游戏获取免费盐面包优惠券！',
    'zh-TW': '玩遊戲獲取免費鹽麵包優惠券！',
    ja: 'ゲームをプレイして無料塩パンクーポンをゲット！',
  },
  howToPlay1: {
    ko: '같은 빵 3개를 맞추면 빵이 터져요!',
    en: 'Match 3 of the same bread to pop them!',
    'zh-CN': '匹配3个相同的面包就会爆破！',
    'zh-TW': '配對3個相同的麵包就會爆破！',
    ja: '同じパン3つを揃えると弾けます！',
  },
  howToPlay2: {
    ko: '빵을 터뜨리면 무료 쿠폰을 드려요!',
    en: 'Pop bread to earn free coupons!',
    'zh-CN': '打破面包即可获得免费优惠券！',
    'zh-TW': '打破麵包即可獲得免費優惠券！',
    ja: 'パンを弾くと無料クーポンがもらえます！',
  },
  howToPlay3: {
    ko: '4개 이상 맞추면 특수 아이템 등장!',
    en: 'Match 4+ for special items!',
    'zh-CN': '匹配4个以上出现特殊道具！',
    'zh-TW': '配對4個以上出現特殊道具！',
    ja: '4つ以上揃えると特別アイテムが登場！',
  },
  specialItemsGuide: {
    ko: '특수 아이템 가이드',
    en: 'Special Items Guide',
    'zh-CN': '特殊道具指南',
    'zh-TW': '特殊道具指南',
    ja: '特別アイテムガイド',
  },
  matchaCube: {
    ko: '말차 큐브',
    en: 'Matcha Cube',
    'zh-CN': '抹茶方块',
    'zh-TW': '抹茶方塊',
    ja: '抹茶キューブ',
  },
  matchaCubeRule: {
    ko: '4개 매치 시 생성',
    en: 'Created on 4 match',
    'zh-CN': '4个匹配时生成',
    'zh-TW': '4個配對時生成',
    ja: '4つマッチで生成',
  },
  matchaCubeEffect: {
    ko: '십자(+) 모양으로 폭발!',
    en: 'Cross (+) explosion!',
    'zh-CN': '十字形爆炸！',
    'zh-TW': '十字形爆炸！',
    ja: '十字形に爆発！',
  },
  chocoCream: {
    ko: '초코 크림',
    en: 'Choco Cream',
    'zh-CN': '巧克力奶油',
    'zh-TW': '巧克力奶油',
    ja: 'チョコクリーム',
  },
  chocoCreamRule: {
    ko: '5개 매치 시 생성',
    en: 'Created on 5 match',
    'zh-CN': '5个匹配时生成',
    'zh-TW': '5個配對時生成',
    ja: '5つマッチで生成',
  },
  chocoCreamEffect: {
    ko: '3x3 범위 폭발!',
    en: '3x3 area explosion!',
    'zh-CN': '3x3范围爆炸！',
    'zh-TW': '3x3範圍爆炸！',
    ja: '3x3範囲爆発！',
  },
  milkTea: {
    ko: '밀크티',
    en: 'Milk Tea',
    'zh-CN': '奶茶',
    'zh-TW': '奶茶',
    ja: 'ミルクティー',
  },
  milkTeaRule: {
    ko: '6개+ 매치 시 생성',
    en: 'Created on 6+ match',
    'zh-CN': '6个以上匹配时生成',
    'zh-TW': '6個以上配對時生成',
    ja: '6つ以上マッチで生成',
  },
  milkTeaEffect: {
    ko: '5x5 대폭발!',
    en: '5x5 mega explosion!',
    'zh-CN': '5x5大爆炸！',
    'zh-TW': '5x5大爆炸！',
    ja: '5x5大爆発！',
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

  // Bread names & descriptions (for Landing Page)
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

  // Landing-only breads
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
  allRightsReserved: {
    ko: '. All rights reserved.',
    en: '. All rights reserved.',
    'zh-CN': '. 版权所有。',
    'zh-TW': '. 版權所有。',
    ja: '. All rights reserved.',
  },
  anonymous: {
    ko: '익명',
    en: 'Anonymous',
    'zh-CN': '匿名',
    'zh-TW': '匿名',
    ja: '匿名',
  },

  // ScoreView
  moves: {
    ko: '이동',
    en: 'Moves',
    'zh-CN': '步数',
    'zh-TW': '步數',
    ja: '移動',
  },
  levelSystem: {
    ko: '레벨 시스템',
    en: 'Level System',
    'zh-CN': '等级系统',
    'zh-TW': '等級系統',
    ja: 'レベルシステム',
  },
  levelSystemDesc: {
    ko: '목표 점수를 달성하면 다음 레벨로 올라가요!',
    en: 'Reach the target score to advance to the next level!',
    'zh-CN': '达到目标分数即可升至下一等级！',
    'zh-TW': '達到目標分數即可升至下一等級！',
    ja: '目標スコアを達成すると次のレベルへ！',
  },
  scoreDesc: {
    ko: '빵을 3개 이상 맞추면 점수를 얻어요. 콤보를 이어가면 더 많은 점수를 획득할 수 있어요!',
    en: 'Match 3+ bread to earn points. Chain combos for even more points!',
    'zh-CN': '匹配3个以上面包可获得分数。连续匹配可获得更多分数！',
    'zh-TW': '配對3個以上麵包可獲得分數。連續配對可獲得更多分數！',
    ja: 'パンを3つ以上マッチするとスコア獲得。コンボでさらに多くのスコアを！',
  },
  levelScaleInfo: {
    ko: '레벨이 올라갈수록 목표 점수가 높아져요',
    en: 'Target score increases with each level',
    'zh-CN': '等级越高目标分数越高',
    'zh-TW': '等級越高目標分數越高',
    ja: 'レベルが上がるほど目標スコアが高くなります',
  },

  // LevelUpView
  levelClear: {
    ko: '레벨 클리어!',
    en: 'Level Clear!',
    'zh-CN': '等级通关！',
    'zh-TW': '等級通關！',
    ja: 'レベルクリア！',
  },
  finalScoreLabel: {
    ko: '최종 점수:',
    en: 'Final Score:',
    'zh-CN': '最终得分：',
    'zh-TW': '最終得分：',
    ja: '最終スコア：',
  },
  nextLevelStart: {
    ko: '시작!',
    en: 'Start!',
    'zh-CN': '开始！',
    'zh-TW': '開始！',
    ja: 'スタート！',
  },

  // CouponCelebration
  onePlusOneCoupon: {
    ko: '무료 쿠폰',
    en: 'Free Coupon',
    'zh-CN': '免费优惠券',
    'zh-TW': '免費優惠券',
    ja: '無料クーポン',
  },
  congratsCoupon: {
    ko: '무료 쿠폰을 획득했어요!',
    en: 'You earned a free coupon!',
    'zh-CN': '获得了免费优惠券！',
    'zh-TW': '獲得了免費優惠券！',
    ja: '無料クーポンを獲得しました！',
  },
  referralCouponMessage: {
    ko: '초대 보상으로 플레인 무료 쿠폰을 받았어요!',
    en: 'You received a free Plain coupon as a referral reward!',
    'zh-CN': '您获得了邀请奖励：原味免费优惠券！',
    'zh-TW': '您獲得了邀請獎勵：原味免費優惠券！',
    ja: '招待報酬としてプレーン無料クーポンをもらいました！',
  },

  // Share
  shareTitle: {
    ko: '솔트, 빵 💥',
    en: 'Salt Bread 💥',
    'zh-CN': '盐面包 💥',
    'zh-TW': '鹽麵包 💥',
    ja: '塩パン 💥',
  },
  shareText: {
    ko: '솔트, 빵 💥 게임에 초대합니다! 가입하면 플레인 무료 쿠폰을 받을 수 있어요!',
    en: 'Join Salt Bread 💥 game! Sign up and get a free Plain coupon!',
    'zh-CN': '邀请你玩盐面包💥游戏！注册即可获得原味免费优惠券！',
    'zh-TW': '邀請你玩鹽麵包💥遊戲！註冊即可獲得原味免費優惠券！',
    ja: '塩パン💥ゲームに招待します！登録するとプレーン無料クーポンがもらえます！',
  },

  // Error messages
  errorOccurred: {
    ko: '오류가 발생했습니다.',
    en: 'An error occurred.',
    'zh-CN': '发生了错误。',
    'zh-TW': '發生了錯誤。',
    ja: 'エラーが発生しました。',
  },
  loginFailed: {
    ko: '로그인 실패',
    en: 'Login failed',
    'zh-CN': '登录失败',
    'zh-TW': '登錄失敗',
    ja: 'ログイン失敗',
  },
  kakaoLoginFailed: {
    ko: '카카오 로그인 실패',
    en: 'Kakao login failed',
    'zh-CN': 'Kakao登录失败',
    'zh-TW': 'Kakao登錄失敗',
    ja: 'Kakaoログイン失敗',
  },
  logoutFailed: {
    ko: '로그아웃 실패',
    en: 'Logout failed',
    'zh-CN': '退出登录失败',
    'zh-TW': '登出失敗',
    ja: 'ログアウト失敗',
  },
  loginRequired: {
    ko: '로그인이 필요합니다.',
    en: 'Login required.',
    'zh-CN': '需要登录。',
    'zh-TW': '需要登錄。',
    ja: 'ログインが必要です。',
  },
  deleteAccountFailed: {
    ko: '회원 탈퇴 실패',
    en: 'Account deletion failed',
    'zh-CN': '账户删除失败',
    'zh-TW': '帳戶刪除失敗',
    ja: 'アカウント削除失敗',
  },

  // Referral messages
  selfInviteError: {
    ko: '자기 자신을 초대할 수 없습니다.',
    en: 'You cannot invite yourself.',
    'zh-CN': '不能邀请自己。',
    'zh-TW': '不能邀請自己。',
    ja: '自分自身を招待することはできません。',
  },
  alreadyReferred: {
    ko: '이미 다른 사용자에 의해 초대되었습니다.',
    en: 'Already invited by another user.',
    'zh-CN': '已被其他用户邀请。',
    'zh-TW': '已被其他用戶邀請。',
    ja: 'すでに他のユーザーに招待されています。',
  },
  invalidReferralCode: {
    ko: '유효하지 않은 초대 코드입니다.',
    en: 'Invalid referral code.',
    'zh-CN': '无效的邀请码。',
    'zh-TW': '無效的邀請碼。',
    ja: '無効な招待コードです。',
  },
  referralComplete: {
    ko: '초대가 완료되었습니다!',
    en: 'Referral completed!',
    'zh-CN': '邀请完成！',
    'zh-TW': '邀請完成！',
    ja: '招待が完了しました！',
  },
  referralProcessError: {
    ko: '초대 처리 중 오류가 발생했습니다.',
    en: 'An error occurred while processing the referral.',
    'zh-CN': '处理邀请时发生错误。',
    'zh-TW': '處理邀請時發生錯誤。',
    ja: '招待処理中にエラーが発生しました。',
  },

  // Admin/Service fallbacks
  unspecified: {
    ko: '미지정',
    en: 'Unspecified',
    'zh-CN': '未指定',
    'zh-TW': '未指定',
    ja: '未指定',
  },
  unknownBranch: {
    ko: '알 수 없음',
    en: 'Unknown',
    'zh-CN': '未知',
    'zh-TW': '未知',
    ja: '不明',
  },
  // ComboView
  combo: {
    ko: '콤보!',
    en: 'COMBO!',
    'zh-CN': '连击！',
    'zh-TW': '連擊！',
    ja: 'コンボ！',
  },
} as const;

export type TranslationKey = keyof typeof translations;

// Get browser language
function getBrowserLanguage(): Language {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang === 'zh-tw' || browserLang === 'zh-hant' || browserLang.startsWith('zh-hant')) return 'zh-TW';
  if (browserLang.startsWith('zh')) return 'zh-CN';
  if (browserLang.startsWith('ja')) return 'ja';
  return 'en';
}

// Get saved language or browser default
export function getDefaultLanguage(): Language {
  const saved = localStorage.getItem('saltify_language') as Language | null;
  if (saved && ['ko', 'en', 'zh-CN', 'zh-TW', 'ja'].includes(saved)) {
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
