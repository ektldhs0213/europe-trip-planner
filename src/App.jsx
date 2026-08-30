import { useEffect, useMemo, useRef, useState } from 'react'
import { loadLocalTrip, saveLocalTrip } from './lib/localStore.js'
import { deleteOfflineTicket, downloadOfflineTicket, getOfflineTicket, getOfflineTicketIds, openOfflineTicket, saveOfflineTicket } from './lib/offlineTickets.js'
import { backupTrip, deleteTicket, fetchTickets, fetchTranslationUsage, getTicketUrl, isSupabaseConfigured, restoreTrip, sendMagicLink, signOutLocal, supabase, translateTravelText, uploadTicket } from './lib/supabase.js'
import { usePwa } from './lib/usePwa.js'
import { addDeletion, ensureRecordTimestamps, isSafeHttpUrl, mergeTripPayloads, normalizeDeletions, touchRecord } from './lib/tripData.js'
import { BATCH_CITY_SEED, BATCH_PLACE_SEED } from './placeBatch20260816.js'

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
  copy: ['M9 9h11v11H9Z', 'M4 15H3V4h11v1'],
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
  { id: 'misc', label: '기타', icon: 'backpack' },
  { id: 'settings', label: '환경설정', icon: 'database' },
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

const LISBON_PLACE_SEED = [
  ['rossio-square', '호시우 광장', 'attraction', '리스본 중심광장', 'Rossio+Square+Lisbon', 'tour-planned'],
  ['sao-domingos', '상도밍고 성당', 'attraction', '화재 흔적 성당', 'Igreja+de+Sao+Domingos+Lisbon', 'tour-planned'],
  ['alfama', '알파마 지구', 'attraction', '최고령 구시가지', 'Alfama+Lisbon', 'tour-planned'],
  ['portas-do-sol', '포르타스 두 솔 전망대', 'attraction', '알파마 전망명소', 'Miradouro+das+Portas+do+Sol+Lisbon', 'tour-planned'],
  ['santa-luzia', '산타루치아 전망대', 'attraction', '타일장식 전망대', 'Miradouro+de+Santa+Luzia+Lisbon', 'tour-planned'],
  ['cathedral', '리스본 대성당', 'attraction', '리스본 대표성당', 'Lisbon+Cathedral', 'tour-planned'],
  ['saramago-foundation', '주제 사라마구 재단', 'attraction', '노벨문학상 작가', 'Fundacao+Jose+Saramago+Lisbon', 'tour-planned'],
  ['conceicao-velha', '콘세이샹 벨라 성당', 'attraction', '마누엘 양식성당', 'Igreja+da+Conceicao+Velha+Lisbon', 'tour-planned'],
  ['comercio-square', '코메르시우 광장', 'attraction', '테주강 대표광장', 'Praca+do+Comercio+Lisbon', 'tour-planned'],
  ['time-out-market', '타임아웃 마켓', 'restaurant', '포르투갈 음식', 'Time+Out+Market+Lisboa', 'tour-planned'],
  ['camoes-square', '카몽이스 광장', 'attraction', '시아두 중심광장', 'Praca+Luis+de+Camoes+Lisbon', 'tour-planned'],
  ['bertrand', '베르트랑 서점', 'other', '세계 최고령 서점', 'Livraria+Bertrand+Chiado+Lisbon', 'tour-planned'],
  ['a-brasileira', '아 브라질레이라', 'cafe', '비카·파스텔', 'A+Brasileira+Lisbon', 'tour-planned'],
  ['carmo-convent', '카르무 수도원', 'attraction', '대지진 흔적', 'Carmo+Convent+Lisbon', 'tour-planned'],
  ['sao-pedro-viewpoint', '상페드로 알칸타라 전망대', 'attraction', '대표 야경명소', 'Miradouro+de+Sao+Pedro+de+Alcantara+Lisbon', 'tour-planned'],
  ['jeronimos', '제로니무스 수도원', 'attraction', '마누엘 양식걸작', 'Jeronimos+Monastery+Lisbon', 'visit-needed'],
  ['belem-tower', '벨렝탑', 'attraction', '대항해시대 상징', 'Belem+Tower+Lisbon', 'visit-needed'],
  ['discoveries-monument', '발견기념비', 'attraction', '대항해시대 기념', 'Padrao+dos+Descobrimentos+Lisbon', 'visit-needed'],
  ['sao-jorge-castle', '상조르즈 성', 'attraction', '리스본 성곽전망', 'Castelo+de+Sao+Jorge+Lisbon', 'visit-needed'],
  ['santa-justa-lift', '산타주스타 엘리베이터', 'attraction', '철제 전망승강기', 'Santa+Justa+Lift+Lisbon', 'visit-needed'],
  ['pasteis-de-belem', '파스테이스 드 벨렝', 'restaurant', '에그타르트', 'Pasteis+de+Belem+Lisbon', 'visit-needed'],
  ['o-velho-eurico', '오 벨류 에우리쿠', 'restaurant', '바칼라우·문어요리', 'O+Velho+Eurico+Lisbon', 'visit-needed'],
  ['bifanas-afonso', '아스 비파나스 두 아폰수', 'restaurant', '비파나', 'As+Bifanas+do+Afonso+Lisbon', 'visit-needed'],
  ['manteigaria', '만테이가리아', 'cafe', '에그타르트·커피', 'Manteigaria+Rua+do+Loreto+Lisbon', 'visit-needed'],
  ['red-frog', '레드 프로그', 'bar', '시그니처 칵테일', 'Red+Frog+Lisbon', 'visit-needed'],
].map(([slug, name, category, description, query, visitStatus]) => ({
  id: `lisbon-${slug}`, city: 'lisbon', name, category, description,
  mapUrl: `https://www.google.com/maps/search/?api=1&query=${query}`,
  priority: 2, visitStatus, visited: false, reservation: false, duration: '', visitDate: '', meta: '',
}))

const initialPlaces = [
  { id: 1, city: 'barcelona', name: 'Sagrada Família', category: 'attraction', description: '가우디의 미완성 대성당. 오전 첫 타임으로 예약하기.', priority: 3, visited: false, mapUrl: 'https://maps.google.com/?q=Sagrada+Familia', reservation: true, duration: '2시간', visitDate: '2026-09-16', meta: '9월 16일 09:00' },
  { id: 2, city: 'barcelona', name: 'Bodega Biarritz 1881', category: 'restaurant', description: '고딕 지구의 작은 타파스 바. 혼자 방문하기 좋음.', priority: 3, visited: false, mapUrl: 'https://maps.google.com/?q=Bodega+Biarritz+1881', reservation: false, duration: '1.5시간', visitDate: '', meta: '타파스 · €€' },
  { id: 3, city: 'barcelona', name: 'Casa Batlló', category: 'attraction', description: '빛이 가장 예쁜 늦은 오후 시간대로 방문.', priority: 2, visited: false, mapUrl: 'https://maps.google.com/?q=Casa+Batllo', reservation: true, duration: '1.5시간', visitDate: '2026-09-17', meta: '9월 17일 15:45' },
  { id: 4, city: 'barcelona', name: 'Nomad Coffee Lab', category: 'cafe', description: '엘 보른 산책 중 들를 스페셜티 커피 로스터리.', priority: 2, visited: false, mapUrl: 'https://maps.google.com/?q=Nomad+Coffee+Lab+Barcelona', reservation: false, duration: '1시간', visitDate: '', meta: '커피 · €' },
  { id: 5, city: 'barcelona', name: 'La Boqueria', category: 'other', description: '아침 일찍 방문해 시장 구경과 간단한 식사.', priority: 1, visited: false, mapUrl: 'https://maps.google.com/?q=La+Boqueria', reservation: false, duration: '1시간', visitDate: '', meta: '마켓 · 오전 추천' },
  { id: 6, city: 'barcelona', name: 'Paradiso', category: 'bar', description: '숨겨진 입구로 들어가는 칵테일 바.', priority: 2, visited: true, mapUrl: 'https://maps.google.com/?q=Paradiso+Barcelona', reservation: false, duration: '2시간', visitDate: '2026-09-15', meta: '칵테일 · €€€' },
  ...LISBON_PLACE_SEED,
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
  { id: 'event-0909-sevilla-tour', date: '09.09', day: '수', city: '세비야', time: '미정', end: '16:00', title: '세비야 시내 투어', desc: '세비야 대성당 내부 입장 포함 투어 / 정확한 시작·종료시간 확인 필요', type: 'tour', status: '예매 필요' },
  { id: 'event-0909-ronda-tour', date: '09.09', day: '수', city: '론다', time: '16:00', end: '미정', title: '론다 일몰·야경 투어', desc: '세비야 출발 → 론다 관광 → 일몰·야경 → 세비야 복귀 / 앞 투어와 연결시간 확인 필요', type: 'tour', status: '예매 필요' },
  { id: 'event-0910-alcazar', date: '09.10', day: '목', city: '세비야', time: '09:30', end: '12:30', title: '알카사르 궁전', desc: '알카사르 궁전 내부 및 정원 자유관람', type: 'pin', status: '예매 필요' },
  { id: 'event-0910-sevilla-free', date: '09.10', day: '목', city: '세비야', time: '13:00', end: '21:00', title: '세비야 자유여행', desc: '스페인광장·트리아나·메트로폴 파라솔 등 미방문 장소 자유관광', type: 'pin', status: '예매 불필요' },
  { id: 'event-0911-rental-pickup', date: '09.11', day: '금', city: '세비야', time: '09:30', end: '10:00', title: '렌터카 픽업', desc: '세비야에서 렌터카 수령 / 이후 스페인 로드트립', type: 'transport', status: '예매 필요' },
  { id: 'event-0911-drive-nerja', date: '09.11', day: '금', city: '네르하', time: '10:00', end: '12:30', title: '세비야 → 네르하', desc: '렌터카 이동', type: 'transport', status: '예매 불필요' },
  { id: 'event-0911-nerja-tour', date: '09.11', day: '금', city: '네르하', time: '12:30', end: '19:30', title: '네르하 관광', desc: '네르하 동굴·구시가지·발콘 데 에우로파·해변 등', type: 'pin', status: '예매 불필요' },
  { id: 'event-0911-nerja-sunset', date: '09.11', day: '금', city: '네르하', time: '19:30', end: '20:00', title: '네르하 일몰', desc: '지중해 일몰 및 매직아워 감상', type: 'pin', status: '예매 불필요' },
  { id: 'event-0911-drive-granada', date: '09.11', day: '금', city: '그라나다', time: '20:00', end: '21:15', title: '네르하 → 그라나다', desc: '일몰 후 렌터카로 그라나다 이동', type: 'transport', status: '예매 불필요' },
  { id: 'event-0911-granada-checkin', date: '09.11', day: '금', city: '그라나다', time: '21:30', end: '22:00', title: '숙소 체크인', desc: '다음날 오전 알함브라 일정 / 그라나다 숙박', type: 'pin', status: '예매 필요' },
  { id: 'event-0912-alhambra', date: '09.12', day: '토', city: '그라나다', time: '09:00', end: '13:00', title: '알함브라 궁전 투어', desc: '나스리 궁전 09:00 입장 / 알함브라 궁전 가이드 투어', type: 'tour', status: '예매 완료' },
  { id: 'event-0912-granada-tour', date: '09.12', day: '토', city: '그라나다', time: '14:00', end: '20:00', title: '그라나다 시내 관광', desc: '대성당·알바이신·산 니콜라스 전망대 등', type: 'pin', status: '예매 불필요' },
  { id: 'event-0913-roadtrip-move', date: '09.13', day: '일', city: '미정', time: '미정', end: '미정', title: '그라나다 → 바르셀로나 방향 이동', desc: '렌터카 로드트립 / 경유지 및 숙박지역 결정 필요', type: 'transport', status: '예매 불필요' },
  { id: 'event-0913-east-roadtrip', date: '09.13', day: '일', city: '미정', time: '미정', end: '미정', title: '스페인 동부 로드트립', desc: '경유 도시 관광 / 목적지 결정 필요', type: 'pin', status: '예매 불필요' },
  { id: 'event-0914-roadtrip-move', date: '09.14', day: '월', city: '미정', time: '미정', end: '미정', title: '바르셀로나 방향 이동', desc: '렌터카 이동 / 9/14 바르셀로나 조기 도착안 검토', type: 'transport', status: '예매 불필요' },
  { id: 'event-0914-east-roadtrip', date: '09.14', day: '월', city: '미정', time: '미정', end: '미정', title: '스페인 동부 로드트립', desc: '경유지 또는 바르셀로나 자유관광', type: 'pin', status: '예매 불필요' },
  { id: 'event-0915-barcelona-arrival', date: '09.15', day: '화', city: '바르셀로나', time: '미정', end: '미정', title: '바르셀로나 도착', desc: '렌터카 반납 / 도착일을 9/14로 당기는 안도 검토 중', type: 'transport', status: '예매 불필요' },
  { id: 'event-0915-barcelona-checkin', date: '09.15', day: '화', city: '바르셀로나', time: '미정', end: '미정', title: '숙소 체크인', desc: '바르셀로나 숙소', type: 'pin', status: '예매 필요' },
  { id: 'event-0916-sagrada', date: '09.16', day: '수', city: '바르셀로나', time: '10:30', end: '미정', title: '사그라다 파밀리아', desc: '성당 입장 + 탄생의 파사드 타워', type: 'pin', status: '예매 완료' },
  { id: 'event-0916-barcelona-match', date: '09.16', day: '수', city: '바르셀로나', time: '21:00', end: '23:00', title: 'FC 바르셀로나 경기', desc: 'FC 바르셀로나 vs 라싱 산탄데르 / 1st Grandstand Basic Plus', type: 'pin', status: '예매 완료' },
  { id: 'event-0917-casa-mila', date: '09.17', day: '목', city: '바르셀로나', time: '13:30', end: '15:00', title: '카사 밀라', desc: 'La Pedrera 입장 + 오디오가이드', type: 'pin', status: '예매 완료' },
  { id: 'event-0917-casa-batllo', date: '09.17', day: '목', city: '바르셀로나', time: '15:45', end: '17:15', title: '카사 바트요', desc: 'Casa Batlló Silver 티켓', type: 'pin', status: '예매 완료' },
  { id: 'event-0917-sagrada-rooftop', date: '09.17', day: '목', city: '바르셀로나', time: '미정', end: '미정', title: '사그라다 파밀리아 뷰 루프탑', desc: 'Sercotel Rosellón 루프탑 바 / 9월 17일 저녁 이용 예정', type: 'pin', status: '예매 필요' },
  { id: 'event-flight-out', date: '10.08', day: '목', city: 'Helsinki', time: '17:30', end: '—', title: 'Helsinki → Seoul', desc: 'HEL · AY041 · ICN', type: 'transport', status: '예매 완료' },
]

