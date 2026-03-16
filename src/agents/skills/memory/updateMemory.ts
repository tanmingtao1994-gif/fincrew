import { memoryStorage } from '../../../utils/storage';
import { MemoryNode } from '../../../types/memory';
import { withErrorHandling } from '../../../utils/error';

interface UpdateMemoryInput {
  id: string;
  updates: Partial<Omit<MemoryNode, 'id' | 'createdAt'>>;
}

export async function updateMemory(input: UpdateMemoryInput): Promise<MemoryNode> {
  return withErrorHandling(async () => {
    await memoryStorage.init();
    
    // Fetch existing memory to merge metadata deeply if needed
    const existing = await memoryStorage.getMemory(input.id);
    if (!existing) {
        throw new Error(`Memory ${input.id} not found`);
    }
    
    const updates = { ...input.updates };
    
    // Merge metadata if present in both
    if (updates.metadata && existing.metadata) {
        updates.metadata = {
            ...existing.metadata,
            ...updates.metadata
        };
    }
    
    const updated = await memoryStorage.updateMemory(input.id, updates);
    return updated;
  }, 'updateMemory');
}
