import { retrieveMemory } from './memory/retrieveMemory';
import { withErrorHandling } from '../../utils/error';

interface ValidateAgainstMemoryInput {
  decision: string; // Description of decision
}

export async function validateAgainstMemory(input: ValidateAgainstMemoryInput): Promise<{ conflict: boolean; warning?: string }> {
  return withErrorHandling(async () => {
    const { decision } = input;
    
    // Retrieve relevant memories (principles, lessons)
    const memories = await retrieveMemory({
        query: decision,
        types: ['principle', 'lesson'],
        limit: 5
    });
    
    // Simple conflict check (mock logic: check if memory text contains "avoid" and decision contains same keyword)
    // In real system, LLM would do this.
    // Here we just return found relevant memories as warnings if they seem negative.
    
    for (const mem of memories) {
        if (mem.content.toLowerCase().includes('avoid') || mem.content.toLowerCase().includes('risk')) {
            return {
                conflict: true,
                warning: `Potential conflict with memory: "${mem.content}"`
            };
        }
    }
    
    return { conflict: false };
  }, 'validateAgainstMemory');
}
