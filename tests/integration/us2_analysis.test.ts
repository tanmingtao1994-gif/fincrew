import { analyzeMarket } from '../../src/agents/skills/analyzeMarket';
import { analyzeStock } from '../../src/agents/skills/analyzeStock';
import { createTradingPlan } from '../../src/agents/skills/createTradingPlan';
import { validateRiskControls } from '../../src/agents/skills/validateRiskControls';
import { checkRiskLimits } from '../../src/agents/skills/checkRiskLimits';
import { UserPortfolio, UserPreference } from '../../src/types/domain';

async function runTest() {
  console.log('Running US2 Analysis Integration Test...');

  // 1. Analyze Market
  console.log('\nTesting analyzeMarket...');
  try {
    const market = await analyzeMarket({ timeframe: '1d' });
    console.log('Market Analysis:', { 
        sentiment: market.sentiment.overall,
        score: market.sentiment.score,
        riskLevel: market.riskLevel
    });
  } catch (error) {
    console.error('FAIL: analyzeMarket', error);
  }

  // 2. Analyze Stock
  console.log('\nTesting analyzeStock (AAPL)...');
  let analysisResult;
  try {
    const result = await analyzeStock({ ticker: 'AAPL' });
    analysisResult = result.analysis;
    console.log('Stock Analysis:', {
        conclusion: result.analysis.conclusion,
        action: result.analysis.recommendation.action,
        price: result.analysis.recommendation.entryPrice
    });
  } catch (error) {
    console.error('FAIL: analyzeStock', error);
  }

  if (analysisResult) {
      // 3. Create Trading Plan
      console.log('\nTesting createTradingPlan...');
      let plan;
      try {
        plan = await createTradingPlan({
            ticker: 'AAPL',
            analysis: analysisResult,
            capital: 10000
        });
        console.log('Trading Plan:', {
            action: plan.action,
            quantity: plan.execution.quantity,
            maxLoss: plan.riskControls.maxLoss
        });
      } catch (error) {
        console.error('FAIL: createTradingPlan', error);
      }

      if (plan) {
          // 4. Validate Risk Controls
          console.log('\nTesting validateRiskControls...');
          const riskProfile: UserPreference['riskTolerance'] = {
              level: 'moderate',
              maxDrawdown: 20,
              maxPositionSize: 10 // 10%
          };
          try {
            const validation = await validateRiskControls({ plan, riskProfile });
            console.log('Risk Validation:', validation);
          } catch (error) {
            console.error('FAIL: validateRiskControls', error);
          }

          // 5. Check Risk Limits
          console.log('\nTesting checkRiskLimits...');
          const portfolio: UserPortfolio = {
              userId: 'test',
              timestamp: new Date().toISOString(),
              holdings: {},
              summary: {
                  totalValue: 100000,
                  totalCost: 0,
                  totalProfitLoss: 0,
                  totalProfitLossPercent: 0,
                  cashBalance: 100000
              },
              riskMetrics: { portfolioBeta: 1, portfolioVolatility: 0, maxDrawdown: 0, sharpeRatio: 0 }
          };
          try {
            const limitCheck = await checkRiskLimits({ plan, portfolio });
            console.log('Limit Check:', limitCheck);
          } catch (error) {
            console.error('FAIL: checkRiskLimits', error);
          }
      }
  }
}

export { runTest };

// If executed directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runTest().catch(console.error);
}
