import { ReviewResult } from '../../types/domain.ts';
import { withErrorHandling } from '../../utils/error.ts';

interface GenerateReviewReportInput {
  reviews: ReviewResult[];
  lessons: string[];
}

export async function generateReviewReport(input: GenerateReviewReportInput): Promise<string> {
  return withErrorHandling(async () => {
    const { reviews, lessons } = input;
    
    let report = `# Weekly Trading Review\n\n`;
    report += `Date: ${new Date().toISOString().split('T')[0]}\n`;
    report += `Total Trades Reviewed: ${reviews.length}\n\n`;
    
    report += `## Performance Summary\n`;
    const avgScore = reviews.reduce((sum, r) => sum + r.evaluation.score, 0) / (reviews.length || 1);
    report += `Average Score: ${avgScore.toFixed(2)}\n\n`;
    
    report += `## Key Lessons\n`;
    lessons.forEach(l => report += `- ${l}\n`);
    report += `\n`;
    
    report += `## Detailed Reviews\n`;
    reviews.forEach(r => {
        report += `### Trade ${r.tradeId}\n`;
        report += `- Grade: ${r.evaluation.grade}\n`;
        report += `- Decision: ${r.analysis.decisionQuality.reasoning}\n`;
        report += `- Execution: ${r.analysis.executionQuality.reasoning}\n\n`;
    });
    
    return report;
  }, 'generateReviewReport');
}
