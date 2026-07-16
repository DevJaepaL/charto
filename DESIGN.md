# CHARTO DESIGN.md — 토스증권 기반 디자인 시스템

> 참조: 토스증권(tossinvest.com) 토큰 체계 · 대상 표면: 콘텐츠 사이트(마켓 대시보드) · 대상 사용자: 시장 흐름을 읽으려는 투자 정보 탐색자

## 1. Context & Goals

**디자인 의도(한 문장):** 검은 캔버스 위에 숫자가 주인공이 되는, 토스증권처럼 밀도 높고 기능적인 다크 퍼스트 마켓 대시보드를 토큰만으로 일관되게 구현한다.

- 목표: 일관성(토큰 강제) · 접근성(WCAG 2.2 AA) · 빠른 전달(구현 즉시 사용 가능한 규칙)
- 다크 모드가 **기본**이다. 라이트 모드는 보조 테마로 유지하며 동일한 시맨틱 토큰 이름을 공유한다.
- 모든 컴포넌트 가이드는 시맨틱 토큰으로 기술해야 하며(must), raw hex를 직접 쓰면 안 된다(must not).

## 2. Design Tokens & Foundations

토큰의 유일한 소스는 [src/app/globals.css](./src/app/globals.css)다. 아래 값은 `.dark`(기본 테마) 기준이다.

### 2.1 Typography

| 토큰 | 값 |
|---|---|
| `font.family.stack` | `Pretendard GOV Variable, Pretendard GOV, -apple-system, BlinkMacSystemFont, Noto Sans KR, Segoe UI, Apple SD Gothic Neo, Roboto, Helvetica Neue, Arial, sans-serif` |
| `font.family.mono` | `JetBrains Mono, SF Mono, monospace` — 가격·등락률·순위 등 숫자 전용 |
| `font.size.xs / sm / md / lg / xl / 2xl` | `12px / 13px / 14px / 16px / 18.72px / 24px` |
| `font.size.base` | `13px` (본문 기본) |
| `font.weight.base` | `600` (UI 텍스트 기본) |
| `font.lineHeight.base` | `20px` |

- UI 레이블·값은 `600` 이상을 기본으로 사용해야 한다(must). 긴 설명 문단만 `400~500`을 쓸 수 있다(should).
- 숫자(가격·수익률·시총)는 mono 스택 + tabular 정렬로 표기해야 한다(must).
- 기본 폰트는 **Pretendard GOV**(jsDelivr 웹폰트, dynamic subset)다. 토큰 체계·색·radius는 토스증권 참조를 유지하되 서체만 Pretendard GOV를 쓴다. 임의의 다른 서체를 추가하면 안 된다(must not).

### 2.2 Color (시맨틱)

| 시맨틱 토큰 | 다크(기본) | 용도 |
|---|---|---|
| `--surface-0` (`color.surface.base`) | `#000000` | 페이지 캔버스 |
| `--surface-card` (`color.surface.muted`) | `#17171c` | 카드 |
| `--surface-card-strong` | `#1e1e24` | 카드 내부 웰 |
| `--surface-pill` | `#26262c` | 세그먼트·칩 트랙 |
| `--text-main` (`color.text.primary`) | `#f2f6ff` | 제목·핵심 값 |
| `--text-soft` (`color.text.secondary`) | `#c3c3c6` | 보조 텍스트 |
| `--text-strong-soft` (`color.text.tertiary`) | `#d8dfed` | 강조 보조(수치 레이블) |
| `--text-softest` (`color.text.inverse`) | `#888d97` | 미세 레이블·캡션 |
| `--brand` | `#3182f6` | 인터랙티브 액센트(토스 블루) |
| `--price-up` | `#f04452` | 상승(한국식 빨강) |
| `--price-down` | `#3485fa` | 하락(한국식 파랑) |
| `--line-soft` | `rgba(212, 223, 248, 0.10)` | 헤어라인 보더 |

- 의미 없는 장식 색을 추가하면 안 된다(must not). 색은 `상승/하락/브랜드/경고`의 의미가 있을 때만 쓴다.
- 상승=빨강·하락=파랑 매핑은 전 화면에서 뒤바뀌면 안 된다(must not).

### 2.3 Spacing · Radius · Shadow · Motion

| 토큰 | 값 |
|---|---|
| `space.1 / 2 / 3` | `4px / 8px / 12px` — 파생 스텝은 4px 배수만 허용 |
| `--radius-xs / sm / md / lg` | `7px / 8px / 9px / 12px` |
| `--shadow-raised` (`shadow.1`) | `rgba(212, 223, 248, 0.19) 0 0 0 0.75px inset` — 다크 카드의 헤어라인 윤곽 |
| `--motion-instant` | `200ms` (전 인터랙션 공통 duration) |

- radius·spacing에 토큰 외 값을 새로 만들면 안 된다(must not). 필요하면 토큰을 추가하고 이 문서를 갱신한다.
- 다크 카드 구분은 그림자 대신 `shadow.1` 인셋 헤어라인 + 표면 단차로 표현해야 한다(must).
- `prefers-reduced-motion: reduce`에서 모든 전환·애니메이션을 비활성화해야 한다(must).

