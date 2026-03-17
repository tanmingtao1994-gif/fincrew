/**
 * 简易文件缓存 — 按路径存取 JSON 数据
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { extname, basename, dirname, join, resolve } from 'path';

// Refactored to use process.cwd() instead of import.meta.url for flattened structure
const PROJECT_ROOT = resolve(process.cwd());

/** 缓存根目录 */
export const CACHE_DIR = join(PROJECT_ROOT, 'data', 'cache');
export const DAILY_DIR = join(PROJECT_ROOT, 'data', 'daily');
export const OUTPUT_DIR = join(PROJECT_ROOT, 'src', 'stock_rich', 'output'); // Keep output in stock_rich for now or move to root? Plan said data/config moved. Let's assume output stays or goes to root output. Let's use root output for consistency.
// Actually, looking at original structure, output was in src/stock_rich/output. Let's move it to root/output to be consistent with data/config.
// However, the original code had: const ROOT = new URL('../../', import.meta.url).pathname; which pointed to src/stock_rich/
// So data/cache was src/stock_rich/data/cache.
// Now data/cache is root/data/cache.
// Correct.

/** 若文件已存在，返回带 _HHMMSS 后缀的新路径，否则返回原路径 */
function safeFilename(fullPath: string): string {
  if (!existsSync(fullPath)) return fullPath;
  const ext = extname(fullPath);
  const base = basename(fullPath, ext);
  const dir = dirname(fullPath);
  const now = new Date();
  const ts = [
    now.getHours().toString().padStart(2, '0'),
    now.getMinutes().toString().padStart(2, '0'),
    now.getSeconds().toString().padStart(2, '0'),
  ].join('');
  return join(dir, `${base}_${ts}${ext}`);
}

/** 确保目录存在 */
async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/** 读取 JSON 缓存，不存在返回 null */
export async function readCache<T>(relativePath: string): Promise<T | null> {
  const fullPath = join(CACHE_DIR, relativePath);
  try {
    const raw = await readFile(fullPath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 写入 JSON 缓存 */
export async function writeCache(relativePath: string, data: unknown): Promise<void> {
  const fullPath = join(CACHE_DIR, relativePath);
  await ensureDir(dirname(fullPath));
  await writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
}

/** 读取每日采集数据 */
export async function readDailyData<T>(date: string, platform: string): Promise<T | null> {
  const fullPath = join(DAILY_DIR, date, `${platform}.json`);
  try {
    const raw = await readFile(fullPath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 写入每日采集数据。overwrite=false（默认）时若文件已存在则加时间戳后缀，不覆盖原文件 */
export async function writeDailyData(date: string, platform: string, data: unknown, overwrite = false): Promise<void> {
  const dir = join(DAILY_DIR, date);
  await ensureDir(dir);
  const rawPath = join(dir, `${platform}.json`);
  const finalPath = overwrite ? rawPath : safeFilename(rawPath);
  await writeFile(finalPath, JSON.stringify(data, null, 2), 'utf-8');
}

/** 写入输出文件。若文件已存在则加时间戳后缀，不覆盖原文件 */
export async function writeOutput(filename: string, content: string): Promise<void> {
  await ensureDir(OUTPUT_DIR);
  const rawPath = join(OUTPUT_DIR, filename);
  const finalPath = safeFilename(rawPath);
  await writeFile(finalPath, content, 'utf-8');
}

/** 检查缓存是否过期 (基于文件修改时间) */
export async function isCacheStale(relativePath: string, maxAgeMs: number): Promise<boolean> {
  const fullPath = join(CACHE_DIR, relativePath);
  try {
    const { mtimeMs } = await import('fs').then(fs =>
      fs.promises.stat(fullPath)
    );
    return Date.now() - mtimeMs > maxAgeMs;
  } catch {
    return true; // 文件不存在视为过期
  }
}
