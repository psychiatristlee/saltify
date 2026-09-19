/**
 * Store facts as they are handed to the LLM.
 *
 * These prompts are the reason stale business info survives redesigns: the
 * blog generator keeps re-emitting whatever this file says, long after the
 * rendered pages have been fixed. Every AI route imports from here so there
 * is exactly one place to update when the store's hours or name change.
 *
 * Brand rules the model must follow are stated explicitly — an LLM will
 * happily invent "Saltify" or "솔트 빵" if it is not told not to.
 */

import { STORE } from './storeInfo';

const BRAND_RULES_KO = `## 표기 규칙 (반드시 준수)
- 상호는 "솔트빵" 또는 "솔트빵 Salt,θ" 로만 표기. "솔트 빵" 처럼 띄어쓰지 말 것
- "Saltify" 는 사업자명이며 브랜드가 아니므로 본문에 절대 쓰지 말 것
- 영문 표기는 반드시 "Salt,θ (Salt Bread)" — 외국인이 θ 를 입력할 수 없으므로 Salt Bread 병기 필수
- 휴무일은 없음. "일요일 휴무" 같은 표현을 절대 쓰지 말 것`;

const BRAND_RULES_EN = `## Naming rules (mandatory)
- The shop is "Salt,θ (Salt Bread)" in English, or "솔트빵" in Korean
- NEVER write "Saltify" — that is the legal entity name, not the brand
- Always pair the stylised "Salt,θ" with the typeable "Salt Bread"
- The shop is open every day. NEVER write "closed Sundays" or any closing day`;

const BRAND_RULES_JA = `## 表記ルール (必須)
- 店名は「ソルトパン Salt,θ (Salt Bread)」または「솔트빵」のみ
- 「Saltify」は法人名でありブランド名ではないため、絶対に使用しないこと
- 「Salt,θ」には必ず入力可能な「Salt Bread」を併記すること
- 定休日はありません。「日曜定休」などの表現は絶対に使わないこと`;

const BRAND_RULES_ZH = `## 名称规则 (必须遵守)
- 店名只写 "Salt,θ (Salt Bread)" 或 "솔트빵"
- 绝对不要写 "Saltify" — 那是公司名称，不是品牌名
- "Salt,θ" 必须与可输入的 "Salt Bread" 并列书写
- 本店全年无休。绝对不要写 "周日休息" 或任何休息日`;

const BRAND_RULES_ZH_HANT = `## 名稱規則 (必須遵守)
- 店名只寫 "Salt,θ (Salt Bread)" 或 "솔트빵"
- 絕對不要寫 "Saltify" — 那是公司名稱，不是品牌名
- "Salt,θ" 必須與可輸入的 "Salt Bread" 並列書寫
- 本店全年無休。絕對不要寫 "週日公休" 或任何公休日
- 鹽麵包在台灣/香港稱為「鹽可頌」，請優先使用此說法`;

