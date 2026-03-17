import { memoryStorage } from '../../../utils/storage';
import { MemoryNode } from '../../../types/memory';
import { withErrorHandling, ErrorCode, ToolError } from '../../../utils/error';

export interface UpdateMemoryInput {
  id: string;
  updates: Partial<Omit<MemoryNode, 'id' | 'createdAt'>>;
}

/**
 * Skill to update an existing memory.
 */
export async function updateMemory(input: UpdateMemoryInput): Promise<MemoryNode> {
  return withErrorHandling(async () => {
    await memoryStorage.init();
    
    // Fetch existing memory to merge metadata deeply if needed
    const existing = await memoryStorage.getMemory(input.id);
    if (!existing) {
        throw new ToolError(`Memory ${input.id} not found`, ErrorCode.NOT_FOUND);
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
  }, 'updateMemory', ErrorCode.STORAGE_ERROR);
}
