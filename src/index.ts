import readline from 'readline';
import { collect } from './agents/skills/collect.ts';
import { analyzeMarket } from './agents/skills/analyzeMarket.ts';
import { analyzeStock } from './agents/skills/analyzeStock.ts';
import { validateTradeRequest } from './agents/skills/validateTradeRequest.ts';
import { createTradingPlan } from './agents/skills/createTradingPlan.ts';
import { executeTrade } from './agents/skills/executeTrade.ts';
import { config } from './utils/config.ts';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🤖 AI Financial Assistant');
  
  if (!command || command === 'help') {
    console.log('Available commands:');
    console.log('  collect <tickers>   - Collect data for tickers (comma separated)');
    console.log('  analyze <ticker>    - Analyze a specific stock');
    console.log('  market              - Analyze overall market');
    console.log('  trade "<request>"   - Process a trade request (e.g., "Buy 10 AAPL")');
    console.log('  repl                - Start interactive mode');
    return;
  }

  try {
    switch (command) {
      case 'collect':
        const tickers = args[1]?.split(',') || ['AAPL', 'MSFT', 'TSLA', 'NVDA'];
        console.log(`Collecting data for ${tickers.join(', ')}...`);
        await collect({ tickers, sources: ['market', 'news'] });
        console.log('Done.');
        break;

      case 'analyze':
        const ticker = args[1];
        if (!ticker) { console.error('Please provide a ticker.'); return; }
        console.log(`Analyzing ${ticker}...`);
        const result = await analyzeStock({ ticker });
        console.log('Conclusion:', result.analysis.conclusion);
        console.log('Rationale:', result.analysis.rationale);
        break;

      case 'market':
        console.log('Analyzing market...');
        const market = await analyzeMarket({ timeframe: '1d' });
        console.log('Sentiment:', market.sentiment.overall);
        console.log('Risk Level:', market.riskLevel);
        break;

      case 'trade':
        const request = args.slice(1).join(' ');
        if (!request) { console.error('Please provide a trade request.'); return; }
        
        console.log(`Processing: "${request}"`);
        const validation = await validateTradeRequest({ request });
        
        if (!validation.isValid || !validation.parsedIntent) {
            console.error('Invalid request:', validation.reason);
            return;
        }
        
        console.log('Intent:', validation.parsedIntent);
        
        // Full flow: Analyze -> Plan -> Execute
        console.log('Analyzing...');
        const analysis = await analyzeStock({ ticker: validation.parsedIntent.ticker });
        
        console.log('Creating Plan...');
        const plan = await createTradingPlan({
            ticker: validation.parsedIntent.ticker,
            analysis: analysis.analysis,
            capital: 100000 // Mock capital
        });
        
        // Override quantity if specified
        if (validation.parsedIntent.quantity) {
            plan.execution.quantity = validation.parsedIntent.quantity;
        }
        
        console.log(`Plan: ${plan.action} ${plan.execution.quantity} @ ${plan.execution.price}`);
        
        if (config.trading.dryRun) {
            console.log('Executing (Dry Run)...');
            const trade = await executeTrade({ plan, dryRun: true });
            console.log('Trade Executed:', trade.id);
        } else {
            console.log('Real trading disabled in CLI for safety.');
        }
        break;

      case 'repl':
        startRepl();
        break;

      default:
        console.error('Unknown command:', command);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

function startRepl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'AI-Fi > '
  });

  console.log('Interactive Mode. Type "exit" to quit.');
  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (input === 'exit') {
        rl.close();
        return;
    }
    
    if (input) {
        if (input.startsWith('analyze ')) {
            console.log('(Analysis in REPL not fully implemented, use CLI args)');
        } else {
            console.log(`You said: ${input}`);
        }
    }
    
    rl.prompt();
  }).on('close', () => {
    console.log('Bye!');
    process.exit(0);
  });
}

if (require.main === module) {
    main();
}
