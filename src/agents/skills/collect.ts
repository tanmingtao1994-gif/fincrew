import { stockRichAdapter } from '../../utils/stockRichAdapter';
import { withErrorHandling } from '../../utils/error';

interface CollectInput {
  tickers: string[];
  sources?: string[]; // e.g., ['market', 'news']
}

export async function collect(input: CollectInput): Promise<{ marketData: boolean; news: boolean }> {
  return withErrorHandling(async () => {
    const { tickers, sources = ['market', 'news'] } = input;
    const results = { marketData: false, news: false };

    if (sources.includes('market')) {
      await stockRichAdapter.getMarketData(tickers);
      results.marketData = true;
    }

    if (sources.includes('news')) {
      // Parallelize news collection
      await Promise.all(tickers.map(ticker => stockRichAdapter.collectNews(ticker)));
      results.news = true;
    }

    return results;
  }, 'collect');
}
