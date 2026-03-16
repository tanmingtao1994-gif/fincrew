import { stockRichAdapter } from '../../utils/stockRichAdapter';
import { MarketAnalysis } from '../../types/domain';
import { withErrorHandling } from '../../utils/error';
import { randomUUID } from 'crypto';

interface AnalyzeMarketInput {
  indices?: string[]; // e.g. ['^GSPC', '^IXIC']
  timeframe?: string; // e.g. '1d'
}

export async function analyzeMarket(input: AnalyzeMarketInput): Promise<MarketAnalysis> {
  return withErrorHandling(async () => {
    // 1. Get Macro Snapshot (VIX, 10Y Yield)
    const snapshot = await stockRichAdapter.getMacroSnapshot();
    
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
            if (snapshot.tenYearYield > 0.045) {
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
    if (snapshot?.tenYearYield && snapshot.tenYearYield > 0.05) {
        analysis.riskFactors.push(`High 10Y Yield: ${(snapshot.tenYearYield * 100).toFixed(2)}%`);
    }

    return analysis;
  }, 'analyzeMarket');
}
