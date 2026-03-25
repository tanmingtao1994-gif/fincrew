import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { EvalData } from '../types/eval-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('eval-data.json', () => {
  it('should match the EvalData structure', () => {
    const dataPath = path.join(__dirname, '../public/eval-data.json');
    if (!fs.existsSync(dataPath)) {
      console.warn('eval-data.json not found, skipping structure check.');
      return;
    }

    const content = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(content);
    
    // 我们检查 data.runs 是否存在且为数组，因为目前 eval-view.ts 是输出 { runs: EvalData[], invocations: any }
    expect(data).toHaveProperty('runs');
    expect(Array.isArray(data.runs)).toBe(true);

    if (data.runs.length > 0) {
      const run = data.runs[0] as EvalData;
      
      expect(run).toHaveProperty('run_id');
      expect(typeof run.run_id).toBe('string');
      
      expect(run).toHaveProperty('timestamp');
      expect(typeof run.timestamp).toBe('string');
      
      expect(run).toHaveProperty('total');
      expect(typeof run.total).toBe('number');
      
      expect(run).toHaveProperty('passed');
      expect(typeof run.passed).toBe('number');
      
      expect(run).toHaveProperty('failed');
      expect(typeof run.failed).toBe('number');
      
      expect(run).toHaveProperty('cases');
      expect(Array.isArray(run.cases)).toBe(true);

      if (run.cases.length > 0) {
        const testCase = run.cases[0];
        expect(testCase).toHaveProperty('test_id');
        expect(typeof testCase.test_id).toBe('string');
        
        expect(testCase).toHaveProperty('name');
        expect(typeof testCase.name).toBe('string');
        
        expect(testCase).toHaveProperty('description');
        expect(typeof testCase.description).toBe('string');
        
        expect(testCase).toHaveProperty('expected_behavior');
        expect(typeof testCase.expected_behavior).toBe('string');
        
        expect(['pass', 'fail']).toContain(testCase.status);
        
        if (testCase.has_logs && testCase.llm_messages && testCase.llm_messages.length > 0) {
          const msg = testCase.llm_messages[0];
          expect(msg).toHaveProperty('role');
          expect(typeof msg.role).toBe('string');
          expect(msg).toHaveProperty('content');
          expect(typeof msg.content === 'string' || Array.isArray(msg.content)).toBe(true);
        }
      }
    }
  });
});
