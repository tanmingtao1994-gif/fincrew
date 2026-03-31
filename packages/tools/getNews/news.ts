/**
 * 消息面采集器 — 多源搜索股票相关新闻 + 内幕交易
 *
 * 数据源:
 *   1. Twitter/X — rettiwt-api tweet.search ($SYMBOL cashtag)
 *   2. Reddit — 公开 JSON API (r/stocks, r/investing, r/wallstreetbets)
 *   3. Google News RSS — fast-xml-parser 解析
 *   4. Yahoo Finance — yahoo-finance2 search()
 *   5. 内幕交易 — yahoo-finance2 quoteSummary (insiderTransactions)
 *
 * 输出: data/info/daily/{date}/news-{SYMBOL}.json
 */
import { XMLParser } from 'fast-xml-parser';
import { writeDailyData, readDailyData } from '../shared/cache.js';
import { getYahooNews, getInsiderTrading } from '../shared/yahoo.js';
import type { YahooNewsItem, InsiderData } from '../shared/yahoo.js';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Types ───

interface TwitterNewsItem {
  text: string;
  username: string;
  url: string;
  likeCount: number;
  retweetCount: number;
  createdAt: string;
}

interface RedditPost {
  title: string;
  selftext: string;
  subreddit: string;
  author: string;
  url: string;
  score: number;
  numComments: number;
  createdAt: string;
}

interface GoogleNewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface NewsResult {
  symbol: string;
  fetchedAt: string;
  twitter: TwitterNewsItem[];
  reddit: RedditPost[];
  googleNews: GoogleNewsItem[];
  yahooNews: YahooNewsItem[];
  insiderTrading: InsiderData;
}

// ─── Twitter Search ───

const REDDIT_SUBS = ['stocks', 'investing', 'wallstreetbets'];
const REDDIT_UA = 'stock-rich/1.0 (Node.js)';

async function searchTwitterNews(symbol: string): Promise<TwitterNewsItem[]> {
  const apiKey = process.env.TWITTER_API_KEY;
  if (!apiKey) {
    console.warn('[news:twitter] TWITTER_API_KEY 未设置，跳过');
    return [];
  }

  try {
    const { Rettiwt } = await import('rettiwt-api');
    let cleanKey = apiKey;
    const decoded = Buffer.from(cleanKey, 'base64').toString('ascii');
    const cleaned = decoded.split(';').map(s => s.trim()).join(';');
    cleanKey = Buffer.from(cleaned).toString('base64');

    const rettiwt = new Rettiwt({ apiKey: cleanKey });
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const result = await rettiwt.tweet.search({
      includeWords: [`$${symbol}`],
      startDate,
      top: true,
    }, 20);

    const tweets = result?.list ?? [];
    return tweets.map((tw: any) => ({
      text: tw.fullText ?? '',
      username: tw.tweetBy?.userName ?? '',
      url: tw.url ?? `https://x.com/i/status/${tw.id}`,
      likeCount: tw.likeCount ?? 0,
      retweetCount: tw.retweetCount ?? 0,
      createdAt: tw.createdAt ?? '',
    }));
  } catch (err) {
    console.error('[news:twitter] 搜索失败:', (err as Error).message);
    return [];
  }
}

// ─── Reddit Search ───

