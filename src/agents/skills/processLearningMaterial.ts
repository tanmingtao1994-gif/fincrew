import { withErrorHandling } from '../../utils/error';

interface ProcessLearningMaterialInput {
  content: string;
  type: string; // 'book', 'article', etc.
}

export async function processLearningMaterial(input: ProcessLearningMaterialInput): Promise<{ points: string[] }> {
  return withErrorHandling(async () => {
    const { content } = input;
    // Mock extraction
    // Extract sentences that look like rules or principles
    
    const points = content.split('.')
        .map(s => s.trim())
        .filter(s => s.length > 20 && (s.toLowerCase().includes('always') || s.toLowerCase().includes('never') || s.toLowerCase().includes('should')));
        
    return { points };
  }, 'processLearningMaterial');
}
