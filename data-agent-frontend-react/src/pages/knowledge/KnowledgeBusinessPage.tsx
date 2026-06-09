/*
 * Copyright 2026 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Space, Tag, Spin, Empty } from 'antd';
import { SearchOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import businessKnowledgeService from '@/services/businessKnowledge';
import type { BusinessKnowledgeVO } from '@/services/businessKnowledge';

const KnowledgeBusinessPage: React.FC = () => {
  const [dataSource, setDataSource] = useState<BusinessKnowledgeVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Get agentId from route or context
      const agentId = 1; // Placeholder
      const data = await businessKnowledgeService.list(agentId, searchKeyword || undefined);
      setDataSource(data);
    } catch (error) {
      console.error('Failed to load business knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<BusinessKnowledgeVO> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Business Term', dataIndex: 'businessTerm', key: 'businessTerm' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Synonyms', dataIndex: 'synonyms', key: 'synonyms' },
    {
      title: 'Recall',
      dataIndex: 'isRecall',
      key: 'isRecall',
      render: (isRecall: boolean) => <Tag color={isRecall ? 'green' : 'default'}>{isRecall ? 'Yes' : 'No'}</Tag>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Business Lexicon</h1>
        <p style={{ color: '#6b6b6b', marginTop: 8 }}>
          Manage global business terminology with synonym expansion and vector recall.
        </p>
      </div>

      {/* Actions */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="Search business terms..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
          />
          <Button icon={<SyncOutlined />}>Sync to Vector Store</Button>
          <Button type="primary" icon={<PlusOutlined />}>Add Knowledge</Button>
        </Space>
      </Card>

      {/* Table */}
      <Card bordered={false}>
        <Spin spinning={loading}>
          {dataSource.length === 0 && !loading ? (
            <Empty description="No business knowledge found" />
          ) : (
            <Table
              columns={columns}
              dataSource={dataSource}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default KnowledgeBusinessPage;
