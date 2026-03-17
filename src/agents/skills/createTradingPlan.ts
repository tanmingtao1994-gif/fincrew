import { StockAnalysis, TradingPlan } from '../../types/domain';
import { withErrorHandling, ErrorCode } from '../../utils/error';
import { dailyStorage } from '../../utils/dailyStorage';
import { randomUUID } from 'crypto';

export interface CreateTradingPlanInput {
  ticker: string;
  analysis: StockAnalysis;
  capital: number; // Available capital to allocate for this trade
}

/**
 * Skill to create a detailed trading plan based on analysis and capital.
 */
export async function createTradingPlan(input: CreateTradingPlanInput): Promise<TradingPlan> {
  return withErrorHandling(async () => {
    const { ticker, analysis, capital } = input;
    
    // Determine action based on analysis
    // Default to 'day_trade' if action isn't strictly buy/sell, though domain types constrain it
    const action = analysis.recommendation.action === 'buy' ? 'buy' : 
                   analysis.recommendation.action === 'sell' ? 'sell' : 'day_trade';
    
    // Determine quantity based on position size
    // Assuming positionSize is percentage (0-100)
    // If positionSize is 0, we might use a default or fail
    const targetPositionSize = analysis.recommendation.positionSize > 0 ? analysis.recommendation.positionSize : 5; // Default 5%
    const positionValue = capital * (targetPositionSize / 100);
    const price = analysis.recommendation.entryPrice;
    
    const quantity = price > 0 ? Math.floor(positionValue / price) : 0;

    const plan: TradingPlan = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        ticker,
        action: action as 'buy' | 'sell' | 'day_trade',
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
            maxLoss: (Math.abs(analysis.recommendation.entryPrice - analysis.risk.stopLoss)) * quantity,
            positionSize: targetPositionSize
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
    
    // Save plan to daily storage for persistence/review
    const dateStr = new Date().toISOString().split('T')[0];
    dailyStorage.saveData(`plan-${ticker}-${plan.id}.json`, plan, dateStr);

    return plan;
  }, 'createTradingPlan', ErrorCode.EXTERNAL_API_ERROR);
}
