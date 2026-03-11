/**
 * yahoo-finance2 封装 — 限速、重试、缓存
 */
import YahooFinance from 'yahoo-finance2';
import { readCache, writeCache, isCacheStale } from './cache.js';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/** 请求间隔 (ms) */
const REQUEST_INTERVAL = 1500;
/** 最大重试次数 */
const MAX_RETRIES = 3;
/** 缓存有效期: 基本面 24 小时 */
const FUNDAMENTAL_TTL = 24 * 60 * 60 * 1000;
/** 缓存有效期: OHLCV 当日数据 12 小时 */
const OHLCV_TTL = 12 * 60 * 60 * 1000;

let lastRequestTime = 0;

/** 限速: 确保请求间隔 >= REQUEST_INTERVAL (exported for news collector) */
export async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_INTERVAL) {
    await new Promise(r => setTimeout(r, REQUEST_INTERVAL - elapsed));
  }
  lastRequestTime = Date.now();
}

/** 带重试的请求包装 (exported for news collector) */
export async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await throttle();
      return await fn();
    } catch (err: any) {
      const is429 = err?.message?.includes('429') || err?.statusCode === 429;
      if (is429 && attempt < MAX_RETRIES) {
        const backoff = REQUEST_INTERVAL * Math.pow(2, attempt);
        console.warn(`[yahoo] ${label} 429 限速, ${backoff}ms 后重试 (${attempt}/${MAX_RETRIES})`);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      if (attempt === MAX_RETRIES) {
        console.error(`[yahoo] ${label} 失败 (${MAX_RETRIES}次重试后):`, err?.message);
        throw err;
      }
    }
  }
  throw new Error('unreachable');
}

/** 基本面数据结构 */
export interface FundamentalData {
  symbol: string;
  trailingPE: number | null;
  forwardPE: number | null;
  revenue: number | null;
  netIncome: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  freeCashflow: number | null;
  capitalExpenditure: number | null;
  fcfCapexRatio: number | null;
  targetMeanPrice: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  recommendationKey: string | null;
  // 增强基本面
  currentPrice: number | null;
  marketCap: number | null;
  enterpriseValue: number | null;
  debtToEquity: number | null;
  grossMargins: number | null;
  operatingMargins: number | null;
  profitMargins: number | null;
  bookValue: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  beta: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  nextEarningsDate: string | null;
  institutionOwnershipPct: number | null;
  pegRatio: number | null;
  returnOnEquity: number | null;
  totalDebt: number | null;
  totalCash: number | null;
  // 做空数据
  shortPercentOfFloat: number | null;
  shortRatio: number | null;
  sharesShort: number | null;
  sharesShortPriorMonth: number | null;
  floatShares: number | null;
  dateShortInterest: string | null;
  fetchedAt: string;
}

