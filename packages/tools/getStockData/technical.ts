/**
 * 技术面分析 — MA, Bollinger Bands, MACD, RSI
 * 使用 technicalindicators 库计算
 */
import { SMA, BollingerBands, MACD, RSI } from 'technicalindicators';
import { getOHLCV, type OHLCVBar, type FundamentalData, type OptionsMaxPain } from '../shared/yahoo.js';

export interface TechnicalIndicators {
  close: number;
  ma30: number | null;
  ma60: number | null;
  ma120: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  macdCross: 'golden' | 'death' | 'none';
  rsi: number | null;
  rsiSignal: 'overbought' | 'oversold' | 'neutral';
  // BB Squeeze 检测
  bbWidth: number | null;           // (upper - lower) / middle
  bbSqueeze: boolean;               // bbWidth 处于近 120 日最低 20% 分位
  bbSqueezeIntensity: number | null; // 0-100，越高越接近极限收口
}

export interface TimeframeAnalysis {
  daily: TechnicalIndicators;
  weekly: TechnicalIndicators;
  monthly: TechnicalIndicators;
}

export interface PriceLevels {
  targetPrice: number | null;
  support1: number | null;
  support2: number | null;
  support3: number | null;
  resistance1: number | null;
  resistance2: number | null;
  resistance3: number | null;
}

export type WyckoffPhase = 'accumulation' | 'markup' | 'distribution' | 'markdown' | 'unknown';

export interface WyckoffAnalysis {
  phase: WyckoffPhase;
  confidence: number;
  description: string;
  volumeProfile: 'increasing_on_up' | 'increasing_on_down' | 'decreasing' | 'mixed';
  priceRange: { high: number; low: number; rangePercent: number };
  daysInPhase: number;
}

export interface FullTechnicalAnalysis {
  symbol: string;
  timeframes: TimeframeAnalysis;
  priceLevels: PriceLevels;
  wyckoff: WyckoffAnalysis;
  optionsMaxPain: OptionsMaxPain | null;
}

/** 从 OHLCV 数据计算技术指标 */
function computeIndicators(bars: OHLCVBar[]): TechnicalIndicators {
  if (bars.length === 0) {
    return emptyIndicators();
  }

  const closes = bars.map(b => b.close);
  const lastClose = closes[closes.length - 1];

  // MA
  const ma30arr = SMA.calculate({ period: 30, values: closes });
  const ma60arr = SMA.calculate({ period: 60, values: closes });
  const ma120arr = SMA.calculate({ period: 120, values: closes });
  const ma30 = ma30arr.length > 0 ? ma30arr[ma30arr.length - 1] : null;
  const ma60 = ma60arr.length > 0 ? ma60arr[ma60arr.length - 1] : null;
  const ma120 = ma120arr.length > 0 ? ma120arr[ma120arr.length - 1] : null;

  // Bollinger Bands (20, 2)
  const bbArr = BollingerBands.calculate({ period: 20, stdDev: 2, values: closes });
  const bb = bbArr.length > 0 ? bbArr[bbArr.length - 1] : null;

  // BB Squeeze: 计算 bbWidth 序列，判断当前是否处于收口极限
  let bbWidth: number | null = null;
  let bbSqueeze = false;
  let bbSqueezeIntensity: number | null = null;
  if (bbArr.length > 0) {
    const bbWidths = bbArr
      .filter(b => b.middle > 0)
      .map(b => (b.upper - b.lower) / b.middle);
    bbWidth = bbWidths.length > 0 ? bbWidths[bbWidths.length - 1] : null;
    if (bbWidth != null && bbWidths.length >= 20) {
      // 取最近 120 个 bbWidth（或全部可用）做百分位
      const recentWidths = bbWidths.slice(-120);
      const below = recentWidths.filter(w => w < bbWidth!).length;
      const pctile = (below / recentWidths.length) * 100;
      bbSqueeze = pctile <= 20; // 处于最低 20% 分位
      bbSqueezeIntensity = Math.round(100 - pctile); // 越高越收口
    }
  }

  // MACD (12, 26, 9)
  const macdArr = MACD.calculate({
    fastPeriod: 12, slowPeriod: 26, signalPeriod: 9,
    SimpleMAOscillator: false, SimpleMASignal: false,
    values: closes,
  });
  const macdLast = macdArr.length > 0 ? macdArr[macdArr.length - 1] : null;
  const macdPrev = macdArr.length > 1 ? macdArr[macdArr.length - 2] : null;

  let macdCross: 'golden' | 'death' | 'none' = 'none';
  if (macdLast && macdPrev && macdLast.histogram != null && macdPrev.histogram != null) {
    if (macdPrev.histogram <= 0 && macdLast.histogram > 0) macdCross = 'golden';
    else if (macdPrev.histogram >= 0 && macdLast.histogram < 0) macdCross = 'death';
  }

  // RSI (14)
  const rsiArr = RSI.calculate({ period: 14, values: closes });
  const rsiVal = rsiArr.length > 0 ? rsiArr[rsiArr.length - 1] : null;
  let rsiSignal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
  if (rsiVal != null) {
    if (rsiVal > 70) rsiSignal = 'overbought';
    else if (rsiVal < 30) rsiSignal = 'oversold';
  }

  return {
    close: lastClose,
    ma30, ma60, ma120,
    bollingerUpper: bb?.upper ?? null,
    bollingerMiddle: bb?.middle ?? null,
    bollingerLower: bb?.lower ?? null,
    macd: macdLast?.MACD ?? null,
    macdSignal: macdLast?.signal ?? null,
    macdHistogram: macdLast?.histogram ?? null,
    macdCross,
    rsi: rsiVal,
    rsiSignal,
    bbWidth: bbWidth != null ? +bbWidth.toFixed(4) : null,
    bbSqueeze,
    bbSqueezeIntensity,
  };
}

