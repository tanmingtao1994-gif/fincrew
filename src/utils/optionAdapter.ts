import { stockRichAdapter } from './stockRichAdapter';
import { dailyStorage } from './dailyStorage';
import { OptionData } from '../types/domain';
import { withErrorHandling, ErrorCode, ToolError } from './error';

export class OptionAdapter {
  /**
   * Fetch and parse option data for a symbol.
   */
  async getOptionData(symbol: string, expiry: string, direction: 'call' | 'put', date?: string): Promise<OptionData | null> {
    return withErrorHandling(async () => {
        // Trigger data collection/analysis via StockRich
        await stockRichAdapter.getOptions(symbol, expiry, direction, date);
        
        // Read result from daily storage
        // Filename format matches what stock_rich/src/index.ts produces: `options-${symbol}-${expiry}`
        // stock_rich's writeDailyData appends .json
        const filename = `options-${symbol}-${expiry}.json`;
        const rawData = dailyStorage.readData<any>(filename, date);
        
        if (!rawData) {
            console.warn(`[OptionAdapter] File ${filename} not found after execution.`);
            return null;
        }
        
        // Map to Domain Entity
        return this.mapToDomain(rawData, symbol, expiry, direction);
    }, 'OptionAdapter.getOptionData', ErrorCode.EXTERNAL_API_ERROR);
  }
  
  private mapToDomain(raw: any, symbol: string, expiry: string, direction: 'call' | 'put'): OptionData {
      // Best-effort mapping based on expected OptionData and typical stock_rich output
      // Adjust this mapping once actual stock_rich output structure is confirmed
      
      return {
          ticker: symbol,
          contractSymbol: raw.contractSymbol || `${symbol}_${expiry}_${direction}`,
          type: direction,
          strikePrice: raw.strike || raw.strikePrice || 0,
          expirationDate: expiry,
          daysToExpiration: raw.daysToExpiration || 0,
          bid: raw.bid || 0,
          ask: raw.ask || 0,
          lastPrice: raw.lastPrice || 0,
          impliedVolatility: raw.impliedVolatility || raw.iv || 0,
          greeks: {
              delta: raw.greeks?.delta || 0,
              gamma: raw.greeks?.gamma || 0,
              theta: raw.greeks?.theta || 0,
              vega: raw.greeks?.vega || 0,
              rho: raw.greeks?.rho || 0
          },
          ivr: raw.ivr || 0,
          ivRvSpread: raw.ivRvSpread || 0,
          maxPain: raw.maxPain || 0,
          timestamp: raw.timestamp || new Date().toISOString()
      };
  }
}

export const optionAdapter = new OptionAdapter();
