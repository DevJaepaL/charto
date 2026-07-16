# Charto v2 — 시장 흐름 대시보드 설계

작성일: 2026-07-16
상태: 자율 실행 모드에서 확정 (사용자 지시: "쓸데 없는 문구 및 큰틀 전부 변경해도 좋다")

## 1. 목표

v1(국내 개별 종목 차트 분석)을 폐지하고, **시장의 큰 흐름을 보는 것**을 중심 가치로 하는 v2로 전면 개편한다.

- 데이터 소스를 한국투자(KIS) → **토스증권 Open API**로 전면 교체 (v1 API 완전 제거)
- 국내(KR) + 미국(US) 시장 동시 커버
- 중심 기능: **섹터 히트맵** — 가장 강한 섹터(상승률 상위)와 가장 약한 섹터(하락률 상위)를 한눈에
- 섹터별 **대표 ETF 상세**: ETF 구성 종목과 섹터 내 시가총액 분포 제공
- 개별 종목 차트·재무제표·기본정보 페이지는 제공하지 않음

## 2. 토스증권 Open API 요약 (확인 완료)

- Base URL: `https://openapi.tossinvest.com`
- 인증: OAuth 2.0 Client Credentials → `POST /oauth2/token` (`client_id` + `client_secret`, form-urlencoded), JWT Bearer 토큰(`expires_in` 초)
- **client_secret 필수 + 허용 IP 등록 필수** → 시크릿 미설정 시 결정적 데모 데이터로 폴백하고 화면에 데모 배지 표시
- 성공 응답은 `{ "result": ... }` envelope, 실패는 `{ "error": { code, message } }`
- 숫자는 전부 decimal **문자열**
- 사용 엔드포인트 (시세 계열, 계좌 헤더 불필요):
  - `GET /api/v1/prices?symbols=` (현재가만 — 등락률 없음, 최대 200개 콤마 구분)
  - `GET /api/v1/candles?symbol=&interval=1m|1d&count=≤200&adjusted=` (등락률·기간수익률 계산의 근원)
  - `GET /api/v1/stocks?symbols=` (종목명·시장·securityType·**sharesOutstanding** → 시총 계산)
  - `GET /api/v1/rankings?type=&marketCountry=KR|US&duration=` (TOP_GAINERS/TOP_LOSERS/MARKET_TRADING_AMOUNT…, changeRate 포함)
  - `GET /api/v1/market-indicators/prices?symbols=KOSPI,KOSDAQ,KR_BOND_10Y`
  - `GET /api/v1/market-indicators/{symbol}/candles?interval=1d`
  - `GET /api/v1/market-indicators/{symbol}/investor-trading` (개인·외국인·기관 매매대금, KOSPI/KOSDAQ)
  - `GET /api/v1/exchange-rate?baseCurrency=USD&quoteCurrency=KRW`
  - `GET /api/v1/market-calendar/KR|US` (장 운영 세션)
- Rate limit: MARKET_DATA 10/s, MARKET_DATA_CHART 5/s, RANKING 5/s, MARKET_INDICATOR 10/s → 서버측 스로틀 + TTL 캐시로 흡수
- 심볼 형식: KR = 6자리 숫자(005930), US = 티커(AAPL) 그대로

### 핵심 설계 판단

1. **등락률은 candles로 계산한다.** prices에는 현재가만 있으므로, 일봉 캔들(count≤200) 1회 호출로 1D/1W/1M/3M 기간 수익률을 전부 계산한다 (마지막 봉 = 당일 진행 봉).
2. **섹터는 API에 없으므로 정적 큐레이션한다.** 섹터 = 대표 ETF 프록시. 섹터 정의(이름·대표 ETF·주요 구성 종목)는 `src/lib/market-v2/sectors.ts`에 정적 데이터로 유지한다.
   - KR: KODEX/TIGER/SOL/PLUS 섹터 ETF 16종 (반도체·2차전지·자동차·바이오·은행·증권·보험·인터넷·게임·엔터미디어·철강·에너지화학·건설·조선·방산·운송)
   - US: GICS 11섹터 SPDR ETF (XLK·XLF·XLV·XLY·XLP·XLE·XLI·XLB·XLU·XLRE·XLC)
3. **ETF 구성 종목 비중은 정적으로 싣지 않는다** (금방 낡음). 대신 "주요 구성 종목" 리스트(정적)에 실시간 가격·등락률·계산된 시가총액(현재가 × sharesOutstanding)을 붙여 시총 순으로 시각화한다.
4. **애널리스트 투자의견**: 무료 공식 API가 없으므로(TipRanks/Seeking Alpha 유료·스크래핑 금지) 미국 종목에 한해 TipRanks·Seeking Alpha·StockAnalysis 외부 링크를 제공한다.

## 3. 정보 구조 (v2)

