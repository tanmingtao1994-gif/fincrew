import React, { useEffect, useState } from 'react';
import { fetchRuns } from '../api';
import { EvalRun } from '../types';
import { SummaryList } from '../components/SummaryList';

interface Props {
  onSelectTest: (testId: string) => void;
}

export const HomePage: React.FC<Props> = ({ onSelectTest }) => {
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRuns()
      .then(data => {
        setRuns(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load evaluation data. Ensure the CLI is running.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-gray-500">Loading evaluation runs...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-white">
      <header className="bg-white border-b px-6 py-4 flex items-center shadow-sm z-10 shrink-0">
        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <span>📊</span> Eval Results Viewer
        </h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <SummaryList runs={runs} onSelectTest={onSelectTest} />
      </main>
    </div>
  );
};