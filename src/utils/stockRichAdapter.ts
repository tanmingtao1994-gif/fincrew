import { ToolError, ErrorCode, withErrorHandling } from './error';

// Import functions directly from stock_rich modules
// Note: We're using dynamic imports in methods to ensure all env vars and configs are loaded
// However, since we are in the same process, we can just import.
// But some stock_rich modules might rely on top-level await or side effects.
// Let's assume standard exports.

export class StockRichAdapter {
  
  /**
   * Collect KOL data (Twitter, Weibo, YouTube)
   */
  async collect(date?: string, platform?: string): Promise<void> {
    return withErrorHandling(async () => {
      // Dynamic import to load fresh config if needed
      const { runCollect } = await import('../stock_rich/index.js');
      // Note: runCollect is not exported in original index.ts, we need to modify src/stock_rich/index.ts to export runner functions
      // Or we can invoke the specific collectors directly if runCollect isn't exported.
      // Let's modify src/stock_rich/index.ts first to export these functions.
      // Wait, I cannot modify index.ts in this step easily without reading it again.
      // But looking at previous `Read` of index.ts, it had `runCollect`, `runData` etc defined but not exported.
      // I should have updated index.ts to export them.
      
      // Let's assume I will update index.ts to export these functions or I can import the underlying functions directly.
      // runCollect calls collectTwitter, collectWeibo, collectYouTube. I can call them directly.
      
      const platforms = platform ? [platform] : ['twitter', 'weibo', 'youtube'];
      const targetDate = date || new Date().toISOString().split('T')[0];

      for (const p of platforms) {
        switch (p) {
          case 'twitter': {
            const { collectTwitter } = await import('../stock_rich/collectors/twitter.js');
            await collectTwitter(targetDate);
            break;
          }
          case 'weibo': {
            const { collectWeibo } = await import('../stock_rich/collectors/weibo.js');
            await collectWeibo(targetDate);
            break;
          }
          case 'youtube': {
            const { collectYouTube } = await import('../stock_rich/collectors/youtube.js');
            await collectYouTube(targetDate);
            break;
          }
          default:
            console.warn(`[StockRichAdapter] Unknown platform: ${p}`);
        }
      }
    }, 'StockRichAdapter.collect');
  }

  /**
   * Get fundamental and technical data for symbols
   */
  async getData(symbols: string[], date?: string): Promise<void> {
    return withErrorHandling(async () => {
      if (!symbols || symbols.length === 0) {
        throw new ToolError('Symbols are required for getData', ErrorCode.INVALID_INPUT);
      }
      
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // Direct call to analysis logic
      // We need to implement logic similar to runData in index.ts
      // Import necessary functions
      const { readDailyData, writeDailyData } = await import('../stock_rich/utils/cache.js');
      const { batchFundamentals } = await import('../stock_rich/analysis/fundamental.js');
      const { analyzeTechnical } = await import('../stock_rich/analysis/technical.js');
      const { getOptionsMaxPain } = await import('../stock_rich/utils/yahoo.js');

      // Check existing
      const existing = await readDailyData<Record<string, any>>(targetDate, 'stockdata');
      const needFetch: string[] = [];
      const result: Record<string, any> = existing ?? {};

      for (const s of symbols) {
        if (existing && existing[s]) {
          // Already exists
        } else {
          needFetch.push(s);
        }
      }

      if (needFetch.length === 0) return;

      const fundMap = await batchFundamentals(needFetch);

      for (const symbol of needFetch) {
        const fund = fundMap.get(symbol) ?? null;
        let tech = null;
        try {
          tech = await analyzeTechnical(symbol, fund);
        } catch (err) {
          console.error(`[StockRichAdapter] ${symbol} Technical analysis failed:`, err);
        }

        if (tech) {
          try {
            tech.optionsMaxPain = await getOptionsMaxPain(symbol);
          } catch { /* ignore */ }
        }

        result[symbol] = { fundamentals: fund, technical: tech };
      }

      await writeDailyData(targetDate, 'stockdata', result, true);

    }, 'StockRichAdapter.getData');
  }

  /**
   * Get news for symbols
   */
  async getNews(symbols: string[], date?: string): Promise<void> {
    return withErrorHandling(async () => {
       if (!symbols || symbols.length === 0) {
        throw new ToolError('Symbols are required for getNews', ErrorCode.INVALID_INPUT);
      }
      const targetDate = date || new Date().toISOString().split('T')[0];
      const { collectNews } = await import('../stock_rich/collectors/news.js');
      await collectNews(targetDate, symbols);
    }, 'StockRichAdapter.getNews');
  }

  /**
   * Analyze options
   */
  async getOptions(symbol: string, expiry: string, direction: 'call' | 'put', date?: string): Promise<void> {
    return withErrorHandling(async () => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const { analyzeOptions } = await import('../stock_rich/analysis/options.js');
      const { writeDailyData } = await import('../stock_rich/utils/cache.js');
      
      const result = await analyzeOptions(symbol, expiry, direction);
      const filename = `options-${symbol}-${expiry}`;
      await writeDailyData(targetDate, filename, result);
    }, 'StockRichAdapter.getOptions');
  }
}

export const stockRichAdapter = new StockRichAdapter();
