/**
 * getKolOpinions — 独立 CLI 入口
 *
 * 用法:
 *   npx tsx packages/tools/getKolOpinions/cli.ts [--date 2026-03-31] [--platform twitter]
 */
import 'dotenv/config';
import { today } from '../shared/date.js';
import { readDailyData, writeDailyData } from '../shared/cache.js';

function parseArgs() {
  const args = process.argv.slice(2);
  let date = today();
  let platform: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) date = args[++i];
    else if (args[i] === '--platform' && args[i + 1]) platform = args[++i];
  }
  return { date, platform };
}

/** 合并各平台原始数据 */
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

/** 采集 KOL 观点 → data/info/daily/{date}/posts.json */
export async function runCollect(date: string, platform?: string) {
  const platforms = platform ? [platform] : ['twitter', 'weibo', 'youtube'];
  for (const p of platforms) {
    console.log(`[collect] 采集 ${p} 数据 (${date})...`);
    switch (p) {
      case 'twitter': {
        const { collectTwitter } = await import('./twitter.js');
        await collectTwitter(date);
        break;
      }
      case 'weibo': {
        const { collectWeibo } = await import('./weibo.js');
        await collectWeibo(date);
        break;
      }
      case 'youtube': {
        const { collectYouTube } = await import('./youtube.js');
        await collectYouTube(date);
        break;
      }
      default:
        console.warn(`[collect] 未知平台: ${p}`);
    }
  }

  const allPosts = await loadAllPosts(date);
  await writeDailyData(date, 'posts', allPosts);
  console.log(`[collect] 采集完成，共 ${allPosts.length} 条 → data/info/daily/${date}/posts.json`);
}

// ─── Main ───
async function main() {
  const { date, platform } = parseArgs();
  console.log(`\n📊 getKolOpinions (${date})\n`);
  await runCollect(date, platform);
}

main().catch(err => {
  console.error('致命错误:', err);
  process.exit(1);
});
