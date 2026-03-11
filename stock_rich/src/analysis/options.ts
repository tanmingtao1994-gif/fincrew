/**
 * 期权量化分析引擎 V2
 *
 * 计算: Black-Scholes Greeks (含 Vanna/Charm), IVR, IV-RV Spread,
 *       IV Skew, 期限结构, Vol/OI, Strike集中度, GEX/Gamma Flip (S²公式),
 *       Gamma Squeeze/Panic Crash 检测, Expected Move,
 *       获利倍数/胜率 (对数正态快筛 + Monte Carlo Jump Diffusion 精算),
 *       流动性过滤, Top 5 推荐
 *
 * 代码只做数学计算，所有"判断"由 LLM 在 /trade skill 中完成。
 */
import {
  getOHLCV,
  getOptionsChainForExpiry,
  getAvailableExpirations,
  getMacroSnapshot,
  type OptionsChain,
  type OptionContract,
  type MacroSnapshot,
} from '../utils/yahoo.js';

// ─── Types ───

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  vanna: number;  // ∂Delta/∂σ — IV变化引起的delta变化
  charm: number;  // ∂Delta/∂T — 时间流逝导致的delta衰减
}

export interface ContractAnalysis {
  strike: number;
  premium: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  iv: number;
  greeks: Greeks;
  volOiRatio: number | null;
  bidAskSpreadPct: number;     // (ask-bid)/mid 百分比
  liquidityWarning: boolean;   // bid-ask > 30%
  strikeConcentration: number; // 该行权价成交量占总方向成交量比例
  breakeven: number;
  target5x: number;
  target10x: number;
  // 对数正态解析解 (快速筛选)
  pProfit: number;
  p5x: number;
  p10x: number;
  ev: number;
  // Monte Carlo Jump Diffusion (仅 Top 5 精算)
  mcPProfit: number | null;
  mcP5x: number | null;
  mcP10x: number | null;
  mcEv: number | null;
  inTheMoney: boolean;
}

export interface VolOiAnomaly {
  strike: number;
  volOiRatio: number;
  volume: number;
  openInterest: number;
  direction: 'call' | 'put';
}

export interface GexData {
  netGex: number;
  gammaFlipPrice: number | null;
  gexByStrike: { strike: number; callGex: number; putGex: number; netGex: number }[];
  maxCallOiStrike: number | null;  // Call OI 墙
  maxPutOiStrike: number | null;   // Put OI 墙
}

export interface StrategySignals {
  ivrLow: boolean;            // HV IVR < 30%
  ivrHigh: boolean;           // HV IVR > 50%
  skewExtreme: boolean;       // |skew| > 0.10
  skewDirection: 'fear' | 'greed' | 'neutral';
  volOiAnomalies: VolOiAnomaly[];
  nearGammaFlip: boolean;     // 股价距 Gamma Flip < 3%
  withinEm: boolean;          // 行权价在 EM 范围内
  gammaSqueezeRisk: boolean;  // 价格接近 Call OI 墙 + NetGEX < 0 + Call Vol 爆发
  panicCrashRisk: boolean;    // Put Skew 急升 + 跌破 GammaFlip + 放量
}

export interface OptionsAnalysis {
  symbol: string;
  expirationDate: string;
  direction: 'call' | 'put';
  currentPrice: number;
  daysToExpiry: number;

  // 量化仪表盘
  hvIvrPercentile: number;
  atmIvPercentile: number;
  atmIv: number;
  ivRvSpread: number;           // ATM IV - HV20, 负值=期权被低估
  ivSkew: number;
  termStructure: number;        // nearIV - farIV, 正值=近端事件溢价
  farExpiryIv: number | null;   // 远端 ATM IV
  expectedMove: number;
  expectedMovePercent: number;
  gex: GexData;
  maxPainStrike: number | null;
  callOI: number;
  putOI: number;
  pcRatio: number;
  macro: MacroSnapshot;

  // 策略信号
  signals: StrategySignals;

  // Top 5 推荐行权价
  top5: ContractAnalysis[];

  // 全部异常 Vol/OI
  volOiAnomalies: VolOiAnomaly[];

  fetchedAt: string;
}

// ─── Black-Scholes ───

/** 标准正态分布 CDF (Abramowitz & Stegun 近似) */
function normCdf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2);
  return 0.5 * (1 + sign * y);
}

