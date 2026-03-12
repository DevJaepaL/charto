import type {
  CompanyContext,
  ContextConfidence,
  InstrumentKind,
  InstrumentProfile,
  StockLookupItem,
} from "@/lib/types";

type CompanyContextRule = {
  match: RegExp;
  sector: string;
  businessSummary: string;
  industryFlow: string;
  marketPosition: string;
  confidence?: ContextConfidence;
  interpretWithCaution?: boolean;
};

const GROUP_RULES: Array<{ match: RegExp; group: string }> = [
  { match: /(삼성)/, group: "삼성" },
  { match: /(SK|에스케이|하이닉스)/, group: "SK" },
  { match: /(LG)/, group: "LG" },
  { match: /(현대|기아|모비스|현대로템|현대차|현대건설)/, group: "현대차" },
  { match: /(HD현대|한국조선해양|현대중공업)/, group: "HD현대" },
  { match: /(한화)/, group: "한화" },
  { match: /(포스코|POSCO)/i, group: "포스코" },
  { match: /(두산)/, group: "두산" },
  { match: /(카카오)/, group: "카카오" },
  { match: /(NAVER|네이버)/i, group: "NAVER" },
  { match: /(LS)/, group: "LS" },
  { match: /(CJ)/, group: "CJ" },
  { match: /(롯데)/, group: "롯데" },
  { match: /(효성)/, group: "효성" },
];