const TRIP_YEAR = 2026
const SCHEDULE_DATA_VERSION = 3
const KOREAN_DAYS = ['일', '월', '화', '수', '목', '금', '토']

function normalizeScheduleStatus(status) {
  const value = String(status || '')
  if (value === '예매 필요' || value === '예매 불필요' || value === '예매 완료') return value
  if (/완료|저장|발권/.test(value)) return '예매 완료'
  if (/불필요/.test(value)) return '예매 불필요'
  return '예매 필요'
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
  const existing = new Map(normalizeEvents(items).map(event => [String(event.id), event]))
  INITIAL_EVENTS.forEach(event => {
    if (!existing.has(String(event.id))) existing.set(String(event.id), event)
  })
  return normalizeEvents([...existing.values()])
}

const categoryLabels = {
  all: '전체', attraction: '관광지', restaurant: '맛집', cafe: '카페', bar: 'Bar', accommodation: '숙소', other: '기타',
}

const PLACE_VISIT_STATUSES = ['tour-planned', 'tour-completed', 'visit-needed', 'visit-completed']
const placeVisitLabels = { 'tour-planned': '투어 예정', 'tour-completed': '투어 완료', 'visit-needed': '방문 필요', 'visit-completed': '방문 완료' }

function normalizePlace(place) {
  const legacyStatusMap = { tour: 'tour-planned', needed: 'visit-needed', completed: 'visit-completed' }
  const visitStatus = PLACE_VISIT_STATUSES.includes(place.visitStatus)
    ? place.visitStatus
    : legacyStatusMap[place.visitStatus] || ((place.visited ?? place.status === 'visited') ? 'visit-completed' : 'visit-needed')
  return {
    ...place,
    category: place.category === 'shopping' ? 'other' : place.category,
    visitStatus,
    visited: visitStatus === 'visit-completed' || visitStatus === 'tour-completed',
  }
}

const PLACE_DATA_VERSION = 2

function migrateCities(cities, dataVersion) {
  const current = Array.isArray(cities) ? cities : []
  if (Number(dataVersion) >= PLACE_DATA_VERSION) return current
  const seen = new Set(current.map(city => city.id))
  return [...current, ...BATCH_CITY_SEED.filter(city => !seen.has(city.id))]
}

