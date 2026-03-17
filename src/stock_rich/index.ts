/**
 * Stock Rich — CLI 入口
 *
 * 代码只负责数据采集和获取，所有分析由 Claude Code LLM 完成：
 *   npm run collect              采集 KOL 数据 → data/daily/{date}/posts.json
 *   npm run data -- --symbols X  获取金融数据 → data/daily/{date}/stockdata.json
 *   npm run options -- --symbol NVDA --expiry 2026-02-27 --direction call  期权分析
 *
 * 参数:
 *   --date 2026-02-19            指定日期
 *   --platform twitter           仅采集指定平台
 *   --symbols NVDA,TSM           指定股票代码
 *   --symbol NVDA                单只股票 (options 命令)
 *   --expiry 2026-02-27          期权到期日 (options 命令)
 *   --direction call|put         方向 (options 命令)
 */
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { today } from './utils/date.js';
import { readDailyData, writeDailyData } from './utils/cache.js';
import { batchFundamentals } from './analysis/fundamental.js';
import { analyzeTechnical } from './analysis/technical.js';
import { getOptionsMaxPain } from './utils/yahoo.js';
import { analyzeOptions } from './analysis/options.js';
import type { FullTechnicalAnalysis } from './analysis/technical.js';

const COMMANDS = ['collect', 'data', 'options', 'news'] as const;
type Command = (typeof COMMANDS)[number];

function parseArgs(): {
  command: Command; date: string; platform?: string; symbols?: string[];
  symbol?: string; expiry?: string; direction?: 'call' | 'put';
} {
  const args = process.argv.slice(2);
  
  // 去除可能的 '--' 前缀（当通过 npm run 传递参数时）
  if (args[0] === '--') {
    args.shift();
  }

  let commandRaw = args[0];

  // 如果第一个参数以 '-' 开头（例如 --collect）或者未提供，默认为 collect
  if (!commandRaw || commandRaw.startsWith('-')) {
    commandRaw = 'collect';
  }

  const command = commandRaw as Command;

  if (!COMMANDS.includes(command)) {
    console.error(`未知命令: ${command}`);
    console.error('可用命令: collect, data, options, news');
    process.exit(1);
  }

  let date = today();
  let platform: string | undefined;
  let symbols: string[] | undefined;
  let symbol: string | undefined;
  let expiry: string | undefined;
  let direction: 'call' | 'put' | undefined;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) {
      date = args[++i];
    } else if (args[i] === '--platform' && args[i + 1]) {
      platform = args[++i];
    } else if (args[i] === '--symbols' && args[i + 1]) {
      symbols = args[++i].split(',').map(s => s.trim().toUpperCase());
    } else if (args[i] === '--symbol' && args[i + 1]) {
      symbol = args[++i].trim().toUpperCase();
    } else if (args[i] === '--expiry' && args[i + 1]) {
      expiry = args[++i];
    } else if (args[i] === '--direction' && args[i + 1]) {
      direction = args[++i] as 'call' | 'put';
    }
  }

  return { command, date, platform, symbols, symbol, expiry, direction };
}

// ─── Collect ─── 采集 KOL 数据 → posts.json
export async function runCollect(date: string, platform?: string) {
  const platforms = platform ? [platform] : ['twitter', 'weibo', 'youtube'];
  for (const p of platforms) {
    console.log(`[collect] 采集 ${p} 数据 (${date})...`);
    switch (p) {
      case 'twitter': {
        const { collectTwitter } = await import('./collectors/twitter.js');
        await collectTwitter(date);
        break;
      }
      case 'weibo': {
        const { collectWeibo } = await import('./collectors/weibo.js');
        await collectWeibo(date);
        break;
      }
      case 'youtube': {
        const { collectYouTube } = await import('./collectors/youtube.js');
        await collectYouTube(date);
        break;
      }
      default:
        console.warn(`[collect] 未知平台: ${p}`);
    }
  }

  const allPosts = await loadAllPosts(date);
  await writeDailyData(date, 'posts', allPosts);
  console.log(`[collect] 采集完成，共 ${allPosts.length} 条 → data/daily/${date}/posts.json`);
}

