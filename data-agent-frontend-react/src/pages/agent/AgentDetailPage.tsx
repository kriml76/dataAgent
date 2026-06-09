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
import { Card, Descriptions, Tag, Avatar, Button, Space } from 'antd';
import { RobotOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const AgentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock data - will be replaced with real API call
  const agent = {
    id: Number(id),
    name: `Agent ${id}`,
    description: 'Specialized AI agent designed for data analysis and intelligent query processing.',
    tags: ['SQL', 'Analytics', 'Report'],
    status: 'active',
    createdTime: '2026-06-01',
    updatedTime: '2026-06-09',
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{ color: '#6b6b6b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
            Agent Profile
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600, color: '#1a1a1a' }}>{agent.name}</h1>
        </div>
        <Space>
          <Button icon={<EditOutlined />}>Edit</Button>
          <Button danger icon={<DeleteOutlined />}>Delete</Button>
        </Space>
      </div>

      {/* Agent Info */}
      <Card bordered={false}>
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <Avatar size={80} icon={<RobotOutlined />} style={{ backgroundColor: 'rgba(193,127,89,0.1)' }} />
          <div>
            <Tag color="green" style={{ borderRadius: 4, marginBottom: 8 }}>
              <span style={{ marginRight: 4 }}>●</span>
              Active
            </Tag>
            <p style={{ color: '#6b6b6b', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              {agent.description}
            </p>
          </div>
        </div>

        <Descriptions column={2} bordered>
          <Descriptions.Item label="Agent ID">{agent.id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color="green">Active</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created">{agent.createdTime}</Descriptions.Item>
          <Descriptions.Item label="Last Updated">{agent.updatedTime}</Descriptions.Item>
          <Descriptions.Item label="Tags" span={2}>
            <Space>
              {agent.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default AgentDetailPage;
