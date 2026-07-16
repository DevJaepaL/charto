/**
 * 섹터 카탈로그 (정적 큐레이션).
 *
 * 토스증권 API는 섹터 분류를 제공하지 않으므로, 각 섹터를 대표 ETF로 프록시한다.
 * 히트맵의 등락률은 대표 ETF 시세에서 계산하고, 구성 종목은 해당 ETF의
 * 주요 편입 종목을 큐레이션한 목록이다 (전체 구성이 아니며 비중은 싣지 않는다 —
 * 시가총액·등락률은 실시간 API로 계산해 붙인다).
 */

export type MarketId = "KR" | "US";

export interface SectorDefinition {
  market: MarketId;
  slug: string;
  /** 섹터명 (한글) */
  name: string;
  /** 히트맵 타일용 축약명 */
  shortName: string;
  etf: {
    symbol: string;
    name: string;
  };
  constituents: Array<{
    symbol: string;
    name: string;
  }>;
}

export const KR_SECTORS: SectorDefinition[] = [
  {
    market: "KR",
    slug: "semiconductor",
    name: "반도체",
    shortName: "반도체",
    etf: { symbol: "091160", name: "KODEX 반도체" },
    constituents: [
      { symbol: "000660", name: "SK하이닉스" },
      { symbol: "042700", name: "한미반도체" },
      { symbol: "403870", name: "HPSP" },
      { symbol: "058470", name: "리노공업" },
      { symbol: "000990", name: "DB하이텍" },
      { symbol: "039030", name: "이오테크닉스" },
      { symbol: "036930", name: "주성엔지니어링" },
      { symbol: "240810", name: "원익IPS" },
    ],
  },
  {
    market: "KR",
    slug: "battery",
    name: "2차전지",
    shortName: "2차전지",
    etf: { symbol: "305720", name: "KODEX 2차전지산업" },
    constituents: [
      { symbol: "373220", name: "LG에너지솔루션" },
      { symbol: "006400", name: "삼성SDI" },
      { symbol: "003670", name: "포스코퓨처엠" },
      { symbol: "247540", name: "에코프로비엠" },
      { symbol: "086520", name: "에코프로" },
      { symbol: "051910", name: "LG화학" },
      { symbol: "096770", name: "SK이노베이션" },
      { symbol: "066970", name: "엘앤에프" },
    ],
  },
  {
    market: "KR",
    slug: "auto",
    name: "자동차",
    shortName: "자동차",
    etf: { symbol: "091180", name: "KODEX 자동차" },
    constituents: [
      { symbol: "005380", name: "현대차" },
      { symbol: "000270", name: "기아" },
      { symbol: "012330", name: "현대모비스" },
      { symbol: "161390", name: "한국타이어앤테크놀로지" },
      { symbol: "018880", name: "한온시스템" },
      { symbol: "011210", name: "현대위아" },
      { symbol: "204320", name: "HL만도" },
      { symbol: "073240", name: "금호타이어" },
    ],
  },
  {
    market: "KR",
    slug: "healthcare",
    name: "바이오·헬스케어",
    shortName: "바이오",
    etf: { symbol: "266420", name: "KODEX 헬스케어" },
    constituents: [
      { symbol: "207940", name: "삼성바이오로직스" },
      { symbol: "068270", name: "셀트리온" },
      { symbol: "196170", name: "알테오젠" },
      { symbol: "326030", name: "SK바이오팜" },
      { symbol: "000100", name: "유한양행" },
      { symbol: "128940", name: "한미약품" },
      { symbol: "028300", name: "HLB" },
      { symbol: "069620", name: "대웅제약" },
    ],
  },
  {
    market: "KR",
    slug: "bank",
    name: "은행",
    shortName: "은행",
    etf: { symbol: "091170", name: "KODEX 은행" },
    constituents: [
      { symbol: "105560", name: "KB금융" },
      { symbol: "055550", name: "신한지주" },
      { symbol: "086790", name: "하나금융지주" },
      { symbol: "316140", name: "우리금융지주" },
      { symbol: "323410", name: "카카오뱅크" },
      { symbol: "024110", name: "기업은행" },
      { symbol: "138930", name: "BNK금융지주" },
      { symbol: "175330", name: "JB금융지주" },
    ],
  },
  {
    market: "KR",
    slug: "securities",
    name: "증권",
    shortName: "증권",
    etf: { symbol: "102970", name: "KODEX 증권" },
    constituents: [
      { symbol: "006800", name: "미래에셋증권" },
      { symbol: "071050", name: "한국금융지주" },
      { symbol: "005940", name: "NH투자증권" },
      { symbol: "016360", name: "삼성증권" },
      { symbol: "039490", name: "키움증권" },
      { symbol: "003540", name: "대신증권" },
    ],
  },
  {
    market: "KR",
    slug: "insurance",
    name: "보험",
    shortName: "보험",
    etf: { symbol: "140700", name: "KODEX 보험" },
    constituents: [
      { symbol: "032830", name: "삼성생명" },
      { symbol: "000810", name: "삼성화재" },
      { symbol: "005830", name: "DB손해보험" },
      { symbol: "001450", name: "현대해상" },
      { symbol: "088350", name: "한화생명" },
      { symbol: "003690", name: "코리안리" },
    ],
  },
  {
    market: "KR",
    slug: "internet",
    name: "인터넷·플랫폼",
    shortName: "인터넷",
    etf: { symbol: "365000", name: "TIGER 인터넷TOP10" },
    constituents: [
      { symbol: "035420", name: "NAVER" },
      { symbol: "035720", name: "카카오" },
      { symbol: "377300", name: "카카오페이" },
      { symbol: "067160", name: "SOOP" },
      { symbol: "012510", name: "더존비즈온" },
      { symbol: "181710", name: "NHN" },
    ],
  },
  {
    market: "KR",
    slug: "game",
    name: "게임",
    shortName: "게임",
    etf: { symbol: "300950", name: "KODEX 게임산업" },
    constituents: [
      { symbol: "259960", name: "크래프톤" },
      { symbol: "036570", name: "엔씨소프트" },
      { symbol: "251270", name: "넷마블" },
      { symbol: "293490", name: "카카오게임즈" },
      { symbol: "263750", name: "펄어비스" },
      { symbol: "112040", name: "위메이드" },
    ],
  },
  {
    market: "KR",
    slug: "media",
    name: "미디어·엔터",
    shortName: "엔터",
    etf: { symbol: "266360", name: "KODEX 미디어&엔터테인먼트" },
    constituents: [
      { symbol: "352820", name: "하이브" },
      { symbol: "035900", name: "JYP Ent." },
      { symbol: "041510", name: "에스엠" },
      { symbol: "122870", name: "와이지엔터테인먼트" },
      { symbol: "035760", name: "CJ ENM" },
      { symbol: "253450", name: "스튜디오드래곤" },
    ],
  },
  {
    market: "KR",
    slug: "steel",
    name: "철강·소재",
    shortName: "철강",
    etf: { symbol: "117680", name: "KODEX 철강" },
    constituents: [
      { symbol: "005490", name: "POSCO홀딩스" },
      { symbol: "010130", name: "고려아연" },
      { symbol: "004020", name: "현대제철" },
      { symbol: "103140", name: "풍산" },
      { symbol: "460860", name: "동국제강" },
    ],
  },
  {
    market: "KR",
    slug: "energy-chem",
    name: "에너지·화학",
    shortName: "화학",
    etf: { symbol: "117460", name: "KODEX 에너지화학" },
    constituents: [
      { symbol: "051910", name: "LG화학" },
      { symbol: "096770", name: "SK이노베이션" },
      { symbol: "010950", name: "S-Oil" },
      { symbol: "011170", name: "롯데케미칼" },
      { symbol: "011780", name: "금호석유" },
      { symbol: "009830", name: "한화솔루션" },
    ],
  },
  {
    market: "KR",
    slug: "construction",
    name: "건설",
    shortName: "건설",
    etf: { symbol: "117700", name: "KODEX 건설" },
    constituents: [
      { symbol: "000720", name: "현대건설" },
      { symbol: "006360", name: "GS건설" },
      { symbol: "375500", name: "DL이앤씨" },
      { symbol: "047040", name: "대우건설" },
      { symbol: "294870", name: "HDC현대산업개발" },
    ],
  },
  {
    market: "KR",
    slug: "shipbuilding",
    name: "조선",
    shortName: "조선",
    etf: { symbol: "466920", name: "SOL 조선TOP3플러스" },
    constituents: [
      { symbol: "009540", name: "HD한국조선해양" },
      { symbol: "042660", name: "한화오션" },
      { symbol: "010140", name: "삼성중공업" },
      { symbol: "329180", name: "HD현대중공업" },
      { symbol: "010620", name: "HD현대미포" },
      { symbol: "082740", name: "한화엔진" },
    ],
  },
  {
    market: "KR",
    slug: "defense",
    name: "방위산업",
    shortName: "방산",
    etf: { symbol: "449450", name: "PLUS K방산" },
    constituents: [
      { symbol: "012450", name: "한화에어로스페이스" },
      { symbol: "064350", name: "현대로템" },
      { symbol: "079550", name: "LIG넥스원" },
      { symbol: "047810", name: "한국항공우주" },
      { symbol: "103140", name: "풍산" },
    ],
  },
  {
    market: "KR",
    slug: "transport",
    name: "운송·물류",
    shortName: "운송",
    etf: { symbol: "140710", name: "KODEX 운송" },
    constituents: [
      { symbol: "003490", name: "대한항공" },
      { symbol: "011200", name: "HMM" },
      { symbol: "086280", name: "현대글로비스" },
      { symbol: "000120", name: "CJ대한통운" },
      { symbol: "028670", name: "팬오션" },
    ],
  },
];

