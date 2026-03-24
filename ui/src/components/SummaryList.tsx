import React, { useState } from 'react';
import { EvalRun } from '../types';
import { TestCaseRow } from './TestCaseRow';

interface Props {
  runs: EvalRun[];
  onSelectTest: (testId: string) => void;
}

export const SummaryList: React.FC<Props> = ({ runs, onSelectTest }) => {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(runs[0]?.run_id || null);

  if (runs.length === 0) {
    return <div className="text-center p-8 text-gray-500">No evaluation runs found.</div>;
  }

  const selectedRun = runs.find(r => r.run_id === selectedRunId) || runs[0];

  return (
    <div className="flex h-full">
      {/* Sidebar for runs */}
      <div className="w-64 border-r bg-gray-50 overflow-y-auto p-4 hidden md:block">
        <h2 className="text-lg font-bold mb-4 text-gray-700">Eval Runs</h2>
        {runs.map(run => (
          <div 
            key={run.run_id}
            className={`p-3 rounded-md mb-2 cursor-pointer border ${selectedRunId === run.run_id ? 'bg-white border-blue-500 shadow-sm' : 'border-transparent hover:bg-gray-100'}`}
            onClick={() => setSelectedRunId(run.run_id)}
          >
            <div className="text-sm font-medium truncate">{run.run_id}</div>
            <div className="text-xs text-gray-500 mt-1 flex justify-between">
              <span>Cases: {run.total}</span>
              <span className={run.failed > 0 ? 'text-red-500 font-medium' : 'text-green-600'}>
                {run.passed}/{run.total} Pass
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main content for test cases */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">Run: {selectedRun.run_id}</h1>
          <div className="flex gap-6 mt-2 text-sm">
            <span className="bg-gray-100 px-3 py-1 rounded text-gray-700">Total: <b>{selectedRun.total}</b></span>
            <span className="bg-green-100 px-3 py-1 rounded text-green-800">Passed: <b>{selectedRun.passed}</b></span>
            <span className="bg-red-100 px-3 py-1 rounded text-red-800">Failed: <b>{selectedRun.failed}</b></span>
          </div>
        </div>

        <div className="space-y-4">
          {selectedRun.cases.map(tc => (
            <TestCaseRow key={tc.test_id} testCase={tc} onClick={onSelectTest} />
          ))}
          {selectedRun.cases.length === 0 && (
             <div className="text-gray-500 italic text-center py-8">No test cases in this run.</div>
          )}
        </div>
      </div>
    </div>
  );
};