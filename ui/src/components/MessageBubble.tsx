import React from 'react';

interface Props {
  role: string;
  timestamp?: string;
  children: React.ReactNode;
}

export const MessageBubble: React.FC<Props> = ({ role, timestamp, children }) => {
  const isUser = role === 'user';
  
  return (
    <div className={`p-4 rounded-lg shadow-sm border max-w-4xl w-full ${isUser ? 'bg-blue-50 ml-auto border-blue-200' : 'bg-white mr-auto border-gray-200'}`}>
      <div className="font-bold text-xs text-gray-500 mb-2 uppercase tracking-wide border-b border-gray-100 pb-1 flex items-center">
        <span className={`px-2 py-0.5 rounded text-white mr-2 ${isUser ? 'bg-blue-500' : 'bg-green-600'}`}>
          {role}
        </span>
        {timestamp && <span className="font-normal text-gray-400">{new Date(timestamp).toLocaleTimeString()}</span>}
      </div>
      <div className="text-sm text-gray-800 break-words whitespace-pre-wrap flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
};