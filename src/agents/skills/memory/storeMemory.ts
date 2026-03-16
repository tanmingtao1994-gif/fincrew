import { memoryStorage } from '../../../utils/storage';
import { MemoryNode } from '../../../types/memory';
import { withErrorHandling } from '../../../utils/error';

interface StoreMemoryInput {
  title: string;
  content: string;
  type: MemoryNode['type'];
  relatedTickers?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
  children?: string[];
  relatedMemories?: string[];
}

export async function storeMemory(input: StoreMemoryInput): Promise<MemoryNode> {
  return withErrorHandling(async () => {
    // Ensure storage is initialized
    await memoryStorage.init();

    const memory: Omit<MemoryNode, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessed' | 'accessCount' | 'effectiveness'> = {
      title: input.title,
      content: input.content,
      type: input.type,
      children: input.children || [],
      relatedMemories: input.relatedMemories || [],
      relatedTickers: input.relatedTickers || [],
      metadata: {
        ...input.metadata,
        tags: input.tags || [],
        weight: input.metadata?.weight ?? 1.0,
        confidence: input.metadata?.confidence ?? 1.0,
      },
    };

    const newMemory = await memoryStorage.addMemory(memory);
    return newMemory;
  }, 'storeMemory');
}