/** 标准正态分布 PDF */
function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/** Black-Scholes Greeks (含 Vanna & Charm) */
function bsGreeks(
  S: number, K: number, T: number, r: number, sigma: number, type: 'call' | 'put',
): Greeks {
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    return { delta: 0, gamma: 0, theta: 0, vega: 0, vanna: 0, charm: 0 };
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const nd1 = normPdf(d1);

  const gamma = nd1 / (S * sigma * sqrtT);
  const vega = S * nd1 * sqrtT / 100; // per 1% IV change

  // Vanna: ∂Delta/∂σ = -nd1 * d2 / sigma (per unit σ change)
  // 归一化为每 1% IV 变化
  const vanna = -nd1 * d2 / (sigma * 100);

  // Charm: ∂Delta/∂T (delta decay per day)
  // charm = -nd1 * (2*r*T - d2*sigma*sqrtT) / (2*T*sigma*sqrtT) / 365
  const charmRaw = T > 0.001
    ? -nd1 * (2 * r * T - d2 * sigma * sqrtT) / (2 * T * sigma * sqrtT)
    : 0;

  if (type === 'call') {
    return {
      delta: normCdf(d1),
      gamma, vega, vanna,
      theta: (-(S * nd1 * sigma) / (2 * sqrtT) - r * K * Math.exp(-r * T) * normCdf(d2)) / 365,
      charm: charmRaw / 365,
    };
  } else {
    return {
      delta: normCdf(d1) - 1,
      gamma, vega, vanna,
      theta: (-(S * nd1 * sigma) / (2 * sqrtT) + r * K * Math.exp(-r * T) * normCdf(-d2)) / 365,
      // Put charm = Call charm + r*K*e^(-rT)*nd1/(S*sigma*sqrtT) 简化为同公式
      charm: charmRaw / 365,
    };
  }
}

// ─── Historical Volatility & IVR ───

/** 计算滚动 HV (年化): HV = std(log_returns, 20d) × √252 */
function rollingHV(closes: number[], window: number = 20): number[] {
  const hvs: number[] = [];
  for (let i = window; i < closes.length; i++) {
    const slice = closes.slice(i - window, i);
    const logReturns: number[] = [];
    for (let j = 1; j < slice.length; j++) {
      if (slice[j - 1] > 0) logReturns.push(Math.log(slice[j] / slice[j - 1]));
    }
    if (logReturns.length < 2) continue;
    const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
    const variance = logReturns.reduce((a, b) => a + (b - mean) ** 2, 0) / (logReturns.length - 1);
    hvs.push(Math.sqrt(variance * 252));
  }
  return hvs;
}

/** 计算百分位 */
function percentile(values: number[], current: number): number {
  if (values.length === 0) return 50;
  const below = values.filter(v => v < current).length;
  return Math.round((below / values.length) * 100);
}

// ─── GEX / Gamma Flip (机构标准 S² 公式) ───

function computeGex(
  calls: OptionContract[], puts: OptionContract[],
  S: number, T: number, r: number,
): GexData {
  const gexByStrike: GexData['gexByStrike'] = [];
  const allStrikes = new Set([...calls.map(c => c.strike), ...puts.map(p => p.strike)]);

  // 找 OI 墙
  let maxCallOi = 0, maxCallOiStrike: number | null = null;
  let maxPutOi = 0, maxPutOiStrike: number | null = null;

  for (const strike of [...allStrikes].sort((a, b) => a - b)) {
    const call = calls.find(c => c.strike === strike);
    const put = puts.find(p => p.strike === strike);

    if (call && call.openInterest > maxCallOi) {
      maxCallOi = call.openInterest; maxCallOiStrike = strike;
    }
    if (put && put.openInterest > maxPutOi) {
      maxPutOi = put.openInterest; maxPutOiStrike = strike;
    }

    let callGex = 0, putGex = 0;
    if (call && call.openInterest > 0 && call.impliedVolatility > 0) {
      const g = bsGreeks(S, strike, T, r, call.impliedVolatility, 'call');
      // 机构标准: GEX = Gamma × OI × 100 × S² (美元对冲流量)
      callGex = g.gamma * call.openInterest * 100 * S * S;
    }
    if (put && put.openInterest > 0 && put.impliedVolatility > 0) {
      const g = bsGreeks(S, strike, T, r, put.impliedVolatility, 'put');
      putGex = -g.gamma * put.openInterest * 100 * S * S;
    }

    gexByStrike.push({ strike, callGex, putGex, netGex: callGex + putGex });
  }

  const netGex = gexByStrike.reduce((sum, g) => sum + g.netGex, 0);

  // Gamma Flip: 找 netGex 从正变负的价格
  let gammaFlipPrice: number | null = null;
  for (let i = 1; i < gexByStrike.length; i++) {
    if (gexByStrike[i - 1].netGex > 0 && gexByStrike[i].netGex <= 0) {
      gammaFlipPrice = (gexByStrike[i - 1].strike + gexByStrike[i].strike) / 2;
      break;
    }
  }

  return { netGex, gammaFlipPrice, gexByStrike, maxCallOiStrike, maxPutOiStrike };
}

