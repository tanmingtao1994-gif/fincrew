import { TradingPlan, TradeRecord } from '../../types/domain';
import { withErrorHandling } from '../../utils/error';
import { randomUUID } from 'crypto';
import { dailyStorage } from '../../utils/dailyStorage';

interface ExecuteTradeInput {
  plan: TradingPlan;
  dryRun?: boolean;
}

export async function executeTrade(input: ExecuteTradeInput): Promise<TradeRecord> {
  return withErrorHandling(async () => {
    const { plan, dryRun = true } = input;
    
    console.log(`[ExecuteTrade] Executing ${plan.action} ${plan.execution.quantity} ${plan.ticker} (DryRun: ${dryRun})`);
    
    // Simulate execution
    const executionPrice = plan.execution.price || 100;
    const commission = 1.0; 
    
    const record: TradeRecord = {
        id: randomUUID(),
        tradingPlanId: plan.id,
        ticker: plan.ticker,
        action: plan.action as any,
        quantity: plan.execution.quantity,
        price: executionPrice,
        execution: {
            orderId: `ord-${randomUUID().slice(0, 8)}`,
            timestamp: new Date().toISOString(),
            status: 'filled',
            filledQuantity: plan.execution.quantity,
            averagePrice: executionPrice,
            commission
        },
        financials: {
            totalCost: executionPrice * plan.execution.quantity + commission,
            currentValue: executionPrice * plan.execution.quantity,
            profitLoss: -commission,
            profitLossPercent: 0
        },
        notes: dryRun ? 'Dry Run' : 'Real Trade',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Save record
    const filename = `trade-${record.id}.json`;
    dailyStorage.saveData(filename, record);
    
    return record;
  }, 'executeTrade');
}
