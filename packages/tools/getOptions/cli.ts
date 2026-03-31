/**
 * getOptions — 独立 CLI 入口
 *
 * 用法:
 *   npx tsx packages/tools/getOptions/cli.ts --symbol NVDA --expiry 2026-02-27 --direction call [--date 2026-03-31]
 */
import 'dotenv/config';
import { today } from '../shared/date.js';
import { writeDailyData } from '../shared/cache.js';
import { analyzeOptions } from './options.js';

function parseArgs() {
  const args = process.argv.slice(2);
  let date = today();
  let symbol: string | undefined;
  let expiry: string | undefined;
  let direction: 'call' | 'put' | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) date = args[++i];
    else if (args[i] === '--symbol' && args[i + 1]) symbol = args[++i].trim().toUpperCase();
    else if (args[i] === '--expiry' && args[i + 1]) expiry = args[++i];
    else if (args[i] === '--direction' && args[i + 1]) direction = args[++i] as 'call' | 'put';
  }
  return { date, symbol, expiry, direction };
}

/** 期权量化分析 → data/info/daily/{date}/options-{SYMBOL}-{EXPIRY}.json */
export async function runOptions(date: string, symbol?: string, expiry?: string, direction?: 'call' | 'put') {
  if (!symbol || !expiry || !direction) {
    console.error('[options] 请指定 --symbol NVDA --expiry 2026-02-27 --direction call');
    process.exit(1);
  }

  console.log(`[options] 分析 ${symbol} ${direction} ${expiry}`);
  const result = await analyzeOptions(symbol, expiry, direction);
  const filename = `options-${symbol}-${expiry}`;
  await writeDailyData(date, filename, result);
  console.log(`[options] 数据已保存 → data/info/daily/${date}/${filename}.json`);
}

// ─── Main ───
async function main() {
  const { date, symbol, expiry, direction } = parseArgs();
  console.log(`\n📊 getOptions (${date})\n`);
  await runOptions(date, symbol, expiry, direction);
}

main().catch(err => {
  console.error('致命错误:', err);
  process.exit(1);
});
