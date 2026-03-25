import React, { useState } from 'react';

export const ToolCallBlock: React.FC<{ name: string; args: any }> = ({ name, args }) => {
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-md overflow-hidden mt-2">
      <div className="bg-indigo-100 text-indigo-800 px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-2">
        <span>🔧 Tool Call</span>
        <code className="bg-white px-1.5 py-0.5 rounded text-indigo-900 normal-case">{name}</code>
      </div>
      <div className="p-3 bg-gray-900 overflow-x-auto">
        <pre className="text-green-400 text-xs m-0 whitespace-pre-wrap break-all">
          {typeof args === 'string' ? args : JSON.stringify(args, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const ToolResultBlock: React.FC<{ result: any }> = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const contentStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
  const isLong = contentStr.length > 1000 || contentStr.split('\n').length > 20;

  return (
    <div className="bg-teal-50 border border-teal-200 rounded-md overflow-hidden mt-2">
       <div className="bg-teal-100 text-teal-800 px-3 py-1.5 text-xs font-bold uppercase">
        <span>✅ Tool Result</span>
      </div>
      <div className="relative bg-gray-900">
        <div className={`p-3 overflow-x-auto ${!isExpanded && isLong ? 'max-h-64 overflow-y-hidden' : ''}`}>
          <pre className="text-blue-300 text-xs m-0 font-mono whitespace-pre-wrap break-all">
            {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
          </pre>
        </div>
        {!isExpanded && isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-900 to-transparent flex items-end justify-center pb-2">
             <button 
               onClick={() => setIsExpanded(true)}
               className="bg-teal-700 text-white text-xs px-3 py-1 rounded hover:bg-teal-600 transition-colors shadow-lg"
             >
               Show More
             </button>
          </div>
        )}
        {isExpanded && isLong && (
          <div className="bg-gray-800 p-2 text-center border-t border-gray-700">
             <button 
               onClick={() => setIsExpanded(false)}
               className="text-gray-400 hover:text-white text-xs"
             >
               Show Less
             </button>
          </div>
        )}
      </div>
    </div>
  );
};