function emptyIndicators(): TechnicalIndicators {
  return {
    close: 0, ma30: null, ma60: null, ma120: null,
    bollingerUpper: null, bollingerMiddle: null, bollingerLower: null,
    macd: null, macdSignal: null, macdHistogram: null, macdCross: 'none',
    rsi: null, rsiSignal: 'neutral',
    bbWidth: null, bbSqueeze: false, bbSqueezeIntensity: null,
  };
}

/** 计算目标价和支撑/阻力位 */
function computePriceLevels(
  daily: TechnicalIndicators,
  fundamentals: FundamentalData | null,
  bars: OHLCVBar[],
): PriceLevels {
  const close = daily.close;

  // 趋势线性外推: 基于最近 20 日收盘价斜率
  let trendTarget: number | null = null;
  if (bars.length >= 20) {
    const recent = bars.slice(-20).map(b => b.close);
    const slope = (recent[recent.length - 1] - recent[0]) / recent.length;
    trendTarget = close + slope * 22; // ~1 month of trading days
  }

  // 一个月目标价 = BB上轨 30% + 分析师均价 40% + 趋势外推 30%
  const components: { value: number; weight: number }[] = [];
  if (daily.bollingerUpper != null) components.push({ value: daily.bollingerUpper, weight: 0.3 });
  if (fundamentals?.targetMeanPrice != null) components.push({ value: fundamentals.targetMeanPrice, weight: 0.4 });
  if (trendTarget != null) components.push({ value: trendTarget, weight: 0.3 });

  let targetPrice: number | null = null;
  if (components.length > 0) {
    const totalWeight = components.reduce((s, c) => s + c.weight, 0);
    targetPrice = components.reduce((s, c) => s + c.value * c.weight, 0) / totalWeight;
  }

  // 支撑位
  const s1Candidates = [daily.ma30, daily.bollingerMiddle].filter((v): v is number => v != null);
  const support1 = s1Candidates.length > 0
    ? s1Candidates.reduce((best, v) => Math.abs(v - close) < Math.abs(best - close) ? v : best)
    : null;
  const support2 = daily.ma60;
  const s3Candidates = [daily.ma120, daily.bollingerLower].filter((v): v is number => v != null);
  const support3 = s3Candidates.length > 0 ? Math.min(...s3Candidates) : null;

  // 阻力位
  const resistance1 = daily.bollingerUpper;
  const recentHigh = bars.length > 0 ? Math.max(...bars.slice(-60).map(b => b.high)) : null;
  const resistance2 = recentHigh;
  const resistance3 = fundamentals?.targetHighPrice ?? null;

  return { targetPrice, support1, support2, support3, resistance1, resistance2, resistance3 };
}

