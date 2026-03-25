export interface LLMMessage {
  role: string;
  content: string | unknown[];
  timestamp?: string;
  /**
   * 来自 tests/llm_invoke_results 中的值
   */
  source?: unknown;
}

export interface EvalTestCase {
  test_id: string;
  name: string;
  description: string;
  expected_behavior: string;
  status: 'pass' | 'fail';
  // 可以根据需要添加其他可能的字段
  score?: number;
  judge_reason?: string;
  has_logs?: boolean;
  llm_messages?: LLMMessage[];
}

export interface EvalData {
  run_id: string;
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  cases: EvalTestCase[];
}

