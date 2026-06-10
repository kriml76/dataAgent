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
import {
  Card,
  Button,
  Space,
  Switch,
  Tag,
  Input,
  Tabs,
  Alert,
  message,
  Modal,
} from 'antd';
import {
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  KeyOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import agentService from '@/services/agent';
import type { AgentApiKeyResponse } from '@/services/agent';
import { useSearchParams } from 'react-router-dom';

const AccessApiPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const agentIdParam = searchParams.get('agentId');
  const resolvedAgentId = agentIdParam ? Number(agentIdParam) : null;

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyEnabled, setApiKeyEnabled] = useState<boolean>(false);
  const [masked, setMasked] = useState<boolean>(true);
  const [canCopy, setCanCopy] = useState<boolean>(false);
  const [loading, setLoading] = useState({
    generate: false,
    reset: false,
    delete: false,
    toggle: false,
    fetch: false,
  });
  const [exampleTab, setExampleTab] = useState<string>('curl');

  // Mask API key for display
  const maskKey = (key: string): string => {
    if (!key) return '';
    if (key.startsWith('****')) return key;
    if (key.length <= 8) return '****';
    return '****' + key.slice(-4);
  };

  const displayKey = masked && apiKey ? maskKey(apiKey) : (apiKey || '');

  // Generate code examples
  const curlExample = React.useMemo(() => {
    const base = window.location.origin;
    const id = resolvedAgentId || '<agent_id>';
    return `# 创建会话
curl -X POST "${base}/api/agent/${id}/sessions" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: <your_api_key>" \\
  -d '{"title":"demo"}'

# 发送消息
curl -X POST "${base}/api/sessions/<sessionId>/messages" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: <your_api_key>" \\
  -d '{"role":"user","content":"给我一个示例","messageType":"text"}'`;
  }, [resolvedAgentId]);

  const jsExample = React.useMemo(() => {
    const base = window.location.origin;
    const id = resolvedAgentId || '<agent_id>';
    return `const apiKey = '<your_api_key>';
const baseUrl = '${base}/api';
const agentId = ${id};

(async () => {
  // 创建会话
  const sessionRes = await fetch(\`\${baseUrl}/agent/\${agentId}/sessions\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ title: 'demo' }),
  });
  const session = await sessionRes.json();

  // 发送消息
  await fetch(\`\${baseUrl}/sessions/\${session.id}/messages\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ role: 'user', content: '你好', messageType: 'text' }),
  });
})();`;
  }, [resolvedAgentId]);

  const pyExample = React.useMemo(() => {
    const base = window.location.origin;
    const id = resolvedAgentId || '<agent_id>';
    return `import requests

api_key = '<your_api_key>'
base_url = '${base}/api'

headers = {
    'Content-Type': 'application/json',
    'X-API-Key': api_key,
}

# 创建会话
session_resp = requests.post(
    f"{base_url}/agent/${id}/sessions",
    headers=headers,
    json={"title": "demo"},
)
session_id = session_resp.json().get("id")

# 发送消息
requests.post(
    f"{base_url}/sessions/{session_id}/messages",
    headers=headers,
    json={"role": "user", "content": "你好", "messageType": "text"},
)`;
  }, [resolvedAgentId]);

  // Load API Key on mount
  useEffect(() => {
    if (resolvedAgentId) {
      loadApiKey();
    }
  }, [resolvedAgentId]);

  const loadApiKey = async () => {
    if (!resolvedAgentId) return;
    
    setLoading(prev => ({ ...prev, fetch: true }));
    try {
      const res = await agentService.getApiKey(resolvedAgentId);
      setApiKey(res?.apiKey ?? null);
      setApiKeyEnabled(Boolean(res?.apiKeyEnabled));
      setMasked(true);
      setCanCopy(false);
    } catch (e) {
      message.error('获取 API Key 失败');
    } finally {
      setLoading(prev => ({ ...prev, fetch: false }));
    }
  };

  const handleGenerate = async () => {
    if (!resolvedAgentId) {
      message.error('缺少智能体ID');
      return;
    }

    setLoading(prev => ({ ...prev, generate: true }));
    try {
      const res = await agentService.generateApiKey(resolvedAgentId);
      setApiKey(res.apiKey);
      setApiKeyEnabled(Boolean(res.apiKeyEnabled));
      setMasked(false);
      setCanCopy(true);
      message.success('已生成 API Key');
    } catch (e) {
      message.error('生成失败');
    } finally {
      setLoading(prev => ({ ...prev, generate: false }));
    }
  };

  const handleReset = async () => {
    if (!resolvedAgentId) {
      message.error('缺少智能体ID');
      return;
    }

    if (!apiKey) {
      await handleGenerate();
      return;
    }

    setLoading(prev => ({ ...prev, reset: true }));
    try {
      const res = await agentService.resetApiKey(resolvedAgentId);
      setApiKey(res.apiKey);
      setApiKeyEnabled(Boolean(res.apiKeyEnabled));
      setMasked(false);
      setCanCopy(true);
      message.success('已重置 API Key');
    } catch (e) {
      message.error('重置失败');
    } finally {
      setLoading(prev => ({ ...prev, reset: false }));
    }
  };

  const handleDelete = async () => {
    if (!apiKey || !resolvedAgentId) return;

    Modal.confirm({
      title: '确认删除',
      content: '确认删除当前 API Key？删除后需重新生成。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        setLoading(prev => ({ ...prev, delete: true }));
        try {
          const res = await agentService.deleteApiKey(resolvedAgentId);
          setApiKey(res.apiKey);
          setApiKeyEnabled(Boolean(res.apiKeyEnabled));
          setMasked(true);
          setCanCopy(false);
          message.success('已删除 API Key');
        } catch (e) {
          message.error('删除失败');
        } finally {
          setLoading(prev => ({ ...prev, delete: false }));
        }
      },
    });
  };

  const handleCopy = async () => {
    if (!canCopy || !apiKey) {
      message.info('请重新生成或重置后复制完整 Key');
      return;
    }

    try {
      await navigator.clipboard.writeText(apiKey);
      message.success('已复制到剪贴板');
    } catch (e) {
      message.error('复制失败');
    }
  };

  const toggleMask = () => {
    if (!apiKey) return;
    setMasked(!masked);
  };

  const handleToggle = async (val: boolean) => {
    if (!resolvedAgentId) {
      message.error('缺少智能体ID');
      return;
    }

    setLoading(prev => ({ ...prev, toggle: true }));
    try {
      const res = await agentService.toggleApiKey(resolvedAgentId, val);
      setApiKeyEnabled(Boolean(res.apiKeyEnabled));
      // 返回值可能是掩码
      setApiKey(res.apiKey);
      setMasked(true);
      setCanCopy(false);
      message.success(val ? '已启用 API Key' : '已禁用 API Key');
    } catch (e) {
      setApiKeyEnabled(!val);
      message.error('切换失败');
    } finally {
      setLoading(prev => ({ ...prev, toggle: false }));
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 920, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
          API 访问配置
        </h1>
        <p style={{ color: '#6b6b6b', marginTop: 4 }}>
          为该智能体生成并管理 API Key，用于外部系统访问。
        </p>
      </div>

      {/* API Key Management Section */}
      <Card bordered={false} style={{ marginBottom: 28, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Status Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 110, fontWeight: 600, color: '#333' }}>API Key 状态</span>
            <Switch
              checked={apiKeyEnabled}
              disabled={!apiKey}
              onChange={handleToggle}
              loading={loading.toggle}
              checkedChildren="已启用"
              unCheckedChildren="已禁用"
            />
            {!apiKey && <Tag color="default">未生成</Tag>}
          </div>

          {/* Key Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ width: 110, fontWeight: 600, color: '#333' }}>当前 Key</span>
            <Input
              value={displayKey}
              readOnly
              placeholder="尚未生成 API Key"
              style={{ flex: 1, minWidth: 240 }}
            />
            <Button
              type="primary"
              onClick={handleGenerate}
              loading={loading.generate}
            >
              {apiKey ? '重新生成' : '生成 Key'}
            </Button>
            <Button
              onClick={handleReset}
              disabled={!apiKey}
              loading={loading.reset}
            >
              重置
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!apiKey}
              loading={loading.delete}
            >
              删除
            </Button>
            <Button
              onClick={handleCopy}
              disabled={!apiKey || !canCopy}
              icon={<CopyOutlined />}
            >
              复制
            </Button>
            <Button
              onClick={toggleMask}
              disabled={!apiKey}
              icon={masked ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            >
              {masked ? '显示' : '隐藏'}
            </Button>
          </div>

          {/* Security Alert */}
          {!canCopy && apiKey && (
            <Alert
              type="info"
              showIcon
              message="为安全起见，已生成/重置时才显示完整 Key，之后仅显示掩码。如需复制请重新生成/重置。"
            />
          )}
        </Space>
      </Card>

      {/* Code Examples Section */}
      <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)' }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>调用示例</h3>
          <p style={{ color: '#6b6b6b', margin: '4px 0 0' }}>
            使用 <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>X-API-Key</code> 请求头调用会话接口。
          </p>
        </div>

        <Tabs
          activeKey={exampleTab}
          onChange={setExampleTab}
          items={[
            {
              key: 'curl',
              label: 'curl',
              children: (
                <pre style={{
                  background: '#0b1021',
                  color: '#e0e6f6',
                  padding: 14,
                  borderRadius: 8,
                  overflow: 'auto',
                  fontSize: 12,
                  margin: 0,
                }}>
                  <code>{curlExample}</code>
                </pre>
              ),
            },
            {
              key: 'js',
              label: 'JavaScript',
              children: (
                <pre style={{
                  background: '#0b1021',
                  color: '#e0e6f6',
                  padding: 14,
                  borderRadius: 8,
                  overflow: 'auto',
                  fontSize: 12,
                  margin: 0,
                }}>
                  <code>{jsExample}</code>
                </pre>
              ),
            },
            {
              key: 'py',
              label: 'Python',
              children: (
                <pre style={{
                  background: '#0b1021',
                  color: '#e0e6f6',
                  padding: 14,
                  borderRadius: 8,
                  overflow: 'auto',
                  fontSize: 12,
                  margin: 0,
                }}>
                  <code>{pyExample}</code>
                </pre>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default AccessApiPage;
