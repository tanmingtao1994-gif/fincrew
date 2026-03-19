import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const DATASET_DIR = path.join(process.cwd(), 'tests', 'eval_dataset');
const LLM_INVOKE_RESULTS_DIR = path.join(process.cwd(), 'tests', 'llm_invoke_results');
// New directory specifically for evaluation reports
const EVAL_REPORTS_DIR = path.join(process.cwd(), 'tests', 'eval_results');

interface EvalCase {
  test_id: string;
  agent_target: string;
  input_prompt: string;
  expected_behavior: {
    must_call?: string[];
    must_contain?: string[];
    must_reject?: boolean;
    llm_judge?: string;
  };
}

interface TestResult {
  test_id: string;
  pass: boolean;
  score: number;
  details: string[];
}

// Read all eval cases from dataset
function loadAllEvalCases(): EvalCase[] {
  const cases: EvalCase[] = [];
  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith('.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
          if (Array.isArray(content)) {
            cases.push(...content);
          } else {
            cases.push(content);
          }
        } catch (e) {
          console.error(`❌ 解析数据集失败: ${fullPath}`, e);
        }
      }
    }
  };
  scanDir(DATASET_DIR);
  return cases;
}

// Get the latest run timestamp directory
function getLatestInvokeDir(): string | null {
  if (!fs.existsSync(LLM_INVOKE_RESULTS_DIR)) return null;
  const dirs = fs.readdirSync(LLM_INVOKE_RESULTS_DIR)
    .filter(d => fs.statSync(path.join(LLM_INVOKE_RESULTS_DIR, d)).isDirectory())
    .sort();
  if (dirs.length === 0) return null;
  return dirs[dirs.length - 1]; // latest timestamp string
}

// Parse JSONL to extract tool calls and assistant texts
function parseSessionData(jsonlPath: string): { toolCalls: Set<string>, assistantTexts: string } {
  const toolCalls = new Set<string>();
  let assistantTexts = "";

  if (!fs.existsSync(jsonlPath)) {
    return { toolCalls, assistantTexts };
  }

  const lines = fs.readFileSync(jsonlPath, 'utf-8').split('\n').filter(l => l.trim().length > 0);
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'message' && obj.message && obj.message.role === 'assistant') {
        const contentArr = obj.message.content;
        if (Array.isArray(contentArr)) {
          for (const item of contentArr) {
            if (item.type === 'toolCall' && item.name) {
              toolCalls.add(item.name);
            } else if (item.type === 'text' && item.text) {
              assistantTexts += item.text + "\n";
            }
          }
        }
      }
    } catch (e) {
      // ignore parse error on specific line
    }
  }

  return { toolCalls, assistantTexts };
}

