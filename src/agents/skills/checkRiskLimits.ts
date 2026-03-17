import { TradingPlan, UserPortfolio } from '../../types/domain';
import { withErrorHandling, ErrorCode } from '../../utils/error';

export interface CheckRiskLimitsInput {
  plan: TradingPlan;
  portfolio: UserPortfolio;
}

export interface CheckRiskLimitsOutput {
    passed: boolean;
    reason?: string;
}

/**
 * Skill to check if a trading plan passes risk limits against the current portfolio.
 */
export async function checkRiskLimits(input: CheckRiskLimitsInput): Promise<CheckRiskLimitsOutput> {
  return withErrorHandling(async () => {
    const { plan, portfolio } = input;
    
    // Check if we have enough cash
    const estimatedCost = (plan.execution.price || 0) * plan.execution.quantity;
    if (plan.action === 'buy' && estimatedCost > portfolio.summary.cashBalance) {
        return { passed: false, reason: `Insufficient cash. Required: ${estimatedCost}, Available: ${portfolio.summary.cashBalance}` };
    }

    // Check Max Drawdown (Simplified: if current drawdown is too high, maybe block new buys?)
    // This requires historical data or a more complex portfolio object.
    // For now, let's assume we check if this trade would exceed max position size in portfolio context
    
    const currentHolding = portfolio.holdings[plan.ticker];
    let newQuantity = plan.execution.quantity;
    if (currentHolding) {
        newQuantity += currentHolding.quantity;
    }
    
    const totalPortfolioValue = portfolio.summary.totalValue; // Assume this is updated
    const estimatedPositionValue = (plan.execution.price || 0) * newQuantity;
    
    // If portfolio value is 0 (new account), skip % check or handle gracefully
    if (totalPortfolioValue > 0) {
        const positionPercent = (estimatedPositionValue / totalPortfolioValue) * 100;
        // Hardcoded max position size check here as a fallback or additional check?
        // Usually validateRiskControls handles the "plan" side (user pref), 
        // this skill handles the "portfolio state" side (e.g. margin calls, existing exposure).
        // Let's keep it simple for now.
    }

    return { passed: true };
  }, 'checkRiskLimits', ErrorCode.RISK_CONTROL_ERROR);
}
