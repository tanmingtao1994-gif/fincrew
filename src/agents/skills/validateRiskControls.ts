import { TradingPlan, UserPreference } from '../../types/domain';
import { withErrorHandling } from '../../utils/error';

interface ValidateRiskControlsInput {
  plan: TradingPlan;
  riskProfile: UserPreference['riskTolerance'];
}

export async function validateRiskControls(input: ValidateRiskControlsInput): Promise<{ valid: boolean; suggestions: string[] }> {
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

    return { valid, suggestions };
  }, 'validateRiskControls');
}
