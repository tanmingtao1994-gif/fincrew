import React, { useEffect, useState } from 'react';
import { Layout, Typography, Spin, Alert } from 'antd';
import { fetchRuns } from '../api';
import { EvalRun } from '../types';
import { SummaryList } from '../components/SummaryList';

const { Header, Content } = Layout;
const { Title } = Typography;

interface Props {
  onSelectTest: (testId: string) => void;
}

export const HomePage: React.FC<Props> = ({ onSelectTest }) => {
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRuns()
      .then(data => {
        setRuns(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load evaluation data. Ensure the CLI is running.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><Spin size="large" /></div>;
  if (error) return <div className="p-8"><Alert message="Error" description={error} type="error" showIcon /></div>;

  return (
    <Layout className="h-full w-full bg-white">
      <Header className="bg-white border-b px-6 flex items-center h-14" style={{ padding: '0 24px', background: '#fff' }}>
        <Title level={4} style={{ margin: 0 }} className="flex items-center gap-2">
          <span>📊</span> Eval Results Viewer
        </Title>
      </Header>
      <Content className="overflow-hidden bg-white">
        <SummaryList runs={runs} onSelectTest={onSelectTest} />
      </Content>
    </Layout>
  );
};