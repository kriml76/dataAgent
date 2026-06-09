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
import { Card, Form, Input, Button, Space } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const NewAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    console.log('Create agent:', values);
    // TODO: Call API to create agent
    navigate('/agent');
  };

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ color: '#6b6b6b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
          Create Agent
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600, color: '#1a1a1a' }}>New Intelligence Agent</h1>
        <p style={{ color: '#6b6b6b', marginTop: 8 }}>
          Configure your new specialized AI agent
        </p>
      </div>

      {/* Form */}
      <Card bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            name: '',
            description: '',
            tags: '',
          }}
        >
          <Form.Item
            label="Agent Name"
            name="name"
            rules={[{ required: true, message: 'Please enter agent name' }]}
          >
            <Input placeholder="Enter agent name" size="large" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea
              placeholder="Describe what this agent does..."
              rows={4}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Tags"
            name="tags"
            extra="Separate tags with commas (e.g., SQL, Analytics, Report)"
          >
            <Input placeholder="SQL, Analytics, Report" size="large" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
                Create Agent
              </Button>
              <Button icon={<CloseOutlined />} size="large" onClick={() => navigate('/agent')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default NewAgentPage;
