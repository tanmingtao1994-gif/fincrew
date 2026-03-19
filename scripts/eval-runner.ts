import { execSync } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(execSync);

// Configuration
const DATASET_DIR = path.join(process.cwd(), 'tests', 'eval_dataset');
const BASE_RESULTS_DIR = path.join(process.cwd(), 'tests', 'eval_results');
// .openclaw-dev base directory
const OPENCLAW_DEV_DIR = path.join(process.env.HOME || '', '.openclaw-dev');

// Format date as YYYY-MM-DD-HH-mm-ss
function getTimestampString(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

interface EvalCase {
  test_id: string;
  agent_target: string; // Used to identify which agent to test, maybe mapped to the message or tool
  input_prompt: string;
  expected_behavior: any;
}

// Helper to get actual agent id from workspace name
// E.g. 'workspace-info-processor' -> 'info-processor'
function getAgentId(agentTarget: string): string {
  if (agentTarget === 'main') return 'main';
  return agentTarget.replace('workspace-', '');
}

// Get session dir for a specific agent
function getSessionDir(agentId: string): string {
  return path.join(OPENCLAW_DEV_DIR, 'agents', agentId, 'sessions');
}

// Find the first session file in the target agent directory
async function getLatestSessionFile(agentId: string): Promise<string | null> {
  const sessionDir = getSessionDir(agentId);
  if (!fs.existsSync(sessionDir)) {
    return null;
  }
  const files = fs.readdirSync(sessionDir).filter(f => f.endsWith('.jsonl'));
  if (files.length === 0) return null;
  
  // Return the most recently modified session file
  const sortedFiles = files.map(file => ({
    name: file,
    time: fs.statSync(path.join(sessionDir, file)).mtime.getTime()
  })).sort((a, b) => b.time - a.time);

  return path.join(sessionDir, sortedFiles[0].name);
}

// Clear all session files for a specific agent
function clearAgentSessions(agentId: string) {
  const sessionDir = getSessionDir(agentId);
  if (!fs.existsSync(sessionDir)) {
    return;
  }
  const files = fs.readdirSync(sessionDir).filter(f => f.endsWith('.jsonl'));
  for (const file of files) {
    const filePath = path.join(sessionDir, file);
    fs.unlinkSync(filePath);
  }
  if (files.length > 0) {
    console.log(`🧹 已清理 [${agentId}] 的 ${files.length} 个历史 Session 文件`);
  }
}

// Clear all session files for all agents
function clearAllSessions() {
  const agentsDir = path.join(OPENCLAW_DEV_DIR, 'agents');
  if (!fs.existsSync(agentsDir)) return;
  
  const agents = fs.readdirSync(agentsDir);
  for (const agent of agents) {
    const agentPath = path.join(agentsDir, agent);
    if (fs.statSync(agentPath).isDirectory()) {
      clearAgentSessions(agent);
    }
  }
}

async function runTest(evalCase: EvalCase, resultsDir: string) {
  console.log(`\n==============================================`);
  console.log(`🚀 开始执行评测 Case: ${evalCase.test_id}`);
  console.log(`🤖 目标 Agent: ${evalCase.agent_target}`);
  console.log(`💬 输入: ${evalCase.input_prompt}`);
  
  try {
    const targetAgentId = getAgentId(evalCase.agent_target);

    // 1. 发送请求给 openclaw (使用 --dev 模式)
    const command = `openclaw --dev agent --agent "${targetAgentId}" --message "${evalCase.input_prompt}"`;
    console.log(`> 执行命令: ${command}`);
    
    // We use execSync here but wrapped in a try/catch. It might take a while depending on the LLM call.
    try {
        const stdout = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
        console.log(`[OpenClaw 输出]:\n${stdout}`);
    } catch (e: any) {
        console.warn(`[OpenClaw 警告/错误]: Command failed but we will still check the session logs. Details: ${e.message}`);
    }

    // 2. 获取对话记录
    const sessionFile = await getLatestSessionFile(targetAgentId);
    
    if (!sessionFile) {
        console.error(`❌ 找不到对应的 session 文件 (路径: ${getSessionDir(targetAgentId)})`);
        return;
    }

    console.log(`> 读取 Session 文件: ${sessionFile}`);
    const sessionContent = fs.existsSync(sessionFile) ? fs.readFileSync(sessionFile, 'utf-8') : '';
    
    // 3. 保存结果并清空 session
    const resultFilePath = path.join(resultsDir, `${evalCase.test_id}_result.jsonl`);
    fs.writeFileSync(resultFilePath, sessionContent);
    console.log(`✅ 结果已保存至: ${resultFilePath}`);

    // 清空原文件，改为直接删除文件以保持目录干净，并在后续使用 clearAllSessions 也行
    fs.unlinkSync(sessionFile);
    console.log(`🧹 已清理当前评测的 Session 文件`);

  } catch (error) {
    console.error(`❌ 执行测试时发生错误:`, error);
  }
}

async function main() {
  const timestamp = getTimestampString();
  const currentResultsDir = path.join(BASE_RESULTS_DIR, timestamp);

  // Ensure results dir exists
  if (!fs.existsSync(currentResultsDir)) {
    fs.mkdirSync(currentResultsDir, { recursive: true });
  }

  // Find all json files in dataset dirs
  const testFiles: string[] = [];
  
  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith('.json')) {
        testFiles.push(fullPath);
      }
    }
  };

  scanDir(DATASET_DIR);

  if (testFiles.length === 0) {
    console.log("未找到任何评测用例文件 (.json)。");
    return;
  }

  // Parse all json files and collect all cases
  const allEvalCases: EvalCase[] = [];
  for (const file of testFiles) {
    try {
      const fileContent = fs.readFileSync(file, 'utf-8');
      const parsed = JSON.parse(fileContent);
      if (Array.isArray(parsed)) {
        allEvalCases.push(...parsed);
      } else {
        // Fallback for single object json
        allEvalCases.push(parsed);
      }
    } catch (e) {
      console.error(`解析文件失败 ${file}:`, e);
    }
  }

  if (allEvalCases.length === 0) {
    console.log("未找到任何有效的评测用例。");
    return;
  }

  console.log(`找到 ${allEvalCases.length} 个评测用例（来源于 ${testFiles.length} 个文件），开始执行...`);
  
  // 清理所有的历史 sessions
  clearAllSessions();

  for (const evalCase of allEvalCases) {
    await runTest(evalCase, currentResultsDir);
  }
  
  console.log(`\n🎉 所有评测用例执行完毕！`);
}

main().catch(console.error);
