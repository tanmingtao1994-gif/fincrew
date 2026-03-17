import { stockRichAdapter } from '../../utils/stockRichAdapter';
import { MarketAnalysis } from '../../types/domain';
import { withErrorHandling, ErrorCode } from '../../utils/error';
import { randomUUID } from 'crypto';

// Note: stockRichAdapter.getMacroSnapshot() was defined in original adapter but removed in refactor.
// We need to either re-add it or use other data sources.
// For now, let's implement basic analysis based on what we have (Stock Data)
// Or we can assume getMacroSnapshot exists if we re-implement it in adapter.
// The refactor removed getMacroSnapshot from stockRichAdapter.ts because it wasn't in the new flattened stock_rich structure's index.ts exports clearly.
// But we can import it directly from src/stock_rich/utils/yahoo.ts if we want.

export interface AnalyzeMarketInput {
  indices?: string[]; // e.g. ['^GSPC', '^IXIC']
  timeframe?: string; // e.g. '1d'
  date?: string;
}

export async function analyzeMarket(input: AnalyzeMarketInput): Promise<MarketAnalysis> {
  return withErrorHandling(async () => {
    // Dynamically import from stock_rich utils to get macro data
    const { getMacroSnapshot } = await import('../../stock_rich/utils/yahoo.js');
    const snapshot = await getMacroSnapshot();
    
    // 2. Map to MarketAnalysis
    let sentimentScore = 0;
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    
    if (snapshot) {
        // VIX Logic
        if (snapshot.vix) {
            if (snapshot.vix > 30) {
                sentimentScore -= 0.5; // High fear
            } else if (snapshot.vix < 15) {
                sentimentScore += 0.3; // Low fear
            }
        }
        
        // Yield Logic
        if (snapshot.tenYearYield) {
            if (snapshot.tenYearYield > 4.5) { // 4.5%
                sentimentScore -= 0.3; // High yield bad for stocks
            }
        }
    }
    
    // Determine overall sentiment
    if (sentimentScore > 0.3) sentiment = 'bullish';
    else if (sentimentScore < -0.3) sentiment = 'bearish';
    else sentiment = 'neutral';

    const analysis: MarketAnalysis = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        sentiment: {
            overall: sentiment,
            score: sentimentScore,
            factors: {
                news: 0, // Placeholder
                social: 0, // Placeholder
                technical: 0 // Placeholder
            }
        },
        sectors: {}, // Need sector data (not available in MacroSnapshot)
        hotTopics: [],
        hotStocks: [],
        riskLevel: snapshot?.vix && snapshot.vix > 20 ? 'high' : 'medium',
        riskFactors: []
    };
    
    if (snapshot?.vix && snapshot.vix > 25) {
        analysis.riskFactors.push(`High VIX: ${snapshot.vix}`);
    }
    if (snapshot?.tenYearYield && snapshot.tenYearYield > 5) { // 5%
        analysis.riskFactors.push(`High 10Y Yield: ${(snapshot.tenYearYield).toFixed(2)}%`);
    }

    return analysis;
  }, 'analyzeMarket', ErrorCode.EXTERNAL_API_ERROR);
}