## 3. Component Rules

공통 상태 규칙 — 모든 인터랙티브 컴포넌트는 다음 7개 상태를 정의해야 한다(must):
**default · hover · focus-visible · active · disabled · loading · error**

공통 포커스: `outline: 2px solid var(--focus-ring); outline-offset: 2px`. 포커스 링을 숨기면 안 된다(must not).

### 3.1 링크 (탐색 밀도 최상위 — 참조 사이트 기준 939개)

- **Anatomy:** 텍스트(+선택적 심볼 코드 캡션). 블록형 링크(히트맵 타일·랭킹 행)는 전체 영역이 히트 타깃.
- **States:** default `--text-main`/`--brand-strong` · hover 배경 `--interactive-hover` 또는 밑줄 · focus-visible 공통 링 · active 투명도 0.85 · disabled는 링크 대신 텍스트로 렌더 · loading 없음 · error 없음.
- **키보드/포인터/터치:** Tab 도달·Enter 활성화(must). 터치 타깃 최소 44×44px — 인라인 링크는 `py` 패딩으로 확보(must).
- **Edge:** 긴 종목명은 `truncate` + `title` 속성. 외부 링크는 `↗` 표기와 `rel="noopener noreferrer"`(must).

### 3.2 버튼·세그먼트 탭 (시장/기간/랭킹 전환)

- **Anatomy:** 트랙(`--surface-pill`, `--radius-sm`) + 아이템(`--radius-xs`, `font.size.sm`, weight 600, `space.2` 패딩).
- **Variants:** primary(`--brand` 채움, 흰 텍스트) · segment(선택 시 `--brand` 채움) · outline(헤어라인 보더).
- **States:** 선택 `aria-selected="true"` + `--brand` 배경(must) · hover `--interactive-hover` · focus-visible 공통 링 · active scale/투명도 미세 변화(200ms) · disabled `--text-softest` + `cursor: not-allowed` · loading은 레이블 유지 + 스피너 · error 상태는 토스트/인라인 메시지로 위임.
- **키보드:** `role="tablist"` 내에서 Tab 진입, Enter/Space 선택(must). 화살표 키 순회는 권장(should).
- **Edge:** 레이블은 2~5자 한글 명사("국내", "1개월"). 아이콘 단독 버튼은 `aria-label` 필수(must).

### 3.3 내비게이션 (헤더)

- **Anatomy:** 로고(홈 링크) + 우측 텍스트 링크 그룹. 높이 고정, `--line-soft` 하단 보더.
- **States:** 현재 페이지 링크는 `--text-main`, 나머지 `--text-soft`(should). hover 배경 `--interactive-hover`.
- **반응형:** 모바일에서도 동일 구조 유지(항목 2~3개 이하로 유지해야 한다, must). 스크롤 시 고정하지 않는다(should).

### 3.4 카드 (`surface-card`)

- **Anatomy:** `--surface-card` 배경 + `--shadow-raised` 인셋 헤어라인 + `--radius-lg` + 내부 패딩 `space.3` 이상.
- **Variants:** 기본 카드 · 웰(`--surface-card-strong`, 그림자 없음) · 지표 칩(고정 최소폭, 수평 스크롤 스트립).
- **States:** 정적 카드는 hover 변화 없음(must not — 클릭 가능해 보이는 착시 금지). 링크 카드만 hover 시 `-translate-y-0.5`(200ms).
- **Edge/empty:** 데이터 없음 → "시세를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요." 문구를 카드 내부에 표기(must). 로딩 → `loading-skeleton` 블록으로 동일 높이 유지(must).

### 3.5 히트맵 타일 (시그니처 컴포넌트)

- **Anatomy:** 섹터명(sm/700) + ETF 심볼 캡션(xs, `--text-softest`) + 등락률(mono lg/700).
- **색 규칙:** 배경 = 등락률 부호별 `--price-up`/`--price-down`의 알파 스케일(±3%에서 포화, 알파 0.06→0.44). 값 없음 → `--surface-card-strong` + "—"(must).
- **States:** 전체 7상태 정의 — default 위 규칙 · hover 리프트 · focus-visible 공통 링 · active 투명도 · disabled 없음(데이터 없음 타일은 비링크로 렌더해야 한다, must) · loading 스켈레톤 그리드 · error 알파 0 + 안내 문구.
- **접근성:** 색만으로 정보를 전달하면 안 된다 — 부호(+/−)가 포함된 수치 텍스트를 항상 병기(must).

### 3.6 리스트 (랭킹·구성 종목)

- **Anatomy:** 순위(mono xs) + 명칭/심볼(2줄) + 우측 값(가격 mono sm, 등락률 mono xs). 행 구분은 `--line-soft` divider.
- **States:** hover `--interactive-hover`(행 전체) · 나머지 공통 규칙.
- **Edge:** 10행 초과 금지(대시보드, must). 시총 막대는 최대값 대비 비율, 최소 2% 폭 보장(should). 빈 목록 → 한 줄 안내 문구.

