import { withErrorHandling } from '../../utils/error';

interface ValidateTradeRequestInput {
  request: string;
}

export async function validateTradeRequest(input: ValidateTradeRequestInput): Promise<{ 
    isValid: boolean; 
    parsedIntent?: { 
        action: 'buy' | 'sell'; 
        ticker: string; 
        quantity?: number; 
    }; 
    reason?: string 
}> {
  return withErrorHandling(async () => {
    const { request } = input;
    
    // Simple Regex Parsing
    // e.g. "Buy 100 AAPL" or "Sell TSLA"
    const buyMatch = request.match(/buy\s+(\d+)?\s*([a-zA-Z]+)/i);
    const sellMatch = request.match(/sell\s+(\d+)?\s*([a-zA-Z]+)/i);
    
    if (buyMatch) {
        return {
            isValid: true,
            parsedIntent: {
                action: 'buy',
                quantity: buyMatch[1] ? parseInt(buyMatch[1], 10) : undefined,
                ticker: buyMatch[2].toUpperCase()
            }
        };
    } else if (sellMatch) {
        return {
            isValid: true,
            parsedIntent: {
                action: 'sell',
                quantity: sellMatch[1] ? parseInt(sellMatch[1], 10) : undefined,
                ticker: sellMatch[2].toUpperCase()
            }
        };
    }
    
    return { isValid: false, reason: 'Could not parse intent. Use format "Buy/Sell [quantity] TICKER"' };
  }, 'validateTradeRequest');
}
