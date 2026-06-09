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

import React from 'react';
import { Card, Table, Button, Input, Space, Tag } from 'antd';
import { SearchOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface BusinessKnowledge {
  id: number;
  businessTerm: string;
  description: string;
  synonyms: string;
  isRecall: boolean;
}

const KnowledgeBusinessPage: React.FC = () => {
  // Mock data
  const dataSource: BusinessKnowledge[] = [
    { id: 1, businessTerm: 'Revenue', description: 'Total income generated', synonyms: 'income, earnings', isRecall: true },
    { id: 2, businessTerm: 'Customer', description: 'End user of products', synonyms: 'client, buyer', isRecall: true },
  ];

  const columns: ColumnsType<BusinessKnowledge> = [
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
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default KnowledgeBusinessPage;
