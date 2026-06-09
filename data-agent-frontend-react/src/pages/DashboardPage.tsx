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
import { Card, Row, Col, Statistic } from 'antd';
import {
  MessageOutlined,
  DatabaseOutlined,
  RobotOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const DashboardPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ color: '#6b6b6b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
          Overview
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600, color: '#1a1a1a' }}>Data Insights</h1>
        <p style={{ color: '#6b6b6b', marginTop: 8 }}>
          Performance metrics and analytics from your intelligent agents
        </p>
      </div>

      {/* Stats Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ height: '100%' }}>
            <Statistic
              title="Conversations"
              value={1284}
              prefix={<MessageOutlined style={{ color: '#c17f59' }} />}
              suffix={
                <span style={{ fontSize: 14, color: '#52c41a' }}>
                  +12.5%
                </span>
              }
            />
            <div style={{ color: '#6b6b6b', fontSize: 12, marginTop: 8 }}>
              from last week
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ height: '100%' }}>
            <Statistic
              title="Queries Processed"
              value={8429}
              prefix={<DatabaseOutlined style={{ color: '#6b8f71' }} />}
              suffix={
                <span style={{ fontSize: 14, color: '#52c41a' }}>
                  +8.3%
                </span>
              }
            />
            <div style={{ color: '#6b6b6b', fontSize: 12, marginTop: 8 }}>
              from last week
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ height: '100%' }}>
            <Statistic
              title="Active Agents"
              value={6}
              prefix={<RobotOutlined style={{ color: '#8b7355' }} />}
              suffix={
                <span style={{ fontSize: 14, color: '#6b6b6b' }}>
                  Active
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ height: '100%' }}>
            <Statistic
              title="Success Rate"
              value={94.2}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#a67f59' }} />}
            />
            <div style={{ color: '#6b6b6b', fontSize: 12, marginTop: 8 }}>
              Average response accuracy
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Card
        title="Recent Activity"
        style={{ marginTop: 24 }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', padding: 40, color: '#6b6b6b' }}>
          No recent activity to display
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
