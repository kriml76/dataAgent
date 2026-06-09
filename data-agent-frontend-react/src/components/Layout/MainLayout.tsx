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
import { Layout, Menu, Select, Avatar, Button, Divider } from 'antd';
import {
  MenuOutlined,
  RobotOutlined,
  MessageOutlined,
  BookOutlined,
  DatabaseOutlined,
  SettingOutlined,
  PlusOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import agentService from '@/services/agent';
import modelConfigService from '@/services/modelConfig';
import type { Agent } from '@/services/agent';

const { Sider, Header, Content } = Layout;
const { Option } = Select;

interface AgentOption {
  id: number;
  name: string;
  title: string;
  value: number;
  subtitle: string;
  avatar?: string;
}

const routeTitleMap: Record<string, string> = {
  '/chat': 'Data Dialogue',
  '/dashboard': 'Data Insights',
  '/prompt-config': 'Prompt Craft',
  '/knowledge/business': 'Business Lexicon',
  '/knowledge/agents': 'Agent Memory',
  '/knowledge/semantic-models': 'Semantic Schema',
  '/system/data-sources': 'Data Sources',
  '/system/model-config': 'Model Registry',
  '/system/settings': 'Configuration',
  '/agent/new': 'Create Agent',
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>(undefined);
  const navigate = useNavigate();
  const location = useLocation();

  const currentRouteTitle = React.useMemo(() => {
    if (location.pathname.startsWith('/agent/') && location.pathname !== '/agent/new') {
      return 'Agent Profile';
    }
    return routeTitleMap[location.pathname] || 'Data Agent';
  }, [location.pathname]);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const list = await agentService.list();
      const options = list
        .filter((item): item is Agent & { id: number } => item.id !== undefined && item.id > 0)
        .map((item) => ({
          id: item.id,
          name: item.name || `Agent ${item.id}`,
          title: item.name || `Agent ${item.id}`,
          value: item.id,
          subtitle: '',
          avatar: undefined,
        }));
      setAgents(options);

      // Auto-select first agent
      if (options.length > 0 && !selectedAgentId) {
        setSelectedAgentId(options[0].id);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const handleAgentSwitch = (value: number) => {
    setSelectedAgentId(value);
    if (location.pathname.startsWith('/agent/') && location.pathname !== '/agent/new') {
      navigate(`/agent/${value}`);
    } else if (location.pathname !== '/agent/new') {
      navigate(`${location.pathname}?agentId=${value}`);
    }
  };

  const navigateToPath = (path: string) => {
    if (path === '/agent/new') {
      navigate(path);
      return;
    }
    if (selectedAgentId) {
      if (path.startsWith('/agent/') && path !== '/agent/new') {
        navigate(`/agent/${selectedAgentId}`);
        return;
      }
      navigate(`${path}?agentId=${selectedAgentId}`);
      return;
    }
    navigate(path);
  };

  const menuItems = [
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: 'Data Dialogue',
    },
    {
      key: '/prompt-config',
      icon: <RobotOutlined />,
      label: 'Prompt Craft',
    },
    {
      key: 'knowledge',
      icon: <BookOutlined />,
      label: 'Knowledge Base',
      type: 'group' as const,
      children: [
        { key: '/knowledge/business', label: 'Business Lexicon' },
        { key: '/knowledge/agents', label: 'Agent Memory' },
        { key: '/knowledge/semantic-models', label: 'Semantic Schema' },
      ],
    },
    {
      key: 'system',
      icon: <DatabaseOutlined />,
      label: 'Configuration',
      type: 'group' as const,
      children: [
        { key: '/system/agents', label: 'Agent Studio' },
        { key: '/system/data-sources', label: 'Data Sources' },
        { key: '/system/model-config', label: 'Model Registry' },
      ],
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={280}
        theme="dark"
        style={{
          background: 'linear-gradient(180deg, #1a1a1a 0%, #151515 100%)',
        }}
      >
        <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Brand Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <Avatar size={44} style={{ backgroundColor: '#c17f59', marginRight: 12 }}>
                D
              </Avatar>
              <div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Data Agent</div>
                <div style={{ color: '#6b6b6b', fontSize: 10, letterSpacing: '0.15em' }}>
                  SPRING AI ALIBABA
                </div>
              </div>
            </div>
            <Divider style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />

            {/* Agent Switcher */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#6b6b6b', fontSize: 10, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Active Intelligence
              </div>
              <Select
                value={selectedAgentId}
                onChange={handleAgentSwitch}
                style={{ width: '100%' }}
                placeholder="Select an agent"
                dropdownStyle={{ backgroundColor: '#1a1a1a' }}
              >
                {agents.map((agent) => (
                  <Option key={agent.value} value={agent.value}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar size={26} style={{ backgroundColor: 'rgba(193,127,89,0.1)', marginRight: 12 }}>
                        {agent.avatar ? <img src={agent.avatar} alt="" /> : <RobotOutlined style={{ color: '#c17f59' }} />}
                      </Avatar>
                      <div>
                        <div style={{ color: selectedAgentId === agent.value ? '#c17f59' : '#e5e0d8', fontSize: 13 }}>
                          {agent.title}
                        </div>
                        {agent.subtitle && (
                          <div style={{ color: '#6b6b6b', fontSize: 11 }}>{agent.subtitle}</div>
                        )}
                      </div>
                      {selectedAgentId === agent.value && (
                        <CheckOutlined style={{ color: '#c17f59', marginLeft: 'auto' }} />
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          {/* Navigation Menu */}
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[location.pathname]}
            onClick={({ key }) => navigateToPath(key)}
            items={menuItems}
            style={{ flex: 1, background: 'transparent', borderRight: 0 }}
          />

          {/* Create Agent Button */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigateToPath('/agent/new')}
            style={{
              marginTop: 16,
              background: 'linear-gradient(135deg, rgba(193,127,89,0.15) 0%, rgba(193,127,89,0.05) 100%)',
              borderColor: 'rgba(193,127,89,0.2)',
              color: '#c17f59',
            }}
          >
            Create Agent
          </Button>
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuOutlined /> : <MenuOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ marginRight: 16 }}
          />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{currentRouteTitle}</h2>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
