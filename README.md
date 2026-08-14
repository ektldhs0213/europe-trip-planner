# 유럽 여행 플래너

로컬 우선 저장과 Supabase 수동 백업을 지원하는 Europe 2026 여행 플래너입니다.

## 실행

```bash
pnpm install
pnpm dev
```

## 포함된 화면

- 앱의 첫 화면으로 표시되는 전체 일정 타임라인
- 날짜·시간·도시·제목·설명·상태 문구를 수정할 수 있는 일정 편집
- 상단 고정 내비게이션과 단색 UI
- 국가별 도시 목록과 도시 상세
- 국가·도시명·여행 기간을 입력하는 도시 추가 기능
- `도시 / 장소명 / 카테고리 / 메모 / Google Maps URL` 형식의 장소 일괄 추가
- 전체·관광지·맛집·카페·Bar·기타 카테고리와 장소 검색
- 장소별 다녀옴/못 다녀옴 체크
- 장소 추가·수정·삭제
- Google Maps 외부 링크
- 이메일 계정 기반 DB 수동 백업·복원
- 비공개 Supabase Storage 티켓 업로드와 열기

전체 일정, 도시, 장소, 티켓 메타데이터와 여행 준비 체크는 브라우저 `localStorage`에 자동 저장됩니다.

## Supabase 연결

새 Supabase 프로젝트를 만들 필요 없이 기존 프로젝트를 그대로 사용합니다.

1. `.env.example`을 `.env`로 복사하고 기존 프로젝트 URL과 Publishable Key를 입력합니다.
2. 기존 Supabase 프로젝트의 SQL Editor에서 `supabase/migrations/202608120001_backup_and_tickets.sql`을 한 번 실행합니다.
3. Supabase Auth의 Email 로그인을 활성화하고 Site URL/Redirect URL을 배포 주소에 맞춥니다.
4. 앱의 `여행 준비` 화면에서 같은 이메일로 로그인한 뒤 `지금 DB에 백업`을 누릅니다.

기존 DB에는 충돌을 피하도록 이름을 분리한 `europe_trip_backups`, `europe_trip_tickets` 테이블 2개만 추가됩니다. 티켓 파일용 비공개 `europe-trip-tickets` Storage bucket도 생성됩니다.

태블릿에서는 같은 이메일로 로그인한 후 `백업 내려받기`를 누르면 일정, 도시, 장소와 여행 준비 목록을 복원할 수 있습니다. 티켓 원본은 비공개 Storage bucket에 저장되고, 열 때마다 5분짜리 서명 URL을 발급합니다.

## PWA와 오프라인 실행

프로덕션 빌드에는 Web App Manifest와 Service Worker가 포함됩니다. 온라인에서 앱을 한 번 연 뒤 설치하면 앱 화면과 로컬 저장 데이터는 인터넷 연결 없이도 열고 수정할 수 있습니다.

```bash
pnpm build
pnpm preview
```

개발 서버(`pnpm dev`)에서는 오래된 캐시가 개발을 방해하지 않도록 Service Worker를 등록하지 않습니다. Cloudflare Pages처럼 HTTPS로 배포한 주소에서는 `여행 준비` 화면의 설치 버튼 또는 브라우저의 `앱 설치/홈 화면에 추가` 메뉴를 사용합니다.

오프라인에서도 가능한 기능:

- 전체 일정·도시·장소·체크리스트 열기와 수정
- 이 기기의 `localStorage` 자동 저장
- 설치된 독립 실행 화면 사용

인터넷 연결이 필요한 기능:

- Supabase 로그인과 DB 백업·복원
- 아직 이 기기에 오프라인 저장하지 않은 티켓의 최초 다운로드
- Google Maps 외부 링크

Supabase 티켓은 온라인에서 `오프라인 저장`을 한 번 누르면 IndexedDB에 파일 원본이 보관되어 이후에는 인터넷 없이 열 수 있습니다. 새로 업로드한 티켓은 업로드한 기기에 자동으로 오프라인 저장됩니다.
