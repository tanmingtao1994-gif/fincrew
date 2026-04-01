import type { EvalData, LLMMessage } from '../types/eval-data';

// State to cache the loaded data
let cachedData: { runs: EvalData[] } | null = null;

async function loadData() {
  if (cachedData) return cachedData;
  try {
    const res = await fetch('/eval-data.json');
    if (!res.ok) throw new Error('Failed to fetch eval data');
    cachedData = await res.json();
    return cachedData!;
  } catch (err) {
    console.error('Error loading eval data:', err);
    return { runs: [] };
  }
}

export async function fetchRuns(): Promise<EvalData[]> {
  const data = await loadData();
  return data.runs || [];
}

export async function fetchInvocations(testId: string): Promise<{ test_id: string, messages: LLMMessage[] }> {
  const data = await loadData();
  
  if (data.runs && data.runs.length > 0) {
    for (const run of data.runs) {
      if (run.cases) {
        const testCase = run.cases.find(c => c.test_id === testId);
        if (testCase && testCase.llm_messages && testCase.llm_messages.length > 0) {
          return {
            test_id: testId,
            messages: testCase.llm_messages
          };
        }
      }
    }
  }
  
  return { test_id: testId, messages: [] };
}