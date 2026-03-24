import { EvalRun, LLMInvocation } from './types';

// Data is injected directly into the HTML by the local Vite server
declare global {
  interface Window {
    __EVAL_RUNS__?: EvalRun[];
    __EVAL_INVOCATIONS__?: Record<string, any>;
  }
}

export async function fetchRuns(): Promise<EvalRun[]> {
  if (window.__EVAL_RUNS__) {
    return window.__EVAL_RUNS__;
  }
  return [];
}

export async function fetchInvocations(testId: string): Promise<LLMInvocation> {
  if (window.__EVAL_INVOCATIONS__ && window.__EVAL_INVOCATIONS__[testId]) {
    return {
      test_id: testId,
      messages: window.__EVAL_INVOCATIONS__[testId]
    };
  }
  return { test_id: testId, messages: [] };
}