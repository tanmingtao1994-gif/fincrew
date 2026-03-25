export interface TestCase {
  test_id: string;
  name: string;
  description: string;
  expected_behavior: string;
  status: string;
  score?: number;
  judge_reason?: string;
  duration?: number;
  has_logs: boolean;
}

export interface EvalRun {
  run_id: string;
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  cases: TestCase[];
}

export interface MessageContent {
  type: string;
  text?: string;
  thinking?: string;
  name?: string;
  arguments?: any;
  input?: any;
  result?: any;
}

export interface LLMMessage {
  role: string;
  content: string | MessageContent[];
  timestamp?: string;
}

export interface LLMInvocation {
  test_id: string;
  messages: LLMMessage[];
}