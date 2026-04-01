import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ============================================================
// Unified Eval Script
// Usage:
//   npx tsx scripts/eval.ts run      [--dir ...] [--timestamp ...]
//   npx tsx scripts/eval.ts compare  [--dir ...] [--timestamp ...]
//   npx tsx scripts/eval.ts          [--dir ...]   (run + compare)
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// -------------------- Types --------------------

interface EvalConfig {
  runner: { command: string; mode: string };
  judge: { command: string; flag: string };
  dataset_dir: string;
  results_dir: string;
  openclaw_dev_dir: string;
  openclaw_prod_dir: string;
}

interface EvalCase {
  test_id: string;
  agent_target: string;
  input_prompt: string;
  expected_behavior: {
    must_call?: string[];
    must_use_skill?: string[];
    must_contain?: string[];
    must_dispatch?: string[];
    must_reject?: boolean;
    must_write_memory?: boolean;
    must_read_memory?: boolean;
    llm_judge?: string;
  };
}

interface SessionData {
  toolCalls: Set<string>;
  usedSkills: Set<string>;
  assistantTexts: string;
  assistantContentItems: Array<{ type: string; name?: string; arguments?: any; text?: string }>;
}

interface TestResult {
  test_id: string;
  pass: boolean;
  score: number;
  details: string[];
}

// -------------------- Shared Utilities --------------------

function resolveHomePath(p: string): string {
  return p.replace(/^~/, process.env.HOME || '');
}

function loadEvalConfig(): EvalConfig {
  const cfgPath = path.join(process.cwd(), 'config/eval.config.json');
  const defaults: EvalConfig = {
    runner: { command: 'openclaw', mode: 'dev' },
    judge: { command: 'coco', flag: '-p' },
    dataset_dir: 'eval/eval_dataset',
    results_dir: 'eval/llm_invoke_results',
    openclaw_dev_dir: '~/.openclaw-dev',
    openclaw_prod_dir: '~/.openclaw',
  };
  if (fs.existsSync(cfgPath)) {
    return { ...defaults, ...JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) };
  }
  return defaults;
}

function getOpenclawDir(config: EvalConfig): string {
  const raw = config.runner.mode === 'dev'
    ? (config.openclaw_dev_dir || '~/.openclaw-dev')
    : (config.openclaw_prod_dir || '~/.openclaw');
  return resolveHomePath(raw);
}

function getTimestampString(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

function loadAllEvalCases(baseDir: string, targetDir?: string): EvalCase[] {
  const cases: EvalCase[] = [];

  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith('.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
          if (Array.isArray(content)) cases.push(...content);
          else cases.push(content);
        } catch (e) {
          console.error(`❌ 解析数据集失败: ${fullPath}`, e);
        }
      }
    }
  };

  let resolvedBase = baseDir;
  if (targetDir) {
    resolvedBase = path.join(baseDir, targetDir);
    if (!fs.existsSync(resolvedBase) || !fs.statSync(resolvedBase).isDirectory()) {
      const fileFallback = resolvedBase.endsWith('.json') ? resolvedBase : `${resolvedBase}.json`;
      if (fs.existsSync(fileFallback) && fs.statSync(fileFallback).isFile()) {
        try {
          const content = JSON.parse(fs.readFileSync(fileFallback, 'utf-8'));
          if (Array.isArray(content)) cases.push(...content);
          else cases.push(content);
        } catch (e) {
          console.error(`❌ 解析数据集失败: ${fileFallback}`, e);
        }
        return cases;
      }
    }
  }

  scanDir(resolvedBase);
  return cases;
}

