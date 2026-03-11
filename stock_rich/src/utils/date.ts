/**
 * 日期工具函数
 */

/** 获取今日日期字符串 YYYY-MM-DD */
export function today(): string {
  return formatDate(new Date());
}

/** Date → YYYY-MM-DD */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** YYYY-MM-DD → Date */
export function parseDate(str: string): Date {
  return new Date(str + 'T00:00:00');
}

/** N 天前的日期字符串 */
export function daysAgo(n: number, from?: Date): string {
  const d = from ? new Date(from) : new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

/** 获取 Unix 时间戳 (秒) */
export function toUnix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}
