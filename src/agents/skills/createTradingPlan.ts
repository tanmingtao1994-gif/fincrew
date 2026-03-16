import { StockAnalysis, TradingPlan } from '../../types/domain';
import { withErrorHandling } from '../../utils/error';
import { randomUUID } from 'crypto';

interface CreateTradingPlanInput {
  ticker: string;
  analysis: StockAnalysis;
  capital: number; // Available capital
}

export async function createTradingPlan(input: CreateTradingPlanInput): Promise<TradingPlan> {
  return withErrorHandling(async () => {
    const { ticker, analysis, capital } = input;
    
    // Determine action based on analysis
    const action = analysis.recommendation.action === 'buy' ? 'buy' : 
                   analysis.recommendation.action === 'sell' ? 'sell' : 'day_trade';
    
    // Determine quantity based on position size
    // Assuming positionSize is percentage (0-100)
    const positionValue = capital * (analysis.recommendation.positionSize / 100);
    const price = analysis.recommendation.entryPrice;
    const quantity = price > 0 ? Math.floor(positionValue / price) : 0;

    const plan: TradingPlan = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        ticker,
        action: action === 'day_trade' ? 'day_trade' : action as 'buy' | 'sell', // Map types
        execution: {
            orderType: 'limit',
            price: analysis.recommendation.entryPrice,
            quantity: quantity,
            timing: 'conditional',
            condition: 'Price reaches entry level'
        },
        riskControls: {
            stopLoss: analysis.risk.stopLoss,
            takeProfit: analysis.recommendation.targetPrice,
            maxLoss: (analysis.recommendation.entryPrice - analysis.risk.stopLoss) * quantity,
            positionSize: analysis.recommendation.positionSize
        },
        reasoning: analysis.rationale,
        analysisId: analysis.id,
        memoryIds: [],
        status: 'pending',
        statusHistory: [{
            status: 'pending',
            timestamp: new Date().toISOString(),
            reason: 'Plan created'
        }]
    };

    return plan;
  }, 'createTradingPlan');
}
