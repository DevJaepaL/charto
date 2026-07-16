# CHARTO v2

![Version](https://img.shields.io/badge/version-2.0.0-233c7c?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16.1.6-111827?style=flat-square&logo=nextdotjs)
![Vercel](https://img.shields.io/badge/Vercel-ready-000000?style=flat-square&logo=vercel)

<b><a href="https://charto.space">charto.space</a></b>

국내·미국 증시의 **시장 큰 흐름**을 한 화면에서 보는 마켓 대시보드입니다.
개별 종목 차트 분석(v1)을 폐지하고, 섹터 단위의 자금 흐름을 중심으로 전면 개편했습니다.

## 주요 기능

- **섹터 히트맵** — 국내 16개·미국 11개(GICS) 섹터를 대표 ETF 수익률로 색칠. 기간(1일/1주/1개월/3개월) 전환, 가장 강한/약한 섹터 하이라이트
- **섹터 상세** — 대표 ETF의 기간별 수익률과 주요 구성 종목의 현재가·등락률·시가총액(현재가 × 발행주식수) 시각화
- **애널리스트 의견** — 미국 종목별 TipRanks·Seeking Alpha 외부 링크
- **오늘의 랭킹** — 급상승·급하락·거래대금 상위 (국내·미국)
- **투자자 순매수** — 코스피·코스닥 개인/외국인/기관 매매 동향
- **시장 지표 스트립** — 지수, 달러 환율, 국채 10년, 장 운영 상태

## 데이터 소스

시세·랭킹·시장 지표는 전부 [토스증권 Open API](https://developers.tossinvest.com/docs)를 사용합니다.

- 인증: OAuth 2.0 Client Credentials (`TOSS_CLIENT_ID` + `TOSS_CLIENT_SECRET`)
- **허용 IP 등록제**: 토스증권 WTS > 설정 > Open API에서 호출 서버 IP를 등록해야 합니다. 미등록 IP는 403으로 차단됩니다.
- 시크릿이 없거나 API 호출이 실패하면 결정적 예시(데모) 데이터로 폴백하며, 화면에 "예시 데이터" 배지가 표시됩니다.
- 섹터 분류·대표 ETF·주요 구성 종목 목록은 자체 큐레이션 정적 데이터입니다 (`src/lib/market-v2/sectors.ts`).

## 실행 방법

```bash
pnpm install
cp .env.example .env   # TOSS_CLIENT_SECRET 설정 (없으면 데모 모드)
pnpm dev
```

## Validate

```bash
pnpm typecheck
pnpm lint
pnpm test        # vitest 단위 테스트
pnpm test:e2e    # playwright (데모 모드 기준)
pnpm build
```

## 아키텍처 요약

```
src/lib/toss/       토스증권 API 클라이언트 (토큰 캐시·스로틀·429 재시도)
src/lib/market-v2/  섹터 카탈로그, 수익률 계산, 서비스(TTL 캐시), 데모 폴백
src/app/api/v2/     heatmap · overview · rankings · sector API 라우트
src/app/            / (대시보드) · /sector/[market]/[slug] (섹터 상세)
```

설계 문서: [docs/superpowers/specs/2026-07-16-v2-market-dashboard-design.md](./docs/superpowers/specs/2026-07-16-v2-market-dashboard-design.md)

## 라이선스

All Rights Reserved

## 출처 및 저작권

- 시세·랭킹·시장 지표: [토스증권 Open API](https://developers.tossinvest.com/docs)
- 아이콘: [Tabler Icons](https://tabler.io/icons) (MIT)
- TipRanks·Seeking Alpha는 각 사의 상표이며, 본 서비스는 외부 링크만 제공합니다.
- Copyright © 2026 DevJaepaL All Rights Reserved.
