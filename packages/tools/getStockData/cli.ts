/**
 * getStockData — 独立 CLI 入口
 *
 * 用法:
 *   npx tsx packages/tools/getStockData/cli.ts --symbols NVDA,TSM [--date 2026-03-31]
 */
import 'dotenv/config';
import { today } from '../shared/date.js';
import { readDailyData, writeDailyData } from '../shared/cache.js';
import { batchFundamentals } from './fundamental.js';
import { analyzeTechnical } from './technical.js';
import { getOptionsMaxPain } from '../shared/yahoo.js';
import type { FullTechnicalAnalysis } from '../analysis/technical.js';

function parseArgs() {
  const args = process.argv.slice(2);
  let date = today();
  let symbols: string[] | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) date = args[++i];
    else if (args[i] === '--symbols' && args[i + 1]) {
      symbols = args[++i].split(',').map(s => s.trim().toUpperCase());
    }
  }
  return { date, symbols };
}

/** 获取基本面+技术面数据 → data/info/daily/{date}/stockdata.json */
export async function runData(date: string, symbols?: string[]) {
  if (!symbols || symbols.length === 0) {
    const matchData = await readDailyData<{ symbols: string[] }>(date, 'matches');
    symbols = matchData?.symbols;
    if (!symbols || symbols.length === 0) {
      console.error('[data] 请指定 --symbols NVDA,TSM');
      return;
    }
  }

  // 数据复用: 检查已有 stockdata.json，跳过已存在的 symbol
  const existing = await readDailyData<Record<string, any>>(date, 'stockdata');
  const needFetch: string[] = [];
  const result: Record<string, any> = existing ?? {};

  for (const s of symbols) {
    if (existing && existing[s]) {
      console.log(`[data] ${s} 已有数据，跳过`);
    } else {
      needFetch.push(s);
    }
  }

  if (needFetch.length === 0) {
    console.log(`[data] 所有 ${symbols.length} 只股票数据已存在，无需重新获取`);
    return;
  }

  console.log(`[data] 获取 ${needFetch.length}/${symbols.length} 只股票数据: ${needFetch.join(', ')}`);

  console.log('[data] 获取基本面...');
  const fundMap = await batchFundamentals(needFetch);

  console.log('[data] 计算技术指标...');
  for (const symbol of needFetch) {
    const fund = fundMap.get(symbol) ?? null;
    let tech: FullTechnicalAnalysis | null = null;
    try {
      tech = await analyzeTechnical(symbol, fund);
    } catch (err) {
      console.error(`[data]   ${symbol} 技术分析失败:`, (err as Error).message);
    }

    if (tech) {
      try {
        tech.optionsMaxPain = await getOptionsMaxPain(symbol);
      } catch { console.warn(`[data]   ${symbol} 期权数据不可用`); }
    }

    result[symbol] = { fundamentals: fund, technical: tech };
  }

  await writeDailyData(date, 'stockdata', result, true);
  console.log(`[data] 数据已保存 → data/info/daily/${date}/stockdata.json`);
}

// ─── Main ───
async function main() {
  const { date, symbols } = parseArgs();
  console.log(`\n📊 getStockData (${date})\n`);
  await runData(date, symbols);
}

main().catch(err => {
  console.error('致命错误:', err);
  process.exit(1);
});