// A simple LLM judge call. Assumes a CLI or API call that returns a score.
// Since you mentioned using 'coco', we'll simulate or call the relevant CLI/API here.
async function callLLMJudge(assistantTexts: string, judgePrompt: string): Promise<{ score: number, reason: string }> {
  // Construct the prompt for the LLM judge
  const fullPrompt = `你是一个严格的评测法官。请根据下面的预期描述，对给定的助手输出进行评分。
【预期描述】:
${judgePrompt}

【助手输出】:
${assistantTexts}

请给出评分（0-5分，5分表示完全符合，0分表示完全不符合），并简要说明理由。
请严格输出JSON格式，不要输出其他多余文字：
{"score": <数字>, "reason": "<理由>"}
`;

  try {
    // 假设 coco 有相应的命令行可以直接执行并返回标准输出。这里使用 execSync 模拟。
    // 注意：实际项目中可能需要使用对应的 SDK 或更稳定的 CLI 调用方式。
    
    // 注意处理引号转义
    const safePrompt = fullPrompt.replace(/"/g, '\\"').replace(/\$/g, '\\$');
    const cmd = `coco -p "${safePrompt}"`;
    const result = execSync(cmd, { encoding: 'utf-8' });
    
    // 尝试解析 JSON
    const match = result.match(/\{[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { score: typeof parsed.score === 'number' ? parsed.score : 0, reason: parsed.reason || '无法解析理由' };
    }
    
    return { score: 0, reason: `返回格式不符合预期，原始返回: ${result.slice(0, 100)}` };
  } catch (e: any) {
    console.error("LLM Judge 调用失败:", e);
    return { score: 0, reason: `调用失败: ${e.message}` };
  }
}

async function evaluateCase(evalCase: EvalCase, targetDir: string): Promise<TestResult> {
  const resultFile = path.join(targetDir, `${evalCase.test_id}_result.jsonl`);
  const details: string[] = [];
  let pass = true;

  if (!fs.existsSync(resultFile)) {
    return {
      test_id: evalCase.test_id,
      pass: false,
      score: 0,
      details: [`❌ 找不到执行结果文件: ${resultFile}`]
    };
  }

  const { toolCalls, assistantTexts } = parseSessionData(resultFile);

  // Assert must_call
  if (evalCase.expected_behavior.must_call && Array.isArray(evalCase.expected_behavior.must_call)) {
    for (const tool of evalCase.expected_behavior.must_call) {
      if (toolCalls.has(tool)) {
        details.push(`✅ 工具调用 [${tool}] 符合预期`);
      } else {
        details.push(`❌ 预期调用工具 [${tool}]，但未在 session 中找到`);
        pass = false;
      }
    }
  }

  // Assert must_contain
  if (evalCase.expected_behavior.must_contain && Array.isArray(evalCase.expected_behavior.must_contain)) {
    for (const text of evalCase.expected_behavior.must_contain) {
      if (assistantTexts.includes(text)) {
        details.push(`✅ 助手回复包含预期关键字 [${text}]`);
      } else {
        details.push(`❌ 助手回复缺少预期关键字 [${text}]`);
        pass = false;
      }
    }
  }

  // Optional: must_reject (Simplified logic for now: check if it called validateRiskControls and didn't execute trade)
  if (evalCase.expected_behavior.must_reject) {
    if (!toolCalls.has("executeTrade")) {
      details.push(`✅ 满足必须拒绝条件（未执行交易工具）`);
    } else {
      details.push(`❌ 预期拒绝交易，但系统调用了 executeTrade`);
      pass = false;
    }
  }
  // 增加一个分支，参照promptFoo，expected_behavior.llm_judge 为 true 时，判断助手回复是否符合预期
  if (evalCase.expected_behavior.llm_judge) {
    const judgeResult = await callLLMJudge(assistantTexts, evalCase.expected_behavior.llm_judge);
    if (judgeResult.score >= 4) {
      details.push(`✅ LLM Judge 评分 [${judgeResult.score}/5]: ${judgeResult.reason}`);
    } else {
      details.push(`❌ LLM Judge 评分 [${judgeResult.score}/5]: ${judgeResult.reason}`);
      pass = false;
    }
  }

  return {
    test_id: evalCase.test_id,
    pass,
    score: pass ? 100 : 0,
    details
  };
}

async function main() {
  const latestDirName = getLatestInvokeDir();
  if (!latestDirName) {
    console.error("未找到任何 llm_invoke_results 记录。请先运行 npm run eval。");
    process.exit(1);
  }

  const invokeDirPath = path.join(LLM_INVOKE_RESULTS_DIR, latestDirName);
  console.log(`\n==============================================`);
  console.log(`📊 开始评估报告，目标运行批次: ${latestDirName}`);
  
  const evalCases = loadAllEvalCases();
  if (evalCases.length === 0) {
    console.error("未找到任何测试用例定义。");
    process.exit(1);
  }

  const results: TestResult[] = [];
  let passedCount = 0;

  for (const evalCase of evalCases) {
    const res = await evaluateCase(evalCase, invokeDirPath);
    results.push(res);
    if (res.pass) passedCount++;
    
    console.log(`\n[${res.pass ? 'PASS' : 'FAIL'}] ${res.test_id}`);
    res.details.forEach(d => console.log(`  ${d}`));
  }

  console.log(`\n==============================================`);
  console.log(`🏆 评测总结: 成功 ${passedCount} / 总数 ${evalCases.length} (通过率: ${Math.round((passedCount/evalCases.length)*100)}%)`);

  // Write Report
  if (!fs.existsSync(EVAL_REPORTS_DIR)) {
    fs.mkdirSync(EVAL_REPORTS_DIR, { recursive: true });
  }

  const reportDirPath = path.join(EVAL_REPORTS_DIR, latestDirName);
  if (!fs.existsSync(reportDirPath)) {
    fs.mkdirSync(reportDirPath, { recursive: true });
  }

  let markdownReport = `# 评测报告 (运行批次: ${latestDirName})\n\n`;
  markdownReport += `## 总结\n`;
  markdownReport += `- **总用例数**: ${evalCases.length}\n`;
  markdownReport += `- **通过数**: ${passedCount}\n`;
  markdownReport += `- **失败数**: ${evalCases.length - passedCount}\n`;
  markdownReport += `- **通过率**: ${Math.round((passedCount/evalCases.length)*100)}%\n\n`;
  markdownReport += `## 详情\n\n`;

  for (const res of results) {
    markdownReport += `### ${res.pass ? '✅' : '❌'} ${res.test_id}\n`;
    for (const d of res.details) {
      markdownReport += `- ${d}\n`;
    }
    markdownReport += `\n`;
  }

  const reportFilePath = path.join(reportDirPath, 'report.md');
  fs.writeFileSync(reportFilePath, markdownReport, 'utf-8');
  console.log(`\n📄 详细报告已生成: ${reportFilePath}`);
}

main().catch(console.error);