// ─── Helper: 合并各平台原始数据 ───
async function loadAllPosts(date: string) {
  const posts: { kolId: string; kolName: string; platform: string; text: string; createdAt: string; url: string }[] = [];

  const twitter = await readDailyData<any[]>(date, 'twitter');
  if (twitter) {
    for (const t of twitter) {
      posts.push({
        kolId: t.kolId ?? '', kolName: t.kolName ?? '',
        platform: 'twitter', text: t.text ?? '', createdAt: t.createdAt ?? '', url: t.url ?? '',
      });
    }
  }

  const weibo = await readDailyData<any[]>(date, 'weibo');
  if (weibo) {
    for (const w of weibo) {
      posts.push({
        kolId: w.kolId ?? '', kolName: w.kolName ?? '',
        platform: 'weibo', text: w.text ?? '', createdAt: w.createdAt ?? '', url: w.url ?? '',
      });
    }
  }

  const youtube = await readDailyData<any[]>(date, 'youtube');
  if (youtube) {
    for (const y of youtube) {
      posts.push({
        kolId: y.kolId ?? '', kolName: y.kolName ?? '',
        platform: 'youtube', text: `${y.title ?? ''}\n${y.transcript ?? ''}`, createdAt: y.publishedAt ?? '', url: y.url ?? '',
      });
    }
  }

  return posts;
}

// ─── Data ─── 获取基本面+技术面真实数据 (供 Claude Code skills 调用)
export async function runData(date: string, symbols?: string[]) {
  if (!symbols || symbols.length === 0) {
    const matchData = await readDailyData<{ symbols: string[] }>(date, 'matches');
    symbols = matchData?.symbols;
    if (!symbols || symbols.length === 0) {
      console.error('[data] 请指定 -- --symbols NVDA,TSM');
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

  await writeDailyData(date, 'stockdata', result, true); // 增量合并，允许覆盖
  console.log(`[data] 数据已保存 → data/daily/${date}/stockdata.json`);
}

// ─── Options ─── 期权量化分析 (供 /trade skill 调用)
export async function runOptions(date: string, symbol?: string, expiry?: string, direction?: 'call' | 'put') {
  if (!symbol || !expiry || !direction) {
    console.error('[options] 请指定 --symbol NVDA --expiry 2026-02-27 --direction call');
    return;
  }

  console.log(`[options] 分析 ${symbol} ${direction} ${expiry}`);
  const result = await analyzeOptions(symbol, expiry, direction);
  const filename = `options-${symbol}-${expiry}`;
  await writeDailyData(date, filename, result);
  console.log(`[options] 数据已保存 → data/daily/${date}/${filename}.json`);
}

// ─── News ─── 消息面搜索 + 内幕交易 (供 /trade, /daily, /news skill 通用调用)
export async function runNews(date: string, symbols?: string[]) {
  if (!symbols || symbols.length === 0) {
    console.error('[news] 请指定 --symbols NVDA,TSM');
    return;
  }

  console.log(`[news] 搜索 ${symbols.length} 只股票消息面: ${symbols.join(', ')}`);
  const { collectNews } = await import('./collectors/news.js');
  await collectNews(date, symbols);
}

// ─── Main ───
async function main() {
  // Check if run directly
  const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
  if (!isMainModule) return;

  const { command, date, platform, symbols, symbol, expiry, direction } = parseArgs();
  console.log(`\n📊 Stock Rich — ${command} (${date})\n`);

  switch (command) {
    case 'collect':
      await runCollect(date, platform);
      break;
    case 'data':
      await runData(date, symbols);
      break;
    case 'options':
      await runOptions(date, symbol, expiry, direction);
      break;
    case 'news':
      await runNews(date, symbols);
      break;
  }
}

main().catch(err => {
  console.error('致命错误:', err);
  process.exit(1);
});
