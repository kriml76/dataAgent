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
import { Card, Row, Col, Avatar, Tag, Button, Spin, Empty } from 'antd';
import { RobotOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import agentService from '@/services/agent';
import type { Agent } from '@/services/agent';

const AgentListPage: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await agentService.list();
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ color: '#6b6b6b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
          Agent Directory
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600, color: '#1a1a1a' }}>Your Intelligence Agents</h1>
        <p style={{ color: '#6b6b6b', marginTop: 8 }}>
          Manage and configure your specialized AI agents
        </p>
      </div>

      {/* Agent Grid */}
      <Spin spinning={loading}>
        {agents.length === 0 && !loading ? (
          <Empty description="No agents found" />
        ) : (
          <Row gutter={[24, 24]}>
            {agents.map((agent) => (
              <Col xs={24} sm={12} lg={8} key={agent.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/agent?agentId=${agent.id}`)}
                  style={{ height: '100%' }}
                  bodyStyle={{ padding: 24 }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <Avatar size={48} icon={<RobotOutlined />} style={{ backgroundColor: 'rgba(193,127,89,0.1)' }} />
                    <Tag color="green" style={{ borderRadius: 4 }}>
                      <span style={{ marginRight: 4 }}>●</span>
                      Active
                    </Tag>
                  </div>

                  {/* Content */}
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600 }}>{agent.name}</h3>
                  <p style={{ color: '#6b6b6b', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    {agent.description || 'No description available'}
                  </p>

                  {/* Footer */}
                  {agent.tags && agent.tags.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ color: '#6b6b6b', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                        Capabilities
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {agent.tags.split(',').map((tag) => (
                          <Tag key={tag.trim()} style={{ borderRadius: 4 }}>{tag.trim()}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            ))}

            {/* Create New Agent Card */}
            <Col xs={24} sm={12} lg={8}>
              <Card
                hoverable
                onClick={() => navigate('/agent/new')}
                style={{
                  height: '100%',
                  border: '2px dashed #d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                bodyStyle={{ padding: 24, textAlign: 'center' }}
              >
                <div>
                  <PlusOutlined style={{ fontSize: 48, color: '#c17f59', marginBottom: 16 }} />
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#c17f59' }}>Create New Agent</div>
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default AgentListPage;
