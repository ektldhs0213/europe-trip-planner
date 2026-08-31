export const PREP_DATA_VERSION = 2
export const PREP_RELEASED_AT = '2026-08-31T01:00:00.000Z'

export const PREP_CATEGORIES = [
  { id: '의류', icon: '🧥' },
  { id: '핀란드 방한용품', icon: '❄️' },
  { id: '세면·미용', icon: '🧴' },
  { id: '렌즈·안경', icon: '👓' },
  { id: '상비약', icon: '💊' },
  { id: '전자기기', icon: '🔌' },
  { id: '보안·생활용품', icon: '🔐' },
  { id: '음식', icon: '🍜' },
  { id: '현금', icon: '💶' },
  { id: '통신', icon: '📶' },
  { id: '카메라', icon: '📷' },
  { id: '서류', icon: '📄' },
  { id: '기타', icon: '🧳' },
]

const completed = (id, category, text, extra = {}) => ({ id, category, text, completed: true, ...extra })
const needed = (id, category, text, extra = {}) => ({ id, category, text, completed: false, ...extra })

export const DEFAULT_PREP_ITEMS = [
  completed('prep-clothes-padding', '의류', '패딩', { group: '겨울옷' }),
  completed('prep-clothes-hoodie', '의류', '후드 1벌', { group: '겨울옷' }),
  completed('prep-clothes-winter-pants', '의류', '겨울바지 1벌', { group: '겨울옷' }),
  completed('prep-clothes-tights', '의류', '타이즈', { group: '겨울옷' }),
  completed('prep-clothes-summer-pants', '의류', '여름용 긴바지 2벌', { group: '긴바지' }),
  completed('prep-clothes-jeans', '의류', '청바지 1벌', { group: '긴바지' }),
  completed('prep-clothes-short-shirts', '의류', '반팔 셔츠 4장'),
  completed('prep-clothes-long-shirts', '의류', '긴팔 셔츠 2장'),
  completed('prep-clothes-track-jacket', '의류', '아디다스 저지'),
  completed('prep-clothes-jacket', '의류', '긴팔 재킷'),
  completed('prep-clothes-long-tees', '의류', '긴팔 티 3장'),
  completed('prep-clothes-sweats', '의류', '츄리닝'),
  completed('prep-clothes-sleeveless', '의류', '나시티 4장'),
  completed('prep-clothes-inner-black', '의류', '검정 반팔 이너 5장', { group: '반팔 이너' }),
  completed('prep-clothes-inner-white', '의류', '흰색 반팔 이너 5장', { group: '반팔 이너' }),
  completed('prep-clothes-tees', '의류', '일반 반팔티 5장'),
  completed('prep-clothes-rashguard', '의류', '래쉬가드 상·하의'),
  completed('prep-clothes-underwear', '의류', '속옷 10장'),
  completed('prep-clothes-socks', '의류', '양말 10켤레'),
  completed('prep-clothes-thick-socks', '의류', '두꺼운 양말'),
  completed('prep-clothes-sneakers', '의류', '운동화', { note: '신고 출국' }),
  completed('prep-clothes-sandals', '의류', '크록스 / 슬리퍼'),

  completed('prep-winter', '핀란드 방한용품', '방한용품 전체 점검 완료'),
  completed('prep-winter-gloves', '핀란드 방한용품', '장갑'),
  completed('prep-winter-hat', '핀란드 방한용품', '방한 모자'),
  completed('prep-winter-neck', '핀란드 방한용품', '목 방한용품'),

  completed('prep-wash-body', '세면·미용', '바디워시'),
  completed('prep-wash-shampoo', '세면·미용', '샴푸'),
  completed('prep-wash-treatment', '세면·미용', '트리트먼트'),
  completed('prep-wash-towel', '세면·미용', '샤워타월'),
  completed('prep-wash-cleansing', '세면·미용', '클렌징'),
  completed('prep-wash-mouthwash', '세면·미용', '가글액'),
  completed('prep-wash-sunscreen', '세면·미용', '선크림'),
  completed('prep-wash-moisturizer', '세면·미용', '보습류'),
  completed('prep-wash-perfume', '세면·미용', '향수'),
  completed('prep-wash-razor', '세면·미용', '면도기'),
  completed('prep-wash-comb', '세면·미용', '빗'),
  completed('prep-wash-hair', '세면·미용', '헤어제품'),
  completed('prep-wash-nails', '세면·미용', '손톱깎이 세트'),
  completed('prep-wash-wipes', '세면·미용', '물티슈'),
  completed('prep-wash-sunglasses', '세면·미용', '선글라스'),
  completed('prep-wash-cap', '세면·미용', '모자'),
  needed('prep-wash-toothbrush', '세면·미용', '칫솔'),
  needed('prep-wash-toothpaste', '세면·미용', '치약'),

  completed('prep-lens-contacts', '렌즈·안경', '렌즈'),
  completed('prep-lens-glasses', '렌즈·안경', '안경'),
  completed('prep-lens-solution', '렌즈·안경', '리뉴액 세트'),
  completed('prep-lens-case', '렌즈·안경', '렌즈 케이스'),

  completed('prep-med-eye-drops', '상비약', '인공눈물'),
  completed('prep-med-digestive', '상비약', '소화제'),
  completed('prep-med-bug-bite', '상비약', '버물리'),
  completed('prep-med-tylenol', '상비약', '타이레놀'),
  completed('prep-med-diarrhea', '상비약', '지사제'),
  completed('prep-med-tick', '상비약', '진드기 제거제'),
  completed('prep-med-ointment', '상비약', '연고'),
  completed('prep-med-personal', '상비약', '개인약'),
  completed('prep-med-bandage', '상비약', '데일밴드'),
  completed('prep-med-oramedy', '상비약', '오라메디'),
  completed('prep-med-floss', '상비약', '치실'),
  completed('prep-med-extra', '상비약', '추가 상비약 점검'),

  completed('prep-device-camera', '전자기기', '카메라'),
  completed('prep-device-camera-charger', '전자기기', '카메라 충전기'),
  completed('prep-device-powerbanks', '전자기기', '보조배터리 2개'),
  completed('prep-device-three-type', '전자기기', '3타입 충전기 3개'),
  completed('prep-device-usb', '전자기기', 'USB 충전 케이블 3개'),
  completed('prep-device-power-strip', '전자기기', '멀티탭'),
  completed('prep-device-adapters', '전자기기', '유럽용 돼지코 2개'),

  completed('prep-life-phone-loop', '보안·생활용품', '휴대폰 보안고리'),
  completed('prep-life-bike-locks', '보안·생활용품', '자전거 고리 2개'),
  completed('prep-life-umbrella', '보안·생활용품', '우산'),
  completed('prep-life-fan', '보안·생활용품', '손선풍기'),
  completed('prep-life-small-items', '보안·생활용품', '작은 생활용품'),
  completed('prep-life-cards', '보안·생활용품', '카드 분리 보관'),
  needed('prep-life-zipbags', '보안·생활용품', '지퍼백'),

  completed('prep-food-kimchi-plan', '음식', '볶음김치 가져가기로 결정'),
  completed('prep-food-ramen-plan', '음식', '라면은 현지에서 구매하기로 결정'),
  needed('prep-food-kimchi-pack', '음식', '볶음김치 실제 패킹', { note: '액체가 새지 않게 지퍼백으로 2중 포장' }),

  completed('prep-cash-budget', '현금', '환전 예산 결정', { note: '약 150만 원어치 유로' }),
  needed('prep-cash-exchange', '현금', '유로 실제 환전', { note: '약 150만 원어치' }),

  needed('prep-esim', '통신', 'eSIM / 유심 / 로밍 결정 및 준비'),

  needed('prep-camera-sd-check', '카메라', 'SD카드 용량 확인'),
  needed('prep-camera-sd-spare', '카메라', '필요하면 예비 SD카드 준비'),
  needed('prep-camera-battery', '카메라', '카메라 예비배터리 필요 여부 확인'),

  needed('prep-passport', '서류', '여권 사본'),
  needed('prep-insurance', '서류', '여행자보험'),
  needed('prep-doc-bookings', '서류', '항공권·숙박·투어 예약내역'),
  needed('prep-doc-international-license', '서류', '필요 시 국제운전면허증'),
  needed('prep-doc-korean-license', '서류', '한국 운전면허증'),
  needed('prep-doc-medical', '서류', '개인약 관련 필요 서류'),
  needed('prep-map', '서류', '중요 서류 휴대폰 오프라인 저장'),
]

