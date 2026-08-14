import { useEffect, useMemo, useState } from 'react'
import { loadLocalTrip, saveLocalTrip } from './lib/localStore.js'
import { downloadOfflineTicket, getOfflineTicket, getOfflineTicketIds, openOfflineTicket, saveOfflineTicket } from './lib/offlineTickets.js'
import { backupTrip, fetchTickets, getTicketUrl, isSupabaseConfigured, restoreTrip, sendMagicLink, signOutLocal, supabase, uploadTicket } from './lib/supabase.js'
import { usePwa } from './lib/usePwa.js'

const iconPaths = {
  home: ['M3 10.8 12 3l9 7.8', 'M5 9.6V21h14V9.6', 'M9 21v-7h6v7'],
  calendar: ['M6 2v4', 'M18 2v4', 'M3 9h18', 'M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z', 'M8 13h3', 'M8 17h3', 'M15 13h1'],
  pin: ['M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z', 'M9 10a3 3 0 1 0 6 0 3 3 0 0 0-6 0'],
  bookmark: ['M6 3h12v18l-6-4-6 4V3Z'],
  backpack: ['M8 7V6a4 4 0 0 1 8 0v1', 'M6 8h12a2 2 0 0 1 2 2v11H4V10a2 2 0 0 1 2-2Z', 'M8 13h8', 'M8 17h8'],
  plus: ['M12 5v14', 'M5 12h14'],
  search: ['m21 21-4.4-4.4', 'M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z'],
  arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
  chevron: ['m9 18 6-6-6-6'],
  plane: ['M22 2 9.5 14.5', 'm22 2-8 20-4.5-7.5L2 10Z'],
  train: ['M6 17h12', 'M8 21l2-4', 'M16 21l-2-4', 'M8 3h8a3 3 0 0 1 3 3v11H5V6a3 3 0 0 1 3-3Z', 'M8 7h8', 'M8 13h.01', 'M16 13h.01'],
  ticket: ['M2 9a3 3 0 0 0 0 6v4h20v-4a3 3 0 0 0 0-6V5H2v4Z', 'M13 5v2', 'M13 11v2', 'M13 17v2'],
  transport: ['M5 17h14', 'M7 20l2-3', 'M17 20l-2-3', 'M6 4h12a2 2 0 0 1 2 2v11H4V6a2 2 0 0 1 2-2Z', 'M4 10h16', 'M8 14h.01', 'M16 14h.01'],
  tour: ['m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z', 'M9 3v15', 'M15 6v15'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2'],
  map: ['m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z', 'M9 3v15', 'M15 6v15'],
  external: ['M14 3h7v7', 'm10 11 11-11', 'M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5'],
  edit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 15H6L5 6', 'M10 11v5', 'M14 11v5'],
  check: ['m5 12 4 4L19 6'],
  close: ['M18 6 6 18', 'm6 6 12 12'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  sparkle: ['m12 3 1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9L12 3Z', 'm19 15 .7 2.3L22 18l-2.3.7L19 22l-.7-2.3L16 18l2.3-.7L19 15Z'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  cloud: ['M17.5 19H7a5 5 0 1 1 1.7-9.7A6 6 0 0 1 20 12a3.5 3.5 0 0 1-2.5 7Z'],
  upload: ['M12 16V4', 'm7 9 5-5 5 5', 'M5 20h14'],
  download: ['M12 4v12', 'm7-5 5 5 5-5', 'M5 20h14'],
  database: ['M20 5c0 1.7-3.6 3-8 3S4 6.7 4 5s3.6-3 8-3 8 1.3 8 3Z', 'M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5', 'M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7'],
  file: ['M14 2H6a2 2 0 0 0-2 2v16h16V8Z', 'M14 2v6h6', 'M8 13h8', 'M8 17h6'],
}

function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]?.map((d, index) => <path key={index} d={d} />)}
    </svg>
  )
}

const NAV_ITEMS = [
  { id: 'schedule', label: '전체 일정', icon: 'calendar' },
  { id: 'cities', label: '도시', icon: 'pin' },
  { id: 'bookings', label: '예약 · 티켓', icon: 'bookmark' },
  { id: 'prep', label: '준비', icon: 'backpack' },
]

const INITIAL_CITIES = [
  { id: 'lisbon', name: 'Lisbon', ko: '리스본', country: 'Portugal', flag: '🇵🇹', dates: '9. 2 — 9. 5', nights: '3박', saved: 8, tone: 'terracotta' },
  { id: 'porto', name: 'Porto', ko: '포르투', country: 'Portugal', flag: '🇵🇹', dates: '9. 5 — 9. 8', nights: '3박', saved: 6, tone: 'ocean' },
  { id: 'sevilla', name: 'Sevilla', ko: '세비야', country: 'Spain', flag: '🇪🇸', dates: '9. 8 — 9. 11', nights: '3박', saved: 5, tone: 'sun' },
  { id: 'granada', name: 'Granada', ko: '그라나다', country: 'Spain', flag: '🇪🇸', dates: '9. 11 — 9. 14', nights: '3박', saved: 7, tone: 'rose' },
  { id: 'barcelona', name: 'Barcelona', ko: '바르셀로나', country: 'Spain', flag: '🇪🇸', dates: '9. 14 — 9. 19', nights: '5박', saved: 12, tone: 'cobalt' },
  { id: 'rovaniemi', name: 'Rovaniemi', ko: '로바니에미', country: 'Finland', flag: '🇫🇮', dates: '10. 1 — 10. 5', nights: '4박', saved: 5, tone: 'aurora' },
  { id: 'helsinki', name: 'Helsinki', ko: '헬싱키', country: 'Finland', flag: '🇫🇮', dates: '10. 5 — 10. 8', nights: '3박', saved: 9, tone: 'berry' },
]

const initialPlaces = [
  { id: 1, city: 'barcelona', name: 'Sagrada Família', category: 'attraction', description: '가우디의 미완성 대성당. 오전 첫 타임으로 예약하기.', priority: 3, visited: false, mapUrl: 'https://maps.google.com/?q=Sagrada+Familia', reservation: true, duration: '2시간', visitDate: '2026-09-16', meta: '9월 16일 09:00' },
  { id: 2, city: 'barcelona', name: 'Bodega Biarritz 1881', category: 'restaurant', description: '고딕 지구의 작은 타파스 바. 혼자 방문하기 좋음.', priority: 3, visited: false, mapUrl: 'https://maps.google.com/?q=Bodega+Biarritz+1881', reservation: false, duration: '1.5시간', visitDate: '', meta: '타파스 · €€' },
  { id: 3, city: 'barcelona', name: 'Casa Batlló', category: 'attraction', description: '빛이 가장 예쁜 늦은 오후 시간대로 방문.', priority: 2, visited: false, mapUrl: 'https://maps.google.com/?q=Casa+Batllo', reservation: true, duration: '1.5시간', visitDate: '2026-09-17', meta: '9월 17일 15:45' },
  { id: 4, city: 'barcelona', name: 'Nomad Coffee Lab', category: 'cafe', description: '엘 보른 산책 중 들를 스페셜티 커피 로스터리.', priority: 2, visited: false, mapUrl: 'https://maps.google.com/?q=Nomad+Coffee+Lab+Barcelona', reservation: false, duration: '1시간', visitDate: '', meta: '커피 · €' },
  { id: 5, city: 'barcelona', name: 'La Boqueria', category: 'other', description: '아침 일찍 방문해 시장 구경과 간단한 식사.', priority: 1, visited: false, mapUrl: 'https://maps.google.com/?q=La+Boqueria', reservation: false, duration: '1시간', visitDate: '', meta: '마켓 · 오전 추천' },
  { id: 6, city: 'barcelona', name: 'Paradiso', category: 'bar', description: '숨겨진 입구로 들어가는 칵테일 바.', priority: 2, visited: true, mapUrl: 'https://maps.google.com/?q=Paradiso+Barcelona', reservation: false, duration: '2시간', visitDate: '2026-09-15', meta: '칵테일 · €€€' },
]

const INITIAL_TICKETS = [
  { id: 'sample-alhambra', city: 'Granada', event_date: '2026-09-12', title: 'Alhambra Nasrid Palaces', file_name: '', storage_path: '', localOnly: true },
  { id: 'sample-sagrada', city: 'Barcelona', event_date: '2026-09-16', title: 'Sagrada Família', file_name: '', storage_path: '', localOnly: true },
  { id: 'sample-train', city: 'Porto', event_date: '2026-09-05', title: 'Lisboa → Porto', file_name: '', storage_path: '', localOnly: true },
]

