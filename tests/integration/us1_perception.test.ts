import { collect } from '../../src/agents/skills/collect';
import { searchHotKeywords } from '../../src/agents/skills/searchHotKeywords';
import { dailyStorage } from '../../src/utils/dailyStorage';

async function runTest() {
  console.log('Running US1 Perception Integration Test...');

  // 1. Test Collect (Market Data)
  console.log('\nTesting collect (Market Data)...');
  try {
    // We use a safe ticker and only market data to avoid heavy API usage
    const result = await collect({ tickers: ['AAPL'], sources: ['market'] });
    console.log('Collect Result:', result);
    
    if (result.marketData) {
        console.log('PASS: Market data collection triggered');
    } else {
        console.error('FAIL: Market data collection failed');
    }
  } catch (error) {
    console.error('FAIL: Collect error', error);
  }

  // 2. Test Search Hot Keywords
  console.log('\nTesting searchHotKeywords...');
  try {
    // We limit to twitter and top 3 to be fast
    const keywords = await searchHotKeywords({ sources: ['twitter'], topN: 3 });
    console.log('Hot Keywords:', keywords);
    
    if (Array.isArray(keywords)) {
        console.log('PASS: Keywords returned');
    } else {
        console.error('FAIL: Invalid keywords return type');
    }
  } catch (error) {
    console.error('FAIL: Search Hot Keywords error', error);
  }
}

// Check if running directly
if (require.main === module) {
    runTest().catch(console.error);
}

export { runTest };
