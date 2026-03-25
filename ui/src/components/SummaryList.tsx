import React, { useState } from 'react';
import { Layout, Menu, Table, Tag, Typography, Button, Space, Badge, Tooltip } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { EvalRun, TestCase } from '../types';

const { Sider, Content } = Layout;
const { Text } = Typography;

interface Props {
  runs: EvalRun[];
  onSelectTest: (testId: string) => void;
}

export const SummaryList: React.FC<Props> = ({ runs, onSelectTest }) => {
  const [selectedRunId, setSelectedRunId] = useState<string>(runs[0]?.run_id || '');

  if (runs.length === 0) {
    return <div className="text-center p-8 text-gray-500">No evaluation runs found.</div>;
  }

  const selectedRun = runs.find(r => r.run_id === selectedRunId) || runs[0];

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        status === 'pass' 
          ? <Tag icon={<CheckCircleOutlined />} color="success">PASS</Tag>
          : <Tag icon={<CloseCircleOutlined />} color="error">FAIL</Tag>
      ),
      filters: [
        { text: 'Pass', value: 'pass' },
        { text: 'Fail', value: 'fail' },
      ],
      onFilter: (value: any, record: TestCase) => record.status === value,
    },
    {
      title: 'Test Case',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
      render: (text: string, record: TestCase) => (
        <div>
          <div className="font-medium">{text}</div>
          <Text type="secondary" className="text-xs font-mono">{record.test_id}</Text>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '35%',
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <div className="line-clamp-2 text-gray-600 text-sm">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'judge_reason',
      key: 'judge_reason',
      render: (text: string, record: TestCase) => (
        record.status === 'pass' ? null : (
          <Tooltip title={text} placement="topLeft">
            <div className="line-clamp-2 text-red-600 text-sm">{text}</div>
          </Tooltip>
        )
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, record: TestCase) => (
        <Button 
          type="link" 
          size="small" 
          icon={<SearchOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onSelectTest(record.test_id);
          }}
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <Layout className="h-full bg-white flex-row overflow-hidden">
      <Sider width={260} className="bg-gray-50 border-r border-gray-200" theme="light">
        <div className="flex flex-col h-full w-full">
          <div className="p-4 border-b border-gray-200 bg-gray-50 shrink-0">
            <Text strong type="secondary" className="uppercase text-xs tracking-wider">Evaluation Runs</Text>
          </div>
          <div className="flex-1 overflow-y-auto w-full">
            <Menu
              mode="inline"
              selectedKeys={[selectedRunId]}
              className="border-r-0 bg-transparent w-full"
              items={runs.map(run => {
              const passRate = run.total > 0 ? Math.round((run.passed / run.total) * 100) : 0;
              return {
                key: run.run_id,
                onClick: () => setSelectedRunId(run.run_id),
                style: { height: 'auto', minHeight: '60px', padding: '12px 16px', lineHeight: '1.2' },
                label: (
                  <div className="flex flex-col gap-2 w-full pt-1">
                    <div className="text-sm font-medium truncate" title={run.run_id}>{run.run_id}</div>
                    <div className="flex items-center justify-between text-xs w-full">
                      <Text type="secondary" className="truncate">{run.total} cases</Text>
                      <Badge 
                        count={`${passRate}%`} 
                        style={{ 
                          backgroundColor: passRate === 100 ? '#52c41a' : '#ff4d4f',
                          fontSize: '11px',
                          boxShadow: 'none'
                        }} 
                      />
                    </div>
                  </div>
                ),
              };
            })}
          />
        </div>
        </div>
      </Sider>

      <Content className="flex flex-col h-full bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <Space size="large">
            <Text strong className="text-lg">{selectedRun.run_id}</Text>
            <Space>
              <Tag>Total: {selectedRun.total}</Tag>
              <Tag color="success">Passed: {selectedRun.passed}</Tag>
              <Tag color="error">Failed: {selectedRun.failed}</Tag>
            </Space>
          </Space>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <Table 
            columns={columns} 
            dataSource={selectedRun.cases} 
            rowKey="test_id"
            pagination={false}
            size="middle"
            onRow={(record) => ({
              onClick: () => onSelectTest(record.test_id),
              className: 'cursor-pointer hover:bg-blue-50/30'
            })}
            rowClassName={(record) => record.status === 'fail' ? 'bg-red-50/20' : ''}
          />
        </div>
      </Content>
    </Layout>
  );
};