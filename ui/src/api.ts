import { EvalRun, LLMInvocation } from './types';

// State to cache the loaded data
let cachedData: { runs: EvalRun[], invocations: Record<string, any> } | null = null;

async function loadData() {
  if (cachedData) return cachedData;
  try {
    const res = await fetch('/eval-data.json');
    if (!res.ok) throw new Error('Failed to fetch eval data');
    cachedData = await res.json();
    return cachedData!;
  } catch (err) {
    console.error('Error loading eval data:', err);
    return { runs: [], invocations: {} };
  }
}

export async function fetchRuns(): Promise<EvalRun[]> {
  const data = await loadData();
  return data.runs || [];
}

export async function fetchInvocations(testId: string): Promise<LLMInvocation> {
  const data = await loadData();
  if (data.invocations && data.invocations[testId]) {
    return {
      test_id: testId,
      messages: data.invocations[testId]
    };
  }
  return { test_id: testId, messages: [] };
}