// ─── Profit / Win Rate (对数正态解析解 — 快速筛选) ───

function pAbove(S: number, target: number, T: number, sigma: number, r: number): number {
  if (T <= 0 || sigma <= 0 || target <= 0) return 0;
  const d2 = (Math.log(S / target) + (r - 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  return normCdf(d2);
}

function pBelow(S: number, target: number, T: number, sigma: number, r: number): number {
  return 1 - pAbove(S, target, T, sigma, r);
}

// ─── Monte Carlo Jump Diffusion (Top 5 精算) ───

const MC_PATHS = 3000;
const JUMP_LAMBDA = 0.1;     // 年化跳跃频率
const JUMP_MEAN = -0.05;     // 跳跃均值 (偏负 = 崩盘更常见)
const JUMP_STD = 0.10;       // 跳跃标准差

/** Box-Muller 正态随机数 */
function randNormal(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

/** Monte Carlo Jump Diffusion 概率计算 */
function monteCarloProb(
  S: number, T: number, sigma: number, r: number,
  targets: { profit: number; x5: number; x10: number },
  direction: 'call' | 'put',
): { mcPProfit: number; mcP5x: number; mcP10x: number } {
  const dt = T; // 单步到期 (简化: 不分步, 直接模拟终值)
  let hitProfit = 0, hit5x = 0, hit10x = 0;

  for (let i = 0; i < MC_PATHS; i++) {
    // GBM + Jump
    const z = randNormal();
    const nJumps = poissonRandom(JUMP_LAMBDA * T);
    let jumpSum = 0;
    for (let j = 0; j < nJumps; j++) {
      jumpSum += JUMP_MEAN + JUMP_STD * randNormal();
    }
    const ST = S * Math.exp(
      (r - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z + jumpSum
    );

    if (direction === 'call') {
      if (ST >= targets.profit) hitProfit++;
      if (ST >= targets.x5) hit5x++;
      if (ST >= targets.x10) hit10x++;
    } else {
      if (ST <= targets.profit) hitProfit++;
      if (ST <= targets.x5) hit5x++;
      if (ST <= targets.x10) hit10x++;
    }
  }

  return {
    mcPProfit: hitProfit / MC_PATHS,
    mcP5x: hit5x / MC_PATHS,
    mcP10x: hit10x / MC_PATHS,
  };
}

/** 泊松随机数 (Knuth 算法) */
function poissonRandom(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

// ─── Max Pain ───

function computeMaxPain(calls: OptionContract[], puts: OptionContract[]): number | null {
  const allStrikes = new Set([...calls.map(c => c.strike), ...puts.map(p => p.strike)]);
  if (allStrikes.size === 0) return null;

  let minLoss = Infinity;
  let maxPainStrike = 0;

  for (const testStrike of allStrikes) {
    let totalLoss = 0;
    for (const c of calls) {
      if (testStrike > c.strike) totalLoss += (testStrike - c.strike) * c.openInterest;
    }
    for (const p of puts) {
      if (testStrike < p.strike) totalLoss += (p.strike - testStrike) * p.openInterest;
    }
    if (totalLoss < minLoss) {
      minLoss = totalLoss;
      maxPainStrike = testStrike;
    }
  }
  return maxPainStrike;
}

// ─── 主分析函数 ───

const RISK_FREE_RATE = 0.045;

export async function analyzeOptions(
  symbol: string,
  expirationDate: string,
  direction: 'call' | 'put',
): Promise<OptionsAnalysis> {
  console.log(`[options] 分析 ${symbol} ${direction} ${expirationDate}...`);

  // 1. 获取期权链
  const chain = await getOptionsChainForExpiry(symbol, expirationDate);
  const S = chain.currentPrice;
  const { calls, puts } = chain;

  // 2. 计算到期天数
  const now = new Date();
  const expiry = new Date(expirationDate + 'T16:00:00');
  const daysToExpiry = Math.max(1, Math.ceil((expiry.getTime() - now.getTime()) / 86400000));
  const T = daysToExpiry / 365;
  const r = RISK_FREE_RATE;

  // 3. 获取历史数据 → HV → IVR
  console.log(`[options] 计算 IVR...`);
  const dailyBars = await getOHLCV(symbol, '1d', 14);
  const closes = dailyBars.map(b => b.close);
  const hvSeries = rollingHV(closes, 20);
  const currentHV = hvSeries.length > 0 ? hvSeries[hvSeries.length - 1] : 0;
  const hvIvrPercentile = percentile(hvSeries, currentHV);

  // 4. ATM IV + IV-RV Spread
  const atmCall = findATM(calls, S);
  const atmPut = findATM(puts, S);
  const atmIv = atmCall ? atmCall.impliedVolatility : (atmPut ? atmPut.impliedVolatility : currentHV);
  const atmIvPercentile = percentile(hvSeries, atmIv);
  const ivRvSpread = atmIv - currentHV; // 负值 = 期权被低估

  // 5. IV Skew: delta ≈ -0.25 Put vs delta ≈ 0.25 Call
  const skewPut = findByDelta(puts, S, T, r, 'put', -0.25);
  const skewCall = findByDelta(calls, S, T, r, 'call', 0.25);
  const ivSkew = (skewPut?.impliedVolatility ?? 0) - (skewCall?.impliedVolatility ?? 0);

  // 6. 期限结构: 获取 ~90 天远端到期日 ATM IV
  console.log(`[options] 计算期限结构...`);
  let termStructure = 0;
  let farExpiryIv: number | null = null;
  try {
    const expirations = await getAvailableExpirations(symbol);
    const target90 = new Date(now.getTime() + 90 * 86400000);
    let bestFarExp: string | null = null;
    let bestDiff = Infinity;
    for (const exp of expirations) {
      const d = new Date(exp + 'T12:00:00Z');
      const diff = Math.abs(d.getTime() - target90.getTime());
      // 至少比当前到期日远 14 天
      if (diff < bestDiff && d.getTime() > expiry.getTime() + 14 * 86400000) {
        bestDiff = diff; bestFarExp = exp;
      }
    }
    if (bestFarExp) {
      const farChain = await getOptionsChainForExpiry(symbol, bestFarExp);
      const farAtm = findATM(direction === 'call' ? farChain.calls : farChain.puts, S);
      if (farAtm && farAtm.impliedVolatility > 0) {
        farExpiryIv = farAtm.impliedVolatility;
        termStructure = atmIv - farExpiryIv; // 正值 = 近端事件溢价
      }
    }
  } catch { console.warn(`[options] 期限结构计算失败，跳过`); }

  // 7. Expected Move
  const atmCallPrice = atmCall ? mid(atmCall.bid, atmCall.ask, atmCall.lastPrice) : 0;
  const atmPutPrice = atmPut ? mid(atmPut.bid, atmPut.ask, atmPut.lastPrice) : 0;
  const expectedMove = (atmCallPrice + atmPutPrice) * 0.85;
  const expectedMovePercent = S > 0 ? (expectedMove / S) * 100 : 0;

  // 8. GEX / Gamma Flip (S² 公式)
  console.log(`[options] 计算 GEX...`);
  const gex = computeGex(calls, puts, S, T, r);

  // 9. Max Pain & P/C Ratio
  const maxPainStrike = computeMaxPain(calls, puts);
  const callOI = calls.reduce((s, c) => s + c.openInterest, 0);
  const putOI = puts.reduce((s, p) => s + p.openInterest, 0);
  const pcRatio = callOI > 0 ? putOI / callOI : 0;

  // 10. 宏观快照
  console.log(`[options] 获取宏观快照...`);
  const macro = await getMacroSnapshot();

  // 11. Vol/OI 异常
  const volOiAnomalies: VolOiAnomaly[] = [];
  for (const c of calls) {
    if (c.openInterest > 0 && c.volume / c.openInterest > 3.0) {
      volOiAnomalies.push({ strike: c.strike, volOiRatio: +(c.volume / c.openInterest).toFixed(2), volume: c.volume, openInterest: c.openInterest, direction: 'call' });
    }
  }
  for (const p of puts) {
    if (p.openInterest > 0 && p.volume / p.openInterest > 3.0) {
      volOiAnomalies.push({ strike: p.strike, volOiRatio: +(p.volume / p.openInterest).toFixed(2), volume: p.volume, openInterest: p.openInterest, direction: 'put' });
    }
  }
  volOiAnomalies.sort((a, b) => b.volOiRatio - a.volOiRatio);

  // 12. 分析每个合约 → 对数正态快筛
  console.log(`[options] 计算获利倍数 & 胜率...`);
  const contracts = direction === 'call' ? calls : puts;
  const totalDirVolume = contracts.reduce((s, c) => s + c.volume, 0);
  const analyzed: ContractAnalysis[] = [];

  for (const c of contracts) {
    const premium = mid(c.bid, c.ask, c.lastPrice);
    if (premium <= 0) continue;

    const iv = c.impliedVolatility > 0 ? c.impliedVolatility : atmIv;
    const greeks = bsGreeks(S, c.strike, T, r, iv, direction);
    const volOiRatio = c.openInterest > 0 ? +(c.volume / c.openInterest).toFixed(2) : null;

    // 流动性过滤
    const midPrice = mid(c.bid, c.ask, c.lastPrice);
    const bidAskSpreadPct = midPrice > 0 && c.bid > 0 && c.ask > 0
      ? +((c.ask - c.bid) / midPrice * 100).toFixed(1)
      : 0;
    const liquidityWarning = bidAskSpreadPct > 30;

    // Strike 集中度
    const strikeConcentration = totalDirVolume > 0
      ? +(c.volume / totalDirVolume).toFixed(4)
      : 0;

    let breakeven: number, target5x: number, target10x: number;
    let pProfit: number, p5x: number, p10x: number;

    if (direction === 'call') {
      breakeven = c.strike + premium;
      target5x = c.strike + 6 * premium;
      target10x = c.strike + 11 * premium;
      pProfit = pAbove(S, breakeven, T, iv, r);
      p5x = pAbove(S, target5x, T, iv, r);
      p10x = pAbove(S, target10x, T, iv, r);
    } else {
      breakeven = c.strike - premium;
      target5x = c.strike - 6 * premium;
      target10x = c.strike - 11 * premium;
      pProfit = breakeven > 0 ? pBelow(S, breakeven, T, iv, r) : 0;
      p5x = target5x > 0 ? pBelow(S, target5x, T, iv, r) : 0;
      p10x = target10x > 0 ? pBelow(S, target10x, T, iv, r) : 0;
    }

    const ev = p10x * 10 + p5x * 5 + pProfit * 2 - (1 - pProfit);

    analyzed.push({
      strike: c.strike, premium: +premium.toFixed(2), bid: c.bid, ask: c.ask,
      volume: c.volume, openInterest: c.openInterest, iv: +iv.toFixed(4),
      greeks: {
        delta: +greeks.delta.toFixed(4), gamma: +greeks.gamma.toFixed(6),
        theta: +greeks.theta.toFixed(4), vega: +greeks.vega.toFixed(4),
        vanna: +greeks.vanna.toFixed(6), charm: +greeks.charm.toFixed(6),
      },
      volOiRatio, bidAskSpreadPct, liquidityWarning, strikeConcentration,
      breakeven: +breakeven.toFixed(2), target5x: +target5x.toFixed(2), target10x: +target10x.toFixed(2),
      pProfit: +pProfit.toFixed(4), p5x: +p5x.toFixed(4), p10x: +p10x.toFixed(4),
      ev: +ev.toFixed(4),
      mcPProfit: null, mcP5x: null, mcP10x: null, mcEv: null,
      inTheMoney: c.inTheMoney,
    });
  }

  // 13. 选 Top 5 候选 (优先 OTM + 流动性过滤)
  analyzed.sort((a, b) => b.ev - a.ev);
  const liquid = analyzed.filter(c => c.bidAskSpreadPct <= 50); // 剔除极差流动性
  const otm = liquid.filter(c => !c.inTheMoney);
  const nearAtm = liquid.filter(c => c.inTheMoney && Math.abs(c.strike - S) / S < 0.05);
  const candidates = otm.length >= 5 ? otm : [...otm, ...nearAtm];
  candidates.sort((a, b) => b.ev - a.ev);
  const top5 = candidates.slice(0, 5);

  // 14. Monte Carlo 精算 Top 5
  console.log(`[options] Monte Carlo 精算 Top ${top5.length} 合约...`);
  for (const contract of top5) {
    const targets = direction === 'call'
      ? { profit: contract.breakeven, x5: contract.target5x, x10: contract.target10x }
      : { profit: contract.breakeven, x5: contract.target5x, x10: contract.target10x };
    // 对 put 方向, target5x/10x 可能 <= 0, 跳过
    if (direction === 'put' && (targets.x5 <= 0 || targets.x10 <= 0)) continue;

    const mc = monteCarloProb(S, T, contract.iv, r, targets, direction);
    contract.mcPProfit = +mc.mcPProfit.toFixed(4);
    contract.mcP5x = +mc.mcP5x.toFixed(4);
    contract.mcP10x = +mc.mcP10x.toFixed(4);
    contract.mcEv = +(mc.mcP10x * 10 + mc.mcP5x * 5 + mc.mcPProfit * 2 - (1 - mc.mcPProfit)).toFixed(4);
  }

  // 15. 策略信号 (含 Gamma Squeeze / Panic Crash)
  const nearGammaFlip = gex.gammaFlipPrice != null
    ? Math.abs(S - gex.gammaFlipPrice) / S < 0.03
    : false;

  // Gamma Squeeze: 股价距 Call OI 墙 < 5% + NetGEX < 0 + Call Vol 爆发
  const totalCallVol = calls.reduce((s, c) => s + c.volume, 0);
  const avgCallVol = calls.length > 0 ? totalCallVol / calls.length : 0;
  const gammaSqueezeRisk = gex.maxCallOiStrike != null
    && Math.abs(S - gex.maxCallOiStrike) / S < 0.05
    && gex.netGex < 0
    && totalCallVol > avgCallVol * 2;

  // Panic Crash: Put Skew 急升 + 接近/跌破 GammaFlip + Put Vol 爆发
  const totalPutVol = puts.reduce((s, p) => s + p.volume, 0);
  const avgPutVol = puts.length > 0 ? totalPutVol / puts.length : 0;
  const panicCrashRisk = ivSkew > 0.10
    && nearGammaFlip
    && totalPutVol > avgPutVol * 2;

  const signals: StrategySignals = {
    ivrLow: hvIvrPercentile < 30,
    ivrHigh: hvIvrPercentile > 50,
    skewExtreme: Math.abs(ivSkew) > 0.10,
    skewDirection: ivSkew > 0.05 ? 'fear' : ivSkew < -0.05 ? 'greed' : 'neutral',
    volOiAnomalies: volOiAnomalies.slice(0, 5),
    nearGammaFlip,
    withinEm: top5.length > 0 && direction === 'call'
      ? top5[0].strike <= S + expectedMove
      : top5.length > 0 ? top5[0].strike >= S - expectedMove : false,
    gammaSqueezeRisk,
    panicCrashRisk,
  };

  console.log(`[options] 分析完成: Top ${top5.length}, IVR=${hvIvrPercentile}%, Skew=${ivSkew.toFixed(4)}, IV-RV=${ivRvSpread.toFixed(4)}, TermStr=${termStructure.toFixed(4)}`);

  return {
    symbol, expirationDate, direction, currentPrice: S, daysToExpiry,
    hvIvrPercentile, atmIvPercentile, atmIv: +atmIv.toFixed(4),
    ivRvSpread: +ivRvSpread.toFixed(4),
    ivSkew: +ivSkew.toFixed(4),
    termStructure: +termStructure.toFixed(4),
    farExpiryIv: farExpiryIv != null ? +farExpiryIv.toFixed(4) : null,
    expectedMove: +expectedMove.toFixed(2), expectedMovePercent: +expectedMovePercent.toFixed(2),
    gex, maxPainStrike, callOI, putOI, pcRatio: +pcRatio.toFixed(4),
    macro,
    signals, top5, volOiAnomalies,
    fetchedAt: new Date().toISOString(),
  };
}

// ─── Helpers ───

function findATM(contracts: OptionContract[], S: number): OptionContract | null {
  if (contracts.length === 0) return null;
  return contracts.reduce((best, c) =>
    Math.abs(c.strike - S) < Math.abs(best.strike - S) ? c : best
  );
}

function findByDelta(
  contracts: OptionContract[], S: number, T: number, r: number,
  type: 'call' | 'put', targetDelta: number,
): OptionContract | null {
  let best: OptionContract | null = null;
  let bestDiff = Infinity;
  for (const c of contracts) {
    if (c.impliedVolatility <= 0) continue;
    const g = bsGreeks(S, c.strike, T, r, c.impliedVolatility, type);
    const diff = Math.abs(g.delta - targetDelta);
    if (diff < bestDiff) { bestDiff = diff; best = c; }
  }
  return best;
}

function mid(bid: number, ask: number, lastPrice: number): number {
  if (bid > 0 && ask > 0) return (bid + ask) / 2;
  if (lastPrice > 0) return lastPrice;
  return Math.max(bid, ask);
}
