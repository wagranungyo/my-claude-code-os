/**
 * 샘플 ETF 데이터 (미국 상장 ETF).
 * file:// 로 열어도 동작하도록 fetch 대신 전역 변수로 제공한다.
 *
 * 주의: 보수율은 실제값에 가깝게 넣었으나, 수익률·AUM·배당수익률은
 *       데모용 "샘플"이며 실제 투자 판단의 근거가 아니다.
 *
 * 필드:
 *  - ticker  : 티커
 *  - name    : 이름
 *  - category: 분류
 *  - expense : 운용보수(연, %) — 낮을수록 좋음
 *  - ret1y   : 최근 1년 수익률(%)
 *  - ret3y   : 최근 3년 연환산 수익률(%)
 *  - ret5y   : 최근 5년 연환산 수익률(%)  (없으면 null)
 *  - yield   : 분배금(배당) 수익률(%)
 *  - aum     : 운용자산(10억 달러)
 */
window.ETF_DATA = [
  { ticker: "VOO",  name: "Vanguard S&P 500",            category: "대형주",   expense: 0.03,   ret1y: 24.5, ret3y:  9.8, ret5y: 15.2, yield: 1.3, aum: 480 },
  { ticker: "IVV",  name: "iShares Core S&P 500",        category: "대형주",   expense: 0.03,   ret1y: 24.4, ret3y:  9.7, ret5y: 15.1, yield: 1.4, aum: 460 },
  { ticker: "SPY",  name: "SPDR S&P 500",                category: "대형주",   expense: 0.0945, ret1y: 24.3, ret3y:  9.6, ret5y: 15.0, yield: 1.3, aum: 530 },
  { ticker: "VTI",  name: "Vanguard Total Stock Market", category: "전체시장", expense: 0.03,   ret1y: 23.8, ret3y:  8.9, ret5y: 14.6, yield: 1.4, aum: 410 },
  { ticker: "QQQ",  name: "Invesco QQQ (Nasdaq 100)",    category: "기술/성장",expense: 0.20,   ret1y: 27.4, ret3y: 12.5, ret5y: 19.8, yield: 0.6, aum: 280 },
  { ticker: "DIA",  name: "SPDR Dow Jones",              category: "대형주",   expense: 0.16,   ret1y: 16.2, ret3y:  8.1, ret5y: 10.9, yield: 1.8, aum:  35 },
  { ticker: "IWM",  name: "iShares Russell 2000",        category: "소형주",   expense: 0.19,   ret1y: 11.5, ret3y:  1.8, ret5y:  8.4, yield: 1.3, aum:  65 },
  { ticker: "IJR",  name: "iShares Core S&P Small-Cap",  category: "소형주",   expense: 0.06,   ret1y: 12.8, ret3y:  4.2, ret5y:  9.9, yield: 1.5, aum:  85 },
  { ticker: "VUG",  name: "Vanguard Growth",             category: "성장주",   expense: 0.04,   ret1y: 30.1, ret3y: 10.2, ret5y: 18.5, yield: 0.5, aum: 130 },
  { ticker: "VTV",  name: "Vanguard Value",              category: "가치주",   expense: 0.04,   ret1y: 17.3, ret3y:  8.0, ret5y: 11.2, yield: 2.2, aum: 110 },
  { ticker: "SCHD", name: "Schwab US Dividend Equity",   category: "배당주",   expense: 0.06,   ret1y: 11.2, ret3y:  6.5, ret5y: 11.8, yield: 3.5, aum:  60 },
  { ticker: "VYM",  name: "Vanguard High Dividend Yield",category: "배당주",   expense: 0.06,   ret1y: 14.8, ret3y:  7.2, ret5y: 10.5, yield: 2.9, aum:  55 },
  { ticker: "VIG",  name: "Vanguard Dividend Appreciation",category:"배당성장",expense: 0.06,   ret1y: 16.9, ret3y:  8.6, ret5y: 12.7, yield: 1.8, aum:  80 },
  { ticker: "JEPI", name: "JPMorgan Equity Premium Income",category:"인컴",    expense: 0.35,   ret1y: 12.1, ret3y:  6.8, ret5y: null, yield: 7.2, aum:  35 },
  { ticker: "XLK",  name: "Technology Select Sector",    category: "섹터/기술",expense: 0.09,   ret1y: 30.8, ret3y: 16.2, ret5y: 22.4, yield: 0.7, aum:  70 },
  { ticker: "XLF",  name: "Financial Select Sector",     category: "섹터/금융",expense: 0.09,   ret1y: 26.5, ret3y:  8.9, ret5y: 12.6, yield: 1.6, aum:  45 },
  { ticker: "XLE",  name: "Energy Select Sector",        category: "섹터/에너지",expense:0.09,   ret1y:  5.4, ret3y: 12.1, ret5y:  9.8, yield: 3.3, aum:  38 },
  { ticker: "VEA",  name: "Vanguard Developed Markets",  category: "선진국",   expense: 0.05,   ret1y: 12.3, ret3y:  4.1, ret5y:  7.2, yield: 3.0, aum: 140 },
  { ticker: "VWO",  name: "Vanguard Emerging Markets",   category: "신흥국",   expense: 0.08,   ret1y: 10.1, ret3y: -1.2, ret5y:  4.5, yield: 2.8, aum:  80 },
  { ticker: "VXUS", name: "Vanguard Total Intl Stock",   category: "해외전체", expense: 0.07,   ret1y: 11.8, ret3y:  2.9, ret5y:  6.3, yield: 3.1, aum:  70 },
  { ticker: "IEMG", name: "iShares Core MSCI Emerging",  category: "신흥국",   expense: 0.09,   ret1y: 10.4, ret3y: -0.9, ret5y:  4.7, yield: 2.6, aum:  85 },
  { ticker: "BND",  name: "Vanguard Total Bond Market",  category: "채권",     expense: 0.03,   ret1y:  2.1, ret3y: -2.4, ret5y:  0.3, yield: 3.4, aum: 120 },
  { ticker: "AGG",  name: "iShares Core US Aggregate Bond",category:"채권",    expense: 0.03,   ret1y:  2.3, ret3y: -2.3, ret5y:  0.4, yield: 3.3, aum: 115 },
  { ticker: "GLD",  name: "SPDR Gold Shares",            category: "원자재",   expense: 0.40,   ret1y: 28.6, ret3y: 12.4, ret5y: 11.2, yield: 0.0, aum:  75 },
  { ticker: "ARKK", name: "ARK Innovation",              category: "혁신/액티브",expense:0.75,   ret1y: 18.5, ret3y: -8.2, ret5y:  2.1, yield: 0.0, aum:   6 }
];
