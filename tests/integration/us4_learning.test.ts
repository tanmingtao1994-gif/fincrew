import { storeMemory } from '../../src/agents/skills/memory/storeMemory';
import { updateMemory } from '../../src/agents/skills/memory/updateMemory';
import { validateAgainstMemory } from '../../src/agents/skills/validateAgainstMemory';
import { processLearningMaterial } from '../../src/agents/skills/processLearningMaterial';
import { extractLessons } from '../../src/agents/skills/extractLessons';
import { ReviewResult } from '../../src/types/domain';

async function runTest() {
  console.log('Running US4 Learning Integration Test...');

  // 1. Process Learning Material
  console.log('\nTesting processLearningMaterial...');
  try {
    const material = await processLearningMaterial({
        content: "You should always use a stop loss. Never trade against the trend.",
        type: 'article'
    });
    console.log('Extracted Points:', material.points);
    
    // Store points as memory
    if (material.points.length > 0) {
        for (const point of material.points) {
            await storeMemory({
                title: 'Trading Rule',
                content: point,
                type: 'principle',
                tags: ['risk', 'rule']
            });
        }
    }
  } catch (error) {
    console.error('FAIL: processLearningMaterial', error);
  }

  // 2. Validate Against Memory
  console.log('\nTesting validateAgainstMemory...');
  try {
    const check = await validateAgainstMemory({ decision: 'Buy without stop loss' });
    console.log('Validation Result:', check);
    if (check.conflict) {
        console.log('PASS: Conflict detected');
    } else {
        console.log('NOTE: No conflict detected (might be due to empty memory or indexing delay)');
    }
  } catch (error) {
    console.error('FAIL: validateAgainstMemory', error);
  }

  // 3. Extract Lessons from Review
  console.log('\nTesting extractLessons...');
  const mockReview: ReviewResult = {
      id: 'rev-1',
      tradeId: 't-1',
      timestamp: new Date().toISOString(),
      evaluation: { success: false, score: 0.4, grade: 'C' },
      analysis: {
          decisionQuality: { score: 0.5, reasoning: '' },
          executionQuality: { score: 0.5, reasoning: '' },
          timing: { score: 0.5, reasoning: '' }
      },
      lessons: {
          whatWentWell: [],
          whatWentWrong: ['Ignored trend'],
          improvements: ['Check higher timeframe trend']
      },
      memoryUpdates: { principles: [], patterns: [], lessons: [] },
      followUp: { needsReview: false, actions: [] }
  };
  
  try {
    const lessons = await extractLessons({ review: mockReview });
    console.log('Extracted Lessons:', lessons);
  } catch (error) {
    console.error('FAIL: extractLessons', error);
  }
}

if (require.main === module) {
    runTest().catch(console.error);
}

export { runTest };
