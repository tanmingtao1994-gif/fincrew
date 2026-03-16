import { ReviewResult } from '../../types/domain';
import { withErrorHandling } from '../../utils/error';

interface ExtractLessonsInput {
  review: ReviewResult;
}

export async function extractLessons(input: ExtractLessonsInput): Promise<string[]> {
  return withErrorHandling(async () => {
    const { review } = input;
    const lessons: string[] = [];
    
    // Simple extraction logic
    if (review.lessons.whatWentWrong.length > 0) {
        lessons.push(...review.lessons.whatWentWrong.map(l => `Avoid: ${l}`));
    }
    if (review.lessons.improvements.length > 0) {
        lessons.push(...review.lessons.improvements.map(l => `Improve: ${l}`));
    }
    if (review.lessons.whatWentWell.length > 0) {
        lessons.push(...review.lessons.whatWentWell.map(l => `Continue: ${l}`));
    }
    
    return lessons;
  }, 'extractLessons');
}