/** Multi-line store block for the long-form blog generator. */
export const STORE_INFO_BY_LANG: Record<string, string> = {
  ko: `## 매장 정보 (필요시 자연스럽게 포함)
- 매장명: 솔트빵 Salt,θ (Salt Bread)
- 위치: 서울 마포구 동교로 39길 10 1층 (연남동, 홍대입구역 3번 출구 도보 5분)
- 영업시간: ${STORE.hoursText}
- 휴무일: 없음 (연중무휴)
- 전화: ${STORE.telephoneDisplay}
- Instagram: @salt_bread_official

${BRAND_RULES_KO}`,

  en: `## Store Info (weave in naturally if relevant)
- Name: Salt,θ (Salt Bread) · 솔트빵
- Location: 1F, 10 Donggyo-ro 39-gil, Mapo-gu, Seoul (Yeonnam-dong, 5 min walk from Hongik Univ. Stn Exit 3)
- Hours: ${STORE.hoursTextEn}
- Closing day: none — open 7 days a week
- Phone: ${STORE.telephone}
- Instagram: @salt_bread_official

${BRAND_RULES_EN}`,

  ja: `## 店舗情報 (自然に織り交ぜて)
- 店名: ソルトパン Salt,θ (Salt Bread)
- 所在地: ソウル特別市 麻浦区 東橋路39キル 10 1F (延南洞、弘大入口駅3番出口から徒歩5分)
- 営業時間: ${STORE.hoursTextJa}
- 定休日: なし (年中無休)
- 電話: ${STORE.telephone}
- Instagram: @salt_bread_official

${BRAND_RULES_JA}`,

  'zh-CN': `## 门店信息 (自然融入)
- 店名: Salt,θ (Salt Bread) · 솔트빵
- 地址: 首尔特别市 麻浦区 东桥路39街 10号 1层 (延南洞，弘大入口站3号出口步行5分钟)
- 营业时间: ${STORE.hoursTextZh}
- 休息日: 无 (全年无休)
- 电话: ${STORE.telephone}
- Instagram: @salt_bread_official

${BRAND_RULES_ZH}`,

  'zh-Hant': `## 門市資訊 (自然融入)
- 店名: Salt,θ (Salt Bread) · 솔트빵
- 地址: 首爾特別市 麻浦區 東橋路39街 10號 1樓 (延南洞，弘大入口站3號出口步行5分鐘)
- 營業時間: ${STORE.hoursTextZhHant}
- 公休日: 無 (全年無休)
- 電話: ${STORE.telephone}
- Instagram: @salt_bread_official

${BRAND_RULES_ZH_HANT}`,
};

/** One-line variant for the cron generator, whose prompt budget is tighter. */
export const STORE_INFO_ONELINE_BY_LANG: Record<string, string> = {
  ko: `매장명: 솔트빵 Salt,θ (Salt Bread). 위치: 서울 마포구 동교로 39길 10 1층 (연남동, 홍대입구역 도보 5분). 영업시간: ${STORE.hoursText}, 연중무휴. 전화: ${STORE.telephoneDisplay}. Instagram: @salt_bread_official. 표기 규칙: "Saltify" 금지, "솔트 빵" 처럼 띄어쓰기 금지, 휴무일 언급 금지.`,
  en: `Salt,θ (Salt Bread) bakery, 1F 10 Donggyo-ro 39-gil, Mapo-gu, Seoul (Yeonnam-dong, 5 min from Hongik Univ. Stn). Hours: ${STORE.hoursTextEn}, no closing day. Tel ${STORE.telephone}. IG: @salt_bread_official. Naming rules: never write "Saltify"; always pair "Salt,θ" with "Salt Bread"; never mention a closing day.`,
  ja: `ソルトパン Salt,θ (Salt Bread)、ソウル特別市 麻浦区 東橋路39キル 10 1F (延南洞、弘大入口駅から徒歩5分)。営業時間: ${STORE.hoursTextJa}、年中無休。電話 ${STORE.telephone}。Instagram: @salt_bread_official。表記ルール: 「Saltify」使用禁止、「Salt,θ」には必ず「Salt Bread」を併記、定休日に言及しないこと。`,
  'zh-CN': `Salt,θ (Salt Bread) · 솔트빵，首尔特别市麻浦区东桥路39街10号1层 (延南洞，弘大入口站步行5分钟)。营业时间: ${STORE.hoursTextZh}，全年无休。电话 ${STORE.telephone}。Instagram: @salt_bread_official。名称规则: 禁止使用 "Saltify"，"Salt,θ" 必须并列 "Salt Bread"，不要提及休息日。`,
  'zh-Hant': `Salt,θ (Salt Bread) · 솔트빵，首爾特別市麻浦區東橋路39街10號1樓 (延南洞，弘大入口站步行5分鐘)。營業時間: ${STORE.hoursTextZhHant}，全年無休。電話 ${STORE.telephone}。Instagram: @salt_bread_official。名稱規則: 禁止使用 "Saltify"，"Salt,θ" 必須並列 "Salt Bread"，不要提及公休日，鹽麵包請寫「鹽可頌」。`,
};
