import React, { useEffect, useState } from 'react';
import { fetchInvocations } from '../api';
import { LLMInvocation } from '../types';
import { MessageList } from '../components/MessageList';

interface Props {
  testId: string;
  onBack: () => void;
}

export const DetailViewPage: React.FC<Props> = ({ testId, onBack }) => {
  const [invocation, setInvocation] = useState<LLMInvocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchInvocations(testId)
      .then(data => {
        setInvocation(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load LLM invocations.');
        setLoading(false);
      });
  }, [testId]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="text-gray-500 hover:text-gray-800 transition-colors px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium"
          >
            ← Back
          </button>
          <h2 className="text-lg font-bold text-gray-800">
            Case: <span className="font-mono text-blue-600 font-normal">{testId}</span>
          </h2>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div className="w-full max-w-5xl">
          {loading ? (
            <div className="text-center text-gray-500 mt-10">Loading interaction logs...</div>
          ) : error ? (
            <div className="text-center text-red-500 mt-10">{error}</div>
          ) : (
            <MessageList messages={invocation?.messages || []} />
          )}
        </div>
      </main>
    </div>
  );
};