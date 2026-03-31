/**
 * getNews — 独立 CLI 入口
 *
 * 用法:
 *   npx tsx packages/tools/getNews/cli.ts --symbols NVDA,TSM [--date 2026-03-31]
 */
import 'dotenv/config';
import { today } from '../shared/date.js';

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

/** 搜索消息面 + 内幕交易 → data/info/daily/{date}/news-{SYMBOL}.json */
export async function runNews(date: string, symbols?: string[]) {
  if (!symbols || symbols.length === 0) {
    console.error('[news] 请指定 --symbols NVDA,TSM');
    process.exit(1);
  }

  console.log(`[news] 搜索 ${symbols.length} 只股票消息面: ${symbols.join(', ')}`);
  const { collectNews } = await import('./news.js');
  await collectNews(date, symbols);
}

// ─── Main ───
async function main() {
  const { date, symbols } = parseArgs();
  console.log(`\n📊 getNews (${date})\n`);
  await runNews(date, symbols);
}

main().catch(err => {
  console.error('致命错误:', err);
  process.exit(1);
});
