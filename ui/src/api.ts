import { EvalRun, LLMInvocation } from './types';

export async function fetchRuns(): Promise<EvalRun[]> {
  const res = await fetch('/api/runs');
  if (!res.ok) throw new Error('Failed to fetch runs');
  return res.json();
}

export async function fetchInvocations(testId: string): Promise<LLMInvocation> {
  const res = await fetch(`/api/invocations?test_id=${testId}`);
  if (!res.ok) throw new Error('Failed to fetch invocations');
  return res.json();
}