export const US_SECTORS: SectorDefinition[] = [
  {
    market: "US",
    slug: "technology",
    name: "기술 (Technology)",
    shortName: "기술",
    etf: { symbol: "XLK", name: "Technology Select Sector SPDR" },
    constituents: [
      { symbol: "AAPL", name: "Apple" },
      { symbol: "MSFT", name: "Microsoft" },
      { symbol: "NVDA", name: "NVIDIA" },
      { symbol: "AVGO", name: "Broadcom" },
      { symbol: "ORCL", name: "Oracle" },
      { symbol: "CRM", name: "Salesforce" },
      { symbol: "AMD", name: "AMD" },
      { symbol: "ADBE", name: "Adobe" },
      { symbol: "CSCO", name: "Cisco" },
      { symbol: "ACN", name: "Accenture" },
    ],
  },
  {
    market: "US",
    slug: "financials",
    name: "금융 (Financials)",
    shortName: "금융",
    etf: { symbol: "XLF", name: "Financial Select Sector SPDR" },
    constituents: [
      { symbol: "JPM", name: "JPMorgan Chase" },
      { symbol: "V", name: "Visa" },
      { symbol: "MA", name: "Mastercard" },
      { symbol: "BAC", name: "Bank of America" },
      { symbol: "WFC", name: "Wells Fargo" },
      { symbol: "GS", name: "Goldman Sachs" },
      { symbol: "MS", name: "Morgan Stanley" },
      { symbol: "SPGI", name: "S&P Global" },
      { symbol: "AXP", name: "American Express" },
    ],
  },
  {
    market: "US",
    slug: "healthcare",
    name: "헬스케어 (Health Care)",
    shortName: "헬스케어",
    etf: { symbol: "XLV", name: "Health Care Select Sector SPDR" },
    constituents: [
      { symbol: "LLY", name: "Eli Lilly" },
      { symbol: "UNH", name: "UnitedHealth" },
      { symbol: "JNJ", name: "Johnson & Johnson" },
      { symbol: "ABBV", name: "AbbVie" },
      { symbol: "MRK", name: "Merck" },
      { symbol: "TMO", name: "Thermo Fisher" },
      { symbol: "ABT", name: "Abbott" },
      { symbol: "AMGN", name: "Amgen" },
      { symbol: "ISRG", name: "Intuitive Surgical" },
      { symbol: "PFE", name: "Pfizer" },
    ],
  },
  {
    market: "US",
    slug: "consumer-discretionary",
    name: "임의소비재 (Consumer Discretionary)",
    shortName: "임의소비재",
    etf: { symbol: "XLY", name: "Consumer Discretionary Select SPDR" },
    constituents: [
      { symbol: "AMZN", name: "Amazon" },
      { symbol: "TSLA", name: "Tesla" },
      { symbol: "HD", name: "Home Depot" },
      { symbol: "MCD", name: "McDonald's" },
      { symbol: "BKNG", name: "Booking Holdings" },
      { symbol: "LOW", name: "Lowe's" },
      { symbol: "TJX", name: "TJX Companies" },
      { symbol: "NKE", name: "Nike" },
      { symbol: "SBUX", name: "Starbucks" },
    ],
  },
  {
    market: "US",
    slug: "consumer-staples",
    name: "필수소비재 (Consumer Staples)",
    shortName: "필수소비재",
    etf: { symbol: "XLP", name: "Consumer Staples Select SPDR" },
    constituents: [
      { symbol: "PG", name: "Procter & Gamble" },
      { symbol: "COST", name: "Costco" },
      { symbol: "WMT", name: "Walmart" },
      { symbol: "KO", name: "Coca-Cola" },
      { symbol: "PEP", name: "PepsiCo" },
      { symbol: "PM", name: "Philip Morris" },
      { symbol: "MDLZ", name: "Mondelez" },
      { symbol: "CL", name: "Colgate-Palmolive" },
    ],
  },
  {
    market: "US",
    slug: "energy",
    name: "에너지 (Energy)",
    shortName: "에너지",
    etf: { symbol: "XLE", name: "Energy Select Sector SPDR" },
    constituents: [
      { symbol: "XOM", name: "Exxon Mobil" },
      { symbol: "CVX", name: "Chevron" },
      { symbol: "COP", name: "ConocoPhillips" },
      { symbol: "WMB", name: "Williams Companies" },
      { symbol: "EOG", name: "EOG Resources" },
      { symbol: "SLB", name: "SLB" },
      { symbol: "PSX", name: "Phillips 66" },
      { symbol: "MPC", name: "Marathon Petroleum" },
    ],
  },
  {
    market: "US",
    slug: "industrials",
    name: "산업재 (Industrials)",
    shortName: "산업재",
    etf: { symbol: "XLI", name: "Industrial Select Sector SPDR" },
    constituents: [
      { symbol: "GE", name: "GE Aerospace" },
      { symbol: "CAT", name: "Caterpillar" },
      { symbol: "RTX", name: "RTX" },
      { symbol: "HON", name: "Honeywell" },
      { symbol: "UNP", name: "Union Pacific" },
      { symbol: "BA", name: "Boeing" },
      { symbol: "DE", name: "Deere" },
      { symbol: "LMT", name: "Lockheed Martin" },
      { symbol: "UPS", name: "UPS" },
    ],
  },
  {
    market: "US",
    slug: "materials",
    name: "소재 (Materials)",
    shortName: "소재",
    etf: { symbol: "XLB", name: "Materials Select Sector SPDR" },
    constituents: [
      { symbol: "LIN", name: "Linde" },
      { symbol: "SHW", name: "Sherwin-Williams" },
      { symbol: "APD", name: "Air Products" },
      { symbol: "ECL", name: "Ecolab" },
      { symbol: "FCX", name: "Freeport-McMoRan" },
      { symbol: "NEM", name: "Newmont" },
      { symbol: "DOW", name: "Dow" },
    ],
  },
  {
    market: "US",
    slug: "utilities",
    name: "유틸리티 (Utilities)",
    shortName: "유틸리티",
    etf: { symbol: "XLU", name: "Utilities Select Sector SPDR" },
    constituents: [
      { symbol: "NEE", name: "NextEra Energy" },
      { symbol: "SO", name: "Southern Company" },
      { symbol: "DUK", name: "Duke Energy" },
      { symbol: "CEG", name: "Constellation Energy" },
      { symbol: "SRE", name: "Sempra" },
      { symbol: "AEP", name: "American Electric Power" },
      { symbol: "EXC", name: "Exelon" },
    ],
  },
  {
    market: "US",
    slug: "real-estate",
    name: "부동산 (Real Estate)",
    shortName: "부동산",
    etf: { symbol: "XLRE", name: "Real Estate Select Sector SPDR" },
    constituents: [
      { symbol: "PLD", name: "Prologis" },
      { symbol: "AMT", name: "American Tower" },
      { symbol: "EQIX", name: "Equinix" },
      { symbol: "WELL", name: "Welltower" },
      { symbol: "SPG", name: "Simon Property" },
      { symbol: "PSA", name: "Public Storage" },
      { symbol: "O", name: "Realty Income" },
    ],
  },
  {
    market: "US",
    slug: "communication",
    name: "커뮤니케이션 (Communication Services)",
    shortName: "커뮤니케이션",
    etf: { symbol: "XLC", name: "Communication Services Select SPDR" },
    constituents: [
      { symbol: "META", name: "Meta Platforms" },
      { symbol: "GOOGL", name: "Alphabet A" },
      { symbol: "NFLX", name: "Netflix" },
      { symbol: "DIS", name: "Walt Disney" },
      { symbol: "TMUS", name: "T-Mobile US" },
      { symbol: "CMCSA", name: "Comcast" },
      { symbol: "VZ", name: "Verizon" },
      { symbol: "T", name: "AT&T" },
    ],
  },
];

export const ALL_SECTORS: SectorDefinition[] = [...KR_SECTORS, ...US_SECTORS];

export function getSectorsByMarket(market: MarketId): SectorDefinition[] {
  return market === "KR" ? KR_SECTORS : US_SECTORS;
}

export function findSector(market: MarketId, slug: string): SectorDefinition | null {
  return getSectorsByMarket(market).find((sector) => sector.slug === slug) ?? null;
}

export function isMarketId(value: string): value is MarketId {
  return value === "KR" || value === "US";
}
