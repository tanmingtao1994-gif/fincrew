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
    <div className="flex flex-col h-full w-full bg-gray-50 border-l border-gray-200 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)]">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-gray-800">Detail View</h2>
          <span className="font-mono text-gray-500 text-xs mt-1">{testId}</span>
        </div>
        <button 
          onClick={onBack}
          className="text-gray-400 hover:text-gray-800 transition-colors p-2 hover:bg-gray-100 rounded-full"
          title="Close details"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col bg-gray-50/50">
        <div className="w-full mx-auto max-w-4xl">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-500">Loading interaction logs...</div>
          ) : error ? (
            <div className="text-center text-red-500 mt-10 bg-red-50 p-4 rounded-lg">{error}</div>
          ) : (
            <MessageList messages={invocation?.messages || []} />
          )}
        </div>
      </main>
    </div>
  );
};