/** 获取基本面数据 (带缓存) */
export async function getFundamentals(symbol: string): Promise<FundamentalData> {
  const cacheKey = `fundamentals/${symbol}.json`;

  if (!(await isCacheStale(cacheKey, FUNDAMENTAL_TTL))) {
    const cached = await readCache<FundamentalData>(cacheKey);
    if (cached) return cached;
  }

  const result: any = await withRetry(
    () => yf.quoteSummary(symbol, {
      modules: [
        'defaultKeyStatistics',
        'financialData',
        'summaryDetail',
        'calendarEvents',
        'majorHoldersBreakdown',
        'incomeStatementHistory',
        'incomeStatementHistoryQuarterly',
        'cashflowStatementHistory',
      ],
    }),
    `fundamentals(${symbol})`
  );

  const fin = result.financialData ?? {};
  const stats = result.defaultKeyStatistics ?? {};
  const income = result.incomeStatementHistory?.incomeStatementHistory ?? [];
  const cashflow = result.cashflowStatementHistory?.cashflowStatements ?? [];
  const summary = result.summaryDetail ?? {};
  const calendar = result.calendarEvents ?? {};
  const holders = result.majorHoldersBreakdown ?? {};

  // 计算 YoY 营收增速
  let revenueGrowth: number | null = null;
  if (income.length >= 2) {
    const curr = income[0]?.totalRevenue;
    const prev = income[1]?.totalRevenue;
    if (curr && prev && prev !== 0) {
      revenueGrowth = (curr - prev) / Math.abs(prev);
    }
  }

  const fcf = (fin as any).freeCashflow ?? null;
  const capex = cashflow[0]?.capitalExpenditures ?? null;

  const data: FundamentalData = {
    symbol,
    trailingPE: (stats as any).trailingEps ? (fin as any).currentPrice / (stats as any).trailingEps : (fin as any).trailingPE ?? null,
    forwardPE: (stats as any).forwardPE ?? (stats as any).forwardEps ? (fin as any).currentPrice / (stats as any).forwardEps : null,
    revenue: income[0]?.totalRevenue ?? null,
    netIncome: income[0]?.netIncome ?? null,
    revenueGrowth,
    earningsGrowth: (fin as any).earningsGrowth ?? null,
    freeCashflow: fcf,
    capitalExpenditure: capex,
    fcfCapexRatio: fcf && capex && capex !== 0 ? Math.abs(fcf / capex) : null,
    targetMeanPrice: (fin as any).targetMeanPrice ?? null,
    targetHighPrice: (fin as any).targetHighPrice ?? null,
    targetLowPrice: (fin as any).targetLowPrice ?? null,
    recommendationKey: (fin as any).recommendationKey ?? null,
    // 增强基本面
    currentPrice: (fin as any).currentPrice ?? null,
    marketCap: (summary as any).marketCap ?? null,
    enterpriseValue: (stats as any).enterpriseValue ?? null,
    debtToEquity: (fin as any).debtToEquity ?? null,
    grossMargins: (fin as any).grossMargins ?? null,
    operatingMargins: (fin as any).operatingMargins ?? null,
    profitMargins: (fin as any).profitMargins ?? null,
    bookValue: (stats as any).bookValue ?? null,
    priceToBook: (stats as any).priceToBook ?? null,
    dividendYield: (summary as any).dividendYield ?? null,
    beta: (summary as any).beta ?? null,
    fiftyTwoWeekHigh: (summary as any).fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: (summary as any).fiftyTwoWeekLow ?? null,
    nextEarningsDate: (calendar as any).earnings?.earningsDate?.[0]
      ? new Date((calendar as any).earnings.earningsDate[0]).toISOString().slice(0, 10)
      : null,
    institutionOwnershipPct: (holders as any).institutionsPercentHeld ?? null,
    pegRatio: (stats as any).pegRatio ?? null,
    returnOnEquity: (fin as any).returnOnEquity ?? null,
    totalDebt: (fin as any).totalDebt ?? null,
    totalCash: (fin as any).totalCash ?? null,
    // 做空数据
    shortPercentOfFloat: (stats as any).shortPercentOfFloat ?? null,
    shortRatio: (stats as any).shortRatio ?? null,
    sharesShort: (stats as any).sharesShort ?? null,
    sharesShortPriorMonth: (stats as any).sharesShortPriorMonth ?? null,
    floatShares: (stats as any).floatShares ?? null,
    dateShortInterest: (stats as any).dateShortInterest
      ? new Date((stats as any).dateShortInterest).toISOString().slice(0, 10)
      : null,
    fetchedAt: new Date().toISOString(),
  };

  await writeCache(cacheKey, data);
  return data;
}

/** OHLCV 单条记录 */
export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** 获取 OHLCV 历史数据 (带缓存) */
export async function getOHLCV(
  symbol: string,
  interval: '1d' | '1wk' | '1mo',
  months: number = 12
): Promise<OHLCVBar[]> {
  const cacheKey = `ohlcv/${symbol}_${interval}.json`;

  if (!(await isCacheStale(cacheKey, OHLCV_TTL))) {
    const cached = await readCache<OHLCVBar[]>(cacheKey);
    if (cached) return cached;
  }

  const period1 = new Date();
  period1.setMonth(period1.getMonth() - months);

  const result: any = await withRetry(
    () => yf.chart(symbol, {
      period1,
      interval,
    }),
    `ohlcv(${symbol}, ${interval})`
  );

  const bars: OHLCVBar[] = (result.quotes ?? []).map((q: any) => ({
    date: q.date instanceof Date ? q.date.toISOString().slice(0, 10) : String(q.date).slice(0, 10),
    open: q.open ?? 0,
    high: q.high ?? 0,
    low: q.low ?? 0,
    close: q.close ?? 0,
    volume: q.volume ?? 0,
  }));

  await writeCache(cacheKey, bars);
  return bars;
}