const CONTEXT_RULES: CompanyContextRule[] = [
  {
    match: /(스팩|SPAC)/i,
    sector: "스팩",
    businessSummary: "스팩은 기존 사업 실적보다 합병 기대와 일정에 따라 가격이 움직이는 특성이 강한 종목입니다.",
    industryFlow: "실적이나 업황보다 합병 대상 기대와 수급에 따라 변동성이 크게 나타나는 경우가 많습니다.",
    marketPosition: "일반 기업처럼 업종 평가를 적용하기 어렵기 때문에 기술적 점수도 보수적으로 보는 편이 좋습니다.",
    confidence: "high",
    interpretWithCaution: true,
  },
  {
    match: /(삼성전자|하이닉스|반도체|DB하이텍|한미반도체|주성엔지니어링|원익|리노공업|ISC|가온칩스|텔레칩스|칩스앤미디어|유진테크|네패스)/,
    sector: "반도체",
    businessSummary: "실적과 밸류에이션이 메모리 가격, AI 서버 투자, 고객사 설비투자 사이클에 크게 민감한 업종입니다.",
    industryFlow: "반도체 업황은 재고 정상화, AI 수요, 글로벌 CAPEX 방향에 따라 강하게 움직이는 편입니다.",
    marketPosition: "차트가 살아날 때는 업황 개선 기대가 빠르게 반영되고, 꺾일 때는 이익 추정 하향 우려가 크게 반영되기 쉽습니다.",
  },
  {
    match: /(전선|LS ELECTRIC|LS에코에너지|대한전선|가온전선|일진전기|제룡전기|효성중공업)/,
    sector: "전력·전선",
    businessSummary: "전력망 투자, 북미 인프라 발주, 변압기·케이블 수급이 기업 가치에 직접 연결되는 업종입니다.",
    industryFlow: "전력 인프라 증설과 수주 잔고 확대 기대가 강할 때 업종 프리미엄이 빠르게 붙는 경향이 있습니다.",
    marketPosition: "수주 기대와 전력 설비 투자 심리가 이어질수록 강세 탄력이 붙기 쉬운 구조입니다.",
  },
  {
    match: /(현대차|기아|모비스|만도|현대로템|HL만도)/,
    sector: "자동차",
    businessSummary: "판매 믹스, 환율, 전기차 전략, 글로벌 수요 회복이 함께 반영되는 대표 경기민감 업종입니다.",
    industryFlow: "자동차 업종은 환율 우호 구간, 판매 호조, 주주환원 기대가 맞물릴 때 강세를 보이기 쉽습니다.",
    marketPosition: "차트가 살아날 때는 실적 안정성과 주주환원 기대가 같이 평가받는 경우가 많습니다.",
  },
  {
    match: /(HD현대에너지솔루션|현대에너지솔루션)/,
    sector: "태양광·신재생에너지",
    businessSummary: "태양광 셀·모듈 수요와 설치 시장 분위기, 정책 지원, 전력 인프라 투자에 민감한 신재생에너지 기업입니다.",
    industryFlow: "태양광 업종은 설치 수요 회복과 정책 지원 기대가 살아날 때 업종 심리가 빠르게 개선되는 편입니다.",
    marketPosition: "전방 설치 수요와 수익성 개선 신호가 확인될수록 밸류에이션이 재평가되기 쉬운 구조입니다.",
  },
  {
    match: /(이차전지|LG에너지솔루션|삼성SDI|SK아이이테크놀로지|에코프로|에코프로비엠|포스코퓨처엠|엘앤에프|천보|코스모신소재|대주전자재료)/,
    sector: "2차전지",
    businessSummary: "밸류에이션 변동성이 크고 전기차 수요, 소재 가격, 고객사 증설 속도에 따라 심리가 크게 움직입니다.",
    industryFlow: "2차전지는 수요 기대가 회복될 때 강하게 반등하지만, 증설 부담이나 판가 둔화 우려에도 민감합니다.",
    marketPosition: "기대와 실망이 빠르게 반영되는 성장주 성격이 강해 추세 확인이 특히 중요합니다.",
  },
  {
    match: /(흥구석유|한국석유|중앙에너비스|극동유화|S-Oil|에쓰오일|SK이노베이션|GS칼텍스|정유|석유)/,
    sector: "정유·에너지",
    businessSummary: "국제유가, 정제마진, 환율, 지정학 변수에 따라 주가가 빠르게 흔들릴 수 있는 업종입니다.",
    industryFlow: "정유·에너지는 국제유가 급등락과 지정학 이슈에 따라 단기 심리가 크게 변하는 편입니다.",
    marketPosition: "단기 재료에 과민하게 반응하는 경우가 많아 기술적 점수는 보수적으로 해석하는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /(롯데케미칼|금호석유|대한유화|LG화학|한화솔루션|효성화학|코오롱인더|화학)/,
    sector: "화학",
    businessSummary: "원재료 가격과 스프레드, 전방 수요 회복, 증설 부담에 따라 실적 변동성이 커지는 업종입니다.",
    industryFlow: "화학주는 경기 회복과 원가 안정 기대가 붙을 때 반등 탄력이 커지지만 시황 둔화에도 민감합니다.",
    marketPosition: "업황 방향성이 명확해질 때 재평가가 빠르게 진행되지만, 사이클 둔화 구간에서는 보수적으로 보는 편이 좋습니다.",
  },
  {
    match: /(바이오|제약|셀트리온|유한양행|삼성바이오로직스|한미약품|알테오젠|펩트론|보로노이|에이비엘바이오)/,
    sector: "바이오·제약",
    businessSummary: "임상 일정, 기술수출 기대, 생산능력 확대, 정책 변화가 valuation에 크게 반영되는 업종입니다.",
    industryFlow: "바이오 업종은 모멘텀 장세에서 빠르게 탄력을 받지만, 이벤트 공백기에는 변동성도 커집니다.",
    marketPosition: "기술 이벤트 기대가 살아 있을수록 수급이 강해지지만, 확인되지 않은 기대만으로는 흔들릴 수 있습니다.",
    interpretWithCaution: true,
  },
  {
    match: /(SM|에스엠|SM엔터|YG|와이지|JYP|제이와이피|하이브|HYBE|큐브엔터|CJ ENM|디어유|에프엔씨엔터|와이지엔터테인먼트)/i,
    sector: "엔터테인먼트",
    businessSummary: "아티스트 활동 일정, 음반·공연 성과, 플랫폼 확장, 팬덤 지표가 실적 기대에 직접 연결되는 업종입니다.",
    industryFlow: "엔터주는 컴백 일정과 글로벌 투어, 플랫폼 성장 기대가 붙을 때 업종 전체 심리가 강해지는 편입니다.",
    marketPosition: "라인업 공백이나 흥행 편차가 있으면 변동성이 커질 수 있어 차트 신호도 일정 리스크와 함께 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /(스튜디오드래곤|콘텐트리중앙|쇼박스|NEW|제이콘텐트리|SBS|KX|IHQ|위지윅스튜디오|미디어|광고|제일기획|이노션)/,
    sector: "미디어·콘텐츠",
    businessSummary: "광고 경기와 콘텐츠 흥행, 제작 편수, 플랫폼 수요가 실적과 주가에 함께 반영되는 업종입니다.",
    industryFlow: "미디어·콘텐츠는 광고 회복과 흥행작 기대가 붙을 때 업종 심리가 빠르게 좋아지는 편입니다.",
    marketPosition: "흥행 편차가 클 수 있어 실적 확인 전까지는 기대감과 변동성을 함께 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /(NAVER|카카오|플랫폼|게임|크래프톤|엔씨소프트|넷마블|펄어비스|더블유게임즈|데브시스터즈)/i,
    sector: "인터넷·플랫폼·게임",
    businessSummary: "광고, 커머스, 콘텐츠, 트래픽, 신사업 확장성과 규제 이슈가 함께 반영되는 성장 업종입니다.",
    industryFlow: "플랫폼과 게임은 신작 모멘텀, 광고 회복, 규제 완화 기대가 붙을 때 투자심리가 개선됩니다.",
    marketPosition: "사용자 지표와 신사업 기대가 좋아질 때 멀티플 재평가가 빠르게 나타날 수 있습니다.",
  },
  {
    match: /(더존비즈온|안랩|한글과컴퓨터|한컴|엑셈|솔트룩스|코난테크놀로지|알체라|마음AI|오브젠|포티투마루|보안|소프트웨어|클라우드|AI)/i,
    sector: "소프트웨어·AI",
    businessSummary: "기업 투자, 공공 프로젝트, AI 기대감, 반복 매출 구조가 밸류에이션에 직접 반영되는 업종입니다.",
    industryFlow: "소프트웨어·AI는 실적보다 성장 기대가 먼저 움직이는 경우가 많아 업종 심리가 빠르게 달라집니다.",
    marketPosition: "기대가 앞서면 주가가 먼저 반응할 수 있어 기술적 점수도 실적 확인 전까지는 보수적으로 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /(레인보우로보틱스|두산로보틱스|로보티즈|유일로보틱스|티로보틱스|에스피지|로보스타|로봇|자동화)/,
    sector: "로봇·자동화",
    businessSummary: "산업 자동화 투자와 신사업 기대, 로봇 침투율 확대 스토리가 주가에 강하게 반영되는 업종입니다.",
    industryFlow: "로봇·자동화는 테마 수급이 크게 붙을 때 빠르게 급등할 수 있지만, 기대가 꺾이면 변동성도 큰 편입니다.",
    marketPosition: "장기 성장 스토리는 유효해도 단기 과열이 잦아 추천 점수는 한 단계 보수적으로 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /(조선|중공업|한화오션|삼성중공업|HD현대중공업|HD한국조선해양|HSD엔진)/,
    sector: "조선·중공업",
    businessSummary: "수주잔고, 선가, 해운 사이클, LNG·방산 발주 기대가 핵심 변수인 업종입니다.",
    industryFlow: "조선은 장기 수주 사이클과 믹스 개선 기대가 강할수록 추세가 길게 이어질 수 있습니다.",
    marketPosition: "수주 모멘텀이 확인되면 중장기 기대가 가격에 반영되기 쉬운 편입니다.",
  },
  {
    match: /(방산|한화에어로스페이스|한국항공우주|LIG넥스원|현대로템|풍산)/,
    sector: "방산",
    businessSummary: "해외 수주, 지정학 긴장, 정부 예산 확대가 실적 가시성과 밸류에이션을 좌우하는 업종입니다.",
    industryFlow: "방산은 대형 수주 뉴스와 수출 기대가 이어질 때 프리미엄이 붙기 쉽습니다.",
    marketPosition: "수주 가시성이 높아질수록 기업 가치 평가가 상향되는 흐름을 자주 보입니다.",
  },
  {
    match: /(건설|GS건설|현대건설|대우건설|DL이앤씨|HDC현대산업개발)/,
    sector: "건설",
    businessSummary: "주택 경기, 원가율, 해외 수주, 금리 방향이 기업 평가에 큰 영향을 주는 업종입니다.",
    industryFlow: "건설은 금리 안정과 수주 회복 기대가 붙을 때 반등 탄력이 생기기 쉽습니다.",
    marketPosition: "실적 신뢰도가 개선될 때 저평가 해소 흐름이 강하게 나타날 수 있습니다.",
  },
  {
    match: /(SK리츠|롯데리츠|ESR켄달스퀘어리츠|신한글로벌액티브리츠|리츠)/,
    sector: "리츠·부동산",
    businessSummary: "리츠는 개별 기업 성장성보다 임대료 흐름, 배당, 금리와 자산 가치 변동이 핵심인 상품형 주식입니다.",
    industryFlow: "리츠는 금리 안정 기대와 배당 선호가 커질 때 상대적으로 주목받는 편입니다.",
    marketPosition: "배당과 자산 가치 관점이 중요해 일반 성장주와 같은 추천 점수 해석은 피하는 편이 좋습니다.",
    confidence: "high",
    interpretWithCaution: true,
  },
  {
    match: /(은행|금융|증권|보험|KB|신한|하나금융|우리금융|메리츠|삼성화재|미래에셋|키움증권)/,
    sector: "금융",
    businessSummary: "금리, 대손비용, 거래대금, 주주환원 정책이 핵심 변수인 업종입니다.",
    industryFlow: "금융은 배당·자사주 기대와 실적 안정성이 부각될 때 방어주 매력이 커집니다.",
    marketPosition: "낮은 밸류에이션이 재평가되려면 실적 안정성과 주주환원 신뢰가 같이 확인돼야 합니다.",
  },
  {
    match: /(철강|POSCO|포스코|현대제철|동국제강|세아베스틸)/i,
    sector: "철강·소재",
    businessSummary: "원재료 가격, 중국 수요, 인프라 투자, 제품 스프레드에 따라 실적이 크게 달라지는 업종입니다.",
    industryFlow: "소재 업종은 업황 기대가 붙을 때 빠르게 움직이지만 경기 둔화 우려에도 민감합니다.",
    marketPosition: "시황 반등 기대가 붙을 때 밸류에이션 정상화가 빠르게 진행될 수 있습니다.",
  },
  {
    match: /(통신|SK텔레콤|KT|LG유플러스)/,
    sector: "통신",
    businessSummary: "현금흐름 안정성과 배당 매력이 중요한 방어 업종입니다.",
    industryFlow: "통신은 금리 하락 기대와 안정적 현금흐름 선호가 커질 때 상대적으로 주목받습니다.",
    marketPosition: "강한 성장주보다 안정적인 수익성과 주주환원 관점에서 평가받는 편입니다.",
  },
  {
    match: /(대한항공|아시아나|진에어|제주항공|티웨이|에어부산|하나투어|모두투어|노랑풍선|참좋은여행|롯데관광개발|호텔신라|파라다이스|항공|여행|면세|카지노|호텔)/,
    sector: "여행·항공·레저",
    businessSummary: "여행 수요, 환율, 유가, 운임, 소비 심리 회복이 동시에 반영되는 업종입니다.",
    industryFlow: "여행·항공·레저는 리오프닝 기대나 소비 회복 기대가 붙을 때 업종 전체로 매수세가 확산되기 쉽습니다.",
    marketPosition: "유가와 환율, 수요 민감도가 높아 단기 이벤트에 따라 흔들릴 수 있어 보수적으로 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /(이마트|롯데쇼핑|현대백화점|신세계|BGF리테일|GS리테일|이랜드리테일|유통|백화점|편의점)/,
    sector: "유통·리테일",
    businessSummary: "소비 경기와 점포 효율, 온라인 경쟁, 객단가 흐름이 실적과 밸류에이션에 반영되는 업종입니다.",
    industryFlow: "유통주는 내수 소비 회복 기대가 살아날 때 상대적으로 안정적인 수급이 유입되는 편입니다.",
    marketPosition: "소비 지표 회복이 확인될수록 실적 신뢰가 높아지지만, 경기 둔화 구간에서는 보수적으로 보는 편이 좋습니다.",
  },
  {
    match: /(식품|오리온|농심|CJ제일제당|삼양식품|롯데웰푸드|하이트진로|빙그레|대상)/,
    sector: "식품·소비재",
    businessSummary: "원가 부담, 가격 전가력, 해외 확장성과 브랜드 파워가 중요한 내수 소비 업종입니다.",
    industryFlow: "소비재는 실적 안정성과 해외 성장 스토리가 붙을 때 꾸준한 수급이 들어오는 편입니다.",
    marketPosition: "브랜드 경쟁력과 해외 매출 확대 기대가 함께 반영되면 재평가 여지가 생깁니다.",
  },
  {
    match: /(화장품|아모레|LG생활건강|클리오|한국콜마|코스맥스)/,
    sector: "화장품",
    businessSummary: "중국과 글로벌 소비 회복, 브랜드 경쟁력, 면세 채널 회복이 핵심 변수입니다.",
    industryFlow: "화장품은 해외 수요 회복 기대가 커질 때 업종 전체로 매수세가 확산되는 경우가 많습니다.",
    marketPosition: "실적 회복 속도가 빨라질수록 멀티플 정상화가 탄력을 받을 수 있습니다.",
  },
  {
    match: /(클래시스|원텍|뷰노|루닛|덴티움|디오|바텍|인바디|메디톡스|휴젤|오스템임플란트|파마리서치|의료기기|미용기기)/,
    sector: "의료기기·헬스케어",
    businessSummary: "수출 성장성과 시술 수요, 병원 투자, 제품 경쟁력이 밸류에이션에 반영되는 업종입니다.",
    industryFlow: "의료기기·헬스케어는 해외 확장 기대와 신제품 모멘텀이 붙을 때 빠르게 재평가되는 경우가 많습니다.",
    marketPosition: "성장 기대가 강한 만큼 밸류에이션 변동성도 커질 수 있어 차트와 실적을 함께 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /(HMM|팬오션|대한해운|한진|KCTC|동방|CJ대한통운|세방|한익스프레스|해운|물류)/,
    sector: "해운·물류",
    businessSummary: "운임과 물동량, 글로벌 교역 흐름, 물류 단가가 실적과 주가에 직접 연결되는 업종입니다.",
    industryFlow: "해운·물류는 운임 반등과 물동량 회복 기대가 붙을 때 업종 심리가 빠르게 살아나는 편입니다.",
    marketPosition: "경기와 운임 변수에 민감해 사이클 변화가 빨라질 수 있어 점수를 보수적으로 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /(한국전력|한국가스공사|지역난방공사|한전기술|한전KPS|두산에너빌리티|비에이치아이|유틸리티|도시가스|가스공사|전력공사|원전)/,
    sector: "유틸리티·에너지인프라",
    businessSummary: "전력 수요, 요금 정책, 원전·발전 설비 투자와 정책 방향이 실적과 가치 평가에 반영되는 업종입니다.",
    industryFlow: "유틸리티·에너지인프라는 정책 기대와 설비 투자 확대가 붙을 때 업종 프리미엄이 형성되는 편입니다.",
    marketPosition: "정책 변수 비중이 커 단기 차트 해석만으로 보기보다 공공요금·수주 흐름을 함께 보는 편이 좋습니다.",
  },
  {
    match: /(F&F|한세실업|영원무역|LF|신세계인터내셔날|한섬|휠라홀딩스|패션|의류)/,
    sector: "의류·패션",
    businessSummary: "브랜드 경쟁력과 소비 회복, 해외 성장, 재고 관리가 실적과 주가에 중요한 업종입니다.",
    industryFlow: "의류·패션은 소비 심리 회복과 브랜드 모멘텀이 붙을 때 꾸준한 수급이 유입될 수 있습니다.",
    marketPosition: "트렌드와 소비 지출 변화에 민감해 실적 확인 전까지는 보수적으로 보는 편이 좋습니다.",
  },
  {
    match: /(메가스터디교육|대교|웅진씽크빅|아이스크림에듀|NE능률|교육)/,
    sector: "교육",
    businessSummary: "학생 수요와 온라인 전환, 브랜드 경쟁력, 콘텐츠 구독 구조가 실적에 영향을 주는 업종입니다.",
    industryFlow: "교육주는 정책 변화와 신규 서비스 성과에 따라 수급이 달라질 수 있습니다.",
    marketPosition: "실적 안정성은 비교적 높지만 성장 기대가 붙는 시기와 아닌 시기의 차이가 커 보수적으로 보는 편이 좋습니다.",
  },
];

