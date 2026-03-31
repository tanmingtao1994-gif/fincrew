/**
 * YouTube 采集器 — RSS feed + youtube-transcript 字幕提取
 * 通过 YouTube RSS 获取最新视频，再提取字幕文本
 */
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { XMLParser } from 'fast-xml-parser';
// @ts-ignore - youtube-transcript ESM import issue
import { YoutubeTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';
import { writeDailyData } from '../shared/cache.js';

// Refactored to use process.cwd()
const PROJECT_ROOT = resolve(process.cwd());

interface YouTubeVideo {
  kolId: string;
  kolName: string;
  channelId: string;
  videoId: string;
  title: string;
  publishedAt: string;
  url: string;
  transcript: string;
}

interface KolConfig {
  id: string;
  name: string;
  platforms: Record<string, Record<string, string>>;
}

/** 从 kols.json 提取 YouTube KOL（兼容大小写 YouTube/youtube, channelId/channelid） */
async function getYouTubeKols(): Promise<{ kolId: string; kolName: string; channelId: string }[]> {
  const raw = await readFile(join(PROJECT_ROOT, 'config', 'kols.json'), 'utf-8');
  const config = JSON.parse(raw) as { kols: KolConfig[] };
  const results: { kolId: string; kolName: string; channelId: string }[] = [];

  for (const k of config.kols) {
    // 兼容 YouTube / youtube 大小写
    const yt = k.platforms.youtube || k.platforms.YouTube;
    if (!yt) continue;
    const channelId = yt.channelId || yt.channelid;
    if (!channelId) continue;
    results.push({ kolId: k.id, kolName: k.name, channelId });
  }
  return results;
}

/** 从 @handle 解析真实 channel ID */
async function resolveChannelId(handle: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/${handle}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    // 尝试多种模式提取 channel_id
    const m1 = html.match(/"channelId":"(UC[^"]+)"/);
    if (m1) return m1[1];
    const m2 = html.match(/channel_id=(UC[^&"]+)/);
    if (m2) return m2[1];
    const m3 = html.match(/\/channel\/(UC[^"'/]+)/);
    if (m3) return m3[1];
    return null;
  } catch {
    return null;
  }
}

/** 通过 RSS 获取频道最新视频 */
async function fetchChannelVideos(channelId: string): Promise<{ videoId: string; title: string; published: string }[]> {
  let resolvedId = channelId;

  // @handle 格式需要先解析为 UCxxx
  if (channelId.startsWith('@')) {
    const real = await resolveChannelId(channelId);
    if (!real) throw new Error(`无法解析频道 handle: ${channelId}`);
    resolvedId = real;
    console.log(`[youtube]   解析 ${channelId} -> ${resolvedId}`);
  }

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${resolvedId}`;
  const resp = await fetch(feedUrl);
  if (!resp.ok) throw new Error(`RSS feed 获取失败: HTTP ${resp.status}`);

  const xml = await resp.text();
  return parseRssFeed(xml);
}

function parseRssFeed(xml: string): { videoId: string; title: string; published: string }[] {
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);
  const entries = parsed?.feed?.entry;
  if (!entries) return [];

  const list = Array.isArray(entries) ? entries : [entries];
  return list.map((e: any) => ({
    videoId: (e['yt:videoId'] || '').toString(),
    title: e.title || '',
    published: e.published || '',
  }));
}

/** 提取视频字幕 */
async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    return segments.map((s: any) => s.text).join(' ');
  } catch {
    return '(字幕不可用)';
  }
}

export async function collectYouTube(date: string): Promise<void> {
  const kols = await getYouTubeKols();

  if (kols.length === 0) {
    console.log('[youtube] 无 YouTube KOL 配置，跳过');
    await writeDailyData(date, 'youtube', []);
    return;
  }

  console.log(`[youtube] 采集 ${kols.length} 个 KOL: ${kols.map(k => k.kolName).join(', ')}`);

  const allVideos: YouTubeVideo[] = [];

  for (const kol of kols) {
    try {
      console.log(`[youtube]   采集 ${kol.kolName} (${kol.channelId})...`);
      const videos = await fetchChannelVideos(kol.channelId);

      // 过滤目标日期的视频
      const todayVideos = videos.filter(v => {
        if (!v.published) return true;
        return v.published.startsWith(date);
      });

      for (const v of todayVideos) {
        console.log(`[youtube]   提取字幕: ${v.title}`);
        const transcript = await fetchTranscript(v.videoId);

        allVideos.push({
          kolId: kol.kolId,
          kolName: kol.kolName,
          channelId: kol.channelId,
          videoId: v.videoId,
          title: v.title,
          publishedAt: v.published,
          url: `https://www.youtube.com/watch?v=${v.videoId}`,
          transcript,
        });
      }

      console.log(`[youtube]   ${kol.kolName}: ${todayVideos.length} 个新视频`);
    } catch (err) {
      console.error(`[youtube]   ${kol.kolName} 采集失败:`, (err as Error).message);
    }
  }

  console.log(`[youtube] 共采集 ${allVideos.length} 个视频`);
  await writeDailyData(date, 'youtube', allVideos);
}