function parseSessionData(jsonlPath: string): SessionData {
  const toolCalls = new Set<string>();
  const usedSkills = new Set<string>();
  let assistantTexts = '';
  const assistantContentItems: SessionData['assistantContentItems'] = [];

  if (!fs.existsSync(jsonlPath)) {
    return { toolCalls, usedSkills, assistantTexts, assistantContentItems };
  }

  const lines = fs.readFileSync(jsonlPath, 'utf-8').split('\n').filter(l => l.trim().length > 0);
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'message' && obj.message?.role === 'assistant') {
        const contentArr = obj.message.content;
        if (!Array.isArray(contentArr)) continue;
        for (const item of contentArr) {
          assistantContentItems.push(item);
          if (item.type === 'toolCall' && item.name) {
            toolCalls.add(item.name);
            if (item.name === 'read' && item.arguments) {
              const p = (item.arguments.file_path || item.arguments.path || '') as string;
              const match = p.match(/skills\/([^/]+)\//) || p.match(/skills\/([^.]+)\.(ts|js|md)/);
              if (match?.[1]) usedSkills.add(match[1]);
            }
          } else if (item.type === 'text' && item.text) {
            assistantTexts += item.text + '\n';
          }
        }
      }
    } catch {
      // ignore parse errors on individual lines
    }
  }

  return { toolCalls, usedSkills, assistantTexts, assistantContentItems };
}

function parseArgs(): { subcommand?: string; timestamp?: string; dir?: string; target?: string } {
  const args = process.argv.slice(2);
  const result: { subcommand?: string; timestamp?: string; dir?: string; target?: string } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--timestamp' && args[i + 1]) { result.timestamp = args[i + 1]; i++; }
    else if (args[i] === '--dir' && args[i + 1]) { result.dir = args[i + 1]; i++; }
    else if (args[i] === '--target' && args[i + 1]) { result.target = args[i + 1]; i++; }
    else if (!args[i].startsWith('--') && !result.subcommand) { result.subcommand = args[i]; }
  }
  return result;
}

// ==================== Phase 1: RUN ====================

function getAgentId(agentTarget: string): string {
  return agentTarget === 'main' ? 'main' : agentTarget.replace('workspace-', '');
}

function getSessionDir(openclawDir: string, agentId: string): string {
  return path.join(openclawDir, 'agents', agentId, 'sessions');
}