/** 期权最大痛点数据 */
export interface OptionsWeekData {
  expirationDate: string;
  maxPainStrike: number;
  callOI: number;
  putOI: number;
  pcRatio: number;
}

export interface OptionsMaxPain {
  currentWeek: OptionsWeekData | null;
  nextWeek: OptionsWeekData | null;
  currentPrice: number;
  fetchedAt: string;
}

/** 期权合约数据 */
export interface OptionContract {
  contractSymbol: string;
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  inTheMoney: boolean;
  expiration: string;
}

/** 完整期权链 */
export interface OptionsChain {
  symbol: string;
  expirationDate: string;
  calls: OptionContract[];
  puts: OptionContract[];
  currentPrice: number;
  fetchedAt: string;
}

/** 获取所有可用到期日 */
export async function getAvailableExpirations(symbol: string): Promise<string[]> {
  const chain: any = await withRetry(
    () => yf.options(symbol),
    `expirations(${symbol})`
  );
  return (chain.expirationDates ?? []).map((d: Date) =>
    d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)
  );
}

/** 获取指定到期日的完整期权链 */
export async function getOptionsChainForExpiry(
  symbol: string,
  expirationDate: string,
): Promise<OptionsChain> {
  const cacheKey = `options-chain/${symbol}_${expirationDate}.json`;

  if (!(await isCacheStale(cacheKey, OPTIONS_TTL))) {
    const cached = await readCache<OptionsChain>(cacheKey);
    if (cached && cached.calls.length > 0) return cached;
  }

  // 先获取可用到期日列表，找到精确匹配的 Date 对象
  const baseChain: any = await withRetry(
    () => yf.options(symbol),
    `optionsBase(${symbol})`
  );

  const expirationDates: Date[] = (baseChain.expirationDates ?? []).map((d: any) =>
    d instanceof Date ? d : new Date(d)
  );

  // 找最接近目标日期的到期日
  const target = new Date(expirationDate + 'T12:00:00Z');
  let bestExp: Date | null = null;
  let bestDiff = Infinity;
  for (const d of expirationDates) {
    const diff = Math.abs(d.getTime() - target.getTime());
    if (diff < bestDiff) { bestDiff = diff; bestExp = d; }
  }

  if (!bestExp || bestDiff > 7 * 86400000) {
    console.warn(`[yahoo] ${symbol} 无匹配到期日 ${expirationDate}`);
    return { symbol, expirationDate, calls: [], puts: [], currentPrice: baseChain.quote?.regularMarketPrice ?? 0, fetchedAt: new Date().toISOString() };
  }

  const chain: any = await withRetry(
    () => yf.options(symbol, { date: bestExp! }),
    `optionsChain(${symbol}, ${expirationDate})`
  );

  const quote = chain.quote ?? {};
  const currentPrice = quote.regularMarketPrice ?? 0;
  const opt = chain.options?.[0];

  const mapContract = (c: any): OptionContract => ({
    contractSymbol: c.contractSymbol ?? '',
    strike: c.strike ?? 0,
    lastPrice: c.lastPrice ?? 0,
    bid: c.bid ?? 0,
    ask: c.ask ?? 0,
    volume: c.volume ?? 0,
    openInterest: c.openInterest ?? 0,
    impliedVolatility: c.impliedVolatility ?? 0,
    inTheMoney: c.inTheMoney ?? false,
    expiration: expirationDate,
  });

  const data: OptionsChain = {
    symbol,
    expirationDate,
    calls: (opt?.calls ?? []).map(mapContract),
    puts: (opt?.puts ?? []).map(mapContract),
    currentPrice,
    fetchedAt: new Date().toISOString(),
  };

  await writeCache(cacheKey, data);
  return data;
}

/** 缓存有效期: 期权 4 小时 */
const OPTIONS_TTL = 4 * 60 * 60 * 1000;