const LEGACY_PREP_IDS = new Set(['prep-passport', 'prep-insurance', 'prep-esim', 'prep-winter', 'prep-map'])

function normalizeItem(item, index) {
  return {
    ...item,
    id: String(item.id || `prep-restored-${index}`),
    text: String(item.text || '').trim(),
    category: String(item.category || '기타'),
    group: String(item.group || '').trim(),
    note: String(item.note || '').trim(),
    completed: Boolean(item.completed),
  }
}

export function normalizePrepItems(payload) {
  let source = Array.isArray(payload?.prepItems) ? payload.prepItems : []
  if (!source.length && Array.isArray(payload?.checks)) {
    source = [
      { id: 'prep-passport', text: '여권 유효기간 확인', completed: Boolean(payload.checks[0]) },
      { id: 'prep-insurance', text: '여행자 보험 가입', completed: Boolean(payload.checks[1]) },
      { id: 'prep-esim', text: '유심 · eSIM 준비', completed: Boolean(payload.checks[2]) },
      { id: 'prep-winter', text: '핀란드 방한용품 챙기기', completed: Boolean(payload.checks[3]) },
      { id: 'prep-map', text: '오프라인 지도 다운로드', completed: Boolean(payload.checks[4]) },
    ]
  }

  const normalized = source
    .filter(item => item && String(item.text || '').trim())
    .map(normalizeItem)

  if (Number(payload?.prepDataVersion || 0) >= PREP_DATA_VERSION) return normalized

  const customItems = normalized.filter(item => !LEGACY_PREP_IDS.has(item.id))
  const next = DEFAULT_PREP_ITEMS.map(item => ({ ...item, _updatedAt: PREP_RELEASED_AT }))
  const seenText = new Set(next.map(item => item.text.toLowerCase()))
  customItems.forEach(item => {
    if (seenText.has(item.text.toLowerCase())) return
    seenText.add(item.text.toLowerCase())
    next.push(item)
  })
  return next
}
