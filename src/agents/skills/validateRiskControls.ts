import { TradingPlan, UserPreference } from '../../types/domain';
import { withErrorHandling, ErrorCode } from '../../utils/error';

export interface ValidateRiskControlsInput {
  plan: TradingPlan;
  riskProfile: UserPreference['riskTolerance'];
}

export interface ValidateRiskControlsOutput {
    valid: boolean;
    suggestions: string[];
}

/**
 * Skill to validate if a trading plan meets risk control parameters.
 */
export async function validateRiskControls(input: ValidateRiskControlsInput): Promise<ValidateRiskControlsOutput> {
  return withErrorHandling(async () => {
    const { plan, riskProfile } = input;
    const suggestions: string[] = [];
    let valid = true;

    // Check Position Size
    if (plan.riskControls.positionSize > riskProfile.maxPositionSize) {
        valid = false;
        suggestions.push(`Position size ${plan.riskControls.positionSize}% exceeds max allowed ${riskProfile.maxPositionSize}%`);
    }

    // Check Stop Loss
    if (plan.riskControls.stopLoss <= 0) {
        valid = false;
        suggestions.push('Stop loss must be greater than 0');
    }
    
    // Check if Stop Loss is below entry for buy (or above for sell)
    // Assuming 'buy' for now, or check action
    const entryPrice = plan.execution.price || 0; // Assuming limit price or current
    if (entryPrice > 0) {
        if (plan.action === 'buy' && plan.riskControls.stopLoss >= entryPrice) {
             valid = false;
             suggestions.push('Stop loss must be below entry price for long positions');
        } else if (plan.action === 'sell' && plan.riskControls.stopLoss <= entryPrice) {
             valid = false;
             suggestions.push('Stop loss must be above entry price for short positions');
        }
    }

    return { valid, suggestions };
  }, 'validateRiskControls', ErrorCode.RISK_CONTROL_ERROR); // Using VALIDATION_ERROR or RISK_CONTROL_ERROR
}
