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
    <div className="flex flex-col p-4 bg-gray-50/30 max-w-5xl mx-auto w-full gap-2">
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} role={msg.role} timestamp={msg.timestamp}>
          {typeof msg.content === 'string' ? (
             <div className="prose prose-sm max-w-none text-gray-800">
               <ReactMarkdown>{msg.content}</ReactMarkdown>
             </div>
          ) : Array.isArray(msg.content) ? (
            <div className="flex flex-col gap-3">
              {msg.content.map((block: any, bIdx: number) => {
                if (block.type === 'thinking' && (block.text || block.thinking)) {
                  return <ThinkingBlock key={bIdx} text={block.text || block.thinking || ''} />;
                }
                if (block.type === 'text' && block.text) {
                  return (
                    <div key={bIdx} className="prose prose-sm max-w-none text-gray-800">
                       <ReactMarkdown>{block.text}</ReactMarkdown>
                    </div>
                  );
                }
                if (block.type === 'toolCall' || block.type === 'tool_use') {
                   return <ToolCallBlock key={bIdx} name={block.name || 'unknown'} args={block.arguments || block.input} />;
                }
                if (block.type === 'toolResult' || block.type === 'tool_result') {
                   // Pass the tool call info to ToolResultBlock if available in the same block array
                   const prevBlock: any = bIdx > 0 ? msg.content[bIdx - 1] : null;
                   const toolName = (prevBlock && (prevBlock.type === 'toolCall' || prevBlock.type === 'tool_use')) ? prevBlock.name : undefined;
                   return <ToolResultBlock key={bIdx} name={toolName} result={block.result || block.text || 'No result data'} />;
                }
                
                // Fallback for unknown block types
                return (
                  <div key={bIdx}>
                    <span>{block.type}</span>
                    <pre className="text-xs overflow-x-auto">{JSON.stringify(block, null, 2)}</pre>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-red-500">Invalid message content format</div>
          )}
        </MessageBubble>
      ))}
    </div>
  );
};