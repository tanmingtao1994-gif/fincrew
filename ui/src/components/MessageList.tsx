import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { LLMMessage } from '../../types/eval-data';
import { MessageBubble } from './MessageBubble';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallBlock, ToolResultBlock } from './ToolBlocks';

interface Props {
  messages: LLMMessage[];
}

export const MessageList: React.FC<Props> = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return <div className="text-gray-500 italic p-4 text-center">No LLM interactions recorded for this case.</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} role={msg.role} timestamp={msg.timestamp}>
          {typeof msg.content === 'string' ? (
             <div className="prose prose-sm max-w-none prose-blue">
               <ReactMarkdown>{msg.content}</ReactMarkdown>
             </div>
          ) : Array.isArray(msg.content) ? (
            <>
              {msg.content.map((block: any, bIdx: number) => {
                if (block.type === 'thinking' && (block.text || block.thinking)) {
                  return <ThinkingBlock key={bIdx} text={block.text || block.thinking || ''} />;
                }
                if (block.type === 'text' && block.text) {
                  return (
                    <div key={bIdx} className="prose prose-sm max-w-none prose-blue mt-2 first:mt-0">
                       <ReactMarkdown>{block.text}</ReactMarkdown>
                    </div>
                  );
                }
                if (block.type === 'toolCall' || block.type === 'tool_use') {
                   return <ToolCallBlock key={bIdx} name={block.name || 'unknown'} args={block.arguments || block.input} />;
                }
                if (block.type === 'toolResult' || block.type === 'tool_result') {
                   return <ToolResultBlock key={bIdx} result={block.result || block.text || 'No result data'} />;
                }
                
                // Fallback for unknown block types
                return (
                  <div key={bIdx} className="bg-gray-100 p-2 rounded border border-gray-300">
                    <span className="font-semibold text-xs text-red-600 uppercase">[{block.type}]</span>
                    <pre className="text-xs mt-1 overflow-x-auto">{JSON.stringify(block, null, 2)}</pre>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="text-red-500">Invalid message content format</div>
          )}
        </MessageBubble>
      ))}
    </div>
  );
};