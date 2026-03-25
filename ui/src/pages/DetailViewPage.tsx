import React, { useEffect, useState } from 'react';
import { Drawer, Spin, Alert, Typography } from 'antd';
import { fetchInvocations } from '../api';
import type { LLMInvocation } from '../types';
import { MessageList } from '../components/MessageList';

const { Text } = Typography;

interface Props {
  testId: string | null;
  onClose: () => void;
}

export const DetailViewPage: React.FC<Props> = ({ testId, onClose }) => {
  const [invocation, setInvocation] = useState<LLMInvocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) return;
    
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
    <Drawer
      title={
        <div className="flex flex-col">
          <span className="text-lg font-bold mr-4" style={{marginRight: '8px'}}>Detail View</span>
          <Text type="secondary" className="font-mono text-xs">{testId}</Text>
        </div>
      }
      placement="right"
      width="80%"
      onClose={onClose}
      open={!!testId}
      bodyStyle={{ backgroundColor: '#f9fafb', padding: 0 }}
      destroyOnClose
    >
      <div className="h-full overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <div className="flex items-center justify-center h-64"><Spin size="large" /></div>
          ) : error ? (
            <Alert message="Error" description={error} type="error" showIcon className="mt-4" />
          ) : (
            <MessageList messages={invocation?.messages || []} />
          )}
        </div>
      </div>
    </Drawer>
  );
};