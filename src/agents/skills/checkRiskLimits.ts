import { TradingPlan, UserPortfolio } from '../../types/domain';
import { withErrorHandling } from '../../utils/error';

interface CheckRiskLimitsInput {
  plan: TradingPlan;
  portfolio: UserPortfolio;
}

export async function checkRiskLimits(input: CheckRiskLimitsInput): Promise<{ passed: boolean; reason?: string }> {
  return withErrorHandling(async () => {
    const { plan, portfolio } = input;
    
    // Check if we have enough cash
    const estimatedCost = (plan.execution.price || 0) * plan.execution.quantity;
    if (plan.action === 'buy' && estimatedCost > portfolio.summary.cashBalance) {
        return { passed: false, reason: `Insufficient cash. Required: ${estimatedCost}, Available: ${portfolio.summary.cashBalance}` };
    }

    return { passed: true };
  }, 'checkRiskLimits');
}