### `/` — 마켓 대시보드 (홈)
1. **시장 지표 스트립**: KOSPI·KOSDAQ (지수+등락률), USD/KRW 환율, 국채 10년 금리, KR/US 장 운영 상태 배지
2. **섹터 히트맵 (중심)**: KR/US 탭 × 기간(1일/1주/1개월/3개월) 선택. 등락률 내림차순 정렬 그리드, 색상 강도 = 등락률 크기 (상승=빨강, 하락=파랑 — 한국식). 타일 클릭 → 섹터 상세
3. **최강/최약 섹터 하이라이트**: 상위 3 / 하위 3 카드
4. **급등/급락/거래대금 랭킹**: rankings API, KR/US 탭
5. **투자자 동향**: KOSPI·KOSDAQ 개인/외국인/기관 순매수 (investor-trading)

### `/sector/[market]/[slug]` — 섹터 상세
- 헤더: 섹터명, 대표 ETF(심볼·현재가·등락률), 기간별 수익률 (1D/1W/1M/3M)
- 구성 종목: 시총 순 테이블 — 종목명, 심볼, 현재가, 등락률, 시가총액(+상대 막대)
- 미국 종목 행에 애널리스트 의견 외부 링크
- 다른 섹터 네비게이션 칩

### 유지 (AdSense·법적 페이지)
`/about`(문구 v2로 갱신), `/privacy`, `/disclaimer`, `/contact`, `ads.txt`, robots, sitemap(v2 경로로 갱신)

### 폐지·삭제
- 페이지: `/analyze/*`, `/indicators`, `/guide/*`, `/methodology`, `/stocks`, `/market-overview`, `/login`
- API: `/api/analysis/*`, `/api/favorites`, `/api/market/*` (KIS 기반 전부), `/api/auth/*`
- 라이브러리: `lib/analysis/*`, `lib/market/*`(KIS·demo·rankings·accumulation), `lib/auth`, `lib/supabase`, `lib/favorites`, `lib/stock-master`, `lib/stock-branding`, `lib/guide-content`
- 의존성: `@google/genai`, `@supabase/supabase-js`, `next-auth`, `lightweight-charts`, `animejs`, `adm-zip`, `simple-icons` 및 관련 스크립트
- 데이터: `src/data/*.generated.json`, `stocks-snapshot.json`

## 4. 아키텍처

```
src/lib/toss/
  client.ts     # 토큰 캐시(만료 60s 여유 재발급), request<T>() envelope 언랩,
                # TossApiError, 429 시 Retry-After 1회 재시도, 그룹별 최소 간격 스로틀
  types.ts      # API 응답 타입 (decimal은 string)
  api.ts        # 엔드포인트별 typed wrapper
src/lib/market-v2/
  sectors.ts    # 정적 섹터 카탈로그 (KR 16 + US 11)
  compute.ts    # 순수 함수: 캔들 → 기간 수익률, decimal 파싱, 시총 계산
  service.ts    # buildSectorHeatmap / getMarketOverview / getSectorDetail / getMarketRankings
                # + 인메모리 TTL 캐시 (히트맵·개요 5분, 섹터상세 5분, 종목마스터 24h)
  demo.ts       # 자격증명 없을 때 심볼 해시 기반 결정적 데모 데이터 (isDemo: true)
src/app/api/v2/
  overview/route.ts   heatmap/route.ts   rankings/route.ts   sector/[market]/[slug]/route.ts
```

- 페이지는 서버 컴포넌트에서 service를 직접 호출(초기 렌더), 클라이언트 갱신(탭·기간 전환)은 `/api/v2/*` 사용
- 모든 응답에 `isDemo` 플래그 → UI에서 "예시 데이터" 배지
- 환경 변수: `TOSS_CLIENT_ID` (기본값: `tsck_live_y1tsa38TAxnqE8toA1nAOD`), `TOSS_CLIENT_SECRET` (필수, 없으면 데모)
- 배포 주의: 토스 API는 허용 IP 등록제 → 고정 IP 환경 필요. Vercel 등 가변 IP 환경에서는 데모 폴백으로 동작함을 README에 명시

## 5. 에러 처리

- 토스 API 실패(네트워크·429 재시도 소진·5xx) 시: 캐시에 stale 데이터가 있으면 stale 반환, 없으면 데모 폴백 + `isDemo`
- 부분 실패(일부 섹터 ETF 캔들 실패): 해당 타일만 `changeRate: null` 처리하고 나머지는 정상 표시

## 6. 테스트

- `compute.test.ts`: 기간 수익률 계산(경계: 봉 부족·0 기준가), decimal 파싱, 시총 포맷
- `sectors.test.ts`: 정적 데이터 무결성 (심볼 형식 KR 6자리/US 티커, slug 중복 없음, 구성 종목 중복 없음)
- `client.test.ts`: envelope 언랩, 에러 매핑, 토큰 캐시 (fetch mock)
- `demo.test.ts`: 결정성(같은 입력 → 같은 출력)
- 기존 v1 테스트는 모듈과 함께 삭제

## 7. 디자인

기존 Atlassian DESIGN.md 톤 유지: neutral-dominant, 네이비 브랜드(#233c7c), 한국식 주가색(상승 빨강 `--price-up`, 하락 파랑 `--price-down`), 8px 리듬, ADS elevation 토큰. 홈은 모바일 중심(기존 30rem 셸)에서 **대시보드형 반응형 레이아웃(max-w-6xl)**으로 확장한다.
