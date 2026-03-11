/**
 * Twitter 采集器 — rettiwt-api
 * 优先使用认证模式 (TWITTER_API_KEY)，fallback 到 guest 模式
 */
import { Rettiwt } from 'rettiwt-api';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { writeDailyData } from '../utils/cache.js';

const ROOT = new URL('../../', import.meta.url).pathname;

interface KolConfig {
  id: string;
  name: string;
  platforms: Record<string, Record<string, string>>;
}

interface TweetResult {
  kolId: string;
  kolName: string;
  username: string;
  text: string;
  createdAt: string;
  url: string;
  retweetCount: number;
  likeCount: number;
  replyCount: number;
}

async function getTwitterKols(): Promise<{ kolId: string; kolName: string; username: string }[]> {
  const raw = await readFile(join(ROOT, 'config', 'kols.json'), 'utf-8');
  const config = JSON.parse(raw) as { kols: KolConfig[] };
  return config.kols
    .filter(k => k.platforms.twitter?.username)
    .map(k => ({
      kolId: k.id,
      kolName: k.name,
      username: k.platforms.twitter.username,
    }));
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** 判断推文日期是否匹配目标日期 */
function isTargetDate(tweetDate: string, targetDate: string): boolean {
  if (!tweetDate) return true;
  try {
    const d = new Date(tweetDate);
    if (isNaN(d.getTime())) return true;
    return d.toISOString().slice(0, 10) === targetDate;
  } catch {
    return true;
  }
}

export async function collectTwitter(date: string): Promise<void> {
  const kols = await getTwitterKols();
  if (kols.length === 0) {
    console.log('[twitter] 无 Twitter KOL 配置，跳过');
    await writeDailyData(date, 'twitter', []);
    return;
  }

  const apiKey = process.env.TWITTER_API_KEY;
  const mode = apiKey ? '认证' : 'guest';
  console.log(`[twitter] ${mode}模式，采集 ${kols.length} 个 KOL: ${kols.map(k => '@' + k.username).join(', ')}`);
  if (!apiKey) {
    console.warn('[twitter] ⚠️  未设置 TWITTER_API_KEY，guest 模式可能无法获取最新推文');
  }

  // rettiwt-api 按 ';' split cookie 但不 trim，需要去掉分号后的空格
  let cleanKey = apiKey;
  if (cleanKey) {
    const decoded = Buffer.from(cleanKey, 'base64').toString('ascii');
    const cleaned = decoded.split(';').map(s => s.trim()).join(';');
    cleanKey = Buffer.from(cleaned).toString('base64');
  }
  const rettiwt = new Rettiwt(cleanKey ? { apiKey: cleanKey } : undefined);
  const allTweets: TweetResult[] = [];

  for (const kol of kols) {
    try {
      console.log(`[twitter]   采集 @${kol.username}...`);

      // 先获取用户 ID
      const user = await rettiwt.user.details(kol.username);
      if (!user) {
        console.warn(`[twitter]   @${kol.username} 用户不存在，跳过`);
        continue;
      }

      // 获取最近推文
      const timeline = await rettiwt.user.timeline(user.id, 20);
      const tweets = timeline?.list ?? [];

      let count = 0;
      for (const tw of tweets) {
        if (!isTargetDate(tw.createdAt, date)) continue;

        allTweets.push({
          kolId: kol.kolId,
          kolName: kol.kolName,
          username: kol.username,
          text: tw.fullText ?? '',
          createdAt: tw.createdAt ?? '',
          url: tw.url ?? `https://twitter.com/${kol.username}/status/${tw.id}`,
          retweetCount: tw.retweetCount ?? 0,
          likeCount: tw.likeCount ?? 0,
          replyCount: tw.replyCount ?? 0,
        });
        count++;
      }

      console.log(`[twitter]   @${kol.username}: ${count} 条推文`);
    } catch (err) {
      console.error(`[twitter]   @${kol.username} 采集失败:`, (err as Error).message);
    }

    await sleep(2000);
  }

  console.log(`[twitter] 共采集 ${allTweets.length} 条推文`);
  await writeDailyData(date, 'twitter', allTweets);
}
