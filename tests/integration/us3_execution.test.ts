import { validateTradeRequest } from '../../src/agents/skills/validateTradeRequest.js';
import { executeTrade } from '../../src/agents/skills/executeTrade.js';
import { analyzeTradeResult } from '../../src/agents/skills/analyzeTradeResult.js';
import { generateReviewReport } from '../../src/agents/skills/generateReviewReport.js';
import { TradingPlan } from '../../src/types/domain.js';
import { randomUUID } from 'crypto';

async function runTest() {
  console.log('Running US3 Execution & Review Integration Test...');

  // 1. Validate Trade Request
  console.log('\nTesting validateTradeRequest...');
  try {
    const validReq = await validateTradeRequest({ request: 'Buy 100 AAPL' });
    console.log('Valid Request:', validReq);
    
    const invalidReq = await validateTradeRequest({ request: 'Hello world' });
    console.log('Invalid Request:', invalidReq);
  } catch (error) {
    console.error('FAIL: validateTradeRequest', error);
  }

  // 2. Execute Trade (Dry Run)
  console.log('\nTesting executeTrade...');
  let trade;
  const mockPlan: TradingPlan = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ticker: 'AAPL',
      action: 'buy',
      execution: {
          orderType: 'limit',
          price: 150,
          quantity: 100,
          timing: 'immediate'
      },
      riskControls: {
          stopLoss: 140,
          takeProfit: 170,
          maxLoss: 1000,
          positionSize: 5
      },
      reasoning: 'Test',
      analysisId: 'test-analysis',
      memoryIds: [],
      status: 'approved',
      statusHistory: []
  };
  
  try {
    trade = await executeTrade({ plan: mockPlan, dryRun: true });
    console.log('Trade Record:', {
        id: trade.id,
        status: trade.execution.status,
        cost: trade.financials.totalCost
    });
  } catch (error) {
    console.error('FAIL: executeTrade', error);
  }

  // 3. Analyze Trade Result
  console.log('\nTesting analyzeTradeResult...');
  let review;
  if (trade) {
      try {
        review = await analyzeTradeResult({ tradeId: trade.id });
        console.log('Review:', {
            score: review.evaluation.score,
            grade: review.evaluation.grade
        });
      } catch (error) {
        console.error('FAIL: analyzeTradeResult', error);
      }
  }

  // 4. Generate Review Report
  console.log('\nTesting generateReviewReport...');
  if (review) {
      try {
        const report = await generateReviewReport({
            reviews: [review],
            lessons: review.lessons.improvements
        });
        console.log('Report Preview:\n', report.slice(0, 200) + '...');
      } catch (error) {
        console.error('FAIL: generateReviewReport', error);
      }
  }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTest().catch(console.error);
}

export { runTest };