export function formatCompanyContextHeadline(context: CompanyContext) {
  if (context.group) {
    return `${context.group} 그룹 · ${context.sector}`;
  }

  if (context.instrumentLabel !== "개별 종목") {
    return `${context.instrumentLabel} · ${context.sector}`;
  }

  return context.sector;
}

export function formatCompanyContextBrief(context: CompanyContext) {
  return context.businessSummary.trim();
}

function getGroup(name: string) {
  return GROUP_RULES.find((rule) => rule.match.test(name))?.group ?? null;
}

const ETF_BRAND_PATTERN =
  /^(KODEX|TIGER|ACE|RISE|HANARO|KBSTAR|KOSEF|ARIRANG|SOL|PLUS|TIMEFOLIO|KIWOOM|TREX|FOCUS|WON|TRUSTON|UNICORN)\b/i;
const ETN_PATTERN = /\bETN\b/i;
const DIRECTIONAL_PATTERN = /(인버스|레버리지|2X|3X|울트라)/i;

type OfficialContextRule = {
  match: RegExp;
  sector: string;
  businessSummary: string;
  industryFlow: string;
  marketPosition: string;
  confidence?: ContextConfidence;
  interpretWithCaution?: boolean;
};

const OFFICIAL_CONTEXT_RULES: OfficialContextRule[] = [
  {
    match: /^(10|11|12)/,
    sector: "식품·소비재",
    businessSummary: "식품과 음료, 생활 소비재 수요가 실적에 직접 반영되는 내수형 업종입니다.",
    industryFlow: "원가와 소비 경기, 브랜드 경쟁력이 동시에 작용해 방어적 성격과 성장 기대가 함께 평가됩니다.",
    marketPosition: "원가 안정과 판매 호조가 확인될 때 재평가되지만 내수 둔화에는 민감할 수 있습니다.",
  },
  {
    match: /^(13|14|15)/,
    sector: "의류·패션",
    businessSummary: "브랜드 경쟁력과 소비 회복, 해외 판매 확대가 실적에 반영되는 패션 업종입니다.",
    industryFlow: "계절성과 소비 심리에 따라 실적 흐름이 달라질 수 있어 기대감과 실제 판매를 함께 보는 편이 좋습니다.",
    marketPosition: "소비 회복 국면에서는 탄력이 붙지만 수요 둔화 구간에서는 보수적으로 해석하는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /^(20|22)/,
    sector: "화학",
    businessSummary: "원재료 가격과 제품 스프레드, 전방 산업 수요가 실적 변동에 크게 작용하는 업종입니다.",
    industryFlow: "시황 회복 기대가 붙을 때 반등 폭이 커질 수 있지만 경기 둔화와 공급 부담에도 민감합니다.",
    marketPosition: "업황 사이클이 중요한 업종이라 기술적 신호도 시황 방향성과 함께 보는 편이 좋습니다.",
  },
  {
    match: /^21/,
    sector: "바이오·제약",
    businessSummary: "의약품 판매와 파이프라인 기대, 규제 변화가 함께 반영되는 업종입니다.",
    industryFlow: "실적보다 이벤트와 기대감이 먼저 움직일 수 있어 변동성이 큰 편입니다.",
    marketPosition: "기대와 실제 성과 간 간격이 클 수 있어 추천 점수는 보수적으로 해석하는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /^24/,
    sector: "철강·소재",
    businessSummary: "원재료 가격과 수요 회복, 스프레드 변화가 실적에 직접 반영되는 업종입니다.",
    industryFlow: "경기와 인프라 투자 기대에 민감해 업황 방향이 바뀌면 주가 흐름도 빠르게 달라질 수 있습니다.",
    marketPosition: "시황 반등 기대가 붙을 때 재평가가 빠르게 나타날 수 있지만 둔화 구간에서는 보수적으로 보는 편이 좋습니다.",
  },
  {
    match: /^25/,
    sector: "기계·장비",
    businessSummary: "설비투자와 수주, 산업 경기 회복 기대가 기업 가치에 직접 연결되는 업종입니다.",
    industryFlow: "수주와 CAPEX 흐름이 살아날 때 업종 심리가 개선되기 쉽습니다.",
    marketPosition: "수주 가시성이 확인될 때 추세가 강해질 수 있어 실적 흐름과 함께 해석하는 편이 좋습니다.",
  },
  {
    match: /^26/,
    sector: "전자·IT하드웨어",
    businessSummary: "전자부품과 하드웨어 수요, 고객사 투자 사이클, 제품 믹스가 실적에 반영되는 업종입니다.",
    industryFlow: "IT 수요 회복 기대가 붙을 때 업종 전체가 함께 움직이는 경우가 많습니다.",
    marketPosition: "세부 업종에 따라 반도체·디스플레이·전자부품으로 갈릴 수 있어 개별 종목 특성과 함께 보는 편이 좋습니다.",
  },
  {
    match: /^27/,
    sector: "전기·전력장비",
    businessSummary: "전력 설비 투자와 전장 수요, 에너지 전환 흐름이 실적에 연결되는 업종입니다.",
    industryFlow: "전력 인프라 확대 기대가 붙을 때 프리미엄이 커지는 편입니다.",
    marketPosition: "수주와 투자 사이클이 중요해 추세 해석 시 업황 방향을 함께 보는 편이 좋습니다.",
  },
  {
    match: /^28/,
    sector: "기계·장비",
    businessSummary: "산업 자동화와 설비 투자, 수주 흐름이 직접 반영되는 기계 장비 업종입니다.",
    industryFlow: "CAPEX 회복 기대가 붙을 때 업종 심리가 빠르게 개선될 수 있습니다.",
    marketPosition: "수주 변동성이 있어 단기 차트만으로 과신하기보다 실적 흐름과 함께 보는 편이 좋습니다.",
  },
  {
    match: /^29/,
    sector: "자동차",
    businessSummary: "판매량과 환율, 전기차 전략, 부품 믹스가 실적과 가치 평가에 반영되는 업종입니다.",
    industryFlow: "판매 호조와 주주환원 기대가 맞물릴 때 업종 전체 심리가 개선될 수 있습니다.",
    marketPosition: "실적 안정성과 전동화 전략을 함께 평가받는 경우가 많습니다.",
  },
  {
    match: /^30/,
    sector: "운송장비",
    businessSummary: "선박·철도·항공 장비 등 대형 프로젝트와 수주 흐름이 실적에 반영되는 업종입니다.",
    industryFlow: "대형 수주 뉴스와 정책 투자 기대에 따라 주가 흐름이 크게 달라질 수 있습니다.",
    marketPosition: "수주 가시성이 높아질수록 재평가가 빠르게 나타날 수 있습니다.",
  },
  {
    match: /^35/,
    sector: "유틸리티·에너지인프라",
    businessSummary: "전력과 가스, 에너지 인프라 운영 및 정책 변화가 실적에 직접 반영되는 업종입니다.",
    industryFlow: "정책과 요금, 설비 투자 기대가 업종 평가에 크게 작용합니다.",
    marketPosition: "정책 변수 비중이 커 단기 차트만으로 보기보다 공공요금·설비 흐름과 함께 보는 편이 좋습니다.",
  },
  {
    match: /^(41|42)/,
    sector: "건설",
    businessSummary: "수주와 원가율, 부동산 경기, 인프라 투자 흐름이 실적에 반영되는 업종입니다.",
    industryFlow: "금리 안정과 수주 회복 기대가 붙을 때 반등 탄력이 생기기 쉽습니다.",
    marketPosition: "실적 신뢰도 개선이 확인될 때 저평가 해소 흐름이 강해질 수 있습니다.",
  },
  {
    match: /^(45|46|47)/,
    sector: "유통·리테일",
    businessSummary: "소비 경기와 객단가, 점포 효율, 온라인 경쟁이 실적에 반영되는 업종입니다.",
    industryFlow: "내수 소비 회복 기대가 붙을 때 상대적으로 안정적인 수급이 유입되는 편입니다.",
    marketPosition: "소비 지표 회복 여부를 함께 보며 해석하는 편이 좋습니다.",
  },
  {
    match: /^(49|50|51|52)/,
    sector: "해운·물류",
    businessSummary: "물동량과 운임, 물류 단가, 글로벌 교역 흐름이 실적에 직접 연결되는 업종입니다.",
    industryFlow: "운임과 수요 변화에 따라 업종 심리가 빠르게 달라질 수 있습니다.",
    marketPosition: "경기 민감도가 높아 변동성이 커질 수 있어 보수적으로 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /^(55|56)/,
    sector: "여행·항공·레저",
    businessSummary: "소비 회복과 여행 수요, 비용 구조가 실적에 반영되는 레저·서비스 업종입니다.",
    industryFlow: "소비 심리와 여행 수요 기대가 살아날 때 업종 전체 심리가 개선되는 편입니다.",
    marketPosition: "수요와 비용 변수에 민감해 단기 변동성도 함께 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /^(58|59|60)/,
    sector: "미디어·콘텐츠",
    businessSummary: "광고 경기와 콘텐츠 흥행, 제작 편수, 플랫폼 유통이 실적에 반영되는 업종입니다.",
    industryFlow: "광고 회복과 흥행 기대가 붙을 때 업종 심리가 빠르게 좋아질 수 있습니다.",
    marketPosition: "흥행 편차가 클 수 있어 기대감과 실적을 함께 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /^61/,
    sector: "통신",
    businessSummary: "가입자 기반과 현금흐름 안정성, 주주환원 매력이 중요한 방어 업종입니다.",
    industryFlow: "금리 하락 기대와 안정적 현금흐름 선호가 커질 때 상대적으로 주목받는 편입니다.",
    marketPosition: "강한 성장주보다 수익성과 배당 관점에서 평가받는 경우가 많습니다.",
  },
  {
    match: /^62/,
    sector: "소프트웨어·AI",
    businessSummary: "기업용 소프트웨어와 서비스 계약, AI 기대감이 밸류에이션에 반영되는 업종입니다.",
    industryFlow: "성장 기대가 먼저 움직일 수 있어 업종 심리가 빠르게 달라지는 편입니다.",
    marketPosition: "실적 확인 전까지는 기대가 앞설 수 있어 보수적으로 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /^63/,
    sector: "인터넷·플랫폼·게임",
    businessSummary: "플랫폼 트래픽과 광고, 커머스, 데이터 서비스가 실적에 반영되는 디지털 서비스 업종입니다.",
    industryFlow: "사용자 지표와 신사업 기대에 따라 멀티플이 빠르게 재평가될 수 있습니다.",
    marketPosition: "정책과 경쟁 환경 변화에 민감해 기대와 실적을 함께 봐야 합니다.",
  },
  {
    match: /^(64|65|66)/,
    sector: "금융",
    businessSummary: "금리와 자산 건전성, 거래대금, 주주환원 정책이 핵심 변수인 업종입니다.",
    industryFlow: "배당과 자사주 기대, 실적 안정성이 부각될 때 방어주 매력이 커질 수 있습니다.",
    marketPosition: "밸류에이션 재평가에는 실적 안정성과 주주환원 신뢰가 같이 필요합니다.",
  },
  {
    match: /^68/,
    sector: "리츠·부동산",
    businessSummary: "자산 가치와 임대료 흐름, 금리, 배당 안정성이 중요한 자산형 업종입니다.",
    industryFlow: "금리 안정 기대와 배당 선호가 커질 때 상대적으로 주목받는 편입니다.",
    marketPosition: "일반 성장주와 다른 방식으로 해석해야 해 추천 점수도 보수적으로 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /^(70|71|72|73|74|75)/,
    sector: "서비스",
    businessSummary: "연구개발과 전문 서비스, 광고, 사업 지원 수요가 실적에 반영되는 업종입니다.",
    industryFlow: "기업 투자 회복 기대가 붙을 때 업종 심리가 개선될 수 있습니다.",
    marketPosition: "세부 사업군이 매우 달라 일반론 수준으로 보는 편이 안전합니다.",
    confidence: "medium",
    interpretWithCaution: true,
  },
  {
    match: /^85/,
    sector: "교육",
    businessSummary: "학생 수요와 콘텐츠 경쟁력, 온라인 전환이 실적과 밸류에이션에 반영되는 업종입니다.",
    industryFlow: "정책 변화와 신규 서비스 성과에 따라 수급이 달라질 수 있습니다.",
    marketPosition: "실적 안정성은 비교적 높지만 성장 기대 구간과 아닌 구간의 차이가 큰 편입니다.",
  },
  {
    match: /^(86|87)/,
    sector: "의료기기·헬스케어",
    businessSummary: "의료 서비스와 헬스케어 수요, 병원 투자, 기기 경쟁력이 실적에 반영되는 업종입니다.",
    industryFlow: "해외 확장 기대와 수요 회복이 붙을 때 빠르게 재평가될 수 있습니다.",
    marketPosition: "정책과 수요 변화에 민감해 기대와 실적을 함께 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
  {
    match: /^(90|91|92|93)/,
    sector: "엔터테인먼트",
    businessSummary: "공연과 콘텐츠, 레저 활동 수요, 팬덤 지표가 실적에 반영되는 업종입니다.",
    industryFlow: "이벤트와 흥행 모멘텀에 따라 업종 전체 심리가 크게 달라질 수 있습니다.",
    marketPosition: "이벤트 편차가 커 변동성이 큰 편이라 점수를 보수적으로 보는 편이 좋습니다.",
    interpretWithCaution: true,
  },
];

export function inferInstrumentProfile(stock: StockLookupItem): InstrumentProfile {
  const name = stock.name.trim();
  const kind: InstrumentKind = ETN_PATTERN.test(name)
    ? "etn"
    : ETF_BRAND_PATTERN.test(name)
      ? "etf"
      : "stock";
  const isDirectionalProduct = DIRECTIONAL_PATTERN.test(name);

  if (kind === "etn") {
    return {
      kind,
      label: isDirectionalProduct ? "전략형 ETN" : "ETN",
      isExchangeTradedProduct: true,
      isDirectionalProduct,
    };
  }

  if (kind === "etf") {
    return {
      kind,
      label: isDirectionalProduct ? "전략형 ETF" : "ETF",
      isExchangeTradedProduct: true,
      isDirectionalProduct,
    };
  }

  return {
    kind,
    label: "개별 종목",
    isExchangeTradedProduct: false,
    isDirectionalProduct: false,
  };
}

function getEtpContext(stock: StockLookupItem, profile: InstrumentProfile): CompanyContext {
  const name = stock.name;
  const sector = /인버스/i.test(name)
    ? "인버스 ETF/ETN"
    : /레버리지|2X|3X|울트라/i.test(name)
      ? "레버리지 ETF/ETN"
      : "ETF/ETN";

  return {
    group: null,
    instrumentLabel: profile.label,
    sector,
    businessSummary:
      "개별 기업 실적보다 추종 지수·원자재·전략 수익률에 연동되는 상품이라 기업 분석 문구를 그대로 적용하면 왜곡될 수 있습니다.",
    industryFlow:
      "ETF·ETN은 업종 이야기보다 기초자산 방향, 선물 구조, 괴리율 같은 상품 특성이 더 크게 작용하는 편입니다.",
    marketPosition:
      "특히 인버스·레버리지 상품은 방향이 맞아도 변동성이 커질 수 있어 추천 점수를 보수적으로 보는 편이 좋습니다.",
    confidence: "high",
    interpretWithCaution: true,
    cautionNote: "ETF·ETN은 개별 기업 평가보다 기초자산과 상품 구조를 먼저 보는 편이 좋습니다.",
  };
}

function getDefaultContext(stock: StockLookupItem, profile: InstrumentProfile): CompanyContext {
  if (profile.isExchangeTradedProduct) {
    return getEtpContext(stock, profile);
  }

  if (stock.market === "KOSDAQ") {
    return {
      group: getGroup(stock.name),
      instrumentLabel: profile.label,
      sector: "개별 성장주",
      businessSummary: "실적 기대와 수급 변화에 따라 가격이 크게 흔들릴 수 있는 개별 성장주 성격이 강합니다.",
      industryFlow: "코스닥 종목은 업종 모멘텀과 수급 변화가 주가에 빠르게 반영되는 경우가 많습니다.",
      marketPosition: "실적 확인 이전에는 기대와 심리 변화에 크게 흔들릴 수 있어 기술적 점수도 보수적으로 해석할 필요가 있습니다.",
      confidence: "low",
      interpretWithCaution: true,
      cautionNote: "업종 분류 근거가 약한 종목이라 기업 설명은 참고용으로만 보는 편이 좋습니다.",
    };
  }

  return {
    group: getGroup(stock.name),
    instrumentLabel: profile.label,
    sector: "개별 종목",
    businessSummary: "업종 흐름과 함께 개별 기업 이슈, 수급, 재료가 함께 반영되는 일반 상장 종목으로 보는 편이 자연스럽습니다.",
    industryFlow: "뚜렷한 업종 규칙이 없으면 지수보다 개별 재료와 수급의 영향이 더 크게 나타날 수 있습니다.",
    marketPosition: "짧은 기간 급등락이 나오면 기술적 점수만으로는 부족할 수 있어 과한 해석은 피하는 편이 좋습니다.",
    confidence: "low",
    interpretWithCaution: true,
    cautionNote: "업종 분류 근거가 약한 종목이라 기업 설명은 참고용으로만 보는 편이 좋습니다.",
  };
}

export function inferCompanyContext(stock: StockLookupItem): CompanyContext {
  const profile = inferInstrumentProfile(stock);
  if (profile.isExchangeTradedProduct) {
    return getEtpContext(stock, profile);
  }

  const matchedRule = CONTEXT_RULES.find((rule) => rule.match.test(stock.name));
  if (!matchedRule) {
    return getDefaultContext(stock, profile);
  }

  return {
    group: getGroup(stock.name),
    instrumentLabel: profile.label,
    sector: matchedRule.sector,
    businessSummary: matchedRule.businessSummary,
    industryFlow: matchedRule.industryFlow,
    marketPosition: matchedRule.marketPosition,
    confidence: matchedRule.confidence ?? "high",
    interpretWithCaution: matchedRule.interpretWithCaution ?? false,
    cautionNote:
      matchedRule.interpretWithCaution ?? false
        ? "단기 재료나 이벤트 영향이 커질 수 있어 추천 점수는 보수적으로 해석하는 편이 좋습니다."
        : null,
  };
}

export function buildOfficialContextFromIndustryCode(
  stock: StockLookupItem,
  profile: InstrumentProfile,
  indutyCode: string,
): CompanyContext | null {
  const rule = OFFICIAL_CONTEXT_RULES.find((item) => item.match.test(indutyCode));
  if (!rule) {
    return null;
  }

  return {
    group: getGroup(stock.name),
    instrumentLabel: profile.label,
    sector: rule.sector,
    businessSummary: rule.businessSummary,
    industryFlow: rule.industryFlow,
    marketPosition: rule.marketPosition,
    confidence: rule.confidence ?? "high",
    interpretWithCaution: rule.interpretWithCaution ?? false,
    cautionNote:
      rule.interpretWithCaution ?? false
        ? "공식 업종 기준으로도 변동성이 클 수 있어 추천 점수는 보수적으로 해석하는 편이 좋습니다."
        : null,
  };
}

function isSpecificSector(context: CompanyContext) {
  return !["개별 종목", "개별 성장주", "ETF/ETN", "레버리지 ETF/ETN", "인버스 ETF/ETN", "서비스"].includes(
    context.sector,
  );
}

export function mergeCompanyContexts(
  inferred: CompanyContext,
  official: CompanyContext | null,
): CompanyContext {
  if (!official) {
    return inferred;
  }

  if (inferred.instrumentLabel !== "개별 종목") {
    return inferred;
  }

  if (inferred.confidence === "low" || !isSpecificSector(inferred)) {
    return official;
  }

  if (official.sector === inferred.sector) {
    return {
      ...inferred,
      confidence: inferred.confidence === "high" ? "high" : official.confidence,
      cautionNote: inferred.cautionNote ?? official.cautionNote,
    };
  }

  return {
    ...inferred,
    cautionNote:
      inferred.cautionNote ??
      `공식 업종코드는 ${official.sector} 계열로 확인돼 세부 종목 특성과 함께 보는 편이 좋습니다.`,
  };
}
