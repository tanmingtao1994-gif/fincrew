import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we are running this script correctly
const TESTS_DIR = path.join(__dirname, 'tests');

async function checkTestsDir() {
  try {
    await fs.access(TESTS_DIR);
    return true;
  } catch {
    return false;
  }
}

async function getDatasets() {
  const datasetPath = path.join(TESTS_DIR, 'eval_dataset');
  const datasets = new Map();
  try {
    const files = await fs.readdir(datasetPath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(datasetPath, file), 'utf-8');
        const data = JSON.parse(content);
        if (data.id) {
           datasets.set(data.id, data);
        }
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not read eval_dataset dir: ${err}`);
  }
  return datasets;
}

async function getResults() {
  const resultsPath = path.join(TESTS_DIR, 'eval_results');
  const runs = [];
  try {
    const files = await fs.readdir(resultsPath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(resultsPath, file), 'utf-8');
        const data = JSON.parse(content);
        runs.push({
          file: file,
          run_id: data.timestamp || file.replace('.json', ''),
          ...data
        });
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not read eval_results dir: ${err}`);
  }
  return runs;
}

async function getInvocations() {
   const invokePath = path.join(TESTS_DIR, 'llm_invoke_results');
   const invocations = new Map();
   try {
     const files = await fs.readdir(invokePath);
     for (const file of files) {
       if (file.endsWith('.jsonl')) {
         const testId = file.replace('.jsonl', '');
         const content = await fs.readFile(path.join(invokePath, file), 'utf-8');
         const lines = content.split('\n').filter(Boolean);
         const messages = lines.map(line => {
           try { return JSON.parse(line); } catch (e) { 
             console.warn(`Warning: Could not parse line in ${file}`);
             return null; 
           }
         }).filter(Boolean);
         invocations.set(testId, messages);
       }
     }
   } catch (err) {
     console.warn(`Notice: Could not read llm_invoke_results dir. Details: ${err}. The viewer will still function but details will be empty.`);
   }
   return invocations;
}

async function start() {
  const hasTests = await checkTestsDir();
  if (!hasTests) {
    console.error(`Error: 'tests' directory not found at ${TESTS_DIR}`);
    process.exit(1);
  }

  console.log('Loading local evaluation data...');
  const datasets = await getDatasets();
  const rawRuns = await getResults();
  const invocations = await getInvocations();

  const formattedRuns = rawRuns.map(run => {
    // Process results to form TestCase objects
    const cases = (run.results || []).map((res: any) => {
       const datasetInfo = datasets.get(res.test_id) || {};
       return {
         test_id: res.test_id,
         name: datasetInfo.name || res.test_id,
         description: datasetInfo.description || '',
         expected_behavior: datasetInfo.expected_behavior || '',
         status: res.status,
         score: res.score,
         judge_reason: res.reason,
         duration: res.duration_ms,
         has_logs: invocations.has(res.test_id)
       };
    });

    return {
      run_id: run.run_id,
      timestamp: run.timestamp || run.run_id,
      total: run.summary?.total || cases.length,
      passed: run.summary?.passed || cases.filter((c:any) => c.status === 'pass').length,
      failed: run.summary?.failed || cases.filter((c:any) => c.status === 'fail').length,
      cases
    };
  });
  
  // Sort runs by run_id (timestamp) descending
  formattedRuns.sort((a, b) => b.run_id.localeCompare(a.run_id));

  // Data to expose to Vite UI
  const invocationsObj = Object.fromEntries(invocations);

  const vite = await createServer({
    root: path.join(__dirname, 'ui'),
    server: {
      port: 3000,
      open: true
    },
    plugins: [
      {
        name: 'serve-eval-data',
        configureServer(server) {
          server.middlewares.use('/api/runs', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(formattedRuns));
          });
          server.middlewares.use('/api/invocations', (req, res) => {
            const url = new URL(req.url || '/', `http://${req.headers.host}`);
            const testId = url.searchParams.get('test_id');
            res.setHeader('Content-Type', 'application/json');
            if (testId && invocationsObj[testId]) {
              res.end(JSON.stringify({ test_id: testId, messages: invocationsObj[testId] }));
            } else if (!testId) {
               res.end(JSON.stringify(invocationsObj));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Not found' }));
            }
          });
        }
      }
    ]
  });

  await vite.listen();
  console.log(`Viewer started at http://localhost:3000`);
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