/** 获取下一个周五 */
function getNextFriday(from: Date): Date {
  const d = new Date(from);
  const day = d.getDay();
  const diff = day <= 5 ? 5 - day : 5 + 7 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 找到最接近目标日期的到期日 */
function findClosestExpiration(dates: Date[], target: Date): Date | null {
  if (!dates || dates.length === 0) return null;
  const targetTime = target.getTime();
  let closest: Date | null = null;
  let minDiff = Infinity;
  for (const d of dates) {
    const diff = Math.abs(d.getTime() - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closest = d;
    }
  }
  // 只接受 7 天内的到期日
  if (closest && minDiff > 7 * 24 * 60 * 60 * 1000) return null;
  return closest;
}

/** 计算单个到期日的 max pain */
function calculateMaxPainForChain(
  calls: any[],
  puts: any[],
  expirationDate: Date,
): OptionsWeekData | null {
  if ((!calls || calls.length === 0) && (!puts || puts.length === 0)) return null;

  // 收集所有 strike
  const strikes = new Set<number>();
  let totalCallOI = 0;
  let totalPutOI = 0;
  for (const c of (calls ?? [])) {
    if (c.strike != null) strikes.add(c.strike);
    totalCallOI += c.openInterest ?? 0;
  }
  for (const p of (puts ?? [])) {
    if (p.strike != null) strikes.add(p.strike);
    totalPutOI += p.openInterest ?? 0;
  }

  if (strikes.size === 0) return null;

  // 对每个 strike 计算总 pain
  let minPain = Infinity;
  let maxPainStrike = 0;
  for (const s of strikes) {
    let pain = 0;
    // Call holders lose when price < strike (they're OTM), but we want ITM pain
    // At settlement price S: call with strike K loses max(0, S - K) * OI * 100
    for (const c of (calls ?? [])) {
      if (c.strike != null && s > c.strike) {
        pain += (s - c.strike) * (c.openInterest ?? 0) * 100;
      }
    }
    // Put holders: put with strike K loses max(0, K - S) * OI * 100
    for (const p of (puts ?? [])) {
      if (p.strike != null && s < p.strike) {
        pain += (p.strike - s) * (p.openInterest ?? 0) * 100;
      }
    }
    if (pain < minPain) {
      minPain = pain;
      maxPainStrike = s;
    }
  }

  return {
    expirationDate: expirationDate.toISOString().slice(0, 10),
    maxPainStrike,
    callOI: totalCallOI,
    putOI: totalPutOI,
    pcRatio: totalCallOI > 0 ? totalPutOI / totalCallOI : 0,
  };
}

/** 获取期权最大痛点 (带缓存) */
export async function getOptionsMaxPain(symbol: string): Promise<OptionsMaxPain | null> {
  const cacheKey = `options/${symbol}_maxpain.json`;

  if (!(await isCacheStale(cacheKey, OPTIONS_TTL))) {
    const cached = await readCache<OptionsMaxPain>(cacheKey);
    if (cached) return cached;
  }

  // 获取期权链 (默认返回第一个到期日 + 所有到期日列表)
  const result: any = await withRetry(
    () => yf.options(symbol),
    `options(${symbol})`
  );

  const currentPrice = result.quote?.regularMarketPrice ?? 0;
  const expirationDates: Date[] = (result.expirationDates ?? []).map((d: any) =>
    d instanceof Date ? d : new Date(d)
  );

  if (expirationDates.length === 0) return null;

  const now = new Date();
  const currentWeekFri = getNextFriday(now);
  const nextWeekFri = getNextFriday(new Date(currentWeekFri.getTime() + 86400000));

  const currentWeekExp = findClosestExpiration(expirationDates, currentWeekFri);
  const nextWeekExp = findClosestExpiration(expirationDates, nextWeekFri);

  let currentWeek: OptionsWeekData | null = null;
  let nextWeek: OptionsWeekData | null = null;

  // 当周期权链
  if (currentWeekExp) {
    try {
      const chain: any = await withRetry(
        () => yf.options(symbol, { date: currentWeekExp }),
        `options(${symbol}, currentWeek)`
      );
      const opt = chain.options?.[0];
      if (opt) {
        currentWeek = calculateMaxPainForChain(opt.calls, opt.puts, currentWeekExp);
      }
    } catch { /* 忽略 */ }
  }

  // 次周期权链
  if (nextWeekExp && nextWeekExp.getTime() !== currentWeekExp?.getTime()) {
    try {
      const chain: any = await withRetry(
        () => yf.options(symbol, { date: nextWeekExp }),
        `options(${symbol}, nextWeek)`
      );
      const opt = chain.options?.[0];
      if (opt) {
        nextWeek = calculateMaxPainForChain(opt.calls, opt.puts, nextWeekExp);
      }
    } catch { /* 忽略 */ }
  }

  const data: OptionsMaxPain = {
    currentWeek,
    nextWeek,
    currentPrice,
    fetchedAt: new Date().toISOString(),
  };

  await writeCache(cacheKey, data);
  return data;
}

// ─── News & Insider Trading (供 news 命令使用) ───

export interface YahooNewsItem {
  title: string;
  publisher: string;
  url: string;
  publishedAt: string;
}

/** 通过 yahoo-finance2 search() 获取新闻 */
export async function getYahooNews(symbol: string, count = 10): Promise<YahooNewsItem[]> {
  const result: any = await withRetry(
    () => yf.search(symbol, { newsCount: count }, { validateResult: false }),
    `news(${symbol})`
  );
  return (result.news ?? []).map((n: any) => ({
    title: n.title ?? '',
    publisher: n.publisher ?? '',
    url: n.link ?? '',
    publishedAt: n.providerPublishTime
      ? new Date(n.providerPublishTime).toISOString()
      : '',
  }));
}

export interface InsiderTransaction {
  filerName: string;
  relation: string;
  transactionText: string;
  shares: number | null;
  value: number | null;
  date: string;
  ownership: string;
}

export interface InsiderSummary {
  buyCount: number | null;
  buyShares: number | null;
  buyPercent: number | null;
  sellCount: number | null;
  sellShares: number | null;
  sellPercent: number | null;
  netCount: number | null;
  netShares: number | null;
  netPercent: number | null;
}

export interface InsiderData {
  transactions: InsiderTransaction[];
  summary: InsiderSummary;
}

/** 通过 yahoo-finance2 quoteSummary 获取内幕交易数据 */
export async function getInsiderTrading(symbol: string): Promise<InsiderData> {
  const result: any = await withRetry(
    () => yf.quoteSummary(symbol, {
      modules: ['insiderTransactions', 'netSharePurchaseActivity'],
    }),
    `insider(${symbol})`
  );

  const txs = result.insiderTransactions?.transactions ?? [];
  const net = result.netSharePurchaseActivity ?? {};

  return {
    transactions: txs.map((t: any) => ({
      filerName: t.filerName ?? '',
      relation: t.filerRelation ?? '',
      transactionText: t.transactionText ?? '',
      shares: t.shares ?? null,
      value: t.value ?? null,
      date: t.startDate ? new Date(t.startDate).toISOString().slice(0, 10) : '',
      ownership: t.ownership ?? '',
    })),
    summary: {
      buyCount: net.buyInfoCount ?? null,
      buyShares: net.buyInfoShares ?? null,
      buyPercent: net.buyPercentInsiderShares ?? null,
      sellCount: net.sellInfoCount ?? null,
      sellShares: net.sellInfoShares ?? null,
      sellPercent: net.sellPercentInsiderShares ?? null,
      netCount: net.netInfoCount ?? null,
      netShares: net.netInfoShares ?? null,
      netPercent: net.netPercentInsiderShares ?? null,
    },
  };
}

// ─── Macro Snapshot (VIX + 10Y Yield) ───

export interface MacroSnapshot {
  vix: number | null;
  tenYearYield: number | null;
  fetchedAt: string;
}

/** 获取宏观快照: VIX + 10Y 国债收益率 (带缓存) */
export async function getMacroSnapshot(): Promise<MacroSnapshot> {
  const cacheKey = 'macro/snapshot.json';

  if (!(await isCacheStale(cacheKey, OPTIONS_TTL))) {
    const cached = await readCache<MacroSnapshot>(cacheKey);
    if (cached) return cached;
  }

  let vix: number | null = null;
  let tenYearYield: number | null = null;

  try {
    const vixQuote: any = await withRetry(
      () => yf.quote('^VIX'),
      'macro(^VIX)'
    );
    vix = vixQuote?.regularMarketPrice ?? null;
  } catch { console.warn('[yahoo] VIX 获取失败'); }

  try {
    const tnxQuote: any = await withRetry(
      () => yf.quote('^TNX'),
      'macro(^TNX)'
    );
    tenYearYield = tnxQuote?.regularMarketPrice
      ? tnxQuote.regularMarketPrice / 100
      : null;
  } catch { console.warn('[yahoo] 10Y yield 获取失败'); }

  const data: MacroSnapshot = { vix, tenYearYield, fetchedAt: new Date().toISOString() };
  await writeCache(cacheKey, data);
  return data;
}
