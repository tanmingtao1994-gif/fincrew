import React, { useState } from 'react';

export const ToolCallBlock: React.FC<{ name: string; args: any }> = () => {
  return null; // hide tool call, only show tool result
};

export const ToolResultBlock: React.FC<{ name?: string, result: any }> = ({ name, result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);

  return (
    <div className="my-2 max-w-2xl border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div 
        className="px-4 py-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="scale-75 origin-left text-gray-500 font-mono text-xs">{isExpanded ? '▼' : '▶'}</span>
          <span className="text-red-500">⚡</span>
          <span className="text-sm font-medium text-gray-700">Tool output</span>
          {name && <span className="text-sm text-gray-500 font-mono">{name}</span>}
        </div>
      </div>
      {isExpanded && (
        <div className="p-4 bg-white">
          <pre className="text-sm text-gray-700 m-0 font-mono whitespace-pre-wrap break-all">
            {contentStr}
          </pre>
        </div>
      )}
    </div>
  );
};