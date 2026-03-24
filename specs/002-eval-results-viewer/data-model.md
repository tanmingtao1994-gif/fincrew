# Data Model: Eval Results Viewer

## Data Sources

The system reads from three main directories within the `tests` directory:
1. `eval_dataset` - Contains base information and expected behavior of test cases.
2. `eval_results` - Contains the evaluation outcomes (pass/fail, score).
3. `llm_invoke_results` - Contains the raw, sequential interaction logs with the LLM.

## Entities

### TestCase
Represents the combined, summarized view of a single test case, formed by merging `eval_dataset` and `eval_results`.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| test_id | string | All | Unique identifier for the test case |
| name | string | `eval_dataset` | Human-readable name of the test |
| description | string | `eval_dataset` | Detailed description of the test's purpose |
| expected_behavior | string | `eval_dataset` | What the LLM is expected to do |
| status | string | `eval_results` | E.g., "passed", "failed", "pending" |
| score | number | `eval_results` | Numeric score if applicable |
| judge_reason | string | `eval_results` | Explanation for the score/status |
| duration | number | `eval_results` | Execution time in milliseconds |
| has_logs | boolean | Computed | True if corresponding `llm_invoke_results` exist |

### EvalRun
Represents a summary of an evaluation execution batch.

| Field | Type | Description |
|-------|------|-------------|
| run_id | string | Unique identifier for the run (often a timestamp) |
| timestamp | Date | When the evaluation was executed |
| total | number | Total number of test cases in this run |
| passed | number | Number of passed cases |
| failed | number | Number of failed cases |

### LLMInvocation
Represents the complete interaction trace for a specific `test_id`.

| Field | Type | Description |
|-------|------|-------------|
| test_id | string | Reference to the TestCase |
| messages | Array<LLMMessage> | Ordered list of messages exchanged during the test |

### LLMMessage
A single message within an interaction trace.

| Field | Type | Description |
|-------|------|-------------|
| role | string | "user", "assistant", "system", "tool" |
| content | string \| Array<MessageContent> | The content of the message. Complex messages (like from Claude/Gemini) often use arrays. |
| timestamp | Date | (Optional) When the message was generated/received |

### MessageContent
Detailed block within a message content array.

| Field | Type | Description |
|-------|------|-------------|
| type | string | "text", "thinking", "toolCall", "toolResult" |
| text | string | (Optional) Text content if type is text or thinking |
| name | string | (Optional) Tool name if type is toolCall or toolResult |
| arguments | object | (Optional) Tool arguments if type is toolCall |
| result | any | (Optional) Tool execution result if type is toolResult |