function migratePlaces(places, dataVersion) {
  const normalized = (Array.isArray(places) ? places : []).map(normalizePlace)
  if (Number(dataVersion) >= PLACE_DATA_VERSION) return normalized
  const seen = new Set(normalized.map(place => `${place.city}::${place.name.trim().toLowerCase()}`))
  const additions = []
  for (const place of [...LISBON_PLACE_SEED, ...BATCH_PLACE_SEED]) {
    const key = `${place.city}::${place.name.trim().toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    additions.push(place)
  }
  return [...normalized, ...additions.map(normalizePlace)]
}

const BULK_CATEGORY_MAP = {
  '관광지': 'attraction', attraction: 'attraction',
  '맛집': 'restaurant', restaurant: 'restaurant',
  '카페': 'cafe', cafe: 'cafe',
  bar: 'bar', '바': 'bar',
  '숙소': 'accommodation', accommodation: 'accommodation', hotel: 'accommodation',
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
        ...(item._updatedAt ? { _updatedAt: item._updatedAt } : {}),
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
  const initialRecordTime = cachedTrip?.savedAt || '2026-08-24T00:00:00.000Z'
  const [view, setView] = useState('schedule')
  const [selectedCity, setSelectedCity] = useState('barcelona')
  const [cities, setCities] = useState(() => ensureRecordTimestamps(migrateCities(cachedTrip?.cities || INITIAL_CITIES, cachedTrip?.placeDataVersion), initialRecordTime))
  const [places, setPlaces] = useState(() => ensureRecordTimestamps(migratePlaces(cachedTrip?.places || initialPlaces, cachedTrip?.placeDataVersion), initialRecordTime))
  const [events, setEvents] = useState(() => ensureRecordTimestamps(migrateScheduleEvents(cachedTrip?.events || INITIAL_EVENTS, cachedTrip?.scheduleDataVersion), initialRecordTime))
  const [tickets, setTickets] = useState(() => ensureRecordTimestamps(cachedTrip?.tickets || INITIAL_TICKETS, initialRecordTime))
  const [prepItems, setPrepItems] = useState(() => ensureRecordTimestamps(normalizePrepItems(cachedTrip), initialRecordTime))
  const [deletedRecords, setDeletedRecords] = useState(() => normalizeDeletions(cachedTrip?.deletedRecords))
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState(() => cachedTrip?.lastCloudSyncAt || '')
  const [session, setSession] = useState(null)
  const [toast, setToast] = useState('')
  const localSavedAtRef = useRef(cachedTrip?.savedAt || null)
  const initialLocalSaveSkippedRef = useRef(false)
  const syncInFlightRef = useRef(false)
  const tripPayloadRef = useRef(null)
  const lastCloudSyncAtRef = useRef(lastCloudSyncAt)

  tripPayloadRef.current = {
    cities,
    places,
    events,
    tickets,
    prepItems,
    deletedRecords,
    lastCloudSyncAt,
    scheduleDataVersion: SCHEDULE_DATA_VERSION,
    placeDataVersion: PLACE_DATA_VERSION,
  }

  const markDeleted = (collection, id) => setDeletedRecords(current => addDeletion(current, collection, id))

  useEffect(() => {
    if (!initialLocalSaveSkippedRef.current) {
      initialLocalSaveSkippedRef.current = true
      return
    }
    localSavedAtRef.current = saveLocalTrip(tripPayloadRef.current)
  }, [cities, places, events, tickets, prepItems, deletedRecords, lastCloudSyncAt])

  useEffect(() => {
    lastCloudSyncAtRef.current = lastCloudSyncAt
  }, [lastCloudSyncAt])

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session || !pwa.isOnline) return
    fetchTickets().then(remoteTickets => {
      if (remoteTickets.length) setTickets(remoteTickets.map(ticket => touchRecord(ticket, ticket.updated_at || ticket.created_at)))
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

  const restoreLocalData = (payload, options = {}) => {
    const nextPayload = options.merge
      ? mergeTripPayloads(tripPayloadRef.current, payload, {
          localSavedAt: localSavedAtRef.current,
          remoteSavedAt: options.remoteUpdatedAt,
        })
      : payload
    if (Array.isArray(nextPayload?.cities)) setCities(migrateCities(nextPayload.cities, nextPayload.placeDataVersion))
    if (Array.isArray(nextPayload?.places)) setPlaces(migratePlaces(nextPayload.places, nextPayload.placeDataVersion))
    if (Array.isArray(nextPayload?.events)) setEvents(migrateScheduleEvents(nextPayload.events, nextPayload.scheduleDataVersion))
    if (Array.isArray(nextPayload?.tickets)) setTickets(nextPayload.tickets)
    if (Array.isArray(nextPayload?.prepItems) || Array.isArray(nextPayload?.checks)) setPrepItems(normalizePrepItems(nextPayload))
    setDeletedRecords(normalizeDeletions(nextPayload?.deletedRecords))
    if (options.remoteUpdatedAt) setLastCloudSyncAt(options.remoteUpdatedAt)
    return nextPayload
  }

  useEffect(() => {
    if (!session?.user?.id || !pwa.isOnline) return undefined
    let disposed = false

    const syncLatestBackup = async () => {
      if (syncInFlightRef.current || disposed || document.visibilityState === 'hidden') return
      syncInFlightRef.current = true
      try {
        const result = await restoreTrip()
        if (disposed) return
        const remoteTime = Date.parse(result.updated_at || '')
        const syncedTime = Date.parse(lastCloudSyncAtRef.current || '')
        if (!Number.isFinite(remoteTime) || (Number.isFinite(syncedTime) && remoteTime <= syncedTime)) return
        restoreLocalData(result.payload, { merge: true, remoteUpdatedAt: result.updated_at })
        notify('다른 기기의 최신 변경을 이 기기 데이터와 안전하게 병합했어요.')
      } catch {
      } finally {
        syncInFlightRef.current = false
      }
    }

    const handleVisibility = () => document.visibilityState === 'visible' && syncLatestBackup()
    syncLatestBackup()
    window.addEventListener('focus', syncLatestBackup)
    document.addEventListener('visibilitychange', handleVisibility)
    const timer = window.setInterval(syncLatestBackup, 60000)
    return () => {
      disposed = true
      window.removeEventListener('focus', syncLatestBackup)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.clearInterval(timer)
    }
  }, [session?.user?.id, pwa.isOnline])

  return (
    <div className="app-shell">
      <AppHeader view={view} onNavigate={navigate} session={session} ticketCount={tickets.length} isOnline={pwa.isOnline} />
      <main className="main-content">
        <div className="page-wrap">
          {view === 'schedule' && <Schedule events={events} setEvents={setEvents} markDeleted={markDeleted} notify={notify} />}
          {view === 'cities' && <Cities cities={cities} setCities={setCities} places={places} setPlaces={setPlaces} onNavigate={navigate} notify={notify} />}
          {view === 'city' && <CityDetail cityId={selectedCity} cities={cities} setCities={setCities} places={places} setPlaces={setPlaces} markDeleted={markDeleted} onBack={() => navigate('cities')} notify={notify} />}
          {view === 'bookings' && <Bookings cities={cities} tickets={tickets} setTickets={setTickets} markDeleted={markDeleted} session={session} isOnline={pwa.isOnline} notify={notify} />}
          {view === 'misc' && <Misc prepItems={prepItems} setPrepItems={setPrepItems} markDeleted={markDeleted} session={session} isOnline={pwa.isOnline} notify={notify} />}
          {view === 'settings' && <Settings cities={cities} places={places} events={events} tickets={tickets} prepItems={prepItems} deletedRecords={deletedRecords} lastCloudSyncAt={lastCloudSyncAt} session={session} pwa={pwa} onRestore={restoreLocalData} notify={notify} />}
        </div>
      </main>
      {pwa.updateReady && <div className="update-banner"><span>새 버전이 준비됐어요.</span><button type="button" onClick={pwa.applyUpdate}>지금 적용</button></div>}
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

function SectionHead({ eyebrow, title, description, action }) {
  return <div className="section-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}

function useEscapeClose(onClose) {
  useEffect(() => {
    const handleKeyDown = event => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
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
  const endMatch = String(event.end || '').match(/(\d{1,2}):(\d{2})/)
  const dateValue = dateMatch
    ? Number(dateMatch[1]) * 32 + Number(dateMatch[2])
    : Number.MAX_SAFE_INTEGER
  const timeValue = timeMatch
    ? Number(timeMatch[1]) * 60 + Number(timeMatch[2])
    : endMatch ? Math.max(0, Number(endMatch[1]) * 60 + Number(endMatch[2]) - 1) : 24 * 60

  return [dateValue, timeValue, originalIndex]
}

function Schedule({ events, setEvents, markDeleted, notify }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editor, setEditor] = useState(null)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [expandedDates, setExpandedDates] = useState(() => new Set())
  const visible = useMemo(() => events
    .map((event, originalIndex) => ({ event, sortKey: eventSortKey(event, originalIndex) }))
    .filter(({ event }) => {
      const typeMatches = filter === 'all' || event.type === filter
      const statusMatches = statusFilter === 'all' || event.status === statusFilter
      const searchText = `${event.title || ''} ${event.city || ''} ${event.desc || ''}`.toLowerCase()
      return typeMatches && statusMatches && searchText.includes(query.trim().toLowerCase())
    })
    .sort((a, b) => (
      a.sortKey[0] - b.sortKey[0]
      || a.sortKey[1] - b.sortKey[1]
      || a.sortKey[2] - b.sortKey[2]
    ))
    .map(({ event }) => event), [events, filter, query, statusFilter])
  const dateGroups = useMemo(() => visible.reduce((groups, event) => {
    const key = event.date || '날짜 미정'
    const group = groups.find(item => item.date === key)
    if (group) group.events.push(event)
    else groups.push({ date: key, day: scheduleDateParts(event.date)?.day || event.day, events: [event] })
    return groups
  }, []), [visible])

  const saveEvent = (form) => {
    if (editor?.id) {
      setEvents(current => current.map(event => event.id === editor.id ? touchRecord({ ...event, ...form }) : event))
      notify('일정 내용을 수정했어요.')
    } else {
      setEvents(current => [...current, touchRecord({ ...form, id: `event-${Date.now()}` })])
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

  const deleteEvent = (event) => {
    if (!window.confirm(`“${event.title}” 일정을 삭제할까요?`)) return
    setEvents(current => current.filter(item => item.id !== event.id))
    markDeleted('events', event.id)
    setEditor(null)
    notify('일정을 삭제했어요.')
  }

  const importEvents = (rows) => {
    const importedAt = Date.now()
    setEvents(current => [...current, ...rows.map((row, index) => touchRecord({ ...row, id: `event-${importedAt}-${index}` }))])
    setBulkImportOpen(false)
    notify(`${rows.length}개 일정을 일괄 추가했어요.`)
  }

  return (
    <div className="page">
      <SectionHead eyebrow="ITINERARY" title="전체 일정" description="날짜별로 일정을 펼쳐 보고 모든 내용을 직접 수정할 수 있어요." action={<div className="head-actions"><button className="secondary-button" onClick={() => setBulkImportOpen(true)}><Icon name="upload" size={17} /> 일정 일괄 추가</button><button className="primary-button" onClick={() => setEditor({})}><Icon name="plus" size={18} /> 일정 추가</button></div>} />
      <div className="filter-bar schedule-filters">
        {[['all','전체'],['transport','항공 · 교통'],['tour','투어'],['pin','방문']].map(([id, label]) => <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</button>)}
      </div>
      <div className="schedule-toolbar">
        <label className="search-field"><Icon name="search" size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="일정·도시·설명 검색" /></label>
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} aria-label="예매 상태 필터"><option value="all">전체 예매 상태</option><option value="예매 필요">예매 필요</option><option value="예매 불필요">예매 불필요</option><option value="예매 완료">예매 완료</option></select>
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
                  <div className="schedule-card"><div><span className="event-city">{event.city}</span><h3>{event.title}</h3><p>{event.desc}</p></div><div className="schedule-actions"><span className={`status-chip ${event.status === '예매 완료' ? 'reserved' : event.status === '예매 필요' ? 'needed' : ''}`}>{event.status}</span><button aria-label={`${event.title} 수정`} onClick={() => setEditor(event)}><Icon name="edit" size={16} /></button></div></div>
                </article>
              ))}
            </div>
          </details>
        ))}
        {!dateGroups.length && <div className="empty-state"><span><Icon name="search" /></span><h3>일정을 찾지 못했어요</h3><p>다른 검색어나 필터를 사용해 보세요.</p></div>}
      </div>
      {editor && <ScheduleEditor event={editor} onClose={() => setEditor(null)} onSave={saveEvent} onDelete={deleteEvent} />}
      {bulkImportOpen && <BulkScheduleImport events={events} onClose={() => setBulkImportOpen(false)} onImport={importEvents} />}
    </div>
  )
}

const BULK_SCHEDULE_TYPE_MAP = { '항공·교통': 'transport', '항공 · 교통': 'transport', '교통': 'transport', '투어': 'tour', '방문': 'pin' }

function parseBulkSchedule(text, events) {
  const seen = new Set(events.map(event => `${event.date}::${event.time}::${event.title.trim().toLowerCase()}`))
  return text.split(/\r?\n/).map((rawLine, index) => ({ rawLine: rawLine.trim(), lineNumber: index + 1 })).filter(item => item.rawLine).map(item => {
    if (/^(날짜|date)\s*(\/|\t)/i.test(item.rawLine)) return { ...item, header: true }
    const columns = item.rawLine.split('\t').map(value => value.trim())
    if (columns.length < 8) return { ...item, error: '날짜부터 상태까지 8개 열을 확인해 주세요.' }
    const [dateValue, time, end, city, typeValue, title, desc, statusValue] = columns
    const date = scheduleDateParts(dateValue)
    if (!date) return { ...item, error: `'${dateValue}' 날짜를 확인해 주세요.` }
    const type = BULK_SCHEDULE_TYPE_MAP[typeValue]
    if (!type) return { ...item, error: `'${typeValue}' 일정 종류를 확인해 주세요.` }
    const status = normalizeScheduleStatus(statusValue)
    if (!title) return { ...item, error: '제목이 비어 있어요.' }
    const duplicateKey = `${date.display}::${time}::${title.toLowerCase()}`
    if (seen.has(duplicateKey)) return { ...item, error: '같은 날짜·시간·제목의 일정이 이미 있어요.' }
    seen.add(duplicateKey)
    return { ...item, date: date.display, day: date.day, time, end, city, type, title, desc, status }
  }).filter(item => !item.header)
}

function BulkScheduleImport({ events, onClose, onImport }) {
  useEscapeClose(onClose)
  const [text, setText] = useState('')
  const parsed = useMemo(() => parseBulkSchedule(text, events), [text, events])
  const validRows = parsed.filter(row => !row.error)
  const errorRows = parsed.filter(row => row.error)
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className="place-editor bulk-import-editor"><header><div><span className="eyebrow">BULK IMPORT</span><h2>일정 일괄 추가</h2></div><button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" /></button></header><div className="bulk-import-body"><div className="bulk-format"><strong>표의 8개 열을 그대로 붙여넣으세요</strong><code>날짜 / 시작 / 종료 / 도시 / 종류 / 제목 / 설명 / 상태</code><p>종류: 항공·교통, 투어, 방문 · 상태: 예매 필요, 예매 불필요, 예매 완료</p></div><label><span>붙여넣을 일정 목록</span><textarea autoFocus value={text} onChange={event => setText(event.target.value)} rows="10" placeholder={'2026-09-07\t07:00\t07:50\t리스본\t항공·교통\t리스본 → 호카곶\tUber/Bolt 직행\t예매 불필요'} /></label>{text.trim() && <div className="bulk-preview"><div className="bulk-summary"><span className="valid"><Icon name="check" size={14} /> 추가 가능 {validRows.length}개</span><span className={errorRows.length ? 'invalid' : ''}>확인 필요 {errorRows.length}개</span></div>{validRows.slice(0, 4).map(row => <div className="preview-row" key={row.lineNumber}><span>{row.date}</span><strong>{row.title}</strong><small>{row.time}</small></div>)}{validRows.length > 4 && <p className="more-rows">외 {validRows.length - 4}개</p>}{errorRows.slice(0, 4).map(row => <div className="error-row" key={row.lineNumber}><strong>{row.lineNumber}행</strong><span>{row.error}</span></div>)}</div>}</div><footer><button type="button" className="cancel-button" onClick={onClose}>취소</button><button className="primary-button" disabled={!validRows.length} onClick={() => onImport(validRows)}><Icon name="upload" size={17} /> {validRows.length}개 일정 추가</button></footer></div></div>
}

function ScheduleEditor({ event, onClose, onSave, onDelete }) {
  useEscapeClose(onClose)
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
  return <div className="modal-backdrop" onMouseDown={mouseEvent => mouseEvent.target === mouseEvent.currentTarget && onClose()}><form className="place-editor schedule-editor" onSubmit={submit}><header><div><span className="eyebrow">ITINERARY DETAILS</span><h2>{event.id ? '일정 수정' : '새 일정 추가'}</h2></div><button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" /></button></header><div className="form-grid"><label><span>날짜 <em>*</em></span><input autoFocus type="date" value={form.date} onChange={changeEvent => update('date', changeEvent.target.value)} required /></label><label><span>요일</span><input value={form.day ? `${form.day}요일` : ''} placeholder="날짜를 선택하면 자동 표시" readOnly /></label><label><span>시작 시간</span><input value={form.time} onChange={changeEvent => update('time', changeEvent.target.value)} placeholder="09:00" /></label><label><span>종료 시간</span><input value={form.end} onChange={changeEvent => update('end', changeEvent.target.value)} placeholder="12:30 또는 —" /></label><label><span>도시</span><input value={form.city} onChange={changeEvent => update('city', changeEvent.target.value)} placeholder="Barcelona" /></label><label><span>일정 종류</span><select value={form.type} onChange={changeEvent => update('type', changeEvent.target.value)}><option value="transport">항공 · 교통</option><option value="tour">투어</option><option value="pin">방문</option></select></label><label className="full"><span>제목 <em>*</em></span><input value={form.title} onChange={changeEvent => update('title', changeEvent.target.value)} placeholder="일정 제목" required /></label><label className="full"><span>설명</span><textarea value={form.desc} onChange={changeEvent => update('desc', changeEvent.target.value)} placeholder="장소, 좌석, 준비물 등" rows="3" /></label><label className="full"><span>상태</span><select value={form.status} onChange={changeEvent => update('status', changeEvent.target.value)}><option value="예매 필요">예매 필요</option><option value="예매 불필요">예매 불필요</option><option value="예매 완료">예매 완료</option></select></label></div><footer>{event.id && <button type="button" className="danger-button schedule-delete-button" onClick={() => onDelete(event)}><Icon name="trash" size={15} /> 일정 삭제</button>}<button type="button" className="cancel-button" onClick={onClose}>취소</button><button className="primary-button" type="submit">{event.id ? '변경사항 저장' : '일정 저장'}</button></footer></form></div>
}

function buildCityRecord(form, existing, toneIndex) {
  const country = COUNTRY_OPTIONS.find(item => item.name === form.country)
  const start = new Date(`${form.startDate}T00:00:00`)
  const end = new Date(`${form.endDate}T00:00:00`)
  const nights = Math.max(0, Math.round((end - start) / 86400000))
  const idBase = form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'city'
  return {
    ...existing,
    id: existing?.id || `${idBase}-${Date.now()}`,
    name: form.name.trim(),
    ko: form.ko.trim() || form.name.trim(),
    country: form.country,
    flag: country?.flag || '🌍',
    startDate: form.startDate,
    endDate: form.endDate,
    dates: `${start.getMonth() + 1}. ${start.getDate()} — ${end.getMonth() + 1}. ${end.getDate()}`,
    nights: nights ? `${nights}박` : '당일',
    saved: existing?.saved || 0,
    tone: existing?.tone || CITY_TONES[toneIndex % CITY_TONES.length],
  }
}

function Cities({ cities, setCities, places, setPlaces, onNavigate, notify }) {
  const [cityEditorOpen, setCityEditorOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const countries = [...new Set(cities.map(city => city.country))]
  const [openCountries, setOpenCountries] = useState(() => countries.slice(0, 1))

  const toggleCountry = (country) => {
    setOpenCountries(current => current.includes(country)
      ? current.filter(item => item !== country)
      : [...current, country])
  }

  const addCity = (form) => {
    if (cities.some(city => city.country === form.country && city.name.trim().toLowerCase() === form.name.trim().toLowerCase())) {
      notify('같은 국가에 동일한 도시가 이미 있어요.')
      return
    }
    const newCity = buildCityRecord(form, null, cities.length)
    setCities(current => [...current, touchRecord(newCity)])
    setCityEditorOpen(false)
    notify(`${newCity.name} 도시를 여행에 추가했어요.`)
  }

  const importPlaces = (rows) => {
    const importedAt = Date.now()
    setPlaces(current => [...current, ...rows.map((row, index) => touchRecord({
      id: `${importedAt}-${index}`,
      city: row.city.id,
      name: row.name,
      category: row.category,
      description: row.description,
      mapUrl: row.mapUrl,
      priority: 2,
      visitStatus: 'visit-needed',
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
        <section className={`country-section ${openCountries.includes(country) ? 'open' : ''}`} key={country}>
          <button className="country-toggle" type="button" onClick={() => toggleCountry(country)} aria-expanded={openCountries.includes(country)}>
            <span className="country-toggle-name"><b>{cities.find(city => city.country === country).flag}</b><strong>{country}</strong></span>
            <span>{cities.filter(city => city.country === country).length}개 도시</span>
            <i><Icon name="arrow" size={17} /></i>
          </button>
          {openCountries.includes(country) && <div className="city-grid">
            {cities.filter(city => city.country === country).map(city => (
              <button key={city.id} className={`city-card ${city.tone}`} onClick={() => onNavigate('city', city.id)}>
                <span className="city-country">{city.country}</span><span className="city-index">{String(cities.indexOf(city) + 1).padStart(2, '0')}</span>
                <div><h3>{city.name}</h3><p>{city.ko}</p></div>
                <footer><span>{city.dates}<br/><strong>{city.nights}</strong></span><span><Icon name="bookmark" size={15} /> {places.filter(place => place.city === city.id).length} places</span><i><Icon name="arrow" size={18} /></i></footer>
              </button>
            ))}
          </div>}
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
    if (!isSafeHttpUrl(mapUrl)) return { ...item, error: 'Google Maps URL은 http 또는 https 주소여야 해요.' }
    const duplicateKey = `${city.id}::${name.trim().toLowerCase()}`
    if (seen.has(duplicateKey)) return { ...item, error: `${city.name}에 같은 이름의 장소가 이미 있어요.` }
    seen.add(duplicateKey)
    return { ...item, city, name: name.trim(), category, description: description.trim(), mapUrl: mapUrl.trim() }
  }).filter(item => !item.header)
}

function BulkPlaceImport({ cities, places, onClose, onImport }) {
  useEscapeClose(onClose)
  const [text, setText] = useState('')
  const parsed = useMemo(() => parseBulkPlaces(text, cities, places), [text, cities, places])
  const validRows = parsed.filter(row => !row.error)
  const errorRows = parsed.filter(row => row.error)
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className="place-editor bulk-import-editor"><header><div><span className="eyebrow">BULK IMPORT</span><h2>장소 일괄 추가</h2></div><button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" /></button></header><div className="bulk-import-body"><div className="bulk-format"><strong>한 줄에 장소 하나씩 입력하세요</strong><code>도시 / 장소명 / 카테고리 / 메모 / Google Maps URL</code><p>카테고리: 관광지, 맛집, 카페, Bar, 숙소, 기타 · 엑셀의 5개 열을 그대로 붙여넣어도 됩니다.</p></div><label><span>붙여넣을 장소 목록</span><textarea autoFocus value={text} onChange={event => setText(event.target.value)} rows="9" placeholder={'Barcelona / Sagrada Família / 관광지 / 오전 예약 추천 / https://maps.app.goo.gl/example\nBarcelona / Bar Cañete / 맛집 / 타파스 / https://maps.google.com/example'} /></label>{text.trim() && <div className="bulk-preview"><div className="bulk-summary"><span className="valid"><Icon name="check" size={14} /> 추가 가능 {validRows.length}개</span><span className={errorRows.length ? 'invalid' : ''}>확인 필요 {errorRows.length}개</span></div>{validRows.slice(0, 4).map(row => <div className="preview-row" key={row.lineNumber}><span>{row.city.name}</span><strong>{row.name}</strong><small>{categoryLabels[row.category]}</small></div>)}{validRows.length > 4 && <p className="more-rows">외 {validRows.length - 4}개</p>}{errorRows.slice(0, 4).map(row => <div className="error-row" key={row.lineNumber}><strong>{row.lineNumber}행</strong><span>{row.error}</span></div>)}</div>}</div><footer><button type="button" className="cancel-button" onClick={onClose}>취소</button><button className="primary-button" disabled={!validRows.length} onClick={() => onImport(validRows)}><Icon name="upload" size={17} /> {validRows.length}개 장소 추가</button></footer></div></div>
}

function cityDateInputs(city) {
  if (city?.startDate && city?.endDate) return { startDate: city.startDate, endDate: city.endDate }
  const match = String(city?.dates || '').match(/(\d{1,2})\.\s*(\d{1,2})\s*[—-]\s*(\d{1,2})\.\s*(\d{1,2})/)
  if (!match) return { startDate: '', endDate: '' }
  return {
    startDate: `${TRIP_YEAR}-${String(match[1]).padStart(2, '0')}-${String(match[2]).padStart(2, '0')}`,
    endDate: `${TRIP_YEAR}-${String(match[3]).padStart(2, '0')}-${String(match[4]).padStart(2, '0')}`,
  }
}

function CityEditor({ city, onClose, onSave }) {
  useEscapeClose(onClose)
  const existingDates = cityDateInputs(city)
  const [form, setForm] = useState({ country: city?.country || 'Portugal', name: city?.name || '', ko: city?.ko || '', ...existingDates })
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
        <header><div><span className="eyebrow">DESTINATION</span><h2>{city?.id ? '도시 수정' : '도시 추가'}</h2></div><button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" /></button></header>
        <div className="form-grid">
          <label className="full"><span>국가 검색 <em>*</em></span><input name="country" list="europe-country-options" value={form.country} onChange={event => update('country', event.target.value)} placeholder="예: France 또는 프랑스" autoComplete="off" required /><datalist id="europe-country-options">{COUNTRY_OPTIONS.map(country => <option key={country.name} value={country.name} label={`${country.flag} ${country.ko}`} />)}</datalist></label>
          <label><span>도시명 <em>*</em></span><input name="name" autoFocus value={form.name} onChange={event => update('name', event.target.value)} placeholder="예: Paris" required /></label>
          <label><span>한글명</span><input name="ko" value={form.ko} onChange={event => update('ko', event.target.value)} placeholder="예: 파리" /></label>
          <label><span>도착일 <em>*</em></span><input name="startDate" type="date" value={form.startDate} onChange={event => update('startDate', event.target.value)} required /></label>
          <label><span>출발일 <em>*</em></span><input name="endDate" type="date" min={form.startDate} value={form.endDate} onChange={event => update('endDate', event.target.value)} required /></label>
          {form.startDate && form.endDate && !validDates && <p className="form-error full">출발일은 도착일보다 빠를 수 없어요.</p>}
          {form.country && !selectedCountry && <p className="form-error full">검색 결과에서 유럽 국가를 선택해 주세요.</p>}
        </div>
        <footer><button type="button" className="cancel-button" onClick={onClose}>취소</button><button className="primary-button" type="submit" disabled={!selectedCountry || !validDates || !form.name.trim()}>{city?.id ? '변경사항 저장' : '도시 저장'}</button></footer>
      </form>
    </div>
  )
}

function CityDetail({ cityId, cities, setCities, places, setPlaces, markDeleted, onBack, notify }) {
  const city = cities.find(item => item.id === cityId) || cities[0]
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('default')
  const [editor, setEditor] = useState(null)
  const [cityEditorOpen, setCityEditorOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedPlaceIds, setSelectedPlaceIds] = useState([])
  const cityPlaces = useMemo(() => places.filter(place => place.city === city.id), [places, city.id])

  useEffect(() => setSelectedPlaceIds([]), [city.id])

  const filtered = useMemo(() => {
    const matches = cityPlaces.filter(place => {
      const categoryMatches = category === 'all' || place.category === category
      const queryMatches = place.name.toLowerCase().includes(query.toLowerCase())
      const statusMatches = statusFilter === 'all'
        || (statusFilter === 'completed' && ['visit-completed', 'tour-completed'].includes(place.visitStatus))
        || (statusFilter === 'other' && !['visit-completed', 'tour-completed'].includes(place.visitStatus))
      return categoryMatches && queryMatches && statusMatches
    })
    return sortOrder === 'priority'
      ? matches.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0) || a.name.localeCompare(b.name, 'ko'))
      : matches
  }, [cityPlaces, category, query, statusFilter, sortOrder])

  useEffect(() => {
    const visibleIds = new Set(filtered.map(place => place.id))
    setSelectedPlaceIds(current => {
      const next = current.filter(id => visibleIds.has(id))
      return next.length === current.length ? current : next
    })
  }, [filtered])

  const savePlace = (form) => {
    const normalizedForm = { ...form, visited: form.visitStatus === 'visit-completed' || form.visitStatus === 'tour-completed' }
    if (editor?.id) {
      setPlaces(current => current.map(place => place.id === editor.id ? touchRecord({ ...place, ...normalizedForm }) : place))
      notify('장소 정보를 수정했어요.')
    } else {
      setPlaces(current => [...current, touchRecord({ ...normalizedForm, id: Date.now(), city: normalizedForm.city || city.id, reservation: false, duration: '', visitDate: '', meta: categoryLabels[form.category] })])
      notify('새 장소를 추가했어요.')
    }
    setEditor(null)
  }

  const deletePlace = () => {
    setPlaces(current => current.filter(place => place.id !== deleteTarget.id))
    markDeleted('places', deleteTarget.id)
    setDeleteTarget(null)
    notify('장소를 삭제했어요.')
  }

  const togglePlaceSelection = (placeId) => {
    setSelectedPlaceIds(current => current.includes(placeId) ? current.filter(id => id !== placeId) : [...current, placeId])
  }

  const toggleVisibleSelection = () => {
    const visibleIds = filtered.map(place => place.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedPlaceIds.includes(id))
    setSelectedPlaceIds(current => allVisibleSelected
      ? current.filter(id => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])])
  }

  const completeSelectedPlaces = () => {
    if (!selectedPlaceIds.length) return
    const selectedIds = new Set(selectedPlaceIds)
    setPlaces(current => current.map(place => selectedIds.has(place.id)
      ? touchRecord({ ...place, visitStatus: 'visit-completed', visited: true })
      : place))
    notify(`${selectedPlaceIds.length}개 장소를 방문 완료로 변경했어요.`)
    setSelectedPlaceIds([])
  }

  const deleteCity = () => {
    if (cityPlaces.length) {
      notify('도시를 삭제하기 전에 장소를 다른 도시로 옮겨 주세요.')
      return
    }
    if (!window.confirm(`“${city.ko}” 도시를 삭제할까요?`)) return
    setCities(current => current.filter(item => item.id !== city.id))
    markDeleted('cities', city.id)
    notify(`${city.ko} 도시를 삭제했어요.`)
    onBack()
  }

  const updateCity = form => {
    if (cities.some(item => item.id !== city.id && item.country === form.country && item.name.trim().toLowerCase() === form.name.trim().toLowerCase())) {
      notify('같은 국가에 동일한 도시가 이미 있어요.')
      return
    }
    const nextCity = touchRecord(buildCityRecord(form, city, cities.indexOf(city)))
    setCities(current => current.map(item => item.id === city.id ? nextCity : item))
    setCityEditorOpen(false)
    notify(`${nextCity.ko} 도시 정보를 수정했어요.`)
  }

  return (
    <div className="page city-detail-page">
      <div className="city-detail-actions"><button className="back-button" onClick={onBack}><span>‹</span> 모든 도시</button><div><button className="secondary-button" type="button" onClick={() => setCityEditorOpen(true)}><Icon name="edit" size={14} /> 도시 수정</button><button className="danger-button" type="button" onClick={deleteCity}><Icon name="trash" size={14} /> 도시 삭제</button></div></div>
      <section className={`city-hero ${city.tone}`}>
        <div className="city-hero-copy"><span>{city.flag} {city.country.toUpperCase()}</span><h1>{city.name}</h1><p>{city.ko} · {city.dates} · {city.nights}</p></div>
        <div className="city-hero-stats"><div><strong>{cityPlaces.filter(place => place.visitStatus === 'tour-planned').length}</strong><span>투어 예정</span></div><div><strong>{cityPlaces.filter(place => place.visitStatus === 'tour-completed').length}</strong><span>투어 완료</span></div><div><strong>{cityPlaces.filter(place => place.visitStatus === 'visit-needed').length}</strong><span>방문 필요</span></div><div><strong>{cityPlaces.filter(place => place.visitStatus === 'visit-completed').length}</strong><span>방문 완료</span></div></div>
        <div className="hero-stamp"><span>{city.name.slice(0, 3).toUpperCase()}</span><small>EUROPE<br/>TRIP</small></div>
      </section>

      <section className="places-section">
        <div className="places-title"><div><span className="eyebrow">SAVED PLACES</span><h2>어디를 가볼까요?</h2></div><button className="primary-button" onClick={() => setEditor({})}><Icon name="plus" size={18} /> 장소 추가</button></div>
        <div className="category-tabs" role="tablist">{Object.entries(categoryLabels).map(([id, label]) => <button key={id} className={category === id ? 'active' : ''} onClick={() => setCategory(id)} role="tab" aria-selected={category === id}>{label}<span>{id === 'all' ? cityPlaces.length : cityPlaces.filter(place => place.category === id).length}</span></button>)}</div>
        <div className="place-toolbar">
          <label className="search-field"><Icon name="search" size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="장소 이름으로 검색" /><span>⌘ K</span></label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="방문 상태 필터"><option value="all">전체 상태</option><option value="completed">방문 완료</option><option value="other">그 외</option></select>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} aria-label="장소 정렬"><option value="default">기본 순서</option><option value="priority">우선순위순</option></select>
        </div>

        <div className="place-results-head"><p><strong>{filtered.length}</strong>개의 장소</p><span>수정 버튼에서 상세 정보를 관리할 수 있어요</span></div>
        <div className="place-selection-bar">
          <label><input type="checkbox" checked={filtered.length > 0 && filtered.every(place => selectedPlaceIds.includes(place.id))} onChange={toggleVisibleSelection} /><span><Icon name="check" size={13} /></span> 현재 목록 전체 선택</label>
          <strong>{selectedPlaceIds.length}개 선택</strong>
          <button type="button" disabled={!selectedPlaceIds.length} onClick={completeSelectedPlaces}><Icon name="check" size={15} /> 선택 장소 방문 완료</button>
        </div>
        <div className="places-grid">
          {filtered.map(place => <PlaceCard key={place.id} place={place} selected={selectedPlaceIds.includes(place.id)} onToggleSelected={() => togglePlaceSelection(place.id)} onEdit={() => setEditor(place)} onDelete={() => setDeleteTarget(place)} />)}
          {filtered.length === 0 && <div className="empty-state"><span><Icon name="search" /></span><h3>검색 결과가 없어요</h3><p>다른 검색어나 필터를 사용해 보세요.</p></div>}
        </div>
      </section>
      <button className="floating-add" onClick={() => setEditor({})}><Icon name="plus" /> 장소 추가</button>
      {editor && <PlaceEditor place={{ ...editor, city: editor.city || city.id }} cities={cities} onClose={() => setEditor(null)} onSave={savePlace} />}
      {cityEditorOpen && <CityEditor city={city} onClose={() => setCityEditorOpen(false)} onSave={updateCity} />}
      {deleteTarget && <ConfirmDelete place={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deletePlace} />}
    </div>
  )
}

function PlaceCard({ place, selected, onToggleSelected, onEdit, onDelete }) {
  return (
    <article className={`place-card ${selected ? 'selected' : ''}`}>
      <div className="place-body">
        <div className="place-heading"><div><div className="place-labels"><span className="place-category">{categoryLabels[place.category]}</span><span className={`status-dot ${place.visitStatus}`}>{placeVisitLabels[place.visitStatus]}</span>{place.priority && <span className="priority-badge" aria-label={`우선순위 ${place.priority}`}>{'◆'.repeat(place.priority)}</span>}</div><h3>{place.name}</h3></div><label className="place-select"><input type="checkbox" checked={selected} onChange={onToggleSelected} aria-label={`${place.name} 선택`} /><span><Icon name="check" size={13} /></span></label></div>
        <p>{place.description}</p>
        {(place.meta || place.reservation) && <div className="place-meta">{place.meta && <span><Icon name="clock" size={13} /> {place.meta}</span>}{place.reservation && <span><Icon name="ticket" size={13} /> 예약 필요</span>}</div>}
        <div className="place-actions">
          {place.mapUrl ? <a className="map-button" href={place.mapUrl} target="_blank" rel="noreferrer"><Icon name="map" size={17} /> Google Maps <Icon name="external" size={13} /></a> : <span className="map-missing">지도 링크 없음</span>}
          <button onClick={onEdit} aria-label="수정"><Icon name="edit" size={17} /></button>
          <button onClick={onDelete} aria-label="삭제"><Icon name="trash" size={17} /></button>
        </div>
      </div>
    </article>
  )
}

function PlaceEditor({ place, cities, onClose, onSave }) {
  useEscapeClose(onClose)
  const [form, setForm] = useState({ name: place.name || '', city: place.city || cities[0]?.id || '', category: place.category || 'attraction', description: place.description || '', mapUrl: place.mapUrl || '', priority: place.priority || 2, visitStatus: normalizePlace(place).visitStatus })
  const [urlError, setUrlError] = useState('')
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const submit = (event) => {
    event.preventDefault()
    if (!isSafeHttpUrl(form.mapUrl)) {
      setUrlError('지도 링크는 http 또는 https 주소를 입력해 주세요.')
      return
    }
    if (form.name.trim()) onSave({ ...form, mapUrl: form.mapUrl.trim() })
  }
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form className="place-editor" onSubmit={submit} role="dialog" aria-modal="true" aria-label={place.id ? '장소 수정' : '새 장소 추가'}>
        <header><div><span className="eyebrow">PLACE DETAILS</span><h2>{place.id ? '장소 수정' : '새 장소 추가'}</h2></div><button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" /></button></header>
        <div className="form-grid">
          <label className="full"><span>장소명 <em>*</em></span><input autoFocus value={form.name} onChange={e => update('name', e.target.value)} placeholder="예: Sagrada Família" required /></label>
          <label className="full"><span>저장 도시</span><select value={form.city} onChange={e => update('city', e.target.value)}>{cities.map(city => <option key={city.id} value={city.id}>{city.flag} {city.ko}</option>)}</select></label>
          <label><span>카테고리 <em>*</em></span><select value={form.category} onChange={e => update('category', e.target.value)}>{Object.entries(categoryLabels).filter(([id]) => id !== 'all').map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <label className="visited-field"><span>방문 상태</span><select value={form.visitStatus} onChange={e => update('visitStatus', e.target.value)}>{PLACE_VISIT_STATUSES.map(status => <option key={status} value={status}>{placeVisitLabels[status]}</option>)}</select></label>
          <label className="full"><span>메모</span><textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="방문 팁이나 기억할 내용을 적어두세요." rows="3" /></label>
          <label className="full"><span>Google Maps URL</span><div className="input-with-icon"><Icon name="map" size={17}/><input value={form.mapUrl} onChange={e => { update('mapUrl', e.target.value); setUrlError('') }} placeholder="https://maps.app.goo.gl/..." aria-invalid={Boolean(urlError)} /></div>{urlError && <small className="form-error">{urlError}</small>}</label>
          <fieldset className="full"><legend>우선순위</legend><div className="priority-options">{[[1,'여유롭게'],[2,'추천'],[3,'꼭 가기']].map(([value,label]) => <button type="button" key={value} className={form.priority === value ? 'active' : ''} onClick={() => update('priority', value)}><span>{'◆'.repeat(value)}</span>{label}</button>)}</div></fieldset>
        </div>
        <footer><button type="button" className="cancel-button" onClick={onClose}>취소</button><button className="primary-button" type="submit">{place.id ? '변경사항 저장' : '장소 저장'}</button></footer>
      </form>
    </div>
  )
}

function ConfirmDelete({ place, onClose, onConfirm }) {
  useEscapeClose(onClose)
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className="confirm-modal" role="dialog" aria-modal="true" aria-label="장소 삭제 확인"><div className="delete-icon"><Icon name="trash" /></div><h2>이 장소를 삭제할까요?</h2><p><strong>{place.name}</strong>의 메모와 방문 정보가 함께 삭제됩니다.</p><div><button className="cancel-button" onClick={onClose}>취소</button><button className="danger-button" onClick={onConfirm}>삭제하기</button></div></div></div>
}

function Bookings({ cities, tickets, setTickets, markDeleted, session, isOnline, notify }) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [offlineTicketIds, setOfflineTicketIds] = useState([])

  useEffect(() => {
    getOfflineTicketIds().then(setOfflineTicketIds).catch(() => {})
  }, [tickets])

  const handleUpload = async (values) => {
    setBusy(true)
    try {
      const ticket = touchRecord(await uploadTicket(values))
      const savedOffline = await saveOfflineTicket(ticket, values.file).then(() => true).catch(() => false)
      tickets.filter(item => item.localOnly).forEach(item => markDeleted('tickets', item.id))
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

  const removeTicket = async ticket => {
    if (!window.confirm(`“${ticket.title}” 티켓을 삭제할까요?`)) return
    if (ticket.storage_path && (!session || !isOnline)) {
      notify('클라우드 티켓은 로그인한 온라인 상태에서 삭제할 수 있어요.')
      return
    }
    setBusy(true)
    try {
      if (ticket.storage_path) await deleteTicket(ticket)
      await deleteOfflineTicket(ticket.id).catch(() => {})
      setTickets(current => current.filter(item => item.id !== ticket.id))
      setOfflineTicketIds(current => current.filter(id => id !== String(ticket.id)))
      markDeleted('tickets', ticket.id)
      notify('티켓과 이 기기의 오프라인 파일을 삭제했어요.')
    } catch (error) {
      notify(error.message || '티켓 삭제에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  const canUseCloud = isSupabaseConfigured && session && isOnline
  const getTicketCity = (ticket) => {
    const city = String(ticket.city || '').trim().replace(/[ㄱ-ㅎㅏ-ㅣ]+$/g, '')
    return city === '신트라' || city.toLowerCase() === 'sintra' ? '리스본' : city
  }
  const getTicketDate = (ticket) => {
    if (ticket.event_date) return ticket.event_date
    if (String(ticket.file_name || '').includes('전자항공권_리스본')) return '2026-09-02'
    const match = String(ticket.file_name || '').match(/_(\d{2})(\d{2})(?:_|\.|$)/)
    return match ? `2026-${match[1]}-${match[2]}` : ''
  }
  const ticketTypes = [
    { id: 'transport', label: '항공 · 교통' },
    { id: 'tour', label: '투어' },
    { id: 'visit', label: '방문' },
  ]
  const getTicketType = (ticket) => {
    const value = `${ticket.title || ''} ${ticket.file_name || ''}`.toLowerCase()
    if (/항공|전자항공권|기차|교통|flight|train|rail/.test(value)) return 'transport'
    if (/투어|tour|알함브라/.test(value)) return 'tour'
    return 'visit'
  }
  const ticketGroups = useMemo(() => {
    const groups = new Map()
    tickets.forEach(ticket => {
      const cityValue = getTicketCity(ticket).toLowerCase()
      const matchedCity = cities.find(city => [city.id, city.name, city.ko].some(value => String(value || '').toLowerCase() === cityValue))
      const matchedCountry = COUNTRY_OPTIONS.find(country => country.name.toLowerCase() === cityValue || country.ko === ticket.city)
      const city = matchedCity?.ko || matchedCountry?.ko || getTicketCity(ticket) || '기타'
      const flag = matchedCity?.flag || matchedCountry?.flag || '🌍'
      if (!groups.has(city)) groups.set(city, { city, flag, tickets: [] })
      groups.get(city).tickets.push(ticket)
    })
    return [...groups.values()].sort((a, b) => {
      const aIndex = cities.findIndex(city => city.ko === a.city)
      const bIndex = cities.findIndex(city => city.ko === b.city)
      if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex
      if (aIndex >= 0) return -1
      if (bIndex >= 0) return 1
      return a.city.localeCompare(b.city, 'ko')
    })
  }, [tickets, cities])

  const renderTicketCard = (item) => {
    const ticketDate = getTicketDate(item)
    const date = ticketDate ? new Date(`${ticketDate}T00:00:00`).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : '날짜 미정'
    const isOfflineReady = offlineTicketIds.includes(String(item.id))
    return <article className="ticket-card" key={item.id || item.title}><div className="ticket-side"><Icon name="ticket" size={16} /><span>{isOfflineReady ? 'OFFLINE' : item.storage_path ? 'BACKUP' : 'UPLOAD'}</span></div><div className="ticket-main"><span>{getTicketCity(item) || '여행 티켓'}</span><h3>{item.title}</h3><p>{date}{item.file_name ? ` · ${item.file_name}` : ''}</p><div><span className={`status-chip ${item.storage_path ? 'reserved' : ''}`}>{isOfflineReady ? '오프라인 저장됨' : item.storage_path ? 'DB 저장 완료' : '파일 업로드 필요'}</span><div className="ticket-actions">{item.storage_path && session && !isOfflineReady && <button disabled={!isOnline || busy} onClick={() => cacheTicket(item)}><Icon name="download" size={13}/> 오프라인 저장</button>}<button disabled={(!item.storage_path || !session) && !isOfflineReady} onClick={() => openTicket(item)}>티켓 열기 <Icon name="external" size={13}/></button><button className="ticket-delete" disabled={busy || (Boolean(item.storage_path) && (!session || !isOnline))} onClick={() => removeTicket(item)} aria-label={`${item.title} 삭제`}><Icon name="trash" size={13}/></button></div></div></div></article>
  }

  return (
    <div className="page">
      <SectionHead eyebrow="PRIVATE TICKET VAULT" title="예약 · 티켓" description="PDF와 이미지 티켓을 비공개 클라우드에 보관하고 어느 기기에서든 열어보세요." action={<button className="primary-button" disabled={!canUseCloud} onClick={() => setUploadOpen(true)}><Icon name="upload" size={18} /> 티켓 업로드</button>} />
      <div className={`cloud-notice ${canUseCloud ? 'ready' : ''}`}>
        <span><Icon name={canUseCloud ? 'cloud' : 'database'} /></span>
        <div><strong>{canUseCloud ? `${session.user.email} 계정에 안전하게 저장됩니다` : '클라우드 연결이 필요해요'}</strong><p>{canUseCloud ? '파일은 비공개 Storage에 저장되며 5분 동안 유효한 링크로만 열립니다.' : '준비 메뉴에서 Supabase를 연결하고 이메일로 로그인해 주세요.'}</p></div>
      </div>
      <div className="ticket-country-list">{ticketGroups.map(group => (
        <details className="ticket-country-group" key={group.city}>
          <summary><span><b>{group.flag}</b><strong>{group.city}</strong></span><span>{group.tickets.length}개 <Icon name="chevron" size={15} /></span></summary>
          <div className="ticket-type-sections">{ticketTypes.map(type => {
            const items = group.tickets.filter(ticket => getTicketType(ticket) === type.id)
            if (!items.length) return null
            return <section className={`ticket-type-section ${type.id}`} key={type.id}><header><strong>{type.label}</strong><span>{items.length}개</span></header><div className="ticket-grid">{items.map(renderTicketCard)}</div></section>
          })}</div>
        </details>
      ))}</div>
      {uploadOpen && <TicketUploadEditor busy={busy} onClose={() => setUploadOpen(false)} onSave={handleUpload} />}
    </div>
  )
}

function TicketUploadEditor({ busy, onClose, onSave }) {
  useEscapeClose(onClose)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [form, setForm] = useState({ title: '', city: '', eventDate: '' })
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const selectFile = nextFile => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (nextFile && (!allowedTypes.includes(nextFile.type) || nextFile.size > 20 * 1024 * 1024)) {
      setFile(null)
      setFileError(nextFile.size > 20 * 1024 * 1024 ? '20MB 이하 파일을 선택해 주세요.' : 'PDF, JPG, PNG, WebP 파일만 업로드할 수 있어요.')
      return
    }
    setFile(nextFile)
    setFileError('')
  }
  const submit = (event) => {
    event.preventDefault()
    if (file && form.title.trim()) onSave({ ...form, file })
  }
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><form className="place-editor" onSubmit={submit} role="dialog" aria-modal="true" aria-label="티켓 업로드"><header><div><span className="eyebrow">SECURE UPLOAD</span><h2>티켓 업로드</h2></div><button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" /></button></header><div className="form-grid"><label className="full"><span>티켓 이름 <em>*</em></span><input autoFocus value={form.title} onChange={event => update('title', event.target.value)} placeholder="예: 알함브라 궁전 입장권" required /></label><label><span>도시</span><input value={form.city} onChange={event => update('city', event.target.value)} placeholder="예: Granada" /></label><label><span>사용일</span><input type="date" value={form.eventDate} onChange={event => update('eventDate', event.target.value)} /></label><label className="full ticket-file-field"><span>파일 <em>*</em></span><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event => selectFile(event.target.files?.[0] || null)} required />{fileError && <small className="form-error">{fileError}</small>}<small>PDF, JPG, PNG, WebP · 최대 20MB</small></label></div><footer><button type="button" className="cancel-button" onClick={onClose}>취소</button><button className="primary-button" type="submit" disabled={busy || !file || !form.title.trim()}>{busy ? '업로드 중…' : 'DB에 저장'}</button></footer></form></div>
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

const EXCHANGE_RATE_CACHE_KEY = 'europe-trip-planner:eur-krw-rate:v1'

function ExchangeRatePanel({ isOnline }) {
  const [amount, setAmount] = useState('100')
  const [direction, setDirection] = useState('eur-to-krw')
  const [rate, setRate] = useState('')
  const [rateDate, setRateDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadRate = async () => {
    if (!isOnline) {
      setError('오프라인에서는 마지막으로 저장된 환율을 사용합니다.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await fetch('https://api.frankfurter.dev/v2/rate/EUR/KRW?providers=ECB')
      if (!response.ok) throw new Error('환율을 불러오지 못했어요.')
      const data = await response.json()
      const nextRate = Number(data.rate)
      if (!Number.isFinite(nextRate)) throw new Error('환율 응답을 확인할 수 없어요.')
      setRate(String(nextRate))
      setRateDate(data.date || '')
      window.localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify({ rate: nextRate, date: data.date || '' }))
    } catch (fetchError) {
      setError(fetchError.message || '환율을 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try {
      const cached = JSON.parse(window.localStorage.getItem(EXCHANGE_RATE_CACHE_KEY) || 'null')
      if (cached?.rate) {
        setRate(String(cached.rate))
        setRateDate(cached.date || '')
      }
    } catch {}
    loadRate()
  }, [isOnline])

  const inputAmount = Number(String(amount).replace(/,/g, '')) || 0
  const wonRate = Number(String(rate).replace(/,/g, '')) || 0
  const converted = direction === 'eur-to-krw'
    ? Math.round(inputAmount * wonRate)
    : wonRate ? inputAmount / wonRate : 0
  const inputLabel = direction === 'eur-to-krw' ? '유로 금액' : '한화 금액'
  const inputUnit = direction === 'eur-to-krw' ? 'EUR' : 'KRW'
  const resultLabel = direction === 'eur-to-krw' ? '한화 예상 금액' : '유로 예상 금액'
  const resultUnit = direction === 'eur-to-krw' ? '원' : 'EUR'
  const formattedResult = direction === 'eur-to-krw'
    ? Math.round(converted).toLocaleString('ko-KR')
    : converted.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const formattedDate = rateDate ? new Date(`${rateDate}T00:00:00`).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '조회 전'

  const swapDirection = () => {
    setAmount(converted ? (direction === 'eur-to-krw' ? String(Math.round(converted)) : converted.toFixed(2)) : '')
    setDirection(current => current === 'eur-to-krw' ? 'krw-to-eur' : 'eur-to-krw')
  }

  return <section className="exchange-panel"><div className="exchange-head"><div><span className="exchange-icon"><Icon name="sparkle" size={19} /></span><div><strong>유로 환율 계산기</strong><p>유로와 원화를 양방향으로 계산할 수 있어요.</p></div></div><button type="button" onClick={loadRate} disabled={loading || !isOnline}>{loading ? '조회 중…' : '환율 새로고침'}</button></div><div className="exchange-calculator"><label><span>{inputLabel}</span><div><input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} aria-label={inputLabel} /><b>{inputUnit}</b></div></label><button type="button" className="exchange-swap" onClick={swapDirection} aria-label="환율 계산 방향 바꾸기">↔</button><label><span>{resultLabel}</span><div className="won-result"><strong>{formattedResult}</strong><b>{resultUnit}</b></div></label></div><div className="exchange-rate-row"><label><span>1 EUR 기준 환율</span><div><input inputMode="decimal" value={rate} onChange={event => setRate(event.target.value)} aria-label="유로 원 환율" /><b>KRW</b></div></label><p><strong>{formattedDate}</strong> ECB 기준 환율 · 실제 환전 및 카드 결제 금액은 수수료에 따라 달라질 수 있어요.</p></div>{error && <p className="exchange-error">{error}</p>}</section>
}

const TRANSLATION_LANGUAGES = {
  es: { label: '스페인어', heading: 'ESPAÑOL', empty: 'Pulsa el botón para traducir.' },
  pt: { label: '포르투갈어', heading: 'PORTUGUÊS', empty: 'Toque no botão para traduzir.' },
  it: { label: '이탈리아어', heading: 'ITALIANO', empty: 'Premi il pulsante per tradurre.' },
  el: { label: '그리스어', heading: 'ΕΛΛΗΝΙΚΑ', empty: 'Πατήστε το κουμπί για μετάφραση.' },
  fi: { label: '핀란드어', heading: 'SUOMI', empty: 'Paina käännöspainiketta.' },
}

function TranslationMockup({ notify = () => {} } = {}) {
  const [text, setText] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('es')
  const [result, setResult] = useState(null)
  const [usage, setUsage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [translationSession, setTranslationSession] = useState(null)
  const language = TRANSLATION_LANGUAGES[targetLanguage]

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setTranslationSession(data.session || null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setTranslationSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!translationSession?.user?.id || !navigator.onLine) return
    fetchTranslationUsage().then(setUsage).catch(() => {})
  }, [translationSession?.user?.id])

  const translate = async () => {
    const source = text.trim()
    if (!source || loading) return
    if (!translationSession?.user?.id) return setError('환경설정에서 먼저 로그인해 주세요.')
    if (!navigator.onLine) return setError('실시간 번역은 인터넷 연결이 필요해요.')
    setLoading(true)
    setError('')
    try {
      const data = await translateTravelText(source, targetLanguage)
      setResult({ en: data.english, [targetLanguage]: data.translated })
      setUsage(Number(data.usage || 0))
    } catch (translateError) {
      setError(translateError.message || '번역 중 오류가 발생했어요.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async value => {
    if (!value) return
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(value)
      notify('번역 결과를 복사했어요.')
    } catch {
      setError('이 브라우저에서는 자동 복사를 사용할 수 없어요.')
    }
  }

  return <section className="translation-panel"><div className="translation-head"><span className="translation-icon"><Icon name="sparkle" size={19} /></span><strong>번역</strong><span className="translation-usage">이번 달 {usage.toLocaleString()} / 500,000자</span><label className="translation-language"><span>추가 번역 언어</span><select aria-label="추가 번역 언어" value={targetLanguage} onChange={event => { setTargetLanguage(event.target.value); setResult(null) }}>{Object.entries(TRANSLATION_LANGUAGES).map(([value, item]) => <option value={value} key={value}>{item.label}</option>)}</select></label></div><label className="translation-input"><span>한국어</span><textarea value={text} onChange={event => setText(event.target.value)} rows="3" maxLength="5000" placeholder="번역할 문장을 입력하세요" /></label><button type="button" className="primary-button translation-submit" disabled={!text.trim() || loading} onClick={translate}><Icon name="sparkle" size={15} /> {loading ? '번역 중…' : '번역하기'}</button>{error && <p className="translation-error">{error}</p>}<div className="translation-results"><article><div className="translation-result-head"><span>ENGLISH</span><button type="button" disabled={!result?.en} onClick={() => copy(result?.en)}><Icon name="copy" size={13} /> 복사</button></div><strong>{result?.en || '번역하기 버튼을 눌러 주세요.'}</strong></article><article><div className="translation-result-head"><span>{language.heading}</span><button type="button" disabled={!result?.[targetLanguage]} onClick={() => copy(result?.[targetLanguage])}><Icon name="copy" size={13} /> 복사</button></div><strong>{result?.[targetLanguage] || language.empty}</strong></article></div><p className="translation-note">입력한 원문은 저장하지 않으며, 번역 사용 글자 수만 계정에 기록합니다. 실시간 번역은 온라인에서만 사용할 수 있어요.</p></section>
}

function Misc({ prepItems, setPrepItems, markDeleted, isOnline, notify }) {
  const [newItem, setNewItem] = useState('')
  const [prepFilter, setPrepFilter] = useState('all')
  const [selectedPrepIds, setSelectedPrepIds] = useState([])
  const completedCount = prepItems.filter(item => item.completed).length
  const progress = prepItems.length ? completedCount / prepItems.length * 100 : 0
  const visiblePrepItems = prepItems.filter(item => prepFilter === 'all' || (prepFilter === 'needed' ? !item.completed : item.completed))

  useEffect(() => {
    const visibleIds = new Set(visiblePrepItems.map(item => item.id))
    setSelectedPrepIds(current => {
      const next = current.filter(id => visibleIds.has(id))
      return next.length === current.length ? current : next
    })
  }, [prepFilter, prepItems])

  const addItem = event => {
    event.preventDefault()
    const text = newItem.trim()
    if (!text) return
    if (prepItems.some(item => item.text.trim().toLowerCase() === text.toLowerCase())) {
      notify('같은 준비 항목이 이미 있어요.')
      return
    }
    const id = window.crypto?.randomUUID?.() || `prep-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setPrepItems(current => [...current, touchRecord({ id, text, completed: false })])
    setNewItem('')
    notify('여행 준비 항목을 추가했어요.')
  }

  const toggleSelection = id => {
    setSelectedPrepIds(current => current.includes(id) ? current.filter(currentId => currentId !== id) : [...current, id])
  }

  const completeSelected = () => {
    if (!selectedPrepIds.length) return
    setPrepItems(current => current.map(item => selectedPrepIds.includes(item.id) ? touchRecord({ ...item, completed: true }) : item))
    setSelectedPrepIds([])
    notify('선택한 준비물을 준비 완료로 변경했어요.')
  }

  const toggleCompleted = item => {
    setPrepItems(current => current.map(currentItem => currentItem.id === item.id
      ? touchRecord({ ...currentItem, completed: !currentItem.completed })
      : currentItem))
    notify(item.completed ? '준비 필요 상태로 되돌렸어요.' : '준비 완료로 변경했어요.')
  }

  const deleteItem = item => {
    setPrepItems(current => current.filter(currentItem => currentItem.id !== item.id))
    setSelectedPrepIds(current => current.filter(id => id !== item.id))
    markDeleted('prepItems', item.id)
    notify('여행 준비 항목을 삭제했어요.')
  }

  return <div className="page"><SectionHead eyebrow="TRAVEL TOOLS" title="기타" description="환율과 간단 번역을 확인하고 여행 준비물을 관리하세요." /><div className="misc-grid"><ExchangeRatePanel isOnline={isOnline} /><TranslationMockup notify={notify} /><section className="checklist-panel"><div className="check-progress"><div><strong>{completedCount}/{prepItems.length}</strong><span>완료</span></div><div><i style={{width: `${progress}%`}} /></div></div><form className="check-add-form" onSubmit={addItem}><input value={newItem} onChange={event => setNewItem(event.target.value)} placeholder="준비할 항목을 하나씩 입력하세요" aria-label="여행 준비 항목" /><button className="primary-button" disabled={!newItem.trim()}><Icon name="plus" size={16} /> 추가</button></form><div className="prep-toolbar"><div className="prep-filters" aria-label="준비물 상태 필터">{[['all','전체'],['needed','준비 필요'],['completed','준비 완료']].map(([value,label]) => <button type="button" key={value} className={prepFilter === value ? 'active' : ''} onClick={() => setPrepFilter(value)}>{label}</button>)}</div><button type="button" className="primary-button prep-complete-button" disabled={!selectedPrepIds.length} onClick={completeSelected}><Icon name="check" size={15} /> 선택 항목 준비 완료{selectedPrepIds.length ? ` (${selectedPrepIds.length})` : ''}</button></div>{visiblePrepItems.length ? visiblePrepItems.map(item => <div className={`check-row ${item.completed ? 'checked' : ''} ${selectedPrepIds.includes(item.id) ? 'selected' : ''}`} key={item.id}><label className="check-main"><input type="checkbox" checked={selectedPrepIds.includes(item.id)} onChange={() => toggleSelection(item.id)} /><span><Icon name="check" size={15}/></span><strong>{item.text}</strong></label><button type="button" className="prep-status-button" onClick={() => toggleCompleted(item)}>{item.completed ? '준비 완료 · 되돌리기' : '준비 필요 · 완료하기'}</button><button type="button" className="check-delete" onClick={() => deleteItem(item)} aria-label={`${item.text} 삭제`}><Icon name="trash" size={15} /></button></div>) : <div className="check-empty">이 상태의 준비 항목이 없어요.</div>}</section></div></div>
}

