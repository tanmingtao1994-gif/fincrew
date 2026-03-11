/**
 * 基本面分析 — 批量获取基本面数据
 */
import { getFundamentals, type FundamentalData } from '../utils/yahoo.js';

/** 批量获取多只股票的基本面数据 */
export async function batchFundamentals(symbols: string[]): Promise<Map<string, FundamentalData>> {
  const results = new Map<string, FundamentalData>();

  for (const symbol of symbols) {
    try {
      console.log(`[fundamental] 获取 ${symbol}...`);
      const data = await getFundamentals(symbol);
      results.set(symbol, data);
    } catch (err) {
      console.error(`[fundamental] ${symbol} 失败:`, (err as Error).message);
    }
  }

  console.log(`[fundamental] 完成 ${results.size}/${symbols.length} 只股票`);
  return results;
}

/** 格式化数字为可读字符串 */
export function formatNumber(n: number | null, opts?: { decimals?: number; prefix?: string; suffix?: string; compact?: boolean }): string {
  if (n == null) return 'N/A';
  const { decimals = 2, prefix = '', suffix = '', compact = false } = opts ?? {};
  if (compact) {
    const abs = Math.abs(n);
    if (abs >= 1e12) return `${prefix}${(n / 1e12).toFixed(decimals)}T${suffix}`;
    if (abs >= 1e9) return `${prefix}${(n / 1e9).toFixed(decimals)}B${suffix}`;
    if (abs >= 1e6) return `${prefix}${(n / 1e6).toFixed(decimals)}M${suffix}`;
  }
  return `${prefix}${n.toFixed(decimals)}${suffix}`;
}
