import React, { useState } from 'react';

interface Props {
  text: string;
}

export const ThinkingBlock: React.FC<Props> = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-100 rounded-md border border-gray-200 overflow-hidden">
      <div 
        className="px-3 py-2 bg-gray-200 text-gray-600 text-xs font-semibold uppercase flex items-center justify-between cursor-pointer hover:bg-gray-300 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span>🧠 Thinking</span>
          <span className="text-gray-400 font-normal normal-case">
             ({text.length} chars)
          </span>
        </div>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="p-3 text-sm text-gray-700 font-mono whitespace-pre-wrap break-words bg-gray-50 border-t border-gray-200">
          {text}
        </div>
      )}
    </div>
  );
};