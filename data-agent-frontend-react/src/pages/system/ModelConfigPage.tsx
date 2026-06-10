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

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Segmented,
  Skeleton,
  Avatar,
  Divider,
  Modal,
  Form,
  Select,
  Input,
  Slider,
  InputNumber,
  Empty,
  message,
  Space,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import modelConfigService, { type ModelConfig, type ModelType } from '@/services/modelConfig';

const providerOptions = [
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'Qwen', value: 'qwen' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Siliconflow', value: 'siliconflow' },
  { label: 'Custom Provider', value: 'custom' },
];

const providerBaseUrlMap: Record<string, string> = {
  deepseek: 'https://api.deepseek.com',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  openai: 'https://api.openai.com',
  siliconflow: 'https://api.siliconflow.cn',
  custom: '',
};

const providerColors: Record<string, string> = {
  deepseek: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  qwen: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  openai: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  siliconflow: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  custom: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
};

const providerLabel = (value: string) => {
  const item = providerOptions.find((option) => option.value === value);
  return item ? item.label : value;
};

const ModelConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [activeTab, setActiveTab] = useState<ModelType>('CHAT');
  const [testingId, setTestingId] = useState<number | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [form] = Form.useForm<ModelConfig>();

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await modelConfigService.list();
      setConfigs(response || []);
    } catch {
      message.error('获取模型配置失败，请稍后重试');
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const filteredConfigs = configs.filter((model) => model.modelType === activeTab);
  const dialogTitle = dialogMode === 'edit' ? '编辑模型配置' : '新增模型配置';

  const openCreateDialog = (type: ModelType) => {
    setDialogMode('create');
    setEditingModel(null);
    form.resetFields();
    form.setFieldsValue({
      provider: providerOptions[0]?.value || 'deepseek',
      apiKey: '',
      baseUrl: providerBaseUrlMap[providerOptions[0]?.value || 'deepseek'] || '',
      modelName: '',
      modelType: type,
      temperature: 0,
      maxTokens: 2000,
      completionsPath: '',
      embeddingsPath: '',
      isActive: false,
    });
    setDialogVisible(true);
  };

  const handleEdit = (model: ModelConfig) => {
    setDialogMode('edit');
    setEditingModel(model);
    form.setFieldsValue(model);
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setShowApiKey(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      let result;
      if (dialogMode === 'edit' && editingModel?.id) {
        result = await modelConfigService.update({ ...values, id: editingModel.id });
      } else {
        result = await modelConfigService.add(values);
      }

      if (result.success) {
        message.success(dialogMode === 'edit' ? '配置更新成功' : '配置创建成功');
        closeDialog();
        fetchConfigs();
      } else {
        message.error(result.message || '操作失败，请重试');
      }
    } catch (errorInfo) {
      console.error('Validation failed:', errorInfo);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (model: ModelConfig) => {
    if (!model.id) {
      message.error('模型ID不存在');
      return;
    }
    try {
      const result = await modelConfigService.delete(model.id);
      if (result.success) {
        message.success('模型已删除');
        fetchConfigs();
      } else {
        message.error(result.message || '删除失败');
      }
    } catch {
      message.error('操作失败，请检查网络');
    }
  };

  const handleActivate = async (model: ModelConfig) => {
    if (!model.id) return;
    if (model.modelType === 'EMBEDDING') {
      const confirmed = window.confirm('切换嵌入模型会导致现有向量数据失效，确定继续吗？');
      if (!confirmed) return;
    }

    setActivatingId(model.id);
    try {
      const result = await modelConfigService.activate(model.id);
      if (result.success) {
        message.success('已设置为默认模型');
        fetchConfigs();
      } else {
        message.error(result.message || '设置失败');
      }
    } catch {
      message.error('操作失败，请检查网络');
    } finally {
      setActivatingId(null);
    }
  };

  const handleTestConnection = async (model: ModelConfig) => {
    setTestingId(model.id ?? null);
    try {
      const result = await modelConfigService.testConnection(model);
      if (result.success) {
        message.success(result.message || '连接测试成功');
      } else {
        message.error(result.message || '连接测试失败');
      }
    } catch {
      message.error('连接测试失败，请检查网络');
    } finally {
      setTestingId(null);
    }
  };

  const handleProviderChange = (value: string) => {
    if (value && value !== 'custom') {
      form.setFieldValue('baseUrl', providerBaseUrlMap[value] || '');
    }
  };

  const chatCount = configs.filter(c => c.modelType === 'CHAT').length;
  const embeddingCount = configs.filter(c => c.modelType === 'EMBEDDING').length;

  return (
    <div className="model-config-page">
      <div className="background-decoration">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
        <div className="gradient-orb orb-3" />
      </div>

      <div className="content-wrapper">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="title-badge">
              <ThunderboltOutlined />
              <span>AI 基础设施</span>
            </div>
            <h1 className="page-title">
              <span className="title-text">模型服务</span>
              <RocketOutlined className="title-icon" />
            </h1>
            <p className="page-description">
              连接全球顶尖的大语言模型供应商，为您的智能应用提供强大的算力支持与向量检索能力
            </p>
          </div>
          <Space size="middle" className="header-actions">
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={fetchConfigs}
              className="glass-button secondary"
            >
              刷新列表
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openCreateDialog(activeTab)}
              className="glass-button primary"
            >
              {activeTab === 'CHAT' ? '添加对话模型' : '添加嵌入模型'}
            </Button>
          </Space>
        </div>

        {/* Tab Navigation */}
        <div className="tab-container">
          <Segmented
            value={activeTab}
            onChange={(value) => setActiveTab(value as ModelType)}
            options={[
              { 
                label: (
                  <div className="tab-content">
                    <div className="tab-icon-wrapper">
                      <MessageOutlined className="tab-icon" />
                    </div>
                    <div className="tab-text">
                      <span className="tab-label">对话模型</span>
                      <span className="tab-desc">聊天对话场景</span>
                    </div>
                    <span className="tab-badge">{chatCount}</span>
                  </div>
                ), 
                value: 'CHAT' 
              },
              { 
                label: (
                  <div className="tab-content">
                    <div className="tab-icon-wrapper">
                      <SearchOutlined className="tab-icon" />
                    </div>
                    <div className="tab-text">
                      <span className="tab-label">嵌入模型</span>
                      <span className="tab-desc">向量检索场景</span>
                    </div>
                    <span className="tab-badge">{embeddingCount}</span>
                  </div>
                ), 
                value: 'EMBEDDING' 
              },
            ]}
            size="large"
            className="custom-segmented"
          />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="cards-container">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="model-card loading-card" variant="outlined">
                <Skeleton avatar paragraph={{ rows: 3 }} active />
              </Card>
            ))}
          </div>
        ) : (
          <div className="cards-container">
            {filteredConfigs.length === 0 ? (
              <Card className="empty-card" variant="outlined">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="empty-content">
                      <div className="empty-icon">✨</div>
                      <h3>暂无配置</h3>
                      <p>您还没有在该分类下添加任何模型供应商</p>
                      <Button
                        type="primary"
                        onClick={() => openCreateDialog(activeTab)}
                        className="glass-button primary"
                      >
                        立即添加
                      </Button>
                    </div>
                  }
                />
              </Card>
            ) : (
              filteredConfigs.map((model, index) => (
                <Card
                  key={model.id}
                  variant="outlined"
                  className={`model-card ${model.isActive ? 'active' : ''}`}
                  style={{ '--card-index': index } as React.CSSProperties}
                  hoverable
                >
                  <div className="card-content">
                    <div 
                      className="model-avatar"
                      style={{ '--provider-gradient': providerColors[model.provider] || providerColors.custom } as React.CSSProperties}
                    >
                      {model.modelType === 'CHAT' ? '💬' : '🔍'}
                    </div>
                    
                    <div className="model-info">
                      <div className="model-header">
                        <span className="model-name">{model.modelName}</span>
                        {model.isActive && (
                          <span className="active-badge">
                            <span className="pulse-dot" />
                            默认
                          </span>
                        )}
                      </div>
                      <div className="model-meta">
                        <span className="meta-item">
                          <span className="meta-icon">📦</span>
                          {providerLabel(model.provider)}
                        </span>
                        <span className="meta-item">
                          <span className="meta-icon">🔗</span>
                          {model.baseUrl || '默认终端'}
                        </span>
                      </div>
                    </div>

                    <div className="card-actions">
                      {!model.isActive && (
                        <Button
                          type="primary"
                          size="small"
                          loading={activatingId === model.id}
                          onClick={() => handleActivate(model)}
                          className="action-button primary"
                        >
                          设为默认
                        </Button>
                      )}
                      <Button
                        size="small"
                        onClick={() => handleTestConnection(model)}
                        loading={testingId === model.id}
                        className="action-button secondary"
                      >
                        测试连接
                      </Button>
                      <Divider type="vertical" className="action-divider" />
                      <Space size="small">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(model)}
                          className="icon-button edit"
                        />
                        <Popconfirm
                          title="确认删除"
                          description={`你确认要删除 ${model.modelName} 吗？`}
                          onConfirm={() => handleDelete(model)}
                          okText="确认"
                          cancelText="取消"
                          overlayClassName="delete-popconfirm"
                        >
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            className="icon-button delete"
                          />
                        </Popconfirm>
                      </Space>
                    </div>
                  </div>
                  
                  {model.isActive && <div className="active-glow" />}
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Config Dialog */}
      <Modal
        title={dialogTitle}
        open={dialogVisible}
        onCancel={closeDialog}
        onOk={handleSubmit}
        confirmLoading={saving}
        className="config-modal"
        width={560}
        okText="确认保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          className="config-form"
        >
          <Form.Item
            label="模型供应商"
            name="provider"
            rules={[{ required: true, message: '该字段为必填项' }]}
          >
            <Select
              options={providerOptions}
              onChange={handleProviderChange}
              className="form-select"
            />
          </Form.Item>

          <Form.Item
            label="模型名称"
            name="modelName"
            rules={[{ required: true, message: '该字段为必填项' }]}
          >
            <Input placeholder="例如: gpt-4o 或 deepseek-chat" className="form-input" />
          </Form.Item>

          <Form.Item
            label="API 密钥 (API Key)"
            name="apiKey"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('provider') === 'custom' || value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('该字段为必填项'));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="sk-..."
              iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
              className="form-input"
            />
          </Form.Item>

          <Form.Item
            label="接口地址 (Base URL)"
            name="baseUrl"
            rules={[{ required: true, message: '该字段为必填项' }]}
          >
            <Input placeholder="https://api.example.com/v1" className="form-input" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, curValues) => prevValues.modelType !== curValues.modelType}
          >
            {() => {
              const modelType = form.getFieldValue('modelType');
              return modelType === 'CHAT' ? (
                <Form.Item label="Completions 路径" name="completionsPath">
                  <Input placeholder="默认 /v1/chat/completions" className="form-input" />
                </Form.Item>
              ) : (
                <Form.Item label="Embeddings 路径" name="embeddingsPath">
                  <Input placeholder="默认 /v1/embeddings" className="form-input" />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="modelType" hidden>
            <Input />
          </Form.Item>

          <div className="form-row">
            <Form.Item
              label="温度系数"
              name="temperature"
              className="form-item-half"
            >
              <Slider min={0} max={2} step={0.1} className="form-slider" />
            </Form.Item>
            <Form.Item
              label="最大 Token 数"
              name="maxTokens"
              rules={[
                {
                  validator: (_, value) => {
                    if (value >= 100 && value <= 10000) return Promise.resolve();
                    return Promise.reject(new Error('Token 范围需在 100 - 10000 之间'));
                  },
                },
              ]}
              className="form-item-half"
            >
              <InputNumber className="form-input-number" min={100} max={10000} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <style>
        {`
          .model-config-page {
            min-height: calc(100vh - 128px);
            background: linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f8fafc 100%);
            position: relative;
            overflow-x: hidden;
          }

          .background-decoration {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
            pointer-events: none;
          }

          .gradient-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(100px);
            opacity: 0.25;
            animation: float 25s ease-in-out infinite;
          }

          .orb-1 {
            width: 500px;
            height: 500px;
            background: linear-gradient(135deg, #6366f1, #a855f7);
            top: -200px;
            right: -100px;
            animation-delay: 0s;
          }

          .orb-2 {
            width: 400px;
            height: 400px;
            background: linear-gradient(135deg, #ec4899, #f43f5e);
            top: 50%;
            left: -150px;
            animation-delay: -8s;
          }

          .orb-3 {
            width: 450px;
            height: 450px;
            background: linear-gradient(135deg, #0ea5e9, #06b6d4);
            bottom: -200px;
            right: 25%;
            animation-delay: -16s;
          }

          @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(40px, -40px) scale(1.08); }
            50% { transform: translate(-30px, 30px) scale(0.95); }
            75% { transform: translate(30px, 40px) scale(1.05); }
          }

          .content-wrapper {
            position: relative;
            z-index: 1;
            padding: 48px;
            max-width: 1100px;
            margin: 0 auto;
          }

          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 48px;
            animation: slideDown 0.6s ease-out;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .title-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 16px;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 20px;
            color: #6366f1;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 16px;
          }

          .page-title {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 0 0 12px 0;
            font-size: 36px;
            font-weight: 700;
            color: #1e293b;
            letter-spacing: -0.5px;
          }

          .title-text {
            background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .title-icon {
            font-size: 28px;
            color: #6366f1;
            animation: bounce 2s ease-in-out infinite;
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }

          .page-description {
            margin: 0;
            color: #64748b;
            font-size: 15px;
            line-height: 1.6;
            max-width: 500px;
          }

          .header-actions {
            margin-top: 20px;
          }

          .glass-button {
            height: 44px;
            padding: 0 24px;
            border-radius: 12px;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
          }

          .glass-button.primary {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
          }

          .glass-button.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
          }

          .glass-button.secondary {
            background: #ffffff;
            color: #475569;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }

          .glass-button.secondary:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }

          .tab-container {
            display: flex;
            justify-content: center;
            margin-bottom: 40px;
            animation: fadeIn 0.6s ease-out 0.2s both;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .custom-segmented {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            padding: 8px;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          }

          .custom-segmented .ant-segmented-item {
            padding: 0;
            border-radius: 14px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: #64748b;
          }

          .custom-segmented .ant-segmented-item-selected {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
          }

          .custom-segmented .ant-segmented-item:not(.ant-segmented-item-selected):hover {
            background: rgba(99, 102, 241, 0.08);
            color: #6366f1;
          }

          .tab-content {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 20px;
            min-width: 180px;
          }

          .tab-icon-wrapper {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(99, 102, 241, 0.1);
            transition: all 0.3s ease;
          }

          .ant-segmented-item-selected .tab-icon-wrapper {
            background: rgba(255, 255, 255, 0.2);
          }

          .tab-icon {
            font-size: 18px;
            color: #6366f1;
            transition: all 0.3s ease;
          }

          .ant-segmented-item-selected .tab-icon {
            color: white;
          }

          .tab-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
          }

          .tab-label {
            font-size: 14px;
            font-weight: 700;
            line-height: 1.2;
          }

          .tab-desc {
            font-size: 11px;
            font-weight: 400;
            opacity: 0.7;
            line-height: 1.2;
          }

          .tab-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 700;
            background: rgba(99, 102, 241, 0.15);
            color: #6366f1;
            transition: all 0.3s ease;
          }

          .ant-segmented-item-selected .tab-badge {
            background: rgba(255, 255, 255, 0.25);
            color: white;
          }

          .cards-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
            animation: slideUp 0.6s ease-out 0.3s both;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .model-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            animation: cardSlideIn 0.5s ease-out backwards;
            animation-delay: calc(var(--card-index, 0) * 0.1s);
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }

          @keyframes cardSlideIn {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .model-card:hover {
            border-color: #cbd5e1;
            transform: translateX(8px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
          }

          .model-card.active {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.03), rgba(139, 92, 246, 0.03));
            border-color: rgba(99, 102, 241, 0.3);
          }

          .model-card.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(180deg, #6366f1, #8b5cf6);
            border-radius: 2px;
          }

          .card-content {
            display: flex;
            align-items: center;
            padding: 8px;
            position: relative;
            z-index: 1;
          }

          .model-avatar {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            background: var(--provider-gradient);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            margin-right: 20px;
            flex-shrink: 0;
          }

          .model-info {
            flex-grow: 1;
          }

          .model-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
          }

          .model-name {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
          }

          .active-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            font-size: 12px;
            font-weight: 600;
            border-radius: 20px;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
          }

          .pulse-dot {
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
          }

          .model-meta {
            display: flex;
            align-items: center;
          
          }

          .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #64748b;
            font-size: 13px;
          }

          .meta-icon {
            opacity: 0.8;
          }

          .card-actions {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .action-button {
            height: 32px;
            padding: 0 16px;
            border-radius: 10px;
            font-weight: 500;
            border: none;
            transition: all 0.3s ease;
          }

          .action-button.primary {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
          }

          .action-button.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
          }

          .action-button.secondary {
            background: #f8fafc;
            color: #475569;
            border: 1px solid #e2e8f0;
          }

          .action-button.secondary:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
          }

          .action-divider {
            height: 28px;
            margin: 0 4px;
            background: #e2e8f0;
          }

          .icon-button {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }

          .icon-button.edit {
            color: #6366f1;
          }

          .icon-button.edit:hover {
            background: rgba(99, 102, 241, 0.1);
          }

          .icon-button.delete:hover {
            background: rgba(239, 68, 68, 0.1);
          }

          .active-glow {
            position: absolute;
            top: 0;
            right: 0;
            width: 250px;
            height: 250px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
            pointer-events: none;
          }

          .empty-card {
            background: #ffffff;
            border: 2px dashed #e2e8f0;
            border-radius: 20px;
          }

          .empty-content {
            padding: 40px 20px;
            text-align: center;
          }

          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
            animation: float 3s ease-in-out infinite;
          }

          .empty-content h3 {
            color: #1e293b;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .empty-content p {
            color: #64748b;
            margin-bottom: 24px;
          }

          .config-modal .ant-modal-content {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          }

          .config-modal .ant-modal-header {
            background: transparent;
            border-bottom: 1px solid #f1f5f9;
            padding: 24px 24px 20px;
          }

          .config-modal .ant-modal-title {
            color: #1e293b;
            font-size: 20px;
            font-weight: 600;
          }

          .config-modal .ant-modal-body {
            padding: 24px;
          }

          .config-modal .ant-modal-footer {
            border-top: 1px solid #f1f5f9;
            padding: 20px 24px;
          }

          .config-modal .ant-btn-primary {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border: none;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }

          .config-form .ant-form-item-label > label {
            color: #334155;
            font-weight: 600;
          }

          .form-input,
          .form-select,
          .form-input-number {
            background: #fafafa;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            color: #1e293b;
            transition: all 0.3s ease;
          }

          .form-input:hover,
          .form-select:hover,
          .form-input-number:hover {
            border-color: #cbd5e1;
            background: #ffffff;
          }

          .form-input:focus,
          .form-select:focus,
          .form-input-number:focus {
            background: #ffffff;
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          }

          .form-input::placeholder {
            color: #94a3b8;
          }

          .form-select .ant-select-selector {
            background: transparent !important;
            border: none !important;
            color: #1e293b;
          }

          .form-select .ant-select-arrow {
            color: #94a3b8;
          }

          .form-row {
            display: flex;
            gap: 20px;
          }

          .form-item-half {
            flex: 1;
          }

          .form-slider .ant-slider-rail {
            background: #f1f5f9;
          }

          .form-slider .ant-slider-track {
            background: linear-gradient(90deg, #6366f1, #8b5cf6);
          }

          .form-slider .ant-slider-handle {
            background: white;
            border: 2px solid #6366f1;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
          }

          .loading-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
          }

          .delete-popconfirm .ant-popconfirm-content {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          }

          .delete-popconfirm .ant-popconfirm-title {
            color: #1e293b;
            font-weight: 600;
          }

          .delete-popconfirm .ant-popconfirm-description {
            color: #64748b;
          }

          .delete-popconfirm .ant-btn-dangerous {
            background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
            border: none;
          }
        `}
      </style>
    </div>
  );
};

export default ModelConfigPage;