const INITIAL_EVENTS = [
  { id: 'event-0902-flight-in', date: '09.02', day: '수', city: '리스본', time: '12:45', end: '20:15', title: '인천 → 리스본', desc: '항공편 EK323, EK193 / 두바이 경유', type: 'transport', status: '예매 완료' },
  { id: 'event-0902-lisbon-checkin', date: '09.02', day: '수', city: '리스본', time: '21:00', end: '22:00', title: '숙소 체크인', desc: '리스본 숙소 체크인 및 휴식', type: 'pin', status: '예매 불필요' },
  { id: 'event-0903-lisbon-morning', date: '09.03', day: '목', city: '리스본', time: '09:00', end: '12:30', title: '리스본 오전 관광', desc: '리스본 시내 자유관광', type: 'pin', status: '예매 불필요' },
  { id: 'event-0903-porto-train', date: '09.03', day: '목', city: '포르투', time: '14:09', end: '16:48', title: '리스본 → 포르투', desc: 'CP Alfa Pendular 133', type: 'transport', status: '예매 완료' },
  { id: 'event-0903-porto-checkin', date: '09.03', day: '목', city: '포르투', time: '17:30', end: '18:00', title: '숙소 체크인', desc: 'ZERO Box Lodge Porto', type: 'pin', status: '예매 불필요' },
  { id: 'event-0904-grahams-tour', date: '09.04', day: '금', city: '포르투', time: '09:00', end: '13:00', title: '그라함즈 와이너리 투어', desc: '마이리얼트립 / 한국어 가이드 와이너리 투어', type: 'tour', status: '예매 완료' },
  { id: 'event-0904-porto-night-tour', date: '09.04', day: '금', city: '포르투', time: '15:00', end: '21:00', title: '포르투 반일·야경 투어', desc: '마이리얼트립 / 포르투 시내 및 야경 투어', type: 'tour', status: '예매 완료' },
  { id: 'event-0905-porto-free', date: '09.05', day: '토', city: '포르투', time: '10:00', end: '21:00', title: '포르투 자유여행', desc: '투어에서 못 본 관광지·강변·맛집 등 자유관광', type: 'pin', status: '예매 불필요' },
  { id: 'event-0906-lisbon-train', date: '09.06', day: '일', city: '리스본', time: '08:45', end: '11:52', title: '포르투 → 리스본', desc: 'CP Intercidades 522 / 리스본 오리엔테역 도착', type: 'transport', status: '예매 완료' },
  { id: 'event-0906-lisbon-night-tour', date: '09.06', day: '일', city: '리스본', time: '14:00', end: '21:00', title: '리스본 시내·야경 투어', desc: '마이리얼트립 / 리스본 시내 및 야경', type: 'tour', status: '예매 완료' },
  { id: 'event-0908-lisbon-last', date: '09.08', day: '화', city: '리스본', time: '09:00', end: '11:00', title: '리스본 마지막 관광', desc: '포르투갈 마지막 오전 / 못 본 장소 보충', type: 'pin', status: '예매 불필요' },
  { id: 'event-0908-airport', date: '09.08', day: '화', city: '리스본', time: '11:00', end: '12:00', title: '리스본 공항 이동', desc: '리스본 공항 T2 이동 및 출국 준비', type: 'transport', status: '예매 불필요' },
  { id: 'event-0908-sevilla-flight', date: '09.08', day: '화', city: '세비야', time: '13:40', end: '15:45', title: '리스본 → 세비야', desc: 'Ryanair FR3628 / LIS T2 → SVQ', type: 'transport', status: '예매 완료' },
  { id: 'event-0908-sevilla-checkin', date: '09.08', day: '화', city: '세비야', time: '17:00', end: '18:00', title: '숙소 체크인', desc: '세비야 숙소 체크인', type: 'pin', status: '예매 완료' },
  { id: 'event-0908-flamenco', date: '09.08', day: '화', city: '세비야', time: '20:00', end: '22:00', title: '플라멩코 공연', desc: '공연장 선택 후 예약 예정', type: 'tour', status: '예매 불필요' },
  { id: 'event-alhambra', date: '09.12', day: '토', city: 'Granada', time: '09:00', end: '12:30', title: 'Alhambra Nasrid Palaces', desc: '입장 30분 전 도착 · 여권 필수', type: 'tour', status: '예매 완료' },
  { id: 'event-gaudi', date: '09.17', day: '목', city: 'Barcelona', time: '13:30', end: '17:30', title: '가우디 건축 오후', desc: 'Casa Milà → Casa Batlló', type: 'pin', status: '예매 완료' },
  { id: 'event-flight-out', date: '10.08', day: '목', city: 'Helsinki', time: '17:30', end: '—', title: 'Helsinki → Seoul', desc: 'HEL · AY041 · ICN', type: 'transport', status: '예매 완료' },
]

const TRIP_YEAR = 2026
const SCHEDULE_DATA_VERSION = 2
const PUBLISHED_SCHEDULE_DATES = new Set(['09.02', '09.03', '09.04', '09.05', '09.06', '09.07', '09.08'])
const KOREAN_DAYS = ['일', '월', '화', '수', '목', '금', '토']

function normalizeScheduleStatus(status) {
  return /완료|저장|발권/.test(String(status || '')) ? '예매 완료' : '예매 불필요'
}

function scheduleDateParts(value) {
  const match = String(value || '').match(/^(?:(\d{4})\D+)?(\d{1,2})\D+(\d{1,2})$/)
  if (!match) return null
  const year = Number(match[1] || TRIP_YEAR)
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return {
    input: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    display: `${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`,
    day: KOREAN_DAYS[date.getDay()],
  }
}

function normalizeEvents(items) {
  return items.map((event, index) => ({
    ...event,
    id: event.id || `event-${index}-${event.date}`,
    day: scheduleDateParts(event.date)?.day || event.day || '',
    status: normalizeScheduleStatus(event.status),
    type: event.type === 'plane' || event.type === 'train'
      ? 'transport'
      : event.type === 'ticket' ? 'tour' : event.type,
  }))
}

function migrateScheduleEvents(items, dataVersion) {
  if (dataVersion === SCHEDULE_DATA_VERSION) return normalizeEvents(items)
  const preserved = items.filter(event => !PUBLISHED_SCHEDULE_DATES.has(scheduleDateParts(event.date)?.display || event.date))
  const published = INITIAL_EVENTS.filter(event => PUBLISHED_SCHEDULE_DATES.has(event.date))
  return normalizeEvents([...preserved, ...published])
}

const categoryLabels = {
  all: '전체', attraction: '관광지', restaurant: '맛집', cafe: '카페', bar: 'Bar', other: '기타',
}

const BULK_CATEGORY_MAP = {
  '관광지': 'attraction', attraction: 'attraction',
  '맛집': 'restaurant', restaurant: 'restaurant',
  '카페': 'cafe', cafe: 'cafe',
  bar: 'bar', '바': 'bar',
  '기타': 'other', other: 'other',
}

const CITY_TONES = ['terracotta', 'ocean', 'sun', 'rose', 'cobalt', 'aurora', 'berry']
const COUNTRY_OPTIONS = [
  { name: 'Albania', ko: '알바니아', flag: '🇦🇱' },
  { name: 'Andorra', ko: '안도라', flag: '🇦🇩' },
  { name: 'Armenia', ko: '아르메니아', flag: '🇦🇲' },
  { name: 'Austria', ko: '오스트리아', flag: '🇦🇹' },
  { name: 'Azerbaijan', ko: '아제르바이잔', flag: '🇦🇿' },
  { name: 'Belarus', ko: '벨라루스', flag: '🇧🇾' },
  { name: 'Belgium', ko: '벨기에', flag: '🇧🇪' },
  { name: 'Bosnia and Herzegovina', ko: '보스니아 헤르체고비나', flag: '🇧🇦' },
  { name: 'Bulgaria', ko: '불가리아', flag: '🇧🇬' },
  { name: 'Croatia', ko: '크로아티아', flag: '🇭🇷' },
  { name: 'Cyprus', ko: '키프로스', flag: '🇨🇾' },
  { name: 'Czechia', ko: '체코', flag: '🇨🇿' },
  { name: 'Denmark', ko: '덴마크', flag: '🇩🇰' },
  { name: 'Estonia', ko: '에스토니아', flag: '🇪🇪' },
  { name: 'Finland', ko: '핀란드', flag: '🇫🇮' },
  { name: 'France', ko: '프랑스', flag: '🇫🇷' },
  { name: 'Georgia', ko: '조지아', flag: '🇬🇪' },
  { name: 'Germany', ko: '독일', flag: '🇩🇪' },
  { name: 'Greece', ko: '그리스', flag: '🇬🇷' },
  { name: 'Hungary', ko: '헝가리', flag: '🇭🇺' },
  { name: 'Iceland', ko: '아이슬란드', flag: '🇮🇸' },
  { name: 'Ireland', ko: '아일랜드', flag: '🇮🇪' },
  { name: 'Italy', ko: '이탈리아', flag: '🇮🇹' },
  { name: 'Kazakhstan', ko: '카자흐스탄', flag: '🇰🇿' },
  { name: 'Kosovo', ko: '코소보', flag: '🇽🇰' },
  { name: 'Latvia', ko: '라트비아', flag: '🇱🇻' },
  { name: 'Liechtenstein', ko: '리히텐슈타인', flag: '🇱🇮' },
  { name: 'Lithuania', ko: '리투아니아', flag: '🇱🇹' },
  { name: 'Luxembourg', ko: '룩셈부르크', flag: '🇱🇺' },
  { name: 'Malta', ko: '몰타', flag: '🇲🇹' },
  { name: 'Moldova', ko: '몰도바', flag: '🇲🇩' },
  { name: 'Monaco', ko: '모나코', flag: '🇲🇨' },
  { name: 'Montenegro', ko: '몬테네그로', flag: '🇲🇪' },
  { name: 'Netherlands', ko: '네덜란드', flag: '🇳🇱' },
  { name: 'North Macedonia', ko: '북마케도니아', flag: '🇲🇰' },
  { name: 'Norway', ko: '노르웨이', flag: '🇳🇴' },
  { name: 'Poland', ko: '폴란드', flag: '🇵🇱' },
  { name: 'Portugal', ko: '포르투갈', flag: '🇵🇹' },
  { name: 'Romania', ko: '루마니아', flag: '🇷🇴' },
  { name: 'Russia', ko: '러시아', flag: '🇷🇺' },
  { name: 'San Marino', ko: '산마리노', flag: '🇸🇲' },
  { name: 'Serbia', ko: '세르비아', flag: '🇷🇸' },
  { name: 'Slovakia', ko: '슬로바키아', flag: '🇸🇰' },
  { name: 'Slovenia', ko: '슬로베니아', flag: '🇸🇮' },
  { name: 'Spain', ko: '스페인', flag: '🇪🇸' },
  { name: 'Sweden', ko: '스웨덴', flag: '🇸🇪' },
  { name: 'Switzerland', ko: '스위스', flag: '🇨🇭' },
  { name: 'Türkiye', ko: '튀르키예', flag: '🇹🇷' },
  { name: 'Ukraine', ko: '우크라이나', flag: '🇺🇦' },
  { name: 'United Kingdom', ko: '영국', flag: '🇬🇧' },
  { name: 'Vatican City', ko: '바티칸', flag: '🇻🇦' },
]

