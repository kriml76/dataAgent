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
import { Layout, Menu, Select, Avatar, Button, Divider, Badge } from 'antd';
import {
  MenuOutlined,
  RobotOutlined,
  MessageOutlined,
  BookOutlined,
  DatabaseOutlined,
  SettingOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  ScanOutlined,
  RadarChartOutlined,
  ApiOutlined,
  CodeSandboxOutlined,
  FileTextOutlined,
  SaveOutlined,
  BranchesOutlined,
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

const MechaDivider: React.FC = () => (
  <div style={{ position: 'relative', margin: '16px 0' }}>
    <div style={{
      height: '2px',
      background: 'linear-gradient(90deg, transparent 0%, #00f5ff 20%, #00f5ff 80%, transparent 100%)',
      boxShadow: '0 0 10px rgba(0, 245, 255, 0.5)',
    }} />
    <div style={{
      position: 'absolute',
      top: '-4px',
      left: '10%',
      width: '8px',
      height: '8px',
      background: '#00f5ff',
      transform: 'rotate(45deg)',
      boxShadow: '0 0 10px #00f5ff',
    }} />
    <div style={{
      position: 'absolute',
      top: '-4px',
      right: '10%',
      width: '8px',
      height: '8px',
      background: '#00f5ff',
      transform: 'rotate(45deg)',
      boxShadow: '0 0 10px #00f5ff',
    }} />
  </div>
);

const CornerDecoration: React.FC<{ position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }> = ({ position }) => {
  const styles: Record<string, React.CSSProperties> = {
    'top-left': { top: 0, left: 0, borderTop: '2px solid #00f5ff', borderLeft: '2px solid #00f5ff' },
    'top-right': { top: 0, right: 0, borderTop: '2px solid #00f5ff', borderRight: '2px solid #00f5ff' },
    'bottom-left': { bottom: 0, left: 0, borderBottom: '2px solid #00f5ff', borderLeft: '2px solid #00f5ff' },
    'bottom-right': { bottom: 0, right: 0, borderBottom: '2px solid #00f5ff', borderRight: '2px solid #00f5ff' },
  };
  return <div style={{ ...styles[position], position: 'absolute', width: '20px', height: '20px', boxShadow: '0 0 8px rgba(0, 245, 255, 0.3)' }} />;
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
          subtitle: 'OPERATIONAL',
          avatar: undefined,
        }));
      setAgents(options);

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
      icon: <MessageOutlined style={{ filter: 'drop-shadow(0 0 4px #00f5ff)' }} />,
      label: 'Data Dialogue',
    },
    {
      key: '/prompt-config',
      icon: <RobotOutlined style={{ filter: 'drop-shadow(0 0 4px #00f5ff)' }} />,
      label: 'Prompt Craft',
    },
    {
      key: 'knowledge',
      icon: <BookOutlined style={{ filter: 'drop-shadow(0 0 4px #00f5ff)' }} />,
      label: 'Knowledge Base',
      children: [
        { key: '/knowledge/business', icon: <FileTextOutlined />, label: 'Business Lexicon' },
        { key: '/knowledge/agents', icon: <SaveOutlined />, label: 'Agent Memory' },
        { key: '/knowledge/semantic-models', icon: <BranchesOutlined />, label: 'Semantic Schema' },
      ],
    },
    {
      key: 'system',
      icon: <DatabaseOutlined style={{ filter: 'drop-shadow(0 0 4px #00f5ff)' }} />,
      label: 'Configuration',
      children: [
        { key: '/system/agents', icon: <ApiOutlined />, label: 'Agent Studio' },
        { key: '/system/data-sources', icon: <DatabaseOutlined />, label: 'Data Sources' },
        { key: '/system/model-config', icon: <CodeSandboxOutlined />, label: 'Model Registry' },
      ],
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={320}
        collapsedWidth={80}
        theme="dark"
        style={{
          background: 'linear-gradient(180deg, #0d0d12 0%, #0a0a0f 100%)',
          borderRight: '1px solid rgba(0, 245, 255, 0.15)',
          boxShadow: 'inset -1px 0 20px rgba(0, 245, 255, 0.05)',
          overflow: 'hidden',
        }}
      >
        <div style={{ 
          padding: collapsed ? '16px 8px' : '20px', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          transition: 'padding 0.3s ease',
        }}>
          {!collapsed && (
            <>
              <CornerDecoration position="top-left" />
              <CornerDecoration position="top-right" />
            </>
          )}

          {/* Brand Header - Collapsed mode shows only icon */}
          <div style={{ marginBottom: collapsed ? 16 : 20, position: 'relative' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: collapsed ? 'center' : 'flex-start',
              marginBottom: collapsed ? 0 : 16,
              padding: collapsed ? '8px' : '12px',
              background: collapsed ? 'transparent' : 'linear-gradient(135deg, rgba(0, 245, 255, 0.08) 0%, transparent 50%)',
              border: collapsed ? 'none' : '1px solid rgba(0, 245, 255, 0.2)',
              clipPath: collapsed ? 'none' : 'polygon(0 0, 100% 0, 100% 70%, 95% 100%, 0 100%)',
            }}>
              <div style={{ position: 'relative' }}>
                <Avatar size={collapsed ? 40 : 48} style={{ 
                  backgroundColor: '#0a0a0f', 
                  border: '2px solid #00f5ff',
                  boxShadow: '0 0 20px rgba(0, 245, 255, 0.4), inset 0 0 15px rgba(0, 245, 255, 0.2)',
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: 'bold',
                  fontSize: collapsed ? '16px' : '20px',
                  color: '#00f5ff',
                }}>
                  DA
                </Avatar>
                <div style={{
                  position: 'absolute',
                  bottom: 7,
                  right: collapsed ? -201 : -20,
                  width: collapsed ? 10 : 12,
                  height: collapsed ? 10 : 12,
                  background: '#00ff88',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px #00ff88',
                  animation: 'pulse 2s infinite',
                }} />
              </div>
              {!collapsed && (
                <div style={{ marginLeft: 12 }}>
                  <div style={{ 
                    color: '#00f5ff', 
                    fontWeight: 'bold', 
                    fontSize: 20,
                    fontFamily: "'Orbitron', monospace",
                    letterSpacing: '2px',
                    textShadow: '0 0 10px rgba(0, 245, 255, 0.5)',
                  }}>
                    DATA AGENT
                  </div>
                  <div style={{ 
                    color: '#4a4a5a', 
                    fontSize: 9, 
                    letterSpacing: '3px',
                    paddingLeft: 10,
                    fontFamily: "'Rajdhani', sans-serif",
                    textTransform: 'uppercase',
                  }}>
                    NEURAL INTERFACE
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
              <>
                <MechaDivider />

                {/* Agent Switcher */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    color: '#00f5ff', 
                    fontSize: 10, 
                    marginBottom: 12, 
                    textTransform: 'uppercase', 
                    letterSpacing: '3px',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                  }}>
                    <ScanOutlined style={{ marginRight: 8, fontSize: 12 }} />
                    Active Intelligence Node
                  </div>
                  <div style={{
                    position: 'relative',
                    padding: '2px',
                    background: 'linear-gradient(135deg, #00f5ff 0%, #0088ff 50%, #00f5ff 100%)',
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                  }}>
                    <Select
                      value={selectedAgentId}
                      onChange={handleAgentSwitch}
                      style={{ width: '100%' }}
                      placeholder="Select Node"
                      dropdownStyle={{ 
                        backgroundColor: '#0d0d12', 
                        border: '1px solid rgba(0, 245, 255, 0.3)',
                        boxShadow: '0 0 30px rgba(0, 245, 255, 0.2)',
                      }}
                      variant="borderless"
                      size="large"
                    >
                      {agents.map((agent) => (
                        <Option key={agent.value} value={agent.value}>
                          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
                            <div style={{ position: 'relative', marginRight: 12 }}>
                              <Avatar size={32} style={{ 
                                backgroundColor: 'rgba(0, 245, 255, 0.1)', 
                                border: '1px solid rgba(0, 245, 255, 0.3)',
                              }}>
                                <RobotOutlined style={{ color: '#00f5ff' }} />
                              </Avatar>
                              <div style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 8,
                                height: 8,
                                background: '#00ff88',
                                borderRadius: '50%',
                                boxShadow: '0 0 6px #00ff88',
                              }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                color: selectedAgentId === agent.value ? '#00f5ff' : '#e0e0e5', 
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily: "'Rajdhani', sans-serif",
                                letterSpacing: '1px',
                              }}>
                                {agent.title}
                              </div>
                              <div style={{ 
                                color: '#00ff88', 
                                fontSize: 10,
                                fontFamily: "'Orbitron', monospace",
                                letterSpacing: '1px',
                              }}>
                                {agent.subtitle}
                              </div>
                            </div>
                            {selectedAgentId === agent.value && (
                              <div style={{
                                width: 6,
                                height: 6,
                                background: '#00f5ff',
                                boxShadow: '0 0 10px #00f5ff',
                              }} />
                            )}
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Status Bar - Hidden when collapsed */}
          {!collapsed && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 12px',
              marginBottom: 16,
              background: 'rgba(0, 245, 255, 0.05)',
              borderTop: '1px solid rgba(0, 245, 255, 0.1)',
              borderBottom: '1px solid rgba(0, 245, 255, 0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 6,
                  height: 6,
                  background: '#00ff88',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px #00ff88',
                  marginRight: 6,
                  animation: 'blink 1.5s infinite',
                }} />
                <span style={{ 
                  color: '#00ff88', 
                  fontSize: 9, 
                  fontFamily: "'Orbitron', monospace",
                  letterSpacing: '1px',
                }}>
                  ONLINE
                </span>
              </div>
              <div style={{ 
                color: '#6a6a7a', 
                fontSize: 9, 
                fontFamily: "'Orbitron', monospace",
                letterSpacing: '1px',
              }}>
                SYS: NOMINAL
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[location.pathname]}
            onClick={({ key }) => navigateToPath(key)}
            items={menuItems}
            style={{ 
              flex: 1, 
              background: 'transparent', 
              borderRight: 0,
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '14px',
              letterSpacing: '1px',
              overflow: collapsed ? 'visible' : 'hidden',
            }}
            defaultOpenKeys={!collapsed ? ['knowledge', 'system'] : []}
            inlineCollapsed={collapsed}
          />

          {/* Create Agent Button - Hidden when collapsed */}
          {!collapsed && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigateToPath('/agent/new')}
              style={{
                marginTop: 16,
                background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.2) 0%, rgba(0, 136, 255, 0.1) 100%)',
                border: '1px solid rgba(0, 245, 255, 0.5)',
                color: '#00f5ff',
                height: '48px',
                fontFamily: "'Orbitron', monospace",
                fontSize: '12px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                boxShadow: '0 0 20px rgba(0, 245, 255, 0.2), inset 0 0 20px rgba(0, 245, 255, 0.05)',
                clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 245, 255, 0.4) 0%, rgba(0, 136, 255, 0.2) 100%)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 245, 255, 0.4), inset 0 0 30px rgba(0, 245, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 245, 255, 0.2) 0%, rgba(0, 136, 255, 0.1) 100%)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 245, 255, 0.2), inset 0 0 20px rgba(0, 245, 255, 0.05)';
              }}
            >
              Initialize Agent Node
            </Button>
          )}

          {!collapsed && (
            <>
              <CornerDecoration position="bottom-left" />
              <CornerDecoration position="bottom-right" />
            </>
          )}
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            background: 'linear-gradient(90deg, #0d0d12 0%, #0a0a0f 100%)',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 245, 255, 0.15)',
            height: '72px',
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, #00f5ff 20%, #00f5ff 80%, transparent 100%)',
            boxShadow: '0 0 10px rgba(0, 245, 255, 0.5)',
          }} />
          
          <Button
            type="text"
            icon={<MenuOutlined style={{ color: '#00f5ff', fontSize: '20px' }} />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ 
              marginRight: 20,
              width: '48px',
              height: '48px',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              borderRadius: 0,
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
            }}
          />
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <RadarChartOutlined style={{ 
              color: '#00f5ff', 
              fontSize: '24px', 
              marginRight: 16,
              animation: 'scan 3s infinite linear',
            }} />
            <h2 style={{ 
              margin: 0, 
              fontSize: 22, 
              fontWeight: 600, 
              color: '#e0e0e5',
              fontFamily: "'Orbitron', monospace",
              letterSpacing: '3px',
              textTransform: 'uppercase',
              textShadow: '0 0 20px rgba(0, 245, 255, 0.3)',
            }}>
              {currentRouteTitle}
            </h2>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(0, 245, 255, 0.05)',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              fontFamily: "'Orbitron', monospace",
              fontSize: '10px',
              color: '#00f5ff',
              letterSpacing: '2px',
            }}>
              <ThunderboltOutlined style={{ marginRight: '8px' }} />
              POWER: 98.7%
            </div>
          </div>
        </Header>
        
        <Content style={{ 
          padding: 24, 
          background: '#f7f7f7',
          minHeight: 'calc(100vh - 72px)',
          position: 'relative',
        }}>
          
          {/* Content wrapper */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </Content>
      </Layout>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.9); }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes scan {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .ant-menu-dark .ant-menu-item-selected {
          background: linear-gradient(90deg, rgba(0, 245, 255, 0.2) 0%, transparent 100%) !important;
          border-left: 3px solid #00f5ff !important;
          color: #00f5ff !important;
        }
        
        .ant-menu-dark .ant-menu-item:hover {
          background: linear-gradient(90deg, rgba(0, 245, 255, 0.1) 0%, transparent 100%) !important;
          color: #00f5ff !important;
        }
        
        .ant-menu-dark .ant-menu-submenu-title:hover {
          color: #00f5ff !important;
        }
        
        .ant-select-selector {
          background: #0d0d12 !important;
          border: none !important;
          color: #e0e0e5 !important;
        }
        
        .ant-select-dropdown .ant-select-item-option-selected {
          background: rgba(0, 245, 255, 0.1) !important;
        }
        
        .ant-select-dropdown .ant-select-item-option:hover {
          background: rgba(0, 245, 255, 0.05) !important;
        }
      `}</style>
    </Layout>
  );
};

export default MainLayout;