function Settings({ cities, places, events, tickets, prepItems, deletedRecords, lastCloudSyncAt, session, pwa, onRestore, notify }) {
  const payload = { cities, places, events, tickets, prepItems, deletedRecords, lastCloudSyncAt, scheduleDataVersion: SCHEDULE_DATA_VERSION, placeDataVersion: PLACE_DATA_VERSION }
  return <div className="page"><SectionHead eyebrow="APP SETTINGS" title="환경설정" description="앱 설치와 기기 간 데이터 백업을 관리하세요." /><div className="settings-grid"><PwaPanel pwa={pwa} notify={notify} /><CloudBackupPanel session={session} isOnline={pwa.isOnline} payload={payload} onRestore={onRestore} notify={notify} /></div></div>
}

function CloudBackupPanel({ session, isOnline, payload, onRestore, notify }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [lastBackup, setLastBackup] = useState('')

  useEffect(() => {
    if (!session?.user?.id || !isOnline) return
    restoreTrip().then(result => setLastBackup(result.updated_at || '')).catch(() => {})
  }, [session?.user?.id, isOnline])

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
    let mergedPayload = payload
    try {
      const remote = await restoreTrip()
      mergedPayload = mergeTripPayloads(payload, remote.payload, { remoteSavedAt: remote.updated_at })
    } catch (error) {
      if (!String(error?.message || '').includes('아직 없어요')) throw error
    }
    const result = await backupTrip(mergedPayload)
    onRestore(mergedPayload, { remoteUpdatedAt: result.updated_at })
    setLastBackup(result.updated_at)
    notify('다른 기기 데이터와 병합한 뒤 DB에 안전하게 백업했어요.')
  })

  const downloadBackup = () => run('restore', async () => {
    if (!window.confirm('클라우드 백업을 현재 기기 데이터와 안전하게 병합할까요?')) return
    const result = await restoreTrip()
    onRestore(result.payload, { merge: true, remoteUpdatedAt: result.updated_at })
    setLastBackup(result.updated_at)
    notify('클라우드 백업을 이 기기 데이터와 병합했어요.')
  })

  return <section className="backup-panel"><div className="backup-heading"><span><Icon name="database" /></span><div><strong>데이터 백업</strong><p>전체 일정, 도시와 장소는 기기에 자동 저장되고, 원하는 시점에 DB로 백업됩니다.</p></div></div>{!isOnline && <div className="offline-message">현재 오프라인입니다. 입력한 내용은 이 기기에 계속 자동 저장됩니다.</div>}{!isSupabaseConfigured ? <div className="setup-message"><strong>기존 Supabase DB 연결 정보가 필요합니다</strong><p><code>.env</code>에 기존 프로젝트 URL과 Publishable Key를 넣고 아래 migration을 한 번 실행하세요. 여행 앱 전용 테이블 2개만 추가됩니다.</p><code>supabase/migrations/202608120001_backup_and_tickets.sql</code></div> : !session ? <form className="login-form" onSubmit={requestLogin}><label><span>백업 계정 이메일</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required /></label><button className="primary-button" disabled={!isOnline || busy === 'login'}>{busy === 'login' ? '보내는 중…' : '로그인 링크 받기'}</button>{magicSent && <p>이메일의 링크를 열면 이 기기와 태블릿에서 같은 백업을 사용할 수 있어요.</p>}</form> : <div className="backup-ready"><div className="signed-in-row"><span><Icon name="users" size={17} /></span><div><strong>{session.user.email}</strong><small>{lastBackup ? `마지막 백업 ${new Date(lastBackup).toLocaleString('ko-KR')}` : '아직 수동 백업하지 않았어요'}</small></div><button disabled={!isOnline} onClick={() => run('logout', signOutLocal)}>로그아웃</button></div><div className="backup-actions"><button className="primary-button" disabled={!isOnline || Boolean(busy)} onClick={uploadBackup}><Icon name="upload" size={17} /> 지금 DB에 백업</button><button className="secondary-button" disabled={!isOnline || Boolean(busy)} onClick={downloadBackup}><Icon name="download" size={17} /> 백업 내려받기</button></div></div>}<div className="backup-foot"><span><Icon name="check" size={14} /> 이 기기에는 항상 자동 저장</span><span><Icon name="cloud" size={14} /> DB 백업은 온라인에서만</span></div></section>
}

export default App
