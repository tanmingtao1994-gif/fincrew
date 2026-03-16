import { memoryStorage } from '../../../utils/storage';
import { MemoryNode, MemoryQuery } from '../../../types/memory';
import { withErrorHandling } from '../../../utils/error';

interface RetrieveMemoryInput {
  query: string; // Natural language query or keywords
  tickers?: string[];
  types?: MemoryNode['type'][];
  limit?: number;
}

export async function retrieveMemory(input: RetrieveMemoryInput): Promise<MemoryNode[]> {
  return withErrorHandling(async () => {
    // Ensure storage is initialized
    await memoryStorage.init();

    // Convert query string to keywords (simple split for now)
    const keywords = input.query
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2); // Filter short words

    const searchParams: {
      keywords?: string[];
      tickers?: string[];
      types?: string[];
      limit?: number;
    } = {
      keywords: keywords.length > 0 ? keywords : undefined,
      tickers: input.tickers,
      types: input.types,
      limit: input.limit || 5, // Default limit
    };

    const results = await memoryStorage.searchMemories(searchParams);
    return results;
  }, 'retrieveMemory');
}
