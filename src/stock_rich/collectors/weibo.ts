/**
 * 微博采集器 — 通过 weibo.com 桌面版 AJAX API 获取
 * 使用 WEIBO_COOKIE 中的 SUB/SUBP 认证
 */
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { writeDailyData } from '../utils/cache.js';

// Refactored to use process.cwd()
const PROJECT_ROOT = resolve(process.cwd());

interface WeiboPost {
  kolId: string;
  kolName: string;
  uid: string;
  text: string;
  createdAt: string;
  url: string;
  reposts: number;
  comments: number;
  likes: number;
  images: string[];
}

interface KolConfig {
  id: string;
  name: string;
  platforms: Record<string, Record<string, string>>;
}

async function getWeiboKols(): Promise<{ kolId: string; kolName: string; uid: string }[]> {
  const raw = await readFile(join(PROJECT_ROOT, 'config', 'kols.json'), 'utf-8');
  const config = JSON.parse(raw) as { kols: KolConfig[] };
  return config.kols
    .filter(k => k.platforms.weibo?.uid)
    .map(k => ({
      kolId: k.id,
      kolName: k.name,
      uid: k.platforms.weibo.uid,
    }));
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/** 解析微博时间 "Wed Feb 18 18:20:01 +0800 2026" → ISO */
function parseWeiboDate(str: string): string {
  if (!str) return '';
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch { /* ignore */ }
  return str;
}

/** 判断日期是否匹配 */
function isTargetDate(weiboDate: string, targetDate: string): boolean {
  if (!weiboDate) return true;
  try {
    const d = new Date(weiboDate);
    if (isNaN(d.getTime())) return true;
    return d.toISOString().slice(0, 10) === targetDate;
  } catch {
    return true;
  }
}

/** 通过 weibo.com AJAX API 获取用户微博 */
async function fetchUserWeibo(uid: string, cookie: string): Promise<any[]> {
  const url = `https://weibo.com/ajax/statuses/mymblog?uid=${uid}&page=1&feature=0`;
  
  // 提取 xsrf token
  const xsrfMatch = cookie.match(/XSRF-TOKEN=([^;]+)/);
  const xsrfToken = xsrfMatch ? xsrfMatch[1] : (process.env.WEIBO_XSRF_TOKEN || '');
  
  const resp = await fetch(url, {
    headers: {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'zh,en-US;q=0.9,en;q=0.8,zh-TW;q=0.7,zh-CN;q=0.6',
      'cache-control': 'no-cache',
      'client-version': '3.0.0',
      'dnt': '1',
      'pragma': 'no-cache',
      'priority': 'u=1, i',
      'referer': `https://weibo.com/u/${uid}`,
      'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
      'x-xsrf-token': xsrfToken,
      'cookie': cookie,
    },
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`HTTP ${resp.status}: ${body.slice(0, 100)}`);
  }

  const json = await resp.json() as any;
  if (json.ok !== 1 && json.ok !== undefined) {
    throw new Error(json.message || `API 返回 ok=${json.ok}`);
  }

  return json?.data?.list || [];
}

export async function collectWeibo(date: string): Promise<void> {
  const cookie = process.env.WEIBO_COOKIE || '';
  if (!cookie) {
    console.warn('[weibo] WEIBO_COOKIE 未设置，跳过微博采集');
    console.warn('[weibo] 请在 .env 中设置 WEIBO_COOKIE (从浏览器复制 Cookie 头)');
    await writeDailyData(date, 'weibo', []);
    return;
  }

  const kols = await getWeiboKols();
  if (kols.length === 0) {
    console.log('[weibo] 无微博 KOL 配置，跳过');
    await writeDailyData(date, 'weibo', []);
    return;
  }

  console.log(`[weibo] 采集 ${kols.length} 个 KOL: ${kols.map(k => k.kolName).join(', ')}`);

  const allPosts: WeiboPost[] = [];

  for (const kol of kols) {
    try {
      console.log(`[weibo]   采集 ${kol.kolName} (uid: ${kol.uid})...`);
      const mblogs = await fetchUserWeibo(kol.uid, cookie);

      let count = 0;
      for (const mb of mblogs) {
        const createdAt = parseWeiboDate(mb.created_at || '');
        if (!isTargetDate(createdAt, date)) continue;

        const pics = mb.pic_ids || [];
        const picInfos = mb.pic_infos || {};
        const images = pics.map((id: string) => picInfos[id]?.large?.url || picInfos[id]?.original?.url || '').filter(Boolean);

        allPosts.push({
          kolId: kol.kolId,
          kolName: kol.kolName,
          uid: kol.uid,
          text: stripHtml(mb.text_raw || mb.text || ''),
          createdAt,
          url: `https://weibo.com/${kol.uid}/${mb.mblogid || mb.id}`,
          reposts: mb.reposts_count ?? 0,
          comments: mb.comments_count ?? 0,
          likes: mb.attitudes_count ?? 0,
          images,
        });
        count++;
      }

      console.log(`[weibo]   ${kol.kolName}: ${count} 条微博`);
    } catch (err) {
      console.error(`[weibo]   ${kol.kolName} 采集失败:`, (err as Error).message);
    }

    await sleep(2000);
  }

  console.log(`[weibo] 共采集 ${allPosts.length} 条微博`);
  await writeDailyData(date, 'weibo', allPosts);
}
