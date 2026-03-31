const fs = require('fs');
let code = fs.readFileSync('/Users/taotanming/projects/ai/financial-agent/eval-view.ts', 'utf-8');

code = code.replace(/async function getInvocations\(\) \{[\s\S]*?return invocations;\n\}/, `async function getInvocations() {
   const invokePath = path.join(TESTS_DIR, 'llm_invoke_results');
   const invocationsByRun = new Map();
   try {
     const timestampDirs = await fs.readdir(invokePath);
     for (const tsDir of timestampDirs) {
       if (tsDir.startsWith('.')) continue;
       const fullTsDirPath = path.join(invokePath, tsDir);
       const stat = await fs.stat(fullTsDirPath);
       if (stat.isDirectory()) {
         const runInvocations = new Map();
         const files = await fs.readdir(fullTsDirPath);
         for (const file of files) {
           if (file.endsWith('.jsonl')) {
             const testId = file.replace('.jsonl', '');
             const content = await fs.readFile(path.join(fullTsDirPath, file), 'utf-8');
             const lines = content.split('\\n').filter(Boolean);
             const messages = lines.map(line => {
               try { 
                 const obj = JSON.parse(line); 
                 if (obj.type === 'message' && obj.message) {
                   return {
                     role: obj.message.role,
                     content: obj.message.content,
                     timestamp: obj.timestamp,
                     source: obj
                   };
                 }
                 return null;
               } catch (e) { 
                 console.warn(\`Warning: Could not parse line in \${file}\`);
                 return null; 
               }
             }).filter(Boolean);
             runInvocations.set(testId, messages);
           }
         }
         invocationsByRun.set(tsDir, runInvocations);
       }
     }
   } catch (err) {
     console.warn(\`Notice: Could not read llm_invoke_results dir. Details: \${err}. The viewer will still function but details will be empty.\`);
   }
   return invocationsByRun;
}`);

code = code.replace(/const formattedRuns: EvalData\[\]  = rawRuns\.map\(run => \{[\s\S]*?return \{/m, `const formattedRuns: EvalData[]  = rawRuns.map(run => {
    // Process results to form TestCase objects
    const runInvocations = invocations.get(run.run_id) || new Map();
    const cases = (run.results || []).map((res: any) => {
       const datasetInfo = datasets.get(res.test_id) || {};
       const messages = runInvocations.get(res.test_id) || runInvocations.get(\`\${res.test_id}_result\`) || [];
       return {
         test_id: res.test_id,
         name: datasetInfo.name || res.test_id,
         description: datasetInfo.description || '',
         expected_behavior: datasetInfo.expected_behavior || '',
         status: res.status,
         score: res.score,
         judge_reason: res.reason,
         has_logs: messages.length > 0,
         llm_messages: messages
       };
    });

    return {`);

fs.writeFileSync('/Users/taotanming/projects/ai/financial-agent/eval-view.ts', code);
