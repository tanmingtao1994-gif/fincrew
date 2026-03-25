import React from 'react';
import type { EvalTestCase } from '../../types/eval-data';

interface Props {
  testCase: EvalTestCase;
  onClick: (testId: string) => void;
}

export const TestCaseRow: React.FC<Props> = ({ testCase, onClick }) => {
  const isPass = testCase.status === 'pass';

  return (
    <div 
      className="border rounded-md p-4 mb-4 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors"
      onClick={() => onClick(testCase.test_id)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-800">{testCase.name}</h3>
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${isPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {testCase.status.toUpperCase()}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-2">{testCase.description}</p>
      
      <div className="flex gap-4 text-xs text-gray-500 mt-3 pt-3 border-t">
        <span>ID: <code className="bg-gray-100 px-1 rounded">{testCase.test_id}</code></span>
        {testCase.duration && <span>Duration: {testCase.duration}ms</span>}
        {testCase.has_logs && <span className="text-blue-600 font-medium">💬 Has LLM Logs</span>}
      </div>
      
      {!isPass && testCase.judge_reason && (
        <div className="mt-3 bg-red-50 text-red-700 p-2 rounded text-sm">
          <span className="font-semibold">Reason: </span> {testCase.judge_reason}
        </div>
      )}
    </div>
  );
};