async function searchReddit(symbol: string): Promise<RedditPost[]> {
  const cookie = process.env.REDDIT_COOKIE || '';
  const allPosts: RedditPost[] = [];
  const seen = new Set<string>();

  for (const sub of REDDIT_SUBS) {
    try {
      const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(symbol)}&sort=relevance&t=month&restrict_sr=1&limit=10`;
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      };
      if (cookie) headers['Cookie'] = cookie;

      const resp = await fetch(url, { headers });

      if (!resp.ok) {
        console.warn(`[news:reddit] r/${sub} HTTP ${resp.status}`);
        continue;
      }

      const json = await resp.json() as any;
      const children = json?.data?.children ?? [];

      for (const child of children) {
        const d = child.data;
        if (!d || seen.has(d.id)) continue;
        seen.add(d.id);

        allPosts.push({
          title: d.title ?? '',
          selftext: (d.selftext ?? '').slice(0, 500),
          subreddit: d.subreddit ?? sub,
          author: d.author ?? '',
          url: d.permalink ? `https://www.reddit.com${d.permalink}` : '',
          score: d.score ?? 0,
          numComments: d.num_comments ?? 0,
          createdAt: d.created_utc
            ? new Date(d.created_utc * 1000).toISOString()
            : '',
        });
      }

      console.log(`[news:reddit] r/${sub}: ${children.length} 条`);
    } catch (err) {
      console.error(`[news:reddit] r/${sub} 失败:`, (err as Error).message);
    }

    await sleep(1000);
  }

  // 按 score 降序
  allPosts.sort((a, b) => b.score - a.score);
  return allPosts;
}

// ─── Google News RSS ───

async function searchGoogleNews(symbol: string): Promise<GoogleNewsItem[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(symbol + ' stock')}&hl=en-US&gl=US&ceid=US:en`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': REDDIT_UA },
    });

    if (!resp.ok) {
      console.warn(`[news:google] HTTP ${resp.status}`);
      return [];
    }

    const xml = await resp.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item ?? [];
    const list = Array.isArray(items) ? items : [items];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return list
      .map((item: any) => {
        const pubDate = item.pubDate ? new Date(item.pubDate) : null;
        return {
          title: (item.title ?? '').replace(/ - .*$/, ''),
          source: (item.source?.['#text'] ?? item.source ?? '').toString(),
          url: item.link ?? '',
          publishedAt: pubDate ? pubDate.toISOString() : '',
        };
      })
      .filter((n: GoogleNewsItem) => {
        if (!n.publishedAt) return true;
        return new Date(n.publishedAt) >= thirtyDaysAgo;
      })
      .slice(0, 15);
  } catch (err) {
    console.error('[news:google] 失败:', (err as Error).message);
    return [];
  }
}

// ─── Main: collectNews ───

export async function collectNews(date: string, symbols: string[]): Promise<void> {
  for (const symbol of symbols) {
    // 数据复用: 如果 news-{SYMBOL}.json 已存在，跳过
    const existing = await readDailyData<any>(date, `news-${symbol}`);
    if (existing) {
      console.log(`[news] ${symbol} 消息面已存在，跳过`);
      continue;
    }

    console.log(`[news] 搜索 ${symbol} 消息面...`);

    // 并行采集各数据源
    const [twitter, reddit, googleNews, yahooNews, insiderTrading] = await Promise.all([
      searchTwitterNews(symbol).then(r => { console.log(`[news:twitter] ${symbol}: ${r.length} 条`); return r; }),
      searchReddit(symbol),
      searchGoogleNews(symbol).then(r => { console.log(`[news:google] ${symbol}: ${r.length} 条`); return r; }),
      getYahooNews(symbol).then(r => { console.log(`[news:yahoo] ${symbol}: ${r.length} 条新闻`); return r; }).catch(() => { console.log(`[news:yahoo] ${symbol}: Yahoo News 不可用，跳过`); return []; }),
      getInsiderTrading(symbol).then(r => { console.log(`[news:insider] ${symbol}: ${r.transactions.length} 笔交易`); return r; }).catch(() => { console.log(`[news:insider] ${symbol}: 无内幕交易数据（ETF/跳过）`); return { transactions: [], summary: { buyCount: null, buyShares: null, buyPercent: null, sellCount: null, sellShares: null, sellPercent: null, netCount: null, netShares: null, netPercent: null } }; }),
    ]);

    const result: NewsResult = {
      symbol,
      fetchedAt: new Date().toISOString(),
      twitter,
      reddit,
      googleNews,
      yahooNews,
      insiderTrading,
    };

    await writeDailyData(date, `news-${symbol}`, result);
    console.log(`[news] ${symbol} 消息面已保存 → data/info/daily/${date}/news-${symbol}.json`);
  }
}