const DEFAULT_PREP_ITEMS = [
  { id: 'prep-passport', text: '여권 유효기간 확인', completed: true },
  { id: 'prep-insurance', text: '여행자 보험 가입', completed: true },
  { id: 'prep-esim', text: '유심 · eSIM 준비', completed: false },
  { id: 'prep-winter', text: '핀란드 방한용품 챙기기', completed: false },
  { id: 'prep-map', text: '오프라인 지도 다운로드', completed: false },
]

function normalizePrepItems(payload) {
  if (Array.isArray(payload?.prepItems)) {
    return payload.prepItems
      .filter(item => item && String(item.text || '').trim())
      .map((item, index) => ({
        id: String(item.id || `prep-restored-${index}`),
        text: String(item.text).trim(),
        completed: Boolean(item.completed),
      }))
  }

  if (Array.isArray(payload?.checks)) {
    return DEFAULT_PREP_ITEMS.map((item, index) => ({ ...item, completed: Boolean(payload.checks[index]) }))
  }

  return DEFAULT_PREP_ITEMS.map(item => ({ ...item }))
}

function App() {
  const pwa = usePwa()
  const cachedTrip = useMemo(() => loadLocalTrip(), [])
  const [view, setView] = useState('schedule')
  const [selectedCity, setSelectedCity] = useState('barcelona')
  const [cities, setCities] = useState(() => cachedTrip?.cities || INITIAL_CITIES)
  const [places, setPlaces] = useState(() => (cachedTrip?.places || initialPlaces).map(place => ({
    ...place,
    category: place.category === 'shopping' ? 'other' : place.category,
    visited: place.visited ?? place.status === 'visited',
  })))
  const [events, setEvents] = useState(() => migrateScheduleEvents(cachedTrip?.events || INITIAL_EVENTS, cachedTrip?.scheduleDataVersion))
  const [tickets, setTickets] = useState(() => cachedTrip?.tickets || INITIAL_TICKETS)
  const [prepItems, setPrepItems] = useState(() => normalizePrepItems(cachedTrip))
  const [session, setSession] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    saveLocalTrip({ cities, places, events, tickets, prepItems, scheduleDataVersion: SCHEDULE_DATA_VERSION })
  }, [cities, places, events, tickets, prepItems])

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session || !pwa.isOnline) return
    fetchTickets().then(remoteTickets => {
      if (remoteTickets.length) setTickets(remoteTickets)
    }).catch(() => {})
  }, [session, pwa.isOnline])

  const navigate = (next, city) => {
    if (city) setSelectedCity(city)
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const restoreLocalData = (payload) => {
    if (Array.isArray(payload?.cities)) setCities(payload.cities)
    if (Array.isArray(payload?.places)) setPlaces(payload.places)
    if (Array.isArray(payload?.events)) setEvents(migrateScheduleEvents(payload.events, payload.scheduleDataVersion))
    if (Array.isArray(payload?.tickets)) setTickets(payload.tickets)
    if (Array.isArray(payload?.prepItems) || Array.isArray(payload?.checks)) setPrepItems(normalizePrepItems(payload))
  }

  return (
    <div className="app-shell">
      <AppHeader view={view} onNavigate={navigate} session={session} ticketCount={tickets.length} isOnline={pwa.isOnline} />
      <main className="main-content">
        <div className="page-wrap">
          {view === 'schedule' && <Schedule events={events} setEvents={setEvents} notify={notify} />}
          {view === 'cities' && <Cities cities={cities} setCities={setCities} places={places} setPlaces={setPlaces} onNavigate={navigate} notify={notify} />}
          {view === 'city' && <CityDetail cityId={selectedCity} cities={cities} places={places} setPlaces={setPlaces} onBack={() => navigate('cities')} notify={notify} />}
          {view === 'bookings' && <Bookings cities={cities} tickets={tickets} setTickets={setTickets} session={session} isOnline={pwa.isOnline} notify={notify} />}
          {view === 'prep' && <Prep cities={cities} places={places} events={events} tickets={tickets} prepItems={prepItems} setPrepItems={setPrepItems} session={session} pwa={pwa} onRestore={restoreLocalData} notify={notify} />}
        </div>
      </main>
      {toast && <div className="toast"><span><Icon name="check" size={17} /></span>{toast}</div>}
    </div>
  )
}

function AppHeader({ view, onNavigate, session, ticketCount, isOnline }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <button className="header-brand" onClick={() => onNavigate('schedule')} aria-label="전체 일정으로 이동">
          <span className="brand-mark"><Icon name="plane" size={18} /></span>
          <span><strong>유럽</strong><small>Europe 2026</small></span>
        </button>
        <nav className="top-nav" aria-label="주요 메뉴">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={view === item.id || (view === 'city' && item.id === 'cities') ? 'active' : ''} onClick={() => onNavigate(item.id)}>
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.id === 'bookings' && <em>{ticketCount}</em>}
            </button>
          ))}
        </nav>
        <div className={`cloud-indicator ${!isOnline ? 'offline' : session ? 'connected' : ''}`}>
          <i />
          <span>{!isOnline ? '오프라인 · 기기 저장' : session ? '클라우드 연결됨' : '로컬 저장 중'}</span>
        </div>
      </div>
    </header>
  )
}

function Sidebar({ view, onNavigate }) {
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate('schedule')} aria-label="전체 일정으로 이동">
        <span className="brand-mark"><Icon name="plane" size={19} /></span>
        <span>유럽</span>
      </button>
      <div className="trip-switcher">
        <div className="trip-cover"><span>EU</span></div>
        <div><strong>Europe 2026</strong><small>37일 · 3개국</small></div>
        <Icon name="chevron" size={16} />
      </div>
      <nav className="side-nav" aria-label="주요 메뉴">
        {NAV_ITEMS.map(item => (
          <button key={item.id} className={view === item.id || (view === 'city' && item.id === 'cities') ? 'active' : ''} onClick={() => onNavigate(item.id)}>
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
            {item.id === 'bookings' && <em>3</em>}
          </button>
        ))}
      </nav>
      <div className="sidebar-card">
        <Icon name="sparkle" />
        <strong>여행이 21일 남았어요</strong>
        <p>아직 예약하지 않은 일정 3개를 확인해 보세요.</p>
        <button onClick={() => onNavigate('bookings')}>예약 확인하기 <Icon name="arrow" size={15} /></button>
      </div>
      <div className="profile-row"><div className="avatar">YJ</div><div><strong>여행자</strong><small>개인 여행</small></div><button aria-label="프로필 메뉴">•••</button></div>
    </aside>
  )
}

function Topbar({ view, onNavigate }) {
  const title = view === 'city' ? '도시 상세' : NAV_ITEMS.find(item => item.id === view)?.label || '전체 일정'
  return (
    <header className="topbar">
      <div><span className="mobile-kicker">EUROPE 2026</span><strong>{title}</strong></div>
      <div className="top-actions">
        <span className="sync-state"><i /> 마지막 저장 방금 전</span>
        <button className="round-button" aria-label="검색"><Icon name="search" size={19} /></button>
      </div>
    </header>
  )
}

function MobileNav({ view, onNavigate }) {
  return (
    <nav className="mobile-nav" aria-label="모바일 메뉴">
      {NAV_ITEMS.map(item => (
        <button key={item.id} className={view === item.id || (view === 'city' && item.id === 'cities') ? 'active' : ''} onClick={() => onNavigate(item.id)}>
          <Icon name={item.icon} size={21} />
          <span>{item.label.replace('전체 ', '').replace(' · 티켓', '')}</span>
        </button>
      ))}
    </nav>
  )
}

