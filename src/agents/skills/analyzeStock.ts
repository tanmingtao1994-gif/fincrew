import { stockRichAdapter } from '../../utils/stockRichAdapter';
import { StockAnalysis } from '../../types/domain';
import { withErrorHandling, ErrorCode, ToolError } from '../../utils/error';
import { readDailyData } from '../../stock_rich/utils/cache';
import { randomUUID } from 'crypto';

export interface AnalyzeStockInput {
  ticker: string;
  date?: string;
}

export interface AnalyzeStockOutput {
    analysis: StockAnalysis;
    data: any; // Raw stock_rich data
}

/**
 * Skill to analyze a stock based on fundamental and technical data.
 */
export async function analyzeStock(input: AnalyzeStockInput): Promise<AnalyzeStockOutput> {
  return withErrorHandling(async () => {
    const { ticker, date } = input;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // 1. Get Market Data (Fundamentals + Technicals)
    // First try to read existing data
    let marketData = null;
    const rawData = await readDailyData<Record<string, any>>(targetDate, 'stockdata');
    
    if (rawData && rawData[ticker]) {
        marketData = rawData[ticker];
    } else {
        // Trigger fetch if missing
        await stockRichAdapter.getData([ticker], targetDate);
        const newData = await readDailyData<Record<string, any>>(targetDate, 'stockdata');
        if (newData && newData[ticker]) {
            marketData = newData[ticker];
        }
    }
    
    if (!marketData) {
        throw new ToolError(`Failed to get market data for ${ticker}`, ErrorCode.NOT_FOUND);
    }

    // 2. Get Options Data (if needed/available, maybe try ATM or max pain)
    // analyzeOptions requires expiry. 
    // We can skip deep option analysis here or do a basic one if we can guess expiry.
    // StockRich technical analysis already includes optionsMaxPain if available.
    
    // 3. Construct StockAnalysis
    const tech = marketData.technical;
    const fund = marketData.fundamentals;
    
    const analysis: StockAnalysis = {
        ticker,
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        conclusion: 'watch', // Default
        confidence: 0.5,
        assessment: {
            fundamental: {
                score: 0.5, // Logic needed
                keyPoints: []
            },
            technical: {
                score: 0.5, // Logic needed
                keyPoints: []
            },
            sentiment: {
                score: 0.5, // Placeholder
                keyPoints: []
            }
        },
        risk: {
            level: 'medium',
            factors: [],
            stopLoss: tech?.priceLevels?.support1 ?? 0
        },
        recommendation: {
            action: 'watch',
            entryPrice: tech?.timeframes?.daily?.close ?? 0,
            targetPrice: tech?.priceLevels?.targetPrice ?? 0,
            timeHorizon: '1 month',
            positionSize: 0
        },
        rationale: 'Generated from stock_rich data',
        sources: ['stock_rich']
    };
    
    // Basic Scoring Logic
    if (fund) {
        if (fund.recommendationKey === 'buy' || fund.recommendationKey === 'strong_buy') {
            analysis.assessment.fundamental.score += 0.2;
            analysis.assessment.fundamental.keyPoints.push(`Analyst rating: ${fund.recommendationKey}`);
        }
        if (fund.revenueGrowth && fund.revenueGrowth > 0.2) {
            analysis.assessment.fundamental.score += 0.1;
            analysis.assessment.fundamental.keyPoints.push(`High revenue growth: ${(fund.revenueGrowth * 100).toFixed(1)}%`);
        }
    }
    
    if (tech && tech.timeframes && tech.timeframes.daily) {
        const daily = tech.timeframes.daily;
        if (daily.rsi && daily.rsi < 30) {
            analysis.assessment.technical.score += 0.2; // Oversold
            analysis.assessment.technical.keyPoints.push(`RSI Oversold: ${daily.rsi.toFixed(1)}`);
        }
        if (daily.macdCross === 'golden') {
            analysis.assessment.technical.score += 0.2;
            analysis.assessment.technical.keyPoints.push('MACD Golden Cross');
        }
        if (daily.bbSqueeze) {
            analysis.assessment.technical.keyPoints.push('Bollinger Band Squeeze detected');
        }
        
        // Wyckoff
        if (tech.wyckoff && (tech.wyckoff.phase === 'accumulation' || tech.wyckoff.phase === 'markup')) {
             analysis.assessment.technical.score += 0.2;
             analysis.assessment.technical.keyPoints.push(`Wyckoff Phase: ${tech.wyckoff.phase}`);
        }
    }
    
    // Final Conclusion
    const totalScore = (analysis.assessment.fundamental.score + analysis.assessment.technical.score) / 2;
    if (totalScore > 0.7) {
        analysis.conclusion = 'buy';
        analysis.recommendation.action = 'buy';
    } else if (totalScore < 0.3) {
        analysis.conclusion = 'sell';
        analysis.recommendation.action = 'sell';
    }

    return {
        analysis,
        data: marketData
    };
  }, 'analyzeStock', ErrorCode.EXTERNAL_API_ERROR);
}
