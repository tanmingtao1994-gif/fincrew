import React, { useState } from 'react';
import { EvalRun, TestCase } from '../types';

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

  const passRate = selectedRun.total > 0 ? Math.round((selectedRun.passed / selectedRun.total) * 100) : 0;

  return (
    <div className="flex h-full w-full">
      {/* Sidebar for runs */}
      <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto hidden md:block shrink-0">
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-gray-50/95 backdrop-blur z-10">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Evaluation Runs</h2>
        </div>
        <div className="p-2 space-y-1">
          {runs.map(run => {
             const runPassRate = run.total > 0 ? Math.round((run.passed / run.total) * 100) : 0;
             return (
              <div 
                key={run.run_id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedRunId === run.run_id ? 'bg-blue-50 border border-blue-200' : 'border border-transparent hover:bg-gray-200/50'}`}
                onClick={() => setSelectedRunId(run.run_id)}
              >
                <div className={`text-sm font-medium truncate ${selectedRunId === run.run_id ? 'text-blue-900' : 'text-gray-800'}`}>
                  {run.run_id}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    {run.total} cases
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${runPassRate === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {runPassRate}% Pass
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content for test cases */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Top metrics bar */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800 tracking-tight">{selectedRun.run_id}</h1>
            <div className="flex gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Total: {selectedRun.total}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                Passed: {selectedRun.passed}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                Failed: {selectedRun.failed}
              </span>
            </div>
          </div>
        </div>

        {/* Table container */}
        <div className="flex-1 overflow-auto bg-gray-50/30">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Test Case
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result Reason
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedRun.cases.map((tc: TestCase) => {
                const isPass = tc.status === 'pass';
                return (
                  <tr 
                    key={tc.test_id} 
                    className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                    onClick={() => onSelectTest(tc.test_id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${isPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {isPass ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 break-words">
                      {tc.name}
                      <div className="text-xs text-gray-400 font-normal mt-1 font-mono">{tc.test_id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="line-clamp-3" title={tc.description}>
                        {tc.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {!isPass && tc.judge_reason ? (
                        <div className="line-clamp-3 text-red-600" title={tc.judge_reason}>
                          {tc.judge_reason}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No specific reason logged</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTest(tc.test_id);
                        }}
                        className="text-blue-600 hover:text-blue-900 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-3 py-1 rounded"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
              {selectedRun.cases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 italic">
                    No test cases in this run.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};