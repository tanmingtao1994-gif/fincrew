import { analyzeOptions, OptionsAnalysis } from '../stock_rich/src/analysis/options.js';
import { withErrorHandling } from './error';

export class OptionAdapter {
  /**
   * Analyze options for a symbol.
   */
  async analyze(symbol: string, expiry: string, direction: 'call' | 'put'): Promise<OptionsAnalysis> {
    return withErrorHandling(async () => {
      console.log(`[OptionAdapter] Analyzing options for ${symbol} ${direction} ${expiry}`);
      return await analyzeOptions(symbol, expiry, direction);
    }, 'analyzeOptions');
  }
}

export const optionAdapter = new OptionAdapter();