### 3.7 입력 (검색 등 향후 도입 시)

- **Anatomy:** `--surface-card-strong` 배경, `--radius-sm`, `font.size.md`, 패딩 `space.2 space.3`.
- **States:** focus-visible 공통 링(must) · error 시 `--warning-border` 보더 + 아래 xs 안내 문구(must) · disabled 배경 `--surface-pill`.
- **키보드:** Esc로 값 비우기(should), Enter 제출. 레이블은 시각적 또는 `aria-label`로 항상 제공(must).

### 3.8 배지 (예시 데이터 등)

- `--warning-surface`/`--warning-border`/`--warning-icon` 조합, `--radius-xs`, `font.size.xs`/600. `title`로 사유 설명을 제공해야 한다(must).

## 4. Accessibility — 테스트 가능한 수용 기준

| # | 기준 (WCAG 2.2 AA) | Pass 조건 |
|---|---|---|
| A1 | 텍스트 대비 | 본문 대비 ≥ 4.5:1, 18px+/bold ≥ 3:1. `--text-softest`(#888d97 on #000 = 6.0:1)까지 전 토큰이 통과해야 한다 |
| A2 | 포커스 가시성 | 모든 인터랙티브 요소에 Tab 이동 시 2px 링이 시각적으로 확인됨. 스크린샷 회귀로 검증 |
| A3 | 키보드 완주 | 마우스 없이 홈 → 시장/기간 전환 → 섹터 상세 → 뒤로가기 전 과정 수행 가능 |
| A4 | 색 독립성 | 등락 정보가 색을 제거해도(grayscale) 부호 텍스트로 판독 가능 |
| A5 | 터치 타깃 | 인터랙티브 요소 44×44px 이상 (DevTools 측정) |
| A6 | reduced-motion | OS 설정 시 transition/animation 계산값 `none` |
| A7 | 시맨틱 | 탭은 `role="tab"`+`aria-selected`, 섹션은 `aria-label`, 순위는 `<ol>` 사용 |

## 5. Content & Tone

간결하고, 확신 있게, 구현 중심으로. 사용자 관점 언어만 사용한다.

- 시스템 용어 금지: "API 오류" → **"시세를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요."**
- 행동 버튼은 동사구: "제출" → **"변경 저장"**. 같은 행동은 전 화면에서 같은 이름(must).
- 수치 단위 표기: 원화 `72,000원`·`426조원`, 달러 `$231.50`·`$3.20T`, 등락 `+1.25%`/`-0.80%` (부호 필수).
- 빈 화면은 행동 안내로: "표시할 섹터가 없습니다" 다음에 대안 행동을 제시(should).
- 에러는 사과하지 않고 원인·다음 행동만 서술(must).

## 6. Anti-patterns (금지)

- raw hex를 컴포넌트에 직접 쓰기 (토큰만 허용)
- 그라디언트 텍스트·글로우·장식용 그림자
- 낮은 대비 텍스트, `outline: none`으로 포커스 제거
- 토큰 밖 spacing/radius 일회성 값
- "여기를 클릭", "더보기" 같은 무의미 레이블
- 상태 정의 없는 컴포넌트 출시 (7상태 필수)
- 색상만으로 상승/하락 전달
- 정적 카드에 hover 리프트 부여 (클릭 착시)

### Migration note (Atlassian → Toss 전환)

- 캔버스: 흰색/`#0b0e13` → **`#000000`(다크 기본)**, 카드 `#17171c`
- 브랜드: 네이비 `#233c7c` → **토스 블루 `#3182f6`**
- radius: 4/6/8/12 → **7/8/9/12** (`--radius-*` 토큰 값만 교체, 클래스는 토큰 참조로 이행)
- 상승색: `#d53a49` → **`#f04452`**
- 다크 카드 윤곽: box-shadow 레이어 → **인셋 헤어라인 `shadow.1`**
- 라이트 모드는 보조 테마로 유지하되 동일 토큰 이름을 사용

## 7. QA Checklist

배포 전 전 항목 확인(must):

- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` 통과
- [ ] 신규/변경 컴포넌트에 raw hex·비토큰 spacing 없음 (`grep -rn "#[0-9a-f]\{6\}" src/components src/app --include="*.tsx"` 결과 0)
- [ ] 7개 상태(A2 포커스 링 포함) 동작 스크린샷 확인 — 다크·라이트 각 1회
- [ ] A1~A7 접근성 기준 수동 점검
- [ ] 등락 부호 텍스트 병기 확인 (색 제거 테스트)
- [ ] 로딩 스켈레톤·빈 상태·에러 문구 렌더 확인 (데모 모드 강제로 재현)
- [ ] reduced-motion 동작 확인
- [ ] 모바일(375px)·데스크톱(1280px) 레이아웃 확인
