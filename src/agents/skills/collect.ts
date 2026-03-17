import { stockRichAdapter } from '../../utils/stockRichAdapter';
import { withErrorHandling, ErrorCode } from '../../utils/error';

export interface CollectInput {
  tickers: string[];
  sources?: ('market' | 'news' | 'social')[];
  date?: string;
}

export interface CollectOutput {
  success: boolean;
  message: string;
  details: {
    marketData?: boolean;
    news?: boolean;
    social?: boolean;
  };
}

/**
 * Skill to collect market data, news, and social info.
 */
export async function collect(input: CollectInput): Promise<CollectOutput> {
  return withErrorHandling(async () => {
    const { tickers, date } = input;
    const sources = input.sources || ['market', 'news', 'social'];
    const details: CollectOutput['details'] = {};

    // 1. Market Data (Fundamentals + Technicals)
    if (sources.includes('market')) {
      await stockRichAdapter.getData(tickers, date);
      details.marketData = true;
    }

    // 2. News
    if (sources.includes('news')) {
      await stockRichAdapter.getNews(tickers, date);
      details.news = true;
    }
    
    // 3. Social
    if (sources.includes('social')) {
      await stockRichAdapter.collect(date); // collect command gathers all social platforms
      details.social = true;
    }

    return {
        success: true,
        message: `Collected data for ${tickers.join(', ')}`,
        details
    };
  }, 'collect', ErrorCode.EXTERNAL_API_ERROR);
}
