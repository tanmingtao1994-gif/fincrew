import React, { useState } from 'react';

interface Props {
  text: string;
}

export const ThinkingBlock: React.FC<Props> = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="my-1">
      <div 
        className="text-sm text-gray-800 flex items-center gap-1 cursor-pointer w-fit select-none font-mono"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>🧠 Thinking({text.length} chars)</span>
      </div>
      <div className="text-sm text-gray-800 flex items-center gap-1 cursor-pointer w-fit select-none font-mono mt-1" onClick={() => setIsExpanded(!isExpanded)}>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="mt-1 text-sm text-gray-800 font-mono whitespace-pre-wrap break-words">
          {text}
        </div>
      )}
    </div>
  );
};