import { batchFundamentals } from '../stock_rich/src/analysis/fundamental.js';
import { analyzeTechnical, FullTechnicalAnalysis } from '../stock_rich/src/analysis/technical.js';
import { collectNews, NewsResult } from '../stock_rich/src/collectors/news.js';
import { getOptionsMaxPain, FundamentalData, getMacroSnapshot, MacroSnapshot } from '../stock_rich/src/utils/yahoo.js';
import { withErrorHandling } from './error';
import path from 'path';
import fs from 'fs';

const STOCK_RICH_DAILY_DIR = path.resolve(process.cwd(), 'src/stock_rich/data/daily');

export interface MarketDataResult {
  fundamentals: FundamentalData | null;
  technical: FullTechnicalAnalysis | null;
}

export class StockRichAdapter {
  /**
   * Fetch market data (fundamentals + technicals) for given symbols.
   */
  async getMarketData(symbols: string[]): Promise<Map<string, MarketDataResult>> {
    return withErrorHandling(async () => {
      const results = new Map<string, MarketDataResult>();
      
      console.log(`[StockRichAdapter] Fetching market data for ${symbols.join(', ')}`);
      
      // 1. Fundamentals
      const fundMap = await batchFundamentals(symbols);

      // 2. Technicals
      for (const symbol of symbols) {
        const fund = fundMap.get(symbol) ?? null;
        let tech: FullTechnicalAnalysis | null = null;
        try {
          tech = await analyzeTechnical(symbol, fund);
          if (tech) {
            try {
              tech.optionsMaxPain = await getOptionsMaxPain(symbol);
            } catch (e) {
               console.warn(`Failed to get options max pain for ${symbol}: ${e}`);
            }
          }
        } catch (error) {
          console.error(`Technical analysis failed for ${symbol}:`, error);
        }

        results.set(symbol, {
          fundamentals: fund,
          technical: tech
        });
      }

      return results;
    }, 'getMarketData');
  }

  /**
   * Trigger news collection for a symbol.
   */
  async collectNews(symbol: string): Promise<void> {
    return withErrorHandling(async () => {
      const date = new Date().toISOString().split('T')[0];
      console.log(`[StockRichAdapter] Collecting news for ${symbol} on ${date}`);
      await collectNews(date, [symbol]);
    }, 'collectNews');
  }

  /**
   * Read collected news from stock_rich storage.
   */
  async getNews(symbol: string, date?: string): Promise<NewsResult | null> {
    return withErrorHandling(async () => {
       const d = date || new Date().toISOString().split('T')[0];
       const filename = `news-${symbol}.json`;
       const filePath = path.join(STOCK_RICH_DAILY_DIR, d, filename);
       
       if (!fs.existsSync(filePath)) {
           return null;
       }
       
       const content = fs.readFileSync(filePath, 'utf-8');
       return JSON.parse(content) as NewsResult;
    }, 'getNews');
  }

  /**
   * Trigger social media collection (Twitter, Weibo, YouTube).
   */
  async collectSocial(platforms: string[] = ['twitter', 'weibo', 'youtube']): Promise<void> {
    return withErrorHandling(async () => {
        const date = new Date().toISOString().split('T')[0];
        
        for (const p of platforms) {
            console.log(`[StockRichAdapter] Collecting ${p} data for ${date}`);
            switch (p) {
                case 'twitter':
                    await import('../stock_rich/src/collectors/twitter.js').then(m => m.collectTwitter(date));
                    break;
                case 'weibo':
                    await import('../stock_rich/src/collectors/weibo.js').then(m => m.collectWeibo(date));
                    break;
                case 'youtube':
                    await import('../stock_rich/src/collectors/youtube.js').then(m => m.collectYouTube(date));
                    break;
            }
        }
    }, 'collectSocial');
  }

  /**
   * Read collected social posts.
   */
  async getSocialPosts(date?: string, platforms: string[] = ['twitter', 'weibo', 'youtube']): Promise<any[]> {
      return withErrorHandling(async () => {
        const d = date || new Date().toISOString().split('T')[0];
        const posts: any[] = [];
        
        for (const p of platforms) {
            const filename = `${p}.json`;
            const filePath = path.join(STOCK_RICH_DAILY_DIR, d, filename);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const data = JSON.parse(content);
                if (Array.isArray(data)) {
                    posts.push(...data.map(item => ({ ...item, platform: p })));
                }
            }
        }
        return posts;
      }, 'getSocialPosts');
  }
  /**
   * Get macro market snapshot.
   */
  async getMacroSnapshot(): Promise<MacroSnapshot | null> {
    return withErrorHandling(async () => {
      console.log('[StockRichAdapter] Fetching macro snapshot...');
      return await getMacroSnapshot();
    }, 'getMacroSnapshot');
  }
}

export const stockRichAdapter = new StockRichAdapter();