function getLatestSessionFile(openclawDir: string, agentId: string): string | null {
  const dir = getSessionDir(openclawDir, agentId);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'));
  if (files.length === 0) return null;
  const sorted = files
    .map(f => ({ name: f, time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);
  return path.join(dir, sorted[0].name);
}

function clearAllSessions(openclawDir: string) {
  const agentsDir = path.join(openclawDir, 'agents');
  if (!fs.existsSync(agentsDir)) return;
  for (const agent of fs.readdirSync(agentsDir)) {
    const agentPath = path.join(agentsDir, agent);
    if (!fs.statSync(agentPath).isDirectory()) continue;
    const sessionDir = path.join(agentPath, 'sessions');
    if (!fs.existsSync(sessionDir)) continue;
    const files = fs.readdirSync(sessionDir).filter(f => f.endsWith('.jsonl'));
    for (const file of files) fs.unlinkSync(path.join(sessionDir, file));
    if (files.length > 0) console.log(`🧹 已清理 [${agent}] 的 ${files.length} 个历史 Session 文件`);
  }
}

async function runTest(evalCase: EvalCase, resultsDir: string, evalConfig: EvalConfig, openclawDir: string) {
  console.log(`\n==============================================`);
  console.log(`🚀 开始执行评测 Case: ${evalCase.test_id}`);
  console.log(`🤖 目标 Agent: ${evalCase.agent_target}`);
  console.log(`💬 输入: ${evalCase.input_prompt}`);

  try {
    const agentId = getAgentId(evalCase.agent_target);
    const escapedPrompt = evalCase.input_prompt.replace(/'/g, "'\\''" );
    const devFlag = evalConfig.runner.mode === 'dev' ? ' --dev' : '';
    const command = `${evalConfig.runner.command}${devFlag} agent --agent "${agentId}" --message '${escapedPrompt}'`;
    console.log(`> 执行命令: ${command}`);

    try {
      const stdout = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
      console.log(`[OpenClaw 输出]:\n${stdout}`);
    } catch (e: any) {
      console.warn(`[OpenClaw 警告/错误]: ${e.message}`);
    }

    const sessionFile = getLatestSessionFile(openclawDir, agentId);
    if (!sessionFile) {
      console.error(`❌ 找不到对应的 session 文件 (路径: ${getSessionDir(openclawDir, agentId)})`);
      return;
    }

    console.log(`> 读取 Session 文件: ${sessionFile}`);
    const sessionContent = fs.readFileSync(sessionFile, 'utf-8');
    const resultFilePath = path.join(resultsDir, `${evalCase.test_id}_result.jsonl`);
    fs.writeFileSync(resultFilePath, sessionContent);
    console.log(`✅ 结果已保存至: ${resultFilePath}`);

    fs.unlinkSync(sessionFile);
    console.log(`🧹 已清理当前评测的 Session 文件`);
  } catch (error) {
    console.error(`❌ 执行测试时发生错误:`, error);
  }
}

async function phaseRun(evalConfig: EvalConfig, cases: EvalCase[], timestamp: string) {
  const openclawDir = getOpenclawDir(evalConfig);
  const resultsDir = path.join(process.cwd(), evalConfig.results_dir, timestamp);
  fs.mkdirSync(resultsDir, { recursive: true });

  console.log(`找到 ${cases.length} 个评测用例，开始执行...`);
  clearAllSessions(openclawDir);

  for (const c of cases) {
    await runTest(c, resultsDir, evalConfig, openclawDir);
  }

  console.log(`\n🎉 所有评测用例执行完毕！`);
}

// ==================== Phase 2: COMPARE ====================

function checkDispatch(items: SessionData['assistantContentItems'], agent: string): boolean {
  for (const item of items) {
    if (item.type === 'toolCall' && item.name === 'exec') {
      const cmd = ((item.arguments?.command || '') as string);
      if (cmd.includes('openclaw') && cmd.includes('--agent') &&
          (cmd.includes(`"${agent}"`) || cmd.includes(`'${agent}'`) || cmd.includes(` ${agent} `))) {
        return true;
      }
    }
  }
  return false;
}

function checkMemoryWrite(items: SessionData['assistantContentItems']): boolean {
  for (const item of items) {
    if (item.type !== 'toolCall') continue;
    if ((item.name === 'write' || item.name === 'edit') &&
        ((item.arguments?.path || item.arguments?.file_path || '') as string).match(/memory/)) {
      return true;
    }
    if (item.name === 'exec') {
      const cmd = (item.arguments?.command || '') as string;
      if (cmd.includes('memory') && /[>]|write|echo|python|extractLessons/.test(cmd)) return true;
    }
  }
  return false;
}

function checkMemoryRead(items: SessionData['assistantContentItems']): boolean {
  for (const item of items) {
    if (item.type !== 'toolCall') continue;
    if (item.name === 'read' &&
        ((item.arguments?.path || item.arguments?.file_path || '') as string).match(/memory/)) {
      return true;
    }
    if (item.name === 'exec') {
      const cmd = (item.arguments?.command || '') as string;
      if (cmd.includes('memory') && /cat|read|jq|python/.test(cmd)) return true;
    }
  }
  return false;
}

async function callLLMJudge(assistantTexts: string, judgePrompt: string, evalConfig: EvalConfig): Promise<{ score: number; reason: string }> {
  const templatePath = path.join(__dirname, 'prompt', 'llm-judge.md');
  let fullPrompt = fs.readFileSync(templatePath, 'utf-8');
  const currentDate = new Date().toISOString().split('T')[0];
  fullPrompt = fullPrompt
    .replace('{{judgePrompt}}', judgePrompt)
    .replace('{{assistantTexts}}', assistantTexts)
    .replace('{{currentDate}}', currentDate);

  try {
    const safePrompt = fullPrompt.replace(/"/g, '\\"').replace(/\$/g, '\\$');
    const result = execSync(`${evalConfig.judge.command} ${evalConfig.judge.flag} "${safePrompt}"`, { encoding: 'utf-8' });
    const match = result.match(/\{[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { score: typeof parsed.score === 'number' ? parsed.score : 0, reason: parsed.reason || '无法解析理由' };
    }
    return { score: 0, reason: `返回格式不符合预期，原始返回: ${result.slice(0, 100)}` };
  } catch (e: any) {
    console.error('LLM Judge 调用失败:', e.message);
    return { score: 0, reason: `调用失败: ${e.message}` };
  }
}

async function evaluateCase(evalCase: EvalCase, invokeDir: string, evalConfig: EvalConfig): Promise<TestResult> {
  const resultFile = path.join(invokeDir, `${evalCase.test_id}_result.jsonl`);
  const details: string[] = [];
  let pass = true;

  if (!fs.existsSync(resultFile)) {
    return { test_id: evalCase.test_id, pass: false, score: 0, details: [`❌ 找不到执行结果文件: ${resultFile}`] };
  }

  const { toolCalls, usedSkills, assistantTexts, assistantContentItems } = parseSessionData(resultFile);
  const eb = evalCase.expected_behavior;

  for (const tool of eb.must_call || []) {
    if (toolCalls.has(tool)) details.push(`✅ 工具调用 [${tool}] 符合预期`);
    else { details.push(`❌ 预期调用工具 [${tool}]，但未找到`); pass = false; }
  }

  for (const skill of eb.must_use_skill || []) {
    if (usedSkills.has(skill)) details.push(`✅ 技能使用 [${skill}] 符合预期`);
    else { details.push(`❌ 预期使用技能 [${skill}]，但未找到`); pass = false; }
  }

  for (const text of eb.must_contain || []) {
    if (assistantTexts.includes(text)) details.push(`✅ 助手回复包含预期关键字 [${text}]`);
    else { details.push(`❌ 助手回复缺少预期关键字 [${text}]`); pass = false; }
  }

  for (const agent of eb.must_dispatch || []) {
    if (checkDispatch(assistantContentItems, agent)) details.push(`✅ 子 Agent 调度 [${agent}] 符合预期`);
    else { details.push(`❌ 预期调度子 Agent [${agent}]，但未找到`); pass = false; }
  }

  if (eb.must_write_memory) {
    if (checkMemoryWrite(assistantContentItems)) details.push('✅ 长期记忆写入：检测到对 memory 的写操作');
    else { details.push('❌ 预期将经验沉淀到长期记忆，但未检测到写操作'); pass = false; }
  }

  if (eb.must_read_memory) {
    if (checkMemoryRead(assistantContentItems)) details.push('✅ 长期记忆读取：检测到对 memory 的读操作');
    else { details.push('❌ 预期读取长期记忆，但未检测到读操作'); pass = false; }
  }

  if (eb.must_reject) {
    if (!toolCalls.has('executeTrade')) details.push('✅ 满足必须拒绝条件（未执行交易工具）');
    else { details.push('❌ 预期拒绝交易，但系统调用了 executeTrade'); pass = false; }
  }

  if (eb.llm_judge) {
    const judgeResult = await callLLMJudge(assistantTexts, eb.llm_judge, evalConfig);
    if (judgeResult.score >= 4) details.push(`✅ LLM Judge 评分 [${judgeResult.score}/5]: ${judgeResult.reason}`);
    else { details.push(`❌ LLM Judge 评分 [${judgeResult.score}/5]: ${judgeResult.reason}`); pass = false; }
  }

  return { test_id: evalCase.test_id, pass, score: pass ? 100 : 0, details };
}

function getLatestInvokeDir(resultsBaseDir: string): string | null {
  if (!fs.existsSync(resultsBaseDir)) return null;
  const dirs = fs.readdirSync(resultsBaseDir)
    .filter(d => fs.statSync(path.join(resultsBaseDir, d)).isDirectory())
    .sort();
  return dirs.length > 0 ? dirs[dirs.length - 1] : null;
}

async function phaseCompare(evalConfig: EvalConfig, cases: EvalCase[], timestamp: string) {
  const resultsBaseDir = path.join(process.cwd(), evalConfig.results_dir);
  const latestDirName = timestamp || getLatestInvokeDir(resultsBaseDir);
  if (!latestDirName) {
    console.error('未找到任何 llm_invoke_results 记录。请先运行 eval run。');
    process.exit(1);
  }

  const invokeDirPath = path.join(resultsBaseDir, latestDirName);
  console.log(`\n==============================================`);
  console.log(`📊 开始评估报告，目标运行批次: ${latestDirName}`);

  const results: TestResult[] = [];
  let passedCount = 0;

  for (const c of cases) {
    const res = await evaluateCase(c, invokeDirPath, evalConfig);
    results.push(res);
    if (res.pass) passedCount++;
    console.log(`\n[${res.pass ? 'PASS' : 'FAIL'}] ${res.test_id}`);
    res.details.forEach(d => console.log(`  ${d}`));
  }

  const passRate = Math.round((passedCount / cases.length) * 100);
  console.log(`\n==============================================`);
  console.log(`🏆 评测总结: 成功 ${passedCount} / 总数 ${cases.length} (通过率: ${passRate}%)`);

  // Write Markdown report
  const evalReportsDir = path.join(process.cwd(), path.dirname(evalConfig.results_dir), 'eval_results');
  const reportDir = path.join(evalReportsDir, latestDirName);
  fs.mkdirSync(reportDir, { recursive: true });

  const lines = [
    `# 评测报告 (运行批次: ${latestDirName})`,
    ``,
    `## 总结`,
    `- **总用例数**: ${cases.length}`,
    `- **通过数**: ${passedCount}`,
    `- **失败数**: ${cases.length - passedCount}`,
    `- **通过率**: ${passRate}%`,
    ``,
    `## 详情`,
    ``,
  ];
  for (const res of results) {
    lines.push(`### ${res.pass ? '✅' : '❌'} ${res.test_id}`);
    for (const d of res.details) lines.push(`- ${d}`);
    lines.push('');
  }

  const reportPath = path.join(reportDir, 'report.md');
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
  console.log(`\n📄 详细报告已生成: ${reportPath}`);
}

// ==================== Main Entry ====================

async function main() {
  const { subcommand, timestamp: forcedTs, dir: targetDir, target: targetFile } = parseArgs();
  console.log(`📋 Command Args: subcommand=${subcommand}, timestamp=${forcedTs}, dir=${targetDir}, target=${targetFile}`);
  const evalConfig = loadEvalConfig();
  const datasetDir = path.join(process.cwd(), evalConfig.dataset_dir);
  const timestamp = forcedTs || getTimestampString();

  console.log(`📋 Eval config: command=${evalConfig.runner.command}, mode=${evalConfig.runner.mode}`);
  console.log(`⏱  Timestamp: ${timestamp}`);

  const cases = loadAllEvalCases(datasetDir, targetFile || targetDir || undefined);
  if (cases.length === 0) {
    console.log('未找到任何有效的评测用例。');
    return;
  }
  console.log(`📂 加载了 ${cases.length} 个评测用例`);

  if (subcommand === 'run') {
    await phaseRun(evalConfig, cases, timestamp);
  } else if (subcommand === 'compare') {
    await phaseCompare(evalConfig, cases, timestamp);
  } else {
    // Default: run then compare
    await phaseRun(evalConfig, cases, timestamp);
    await phaseCompare(evalConfig, cases, timestamp);
  }
}

main().catch(console.error);