/** 威科夫阶段检测 */
function detectWyckoff(bars: OHLCVBar[], rsi: number | null): WyckoffAnalysis {
  const empty: WyckoffAnalysis = {
    phase: 'unknown', confidence: 0, description: '数据不足，无法判断',
    volumeProfile: 'mixed', priceRange: { high: 0, low: 0, rangePercent: 0 }, daysInPhase: 0,
  };
  if (bars.length < 60) return empty;

  const recent = bars.slice(-60);
  const closes = recent.map(b => b.close);
  const volumes = recent.map(b => b.volume);
  const n = closes.length;

  // 线性回归斜率 (归一化为每日百分比变化)
  const avgClose = closes.reduce((s, v) => s + v, 0) / n;
  let sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    const x = i - (n - 1) / 2;
    sumXY += x * closes[i];
    sumX2 += x * x;
  }
  const slope = sumX2 > 0 ? sumXY / sumX2 : 0;
  const slopePct = avgClose > 0 ? (slope / avgClose) * 100 : 0;

  // 价格区间
  const high = Math.max(...closes);
  const low = Math.min(...closes);
  const rangePercent = low > 0 ? ((high - low) / low) * 100 : 0;

  // 上涨日 vs 下跌日成交量
  let upVolSum = 0, upCount = 0, downVolSum = 0, downCount = 0;
  for (const b of recent) {
    if (b.close > b.open) { upVolSum += b.volume; upCount++; }
    else if (b.close < b.open) { downVolSum += b.volume; downCount++; }
  }
  const avgUpVol = upCount > 0 ? upVolSum / upCount : 0;
  const avgDownVol = downCount > 0 ? downVolSum / downCount : 0;

  let volumeProfile: WyckoffAnalysis['volumeProfile'] = 'mixed';
  if (avgUpVol > avgDownVol * 1.15) volumeProfile = 'increasing_on_up';
  else if (avgDownVol > avgUpVol * 1.15) volumeProfile = 'increasing_on_down';
  else if (volumes.slice(-20).every((v, i) => i === 0 || v <= volumes[volumes.length - 20 + i - 1] * 1.1)) volumeProfile = 'decreasing';

  // 前段趋势 (60 根之前的 30 根)
  let priorTrend: 'up' | 'down' | 'flat' = 'flat';
  if (bars.length >= 90) {
    const prior = bars.slice(-90, -60);
    const priorFirst = prior[0]?.close ?? 0;
    const priorLast = prior[prior.length - 1]?.close ?? 0;
    if (priorFirst > 0) {
      const change = (priorLast - priorFirst) / priorFirst;
      if (change > 0.05) priorTrend = 'up';
      else if (change < -0.05) priorTrend = 'down';
    }
  }

  // 判断阶段
  let phase: WyckoffPhase = 'unknown';
  let confidence = 0;
  let description = '';
  const isRange = Math.abs(slopePct) < 0.1 && rangePercent < 25;

  if (isRange) {
    if (volumeProfile === 'increasing_on_up') {
      phase = 'accumulation';
      confidence = 50;
      description = '价格横盘整理，上涨日成交量高于下跌日，显示资金正在吸筹';
      if (priorTrend === 'down') { confidence += 15; description += '，前期经历下跌'; }
      if (rsi != null && rsi < 50 && rsi > 30) { confidence += 10; description += '，RSI 从超卖区恢复'; }
    } else if (volumeProfile === 'increasing_on_down') {
      phase = 'distribution';
      confidence = 50;
      description = '价格横盘整理，下跌日成交量高于上涨日，显示资金正在派发';
      if (priorTrend === 'up') { confidence += 15; description += '，前期经历上涨'; }
      if (rsi != null && rsi > 50 && rsi < 70) { confidence += 10; description += '，RSI 从超买区回落'; }
    } else {
      phase = priorTrend === 'down' ? 'accumulation' : priorTrend === 'up' ? 'distribution' : 'unknown';
      confidence = 30;
      description = '价格横盘整理，量价关系不明确';
    }
    if (rangePercent < 15) { confidence += 10; }
    confidence += 15; // 横盘本身就是吸筹/派发的特征
  } else if (slopePct > 0.1) {
    phase = 'markup';
    confidence = 50;
    description = '价格处于上升趋势';
    if (volumeProfile === 'increasing_on_up') { confidence += 15; description += '，上涨放量确认'; }
    if (rsi != null && rsi > 50) { confidence += 10; }
  } else if (slopePct < -0.1) {
    phase = 'markdown';
    confidence = 50;
    description = '价格处于下降趋势';
    if (volumeProfile === 'increasing_on_down') { confidence += 15; description += '，下跌放量确认'; }
    if (rsi != null && rsi < 50) { confidence += 10; }
  }

  confidence = Math.min(confidence, 100);

  return {
    phase, confidence, description, volumeProfile,
    priceRange: { high, low, rangePercent: Math.round(rangePercent * 10) / 10 },
    daysInPhase: recent.length,
  };
}

/** 获取完整技术分析 */
export async function analyzeTechnical(
  symbol: string,
  fundamentals: FundamentalData | null,
): Promise<FullTechnicalAnalysis> {
  console.log(`[technical] 分析 ${symbol}...`);

  const [dailyBars, weeklyBars, monthlyBars] = await Promise.all([
    getOHLCV(symbol, '1d', 12).catch(() => [] as OHLCVBar[]),
    getOHLCV(symbol, '1wk', 24).catch(() => [] as OHLCVBar[]),
    getOHLCV(symbol, '1mo', 36).catch(() => [] as OHLCVBar[]),
  ]);

  const daily = computeIndicators(dailyBars);
  const weekly = computeIndicators(weeklyBars);
  const monthly = computeIndicators(monthlyBars);
  const priceLevels = computePriceLevels(daily, fundamentals, dailyBars);
  const wyckoff = detectWyckoff(dailyBars, daily.rsi);

  return {
    symbol,
    timeframes: { daily, weekly, monthly },
    priceLevels,
    wyckoff,
    optionsMaxPain: null, // 在 index.ts 中填充
  };
}