function SectionHead({ eyebrow, title, description, action }) {
  return <div className="section-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}

function Home({ onNavigate }) {
  return (
    <div className="page home-page">
      <section className="welcome-row">
        <div><span className="eyebrow">WED, AUG 12</span><h1>다음 모험까지, <em>21일</em></h1><p>포르투갈에서 시작해 핀란드에서 끝나는 37일의 유럽 여행.</p></div>
        <button className="text-button" onClick={() => onNavigate('schedule')}>전체 일정 보기 <Icon name="arrow" size={17} /></button>
      </section>

      <section className="journey-card">
        <div className="journey-top"><div><span>EUROPE 2026</span><h2>Lisbon에서 Helsinki까지</h2></div><div className="journey-date"><small>2026. 09. 02 — 10. 08</small><strong>37 DAYS</strong></div></div>
        <div className="route-line">
          <div className="route-end start"><span>IN</span><strong>Lisbon</strong><small>9월 2일</small></div>
          <div className="route-track">
            <div className="country-stop"><i /> <span>Portugal</span><small>2개 도시</small></div>
            <div className="country-stop"><i /> <span>Spain</span><small>3개 도시</small></div>
            <div className="country-stop muted"><i /> <span>Europe</span><small>여행 중</small></div>
            <div className="country-stop"><i /> <span>Finland</span><small>2개 도시</small></div>
          </div>
          <div className="route-end"><span>OUT</span><strong>Helsinki</strong><small>10월 8일</small></div>
        </div>
        <div className="trip-metrics"><div><strong>3</strong><span>방문 국가</span></div><div><strong>7</strong><span>저장 도시</span></div><div><strong>52</strong><span>저장 장소</span></div><div><strong>14</strong><span>확정 일정</span></div></div>
      </section>

      <div className="home-grid">
        <section className="panel upcoming-panel">
          <div className="panel-head"><div><span className="eyebrow">UP NEXT</span><h2>다가오는 일정</h2></div><button onClick={() => onNavigate('schedule')}>모두 보기</button></div>
          <div className="next-event featured">
            <div className="date-block"><strong>02</strong><span>SEP</span></div>
            <div className="event-icon plane"><Icon name="plane" /></div>
            <div className="event-copy"><span>첫 번째 일정</span><h3>인천 → 리스본</h3><p>12:45 ICN 출발 · 20:15 LIS 도착</p></div>
            <span className="status-chip reserved">발권 완료</span>
          </div>
          <div className="next-event">
            <div className="date-block"><strong>03</strong><span>SEP</span></div>
            <div className="event-icon"><Icon name="pin" /></div>
            <div className="event-copy"><span>Lisbon</span><h3>벨렝 지구 산책</h3><p>10:00 · 제로니무스 수도원</p></div>
            <Icon name="chevron" size={18} />
          </div>
          <div className="next-event">
            <div className="date-block"><strong>05</strong><span>SEP</span></div>
            <div className="event-icon train"><Icon name="train" /></div>
            <div className="event-copy"><span>Porto</span><h3>리스본 → 포르투</h3><p>14:09 Lisboa Oriente 출발</p></div>
            <Icon name="chevron" size={18} />
          </div>
        </section>

        <section className="panel booking-panel">
          <div className="panel-head"><div><span className="eyebrow">TO DO</span><h2>예약이 필요해요</h2></div><span className="count-bubble">3</span></div>
          <div className="booking-item"><div className="booking-symbol urgent"><Icon name="ticket" /></div><div><strong>알함브라 궁전</strong><p>Granada · 9월 12일</p></div><span>높음</span></div>
          <div className="booking-item"><div className="booking-symbol"><Icon name="pin" /></div><div><strong>사그라다 파밀리아</strong><p>Barcelona · 9월 16일</p></div><span>높음</span></div>
          <div className="booking-item"><div className="booking-symbol"><Icon name="train" /></div><div><strong>Rovaniemi 야간열차</strong><p>Helsinki · 10월 1일</p></div><span className="normal">보통</span></div>
          <button className="booking-action" onClick={() => onNavigate('bookings')}>예약 목록 확인하기 <Icon name="arrow" size={16} /></button>
        </section>
      </div>

      <section className="city-strip">
        <div className="panel-head"><div><span className="eyebrow">YOUR ROUTE</span><h2>도시 둘러보기</h2></div><button onClick={() => onNavigate('cities')}>모든 도시 <Icon name="arrow" size={15} /></button></div>
        <div className="mini-city-grid">
          {INITIAL_CITIES.slice(0, 4).map(city => <button key={city.id} className={`mini-city ${city.tone}`} onClick={() => onNavigate('city', city.id)}><span>{city.flag} {city.country}</span><strong>{city.name}</strong><small>{city.dates} · {city.nights}</small><i><Icon name="arrow" size={17} /></i></button>)}
        </div>
      </section>
    </div>
  )
}

function eventSortKey(event, originalIndex) {
  const dateMatch = String(event.date || '').match(/(\d{1,2})\D+(\d{1,2})/)
  const timeMatch = String(event.time || '').match(/(\d{1,2}):(\d{2})/)
  const dateValue = dateMatch
    ? Number(dateMatch[1]) * 32 + Number(dateMatch[2])
    : Number.MAX_SAFE_INTEGER
  const timeValue = timeMatch
    ? Number(timeMatch[1]) * 60 + Number(timeMatch[2])
    : 24 * 60

  return [dateValue, timeValue, originalIndex]
}

function Schedule({ events, setEvents, notify }) {
  const [filter, setFilter] = useState('all')
  const [editor, setEditor] = useState(null)
  const [expandedDates, setExpandedDates] = useState(() => new Set())
  const visible = useMemo(() => events
    .map((event, originalIndex) => ({ event, sortKey: eventSortKey(event, originalIndex) }))
    .filter(({ event }) => filter === 'all' || event.type === filter)
    .sort((a, b) => (
      a.sortKey[0] - b.sortKey[0]
      || a.sortKey[1] - b.sortKey[1]
      || a.sortKey[2] - b.sortKey[2]
    ))
    .map(({ event }) => event), [events, filter])
  const dateGroups = useMemo(() => visible.reduce((groups, event) => {
    const key = event.date || '날짜 미정'
    const group = groups.find(item => item.date === key)
    if (group) group.events.push(event)
    else groups.push({ date: key, day: scheduleDateParts(event.date)?.day || event.day, events: [event] })
    return groups
  }, []), [visible])

  const saveEvent = (form) => {
    if (editor?.id) {
      setEvents(current => current.map(event => event.id === editor.id ? { ...event, ...form } : event))
      notify('일정 내용을 수정했어요.')
    } else {
      setEvents(current => [...current, { ...form, id: `event-${Date.now()}` }])
      notify('새 일정을 추가했어요.')
    }
    setEditor(null)
  }

  const toggleDate = (date) => setExpandedDates(current => {
    const next = new Set(current)
    if (next.has(date)) next.delete(date)
    else next.add(date)
    return next
  })

  return (
    <div className="page">
      <SectionHead eyebrow="ITINERARY" title="전체 일정" description="날짜별로 일정을 펼쳐 보고 모든 내용을 직접 수정할 수 있어요." action={<button className="primary-button" onClick={() => setEditor({})}><Icon name="plus" size={18} /> 일정 추가</button>} />
      <div className="filter-bar schedule-filters">
        {[['all','전체'],['transport','항공 · 교통'],['tour','투어'],['pin','방문']].map(([id, label]) => <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</button>)}
      </div>
      <div className="schedule-list">
        {dateGroups.map(group => (
          <details className="schedule-day-group" key={group.date} open={expandedDates.has(group.date)}>
            <summary onClick={event => { event.preventDefault(); toggleDate(group.date) }}><span><strong>{group.date}</strong><small>{group.day}요일</small></span><span>{group.events.length}개 일정 <Icon name="chevron" size={16} /></span></summary>
            <div className="schedule-day-events">
              {group.events.map((event, index) => (
                <article className="schedule-row" key={event.id}>
                  <div className="timeline-mark"><span className={event.type}><Icon name={event.type} size={18} /></span>{index < group.events.length - 1 && <i />}</div>
                  <div className="schedule-time"><strong>{event.time}</strong><span>{event.end}</span></div>
                  <div className="schedule-card"><div><span className="event-city">{event.city}</span><h3>{event.title}</h3><p>{event.desc}</p></div><div className="schedule-actions"><span className={`status-chip ${event.status === '예매 완료' ? 'reserved' : ''}`}>{event.status}</span><button aria-label={`${event.title} 수정`} onClick={() => setEditor(event)}><Icon name="edit" size={16} /></button></div></div>
                </article>
              ))}
            </div>
          </details>
        ))}
      </div>
      {editor && <ScheduleEditor event={editor} onClose={() => setEditor(null)} onSave={saveEvent} />}
    </div>
  )
}

function ScheduleEditor({ event, onClose, onSave }) {
  const initialDate = scheduleDateParts(event.date)
  const [form, setForm] = useState({
    date: initialDate?.input || '',
    day: initialDate?.day || event.day || '',
    city: event.city || '',
    time: event.time || '',
    end: event.end || '',
    title: event.title || '',
    desc: event.desc || '',
    type: event.type || 'pin',
    status: normalizeScheduleStatus(event.status),
  })
  const update = (field, value) => setForm(current => field === 'date'
    ? { ...current, date: value, day: scheduleDateParts(value)?.day || '' }
    : { ...current, [field]: value })
  const submit = (submitEvent) => {
    submitEvent.preventDefault()
    const date = scheduleDateParts(form.date)
    if (form.title.trim() && date) onSave({ ...form, date: date.display, day: date.day })
  }
  return <div className="modal-backdrop" onMouseDown={mouseEvent => mouseEvent.target === mouseEvent.currentTarget && onClose()}><form className="place-editor schedule-editor" onSubmit={submit}><header><div><span className="eyebrow">ITINERARY DETAILS</span><h2>{event.id ? '일정 수정' : '새 일정 추가'}</h2></div><button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" /></button></header><div className="form-grid"><label><span>날짜 <em>*</em></span><input autoFocus type="date" value={form.date} onChange={changeEvent => update('date', changeEvent.target.value)} required /></label><label><span>요일</span><input value={form.day ? `${form.day}요일` : ''} placeholder="날짜를 선택하면 자동 표시" readOnly /></label><label><span>시작 시간</span><input value={form.time} onChange={changeEvent => update('time', changeEvent.target.value)} placeholder="09:00" /></label><label><span>종료 시간</span><input value={form.end} onChange={changeEvent => update('end', changeEvent.target.value)} placeholder="12:30 또는 —" /></label><label><span>도시</span><input value={form.city} onChange={changeEvent => update('city', changeEvent.target.value)} placeholder="Barcelona" /></label><label><span>일정 종류</span><select value={form.type} onChange={changeEvent => update('type', changeEvent.target.value)}><option value="transport">항공 · 교통</option><option value="tour">투어</option><option value="pin">방문</option></select></label><label className="full"><span>제목 <em>*</em></span><input value={form.title} onChange={changeEvent => update('title', changeEvent.target.value)} placeholder="일정 제목" required /></label><label className="full"><span>설명</span><textarea value={form.desc} onChange={changeEvent => update('desc', changeEvent.target.value)} placeholder="장소, 좌석, 준비물 등" rows="3" /></label><label className="full"><span>상태</span><select value={form.status} onChange={changeEvent => update('status', changeEvent.target.value)}><option value="예매 완료">예매 완료</option><option value="예매 불필요">예매 불필요</option></select></label></div><footer><button type="button" className="cancel-button" onClick={onClose}>취소</button><button className="primary-button" type="submit">{event.id ? '변경사항 저장' : '일정 저장'}</button></footer></form></div>
}

function Cities({ cities, setCities, places, setPlaces, onNavigate, notify }) {
  const [cityEditorOpen, setCityEditorOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const countries = [...new Set(cities.map(city => city.country))]

  const addCity = (form) => {
    const country = COUNTRY_OPTIONS.find(item => item.name === form.country)
    const start = new Date(`${form.startDate}T00:00:00`)
    const end = new Date(`${form.endDate}T00:00:00`)
    const nights = Math.max(1, Math.round((end - start) / 86400000))
    const idBase = form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'city'
    const newCity = {
      id: `${idBase}-${Date.now()}`,
      name: form.name.trim(),
      ko: form.ko.trim() || form.name.trim(),
      country: form.country,
      flag: country?.flag || '🌍',
      dates: `${start.getMonth() + 1}. ${start.getDate()} — ${end.getMonth() + 1}. ${end.getDate()}`,
      nights: `${nights}박`,
      saved: 0,
      tone: CITY_TONES[cities.length % CITY_TONES.length],
    }
    setCities(current => [...current, newCity])
    setCityEditorOpen(false)
    notify(`${newCity.name} 도시를 여행에 추가했어요.`)
  }

  const importPlaces = (rows) => {
    const importedAt = Date.now()
    setPlaces(current => [...current, ...rows.map((row, index) => ({
      id: `${importedAt}-${index}`,
      city: row.city.id,
      name: row.name,
      category: row.category,
      description: row.description,
      mapUrl: row.mapUrl,
      priority: 2,
      visited: false,
      reservation: false,
      duration: '',
      visitDate: '',
      meta: categoryLabels[row.category],
    }))])
    setBulkImportOpen(false)
    notify(`${rows.length}개 장소를 일괄 추가했어요.`)
  }

  return (
    <div className="page">
      <SectionHead eyebrow={`${cities.length} CITIES · ${countries.length} COUNTRIES`} title="도시" description="도시를 추가하거나 여러 장소를 한 번에 붙여넣을 수 있어요." action={<div className="head-actions"><button className="secondary-button" onClick={() => setBulkImportOpen(true)}><Icon name="upload" size={17} /> 장소 일괄 추가</button><button className="primary-button" onClick={() => setCityEditorOpen(true)}><Icon name="plus" size={18} /> 도시 추가</button></div>} />
      {countries.map(country => (
        <section className="country-section" key={country}>
          <div className="country-title"><h2>{cities.find(city => city.country === country).flag} {country}</h2><span>{cities.filter(city => city.country === country).length}개 도시</span></div>
          <div className="city-grid">
            {cities.filter(city => city.country === country).map(city => (
              <button key={city.id} className={`city-card ${city.tone}`} onClick={() => onNavigate('city', city.id)}>
                <span className="city-country">{city.country}</span><span className="city-index">{String(cities.indexOf(city) + 1).padStart(2, '0')}</span>
                <div><h3>{city.name}</h3><p>{city.ko}</p></div>
                <footer><span>{city.dates}<br/><strong>{city.nights}</strong></span><span><Icon name="bookmark" size={15} /> {places.filter(place => place.city === city.id).length} places</span><i><Icon name="arrow" size={18} /></i></footer>
              </button>
            ))}
          </div>
        </section>
      ))}
      {cityEditorOpen && <CityEditor onClose={() => setCityEditorOpen(false)} onSave={addCity} />}
      {bulkImportOpen && <BulkPlaceImport cities={cities} places={places} onClose={() => setBulkImportOpen(false)} onImport={importPlaces} />}
    </div>
  )
}

function parseBulkPlaces(text, cities, places) {
  const seen = new Set(places.map(place => `${place.city}::${place.name.trim().toLowerCase()}`))
  return text.split(/\r?\n/).map((rawLine, index) => ({ rawLine: rawLine.trim(), lineNumber: index + 1 })).filter(item => item.rawLine).map(item => {
    if (/^(도시|city)\s*(\/|\t)/i.test(item.rawLine)) return { ...item, header: true }
    let values
    if (item.rawLine.includes('\t')) {
      const columns = item.rawLine.split('\t').map(value => value.trim())
      values = columns.length >= 5 ? [columns[0], columns[1], columns[2], columns.slice(3, -1).join(' / '), columns.at(-1)] : null
    } else {
      const match = item.rawLine.match(/^\s*(.*?)\s*\/\s*(.*?)\s*\/\s*(.*?)\s*\/\s*(.*?)\s*\/\s*(https?:\/\/.*)\s*$/i)
      values = match ? match.slice(1) : null
    }
    if (!values) return { ...item, error: '도시 / 장소명 / 카테고리 / 메모 / URL 형식을 확인해 주세요.' }
    const [cityValue, name, categoryValue, description, mapUrl] = values
    const city = cities.find(candidate => candidate.name.toLowerCase() === cityValue.toLowerCase() || candidate.ko.toLowerCase() === cityValue.toLowerCase())
    if (!city) return { ...item, error: `저장된 도시에서 '${cityValue}'을(를) 찾을 수 없어요.` }
    if (!name) return { ...item, error: '장소명이 비어 있어요.' }
    const category = BULK_CATEGORY_MAP[categoryValue.toLowerCase()]
    if (!category) return { ...item, error: `'${categoryValue}'은(는) 지원하지 않는 카테고리예요.` }
    const duplicateKey = `${city.id}::${name.trim().toLowerCase()}`
    if (seen.has(duplicateKey)) return { ...item, error: `${city.name}에 같은 이름의 장소가 이미 있어요.` }
    seen.add(duplicateKey)
    return { ...item, city, name: name.trim(), category, description: description.trim(), mapUrl: mapUrl.trim() }
  }).filter(item => !item.header)
}

function BulkPlaceImport({ cities, places, onClose, onImport }) {
  const [text, setText] = useState('')
  const parsed = useMemo(() => parseBulkPlaces(text, cities, places), [text, cities, places])
  const validRows = parsed.filter(row => !row.error)
  const errorRows = parsed.filter(row => row.error)
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className="place-editor bulk-import-editor"><header><div><span className="eyebrow">BULK IMPORT</span><h2>장소 일괄 추가</h2></div><button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" /></button></header><div className="bulk-import-body"><div className="bulk-format"><strong>한 줄에 장소 하나씩 입력하세요</strong><code>도시 / 장소명 / 카테고리 / 메모 / Google Maps URL</code><p>카테고리: 관광지, 맛집, 카페, Bar, 기타 · 엑셀의 5개 열을 그대로 붙여넣어도 됩니다.</p></div><label><span>붙여넣을 장소 목록</span><textarea autoFocus value={text} onChange={event => setText(event.target.value)} rows="9" placeholder={'Barcelona / Sagrada Família / 관광지 / 오전 예약 추천 / https://maps.app.goo.gl/example\nBarcelona / Bar Cañete / 맛집 / 타파스 / https://maps.google.com/example'} /></label>{text.trim() && <div className="bulk-preview"><div className="bulk-summary"><span className="valid"><Icon name="check" size={14} /> 추가 가능 {validRows.length}개</span><span className={errorRows.length ? 'invalid' : ''}>확인 필요 {errorRows.length}개</span></div>{validRows.slice(0, 4).map(row => <div className="preview-row" key={row.lineNumber}><span>{row.city.name}</span><strong>{row.name}</strong><small>{categoryLabels[row.category]}</small></div>)}{validRows.length > 4 && <p className="more-rows">외 {validRows.length - 4}개</p>}{errorRows.slice(0, 4).map(row => <div className="error-row" key={row.lineNumber}><strong>{row.lineNumber}행</strong><span>{row.error}</span></div>)}</div>}</div><footer><button type="button" className="cancel-button" onClick={onClose}>취소</button><button className="primary-button" disabled={!validRows.length} onClick={() => onImport(validRows)}><Icon name="upload" size={17} /> {validRows.length}개 장소 추가</button></footer></div></div>
}

function CityEditor({ onClose, onSave }) {
  const [form, setForm] = useState({ country: 'Portugal', name: '', ko: '', startDate: '', endDate: '' })
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const selectedCountry = COUNTRY_OPTIONS.find(country => country.name === form.country || country.ko === form.country)
  const validDates = form.startDate && form.endDate && form.endDate >= form.startDate
  const submit = (event) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const datesAreValid = values.startDate && values.endDate && values.endDate >= values.startDate
    const matchedCountry = COUNTRY_OPTIONS.find(country => country.name === values.country || country.ko === values.country)
    if (values.name.trim() && datesAreValid && matchedCountry) onSave({ ...values, country: matchedCountry.name })
  }

  return (
    <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <form className="place-editor city-editor" onSubmit={submit}>
        <header><div><span className="eyebrow">NEW DESTINATION</span><h2>도시 추가</h2></div><button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" /></button></header>
        <div className="form-grid">
          <label className="full"><span>국가 검색 <em>*</em></span><input name="country" list="europe-country-options" value={form.country} onChange={event => update('country', event.target.value)} placeholder="예: France 또는 프랑스" autoComplete="off" required /><datalist id="europe-country-options">{COUNTRY_OPTIONS.map(country => <option key={country.name} value={country.name} label={`${country.flag} ${country.ko}`} />)}</datalist></label>
          <label><span>도시명 <em>*</em></span><input name="name" autoFocus value={form.name} onChange={event => update('name', event.target.value)} placeholder="예: Paris" required /></label>
          <label><span>한글명</span><input name="ko" value={form.ko} onChange={event => update('ko', event.target.value)} placeholder="예: 파리" /></label>
          <label><span>도착일 <em>*</em></span><input name="startDate" type="date" value={form.startDate} onChange={event => update('startDate', event.target.value)} required /></label>
          <label><span>출발일 <em>*</em></span><input name="endDate" type="date" min={form.startDate} value={form.endDate} onChange={event => update('endDate', event.target.value)} required /></label>
          {form.startDate && form.endDate && !validDates && <p className="form-error full">출발일은 도착일보다 빠를 수 없어요.</p>}
          {form.country && !selectedCountry && <p className="form-error full">검색 결과에서 유럽 국가를 선택해 주세요.</p>}
        </div>
        <footer><button type="button" className="cancel-button" onClick={onClose}>취소</button><button className="primary-button" type="submit" disabled={!selectedCountry || !validDates || !form.name.trim()}>도시 저장</button></footer>
      </form>
    </div>
  )
}

function CityDetail({ cityId, cities, places, setPlaces, onBack, notify }) {
  const city = cities.find(item => item.id === cityId) || cities[0]
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('priority')
  const [editor, setEditor] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const cityPlaces = places.filter(place => place.city === city.id)

  const filtered = useMemo(() => {
    return cityPlaces.filter(place => (category === 'all' || place.category === category) && place.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : b.priority - a.priority)
  }, [cityPlaces, category, query, sort])

  const savePlace = (form) => {
    if (editor?.id) {
      setPlaces(current => current.map(place => place.id === editor.id ? { ...place, ...form } : place))
      notify('장소 정보를 수정했어요.')
    } else {
      setPlaces(current => [...current, { ...form, id: Date.now(), city: city.id, reservation: false, duration: '', visitDate: '', meta: categoryLabels[form.category] }])
      notify('새 장소를 추가했어요.')
    }
    setEditor(null)
  }

  const deletePlace = () => {
    setPlaces(current => current.filter(place => place.id !== deleteTarget.id))
    setDeleteTarget(null)
    notify('장소를 삭제했어요.')
  }

  return (
    <div className="page city-detail-page">
      <button className="back-button" onClick={onBack}><span>‹</span> 모든 도시</button>
      <section className={`city-hero ${city.tone}`}>
        <div className="city-hero-copy"><span>{city.flag} {city.country.toUpperCase()}</span><h1>{city.name}</h1><p>{city.ko} · {city.dates} · {city.nights}</p></div>
        <div className="city-hero-stats"><div><strong>{cityPlaces.length}</strong><span>전체 장소</span></div><div><strong>{cityPlaces.filter(place => place.visited).length}</strong><span>다녀옴</span></div><div><strong>{cityPlaces.filter(place => !place.visited).length}</strong><span>못 다녀옴</span></div></div>
        <div className="hero-stamp"><span>{city.name.slice(0, 3).toUpperCase()}</span><small>EUROPE<br/>TRIP</small></div>
      </section>

      <section className="places-section">
        <div className="places-title"><div><span className="eyebrow">SAVED PLACES</span><h2>어디를 가볼까요?</h2></div><button className="primary-button" onClick={() => setEditor({})}><Icon name="plus" size={18} /> 장소 추가</button></div>
        <div className="category-tabs" role="tablist">{Object.entries(categoryLabels).map(([id, label]) => <button key={id} className={category === id ? 'active' : ''} onClick={() => setCategory(id)} role="tab" aria-selected={category === id}>{label}<span>{id === 'all' ? cityPlaces.length : cityPlaces.filter(place => place.category === id).length}</span></button>)}</div>
        <div className="place-toolbar">
          <label className="search-field"><Icon name="search" size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="장소 이름으로 검색" /><span>⌘ K</span></label>
          <select value={sort} onChange={e => setSort(e.target.value)} aria-label="정렬"><option value="priority">우선순위 높은 순</option><option value="name">이름순</option></select>
        </div>

        <div className="place-results-head"><p><strong>{filtered.length}</strong>개의 장소</p><span>카드를 눌러 상세 정보를 확인하세요</span></div>
        <div className="places-grid">
          {filtered.map(place => <PlaceCard key={place.id} place={place} onToggleVisited={() => setPlaces(current => current.map(item => item.id === place.id ? { ...item, visited: !item.visited } : item))} onEdit={() => setEditor(place)} onDelete={() => setDeleteTarget(place)} />)}
          {filtered.length === 0 && <div className="empty-state"><span><Icon name="search" /></span><h3>검색 결과가 없어요</h3><p>다른 검색어나 필터를 사용해 보세요.</p></div>}
        </div>
      </section>
      <button className="floating-add" onClick={() => setEditor({})}><Icon name="plus" /> 장소 추가</button>
      {editor && <PlaceEditor place={editor} onClose={() => setEditor(null)} onSave={savePlace} />}
      {deleteTarget && <ConfirmDelete place={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deletePlace} />}
    </div>
  )
}

function PlaceCard({ place, onToggleVisited, onEdit, onDelete }) {
  return (
    <article className="place-card">
      <div className={`place-visual ${place.category}`}>
        <span>{categoryLabels[place.category]}</span>
        <div className="place-letter">{place.name.slice(0, 1)}</div>
        <div className="priority-flags" aria-label={`우선순위 ${place.priority}`}>{[1,2,3].map(level => <i key={level} className={level <= place.priority ? 'filled' : ''}>◆</i>)}</div>
      </div>
      <div className="place-body">
        <div className="place-heading"><div><span className={`status-dot ${place.visited ? 'visited' : 'not-visited'}`}>{place.visited ? '다녀옴' : '못 다녀옴'}</span><h3>{place.name}</h3></div><button aria-label={`${place.name} 메뉴`}><Icon name="menu" size={18} /></button></div>
        <p>{place.description}</p>
        <div className="place-meta"><span><Icon name="clock" size={15} /> {place.meta}</span>{place.reservation && <span><Icon name="ticket" size={15} /> 예약 필요</span>}</div>
        <div className="place-actions">
          <button className={`visited-toggle ${place.visited ? 'done' : ''}`} onClick={onToggleVisited} aria-label={place.visited ? '못 다녀옴으로 변경' : '다녀옴으로 체크'}><Icon name="check" size={16} /><span>{place.visited ? '다녀옴' : '방문 체크'}</span></button>
          <a className="map-button" href={place.mapUrl} target="_blank" rel="noreferrer"><Icon name="map" size={17} /> Google Maps <Icon name="external" size={13} /></a>
          <button onClick={onEdit} aria-label="수정"><Icon name="edit" size={17} /></button>
          <button onClick={onDelete} aria-label="삭제"><Icon name="trash" size={17} /></button>
        </div>
      </div>
    </article>
  )
}

function PlaceEditor({ place, onClose, onSave }) {
  const [form, setForm] = useState({ name: place.name || '', category: place.category || 'attraction', description: place.description || '', mapUrl: place.mapUrl || '', priority: place.priority || 2, visited: Boolean(place.visited) })
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const submit = (event) => { event.preventDefault(); if (form.name.trim()) onSave(form) }
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form className="place-editor" onSubmit={submit}>
        <header><div><span className="eyebrow">PLACE DETAILS</span><h2>{place.id ? '장소 수정' : '새 장소 추가'}</h2></div><button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" /></button></header>
        <div className="form-grid">
          <label className="full"><span>장소명 <em>*</em></span><input autoFocus value={form.name} onChange={e => update('name', e.target.value)} placeholder="예: Sagrada Família" required /></label>
          <label><span>카테고리 <em>*</em></span><select value={form.category} onChange={e => update('category', e.target.value)}>{Object.entries(categoryLabels).filter(([id]) => id !== 'all').map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <label className="visited-field"><span>방문 여부</span><button type="button" className={form.visited ? 'active' : ''} onClick={() => update('visited', !form.visited)}><Icon name="check" size={16} /> {form.visited ? '다녀옴' : '못 다녀옴'}</button></label>
          <label className="full"><span>메모</span><textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="방문 팁이나 기억할 내용을 적어두세요." rows="3" /></label>
          <label className="full"><span>Google Maps URL</span><div className="input-with-icon"><Icon name="map" size={17}/><input value={form.mapUrl} onChange={e => update('mapUrl', e.target.value)} placeholder="https://maps.app.goo.gl/..." /></div></label>
          <fieldset className="full"><legend>우선순위</legend><div className="priority-options">{[[1,'여유롭게'],[2,'추천'],[3,'꼭 가기']].map(([value,label]) => <button type="button" key={value} className={form.priority === value ? 'active' : ''} onClick={() => update('priority', value)}><span>{'◆'.repeat(value)}</span>{label}</button>)}</div></fieldset>
        </div>
        <footer><button type="button" className="cancel-button" onClick={onClose}>취소</button><button className="primary-button" type="submit">{place.id ? '변경사항 저장' : '장소 저장'}</button></footer>
      </form>
    </div>
  )
}

function ConfirmDelete({ place, onClose, onConfirm }) {
  return <div className="modal-backdrop"><div className="confirm-modal"><div className="delete-icon"><Icon name="trash" /></div><h2>이 장소를 삭제할까요?</h2><p><strong>{place.name}</strong>의 메모와 방문 정보가 함께 삭제됩니다.</p><div><button className="cancel-button" onClick={onClose}>취소</button><button className="danger-button" onClick={onConfirm}>삭제하기</button></div></div></div>
}

function Bookings({ cities, tickets, setTickets, session, isOnline, notify }) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [offlineTicketIds, setOfflineTicketIds] = useState([])

  useEffect(() => {
    getOfflineTicketIds().then(setOfflineTicketIds).catch(() => {})
  }, [tickets])

  const handleUpload = async (values) => {
    setBusy(true)
    try {
      const ticket = await uploadTicket(values)
      const savedOffline = await saveOfflineTicket(ticket, values.file).then(() => true).catch(() => false)
      setTickets(current => [...current.filter(item => !item.localOnly), ticket])
      if (savedOffline) setOfflineTicketIds(current => [...new Set([...current, String(ticket.id)])])
      setUploadOpen(false)
      notify(savedOffline ? '티켓을 DB와 이 기기에 저장했어요.' : '티켓을 DB에 저장했어요.')
    } catch (error) {
      notify(error.message || '티켓 업로드에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  const openTicket = async (ticket) => {
    const offlineTicket = await getOfflineTicket(ticket.id).catch(() => null)
    if (offlineTicket) {
      openOfflineTicket(offlineTicket)
      return
    }
    if (!isOnline) {
      notify('이 티켓은 온라인에서 먼저 오프라인 저장해 주세요.')
      return
    }
    if (!ticket.storage_path) {
      notify('먼저 티켓 파일을 업로드해 주세요.')
      return
    }
    try {
      const url = await getTicketUrl(ticket.storage_path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      notify(error.message || '티켓을 열지 못했어요.')
    }
  }

  const cacheTicket = async (ticket) => {
    if (!isOnline) {
      notify('티켓 저장은 인터넷 연결 후 진행할 수 있어요.')
      return
    }
    setBusy(true)
    try {
      const url = await getTicketUrl(ticket.storage_path)
      await downloadOfflineTicket(ticket, url)
      setOfflineTicketIds(current => [...new Set([...current, String(ticket.id)])])
      notify('이 기기에서 티켓을 오프라인으로 열 수 있어요.')
    } catch (error) {
      notify(error.message || '티켓 오프라인 저장에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  const canUseCloud = isSupabaseConfigured && session && isOnline
  const ticketGroups = useMemo(() => {
    const groups = new Map()
    tickets.forEach(ticket => {
      const cityValue = String(ticket.city || '').trim().toLowerCase()
      const matchedCity = cities.find(city => [city.id, city.name, city.ko].some(value => String(value || '').toLowerCase() === cityValue))
      const matchedCountry = COUNTRY_OPTIONS.find(country => country.name.toLowerCase() === cityValue || country.ko === ticket.city)
      const country = matchedCity?.country || matchedCountry?.name || '기타'
      const flag = matchedCity?.flag || matchedCountry?.flag || '🌍'
      if (!groups.has(country)) groups.set(country, { country, flag, tickets: [] })
      groups.get(country).tickets.push(ticket)
    })
    return [...groups.values()].sort((a, b) => a.country === '기타' ? 1 : b.country === '기타' ? -1 : a.country.localeCompare(b.country))
  }, [tickets, cities])

  return (
    <div className="page">
      <SectionHead eyebrow="PRIVATE TICKET VAULT" title="예약 · 티켓" description="PDF와 이미지 티켓을 비공개 클라우드에 보관하고 어느 기기에서든 열어보세요." action={<button className="primary-button" disabled={!canUseCloud} onClick={() => setUploadOpen(true)}><Icon name="upload" size={18} /> 티켓 업로드</button>} />
      <div className={`cloud-notice ${canUseCloud ? 'ready' : ''}`}>
        <span><Icon name={canUseCloud ? 'cloud' : 'database'} /></span>
        <div><strong>{canUseCloud ? `${session.user.email} 계정에 안전하게 저장됩니다` : '클라우드 연결이 필요해요'}</strong><p>{canUseCloud ? '파일은 비공개 Storage에 저장되며 5분 동안 유효한 링크로만 열립니다.' : '준비 메뉴에서 Supabase를 연결하고 이메일로 로그인해 주세요.'}</p></div>
      </div>
      <div className="ticket-country-list">{ticketGroups.map(group => (
        <details className="ticket-country-group" key={group.country}>
          <summary><span><b>{group.flag}</b><strong>{group.country}</strong></span><span>{group.tickets.length}개 <Icon name="chevron" size={15} /></span></summary>
          <div className="ticket-grid">{group.tickets.map(item => {
            const date = item.event_date ? new Date(`${item.event_date}T00:00:00`).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : '날짜 미정'
            const isOfflineReady = offlineTicketIds.includes(String(item.id))
            return <article className="ticket-card" key={item.id || item.title}><div className="ticket-side"><Icon name="ticket" size={17} /><span>{isOfflineReady ? 'OFFLINE' : item.storage_path ? 'BACKUP' : 'UPLOAD'}</span></div><div className="ticket-main"><span>{item.city || '여행 티켓'}</span><h3>{item.title}</h3><p>{date}{item.file_name ? ` · ${item.file_name}` : ''}</p><div><span className={`status-chip ${item.storage_path ? 'reserved' : ''}`}>{isOfflineReady ? '오프라인 저장됨' : item.storage_path ? 'DB 저장 완료' : '파일 업로드 필요'}</span><div className="ticket-actions">{item.storage_path && session && !isOfflineReady && <button disabled={!isOnline || busy} onClick={() => cacheTicket(item)}><Icon name="download" size={13}/> 오프라인 저장</button>}<button disabled={(!item.storage_path || !session) && !isOfflineReady} onClick={() => openTicket(item)}>티켓 열기 <Icon name="external" size={13}/></button></div></div></div></article>
          })}</div>
        </details>
      ))}</div>
      {uploadOpen && <TicketUploadEditor busy={busy} onClose={() => setUploadOpen(false)} onSave={handleUpload} />}
    </div>
  )
}

function TicketUploadEditor({ busy, onClose, onSave }) {
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({ title: '', city: '', eventDate: '' })
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const submit = (event) => {
    event.preventDefault()
    if (file && form.title.trim()) onSave({ ...form, file })
  }
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><form className="place-editor" onSubmit={submit}><header><div><span className="eyebrow">SECURE UPLOAD</span><h2>티켓 업로드</h2></div><button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" /></button></header><div className="form-grid"><label className="full"><span>티켓 이름 <em>*</em></span><input autoFocus value={form.title} onChange={event => update('title', event.target.value)} placeholder="예: 알함브라 궁전 입장권" required /></label><label><span>도시</span><input value={form.city} onChange={event => update('city', event.target.value)} placeholder="예: Granada" /></label><label><span>사용일</span><input type="date" value={form.eventDate} onChange={event => update('eventDate', event.target.value)} /></label><label className="full ticket-file-field"><span>파일 <em>*</em></span><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event => setFile(event.target.files?.[0] || null)} required /><small>PDF, JPG, PNG, WebP · 최대 20MB</small></label></div><footer><button type="button" className="cancel-button" onClick={onClose}>취소</button><button className="primary-button" type="submit" disabled={busy || !file || !form.title.trim()}>{busy ? '업로드 중…' : 'DB에 저장'}</button></footer></form></div>
}

function PwaPanel({ pwa, notify }) {
  const install = async () => {
    const accepted = await pwa.install()
    notify(accepted ? '유럽 앱을 설치했어요.' : '앱 설치를 다음에 진행할 수 있어요.')
  }

  return (
    <section className={`pwa-panel ${pwa.isOnline ? '' : 'offline'}`}>
      <div className="pwa-heading">
        <span><Icon name={pwa.isOnline ? 'download' : 'cloud'} /></span>
        <div>
          <strong>{pwa.isInstalled ? '오프라인 앱 설치 완료' : '휴대전화 · PC에 앱 설치'}</strong>
          <p>{pwa.isInstalled ? '인터넷이 없어도 일정과 장소를 열고 수정할 수 있어요.' : '온라인에서 한 번 설치하면 앱 화면과 이 기기의 여행 데이터를 오프라인에서도 사용할 수 있어요.'}</p>
        </div>
      </div>
      <div className="pwa-actions">
        <span className={`pwa-status ${pwa.isOnline ? 'online' : ''}`}><i /> {pwa.isOnline ? '온라인' : '오프라인 사용 중'}</span>
        {pwa.canInstall && !pwa.isInstalled && <button className="primary-button" onClick={install}><Icon name="download" size={17} /> 앱 설치</button>}
        {!pwa.canInstall && !pwa.isInstalled && <small>{pwa.registrationReady ? pwa.installHelp : '배포된 HTTPS 주소에서 설치할 수 있어요.'}</small>}
        {pwa.updateReady && <button className="secondary-button" onClick={pwa.applyUpdate}>새 버전 적용</button>}
      </div>
    </section>
  )
}

function Prep({ cities, places, events, tickets, prepItems, setPrepItems, session, pwa, onRestore, notify }) {
  const [newItem, setNewItem] = useState('')
  const completedCount = prepItems.filter(item => item.completed).length
  const progress = prepItems.length ? completedCount / prepItems.length * 100 : 0

  const addItem = event => {
    event.preventDefault()
    const text = newItem.trim()
    if (!text) return
    const id = window.crypto?.randomUUID?.() || `prep-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setPrepItems(current => [...current, { id, text, completed: false }])
    setNewItem('')
    notify('여행 준비 항목을 추가했어요.')
  }

  const toggleItem = id => {
    setPrepItems(current => current.map(item => item.id === id ? { ...item, completed: !item.completed } : item))
  }

  const deleteItem = item => {
    setPrepItems(current => current.filter(currentItem => currentItem.id !== item.id))
    notify('여행 준비 항목을 삭제했어요.')
  }

  return <div className="page"><SectionHead eyebrow="BACKUP & PREP" title="준비" description="기기 분실에 대비해 여행 데이터를 백업하고 출발 준비를 확인하세요." /><div className="prep-grid"><PwaPanel pwa={pwa} notify={notify} /><CloudBackupPanel session={session} isOnline={pwa.isOnline} payload={{ cities, places, events, tickets, prepItems }} onRestore={onRestore} notify={notify} /><section className="checklist-panel"><div className="check-progress"><div><strong>{completedCount}/{prepItems.length}</strong><span>완료</span></div><div><i style={{width: `${progress}%`}} /></div></div><form className="check-add-form" onSubmit={addItem}><input value={newItem} onChange={event => setNewItem(event.target.value)} placeholder="준비할 항목을 하나씩 입력하세요" aria-label="여행 준비 항목" /><button className="primary-button" disabled={!newItem.trim()}><Icon name="plus" size={16} /> 추가</button></form>{prepItems.length ? prepItems.map(item => <div className={`check-row ${item.completed ? 'checked' : ''}`} key={item.id}><label className="check-main"><input type="checkbox" checked={item.completed} onChange={() => toggleItem(item.id)} /><span><Icon name="check" size={15}/></span><strong>{item.text}</strong></label><small>{item.completed ? '완료했어요' : '출발 전 확인'}</small><button type="button" className="check-delete" onClick={() => deleteItem(item)} aria-label={`${item.text} 삭제`}><Icon name="trash" size={15} /></button></div>) : <div className="check-empty">아직 준비 항목이 없어요.</div>}</section></div></div>
}

function CloudBackupPanel({ session, isOnline, payload, onRestore, notify }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [lastBackup, setLastBackup] = useState('')

  const run = async (name, action) => {
    if (!isOnline) {
      notify('클라우드 기능은 인터넷 연결 후 사용할 수 있어요.')
      return
    }
    setBusy(name)
    try { await action() } catch (error) { notify(error.message || '클라우드 작업에 실패했어요.') } finally { setBusy('') }
  }

  const requestLogin = (event) => {
    event.preventDefault()
    run('login', async () => { await sendMagicLink(email); setMagicSent(true); notify('로그인 링크를 이메일로 보냈어요.') })
  }

  const uploadBackup = () => run('backup', async () => {
    const result = await backupTrip(payload)
    setLastBackup(result.updated_at)
    notify('현재 데이터를 DB에 백업했어요.')
  })

  const downloadBackup = () => run('restore', async () => {
    if (!window.confirm('현재 기기의 데이터를 클라우드 백업으로 바꿀까요?')) return
    const result = await restoreTrip()
    onRestore(result.payload)
    setLastBackup(result.updated_at)
    notify('클라우드 백업을 이 기기로 내려받았어요.')
  })

  return <section className="backup-panel"><div className="backup-heading"><span><Icon name="database" /></span><div><strong>데이터 백업</strong><p>전체 일정, 도시와 장소는 기기에 자동 저장되고, 원하는 시점에 DB로 백업됩니다.</p></div></div>{!isOnline && <div className="offline-message">현재 오프라인입니다. 입력한 내용은 이 기기에 계속 자동 저장됩니다.</div>}{!isSupabaseConfigured ? <div className="setup-message"><strong>기존 Supabase DB 연결 정보가 필요합니다</strong><p><code>.env</code>에 기존 프로젝트 URL과 Publishable Key를 넣고 아래 migration을 한 번 실행하세요. 여행 앱 전용 테이블 2개만 추가됩니다.</p><code>supabase/migrations/202608120001_backup_and_tickets.sql</code></div> : !session ? <form className="login-form" onSubmit={requestLogin}><label><span>백업 계정 이메일</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required /></label><button className="primary-button" disabled={!isOnline || busy === 'login'}>{busy === 'login' ? '보내는 중…' : '로그인 링크 받기'}</button>{magicSent && <p>이메일의 링크를 열면 이 기기와 태블릿에서 같은 백업을 사용할 수 있어요.</p>}</form> : <div className="backup-ready"><div className="signed-in-row"><span><Icon name="users" size={17} /></span><div><strong>{session.user.email}</strong><small>{lastBackup ? `마지막 백업 ${new Date(lastBackup).toLocaleString('ko-KR')}` : '아직 수동 백업하지 않았어요'}</small></div><button disabled={!isOnline} onClick={() => run('logout', signOutLocal)}>로그아웃</button></div><div className="backup-actions"><button className="primary-button" disabled={!isOnline || Boolean(busy)} onClick={uploadBackup}><Icon name="upload" size={17} /> 지금 DB에 백업</button><button className="secondary-button" disabled={!isOnline || Boolean(busy)} onClick={downloadBackup}><Icon name="download" size={17} /> 백업 내려받기</button></div></div>}<div className="backup-foot"><span><Icon name="check" size={14} /> 이 기기에는 항상 자동 저장</span><span><Icon name="cloud" size={14} /> DB 백업은 온라인에서만</span></div></section>
}

export default App
