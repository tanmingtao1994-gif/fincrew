import React, { useState, useRef, useEffect } from 'react';
import { UserOutlined, RobotOutlined, ToolOutlined } from '@ant-design/icons';

interface Props {
  role: string;
  timestamp?: string;
  children: React.ReactNode;
}

export const MessageBubble: React.FC<Props> = ({ role, timestamp, children }) => {
  const isUser = role === 'user';
  const isTool = role === 'tool';
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if the content is taller than ~5 lines (approx 100px)
    if (contentRef.current) {
      if (contentRef.current.scrollHeight > 120) {
        setShowExpandButton(true);
      }
    }
  }, [children]);

  return (
    <div className={`py-4 w-full flex gap-4 max-w-4xl mx-auto ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="flex-shrink-0 mt-1">
        <div className={`w-8 h-8 rounded flex items-center justify-center ${
          isUser ? 'bg-orange-100 text-orange-500' : 
          isTool ? 'bg-gray-200 text-gray-600' : 
          'bg-blue-100 text-blue-500'
        }`}>
          {isUser ? <UserOutlined /> : isTool ? <ToolOutlined /> : <RobotOutlined />}
        </div>
      </div>
      <div className={`flex-1 min-w-0 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 mb-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="font-semibold text-sm text-gray-700 capitalize">{role}</span>
          {timestamp && <span className="text-xs text-gray-400">{new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}</span>}
        </div>
        <div className={`text-sm text-gray-800 break-words whitespace-pre-wrap flex flex-col gap-3 w-fit max-w-full ${
          isUser ? 'bg-orange-50 p-4 rounded-2xl rounded-tr-sm' : 
          isTool ? 'bg-gray-100 p-4 rounded-2xl rounded-tl-sm' : 
          'bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-sm shadow-sm'
        }`}>
          <div 
            ref={contentRef}
            className={`relative overflow-hidden transition-all duration-300 ${!isExpanded && showExpandButton ? 'max-h-[120px]' : ''}`}
          >
            {children}
            {!isExpanded && showExpandButton && (
              <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t to-transparent flex items-end justify-center ${
                isUser ? 'from-orange-50' : 
                isTool ? 'from-gray-100' : 
                'from-white'
              }`} />
            )}
          </div>
          {showExpandButton && (
            <div className={`mt-1 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors cursor-pointer select-none"
              >
                {isExpanded ? '收起 (Show Less)' : '展开 (Show More)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};