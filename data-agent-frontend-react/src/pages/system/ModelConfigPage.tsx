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
  CheckCircleOutlined,
  CloseCircleOutlined,
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

  return (
    <div style={{ padding: 32, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#0f172a' }}>模型服务</h1>
          <p style={{ color: '#6b6b6b', marginTop: 8, fontSize: 14 }}>
            连接 LLM 供应商，支持对话生成与向量检索。
          </p>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={fetchConfigs}
            style={{ borderColor: '#e2e8f0' }}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openCreateDialog(activeTab)}
            style={{ backgroundColor: '#000', borderColor: '#000' }}
          >
            {activeTab === 'CHAT' ? '添加对话模型' : '添加嵌入模型'}
          </Button>
        </Space>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <Segmented
          value={activeTab}
          onChange={(value) => setActiveTab(value as ModelType)}
          options={[
            { label: '对话模型', value: 'CHAT' },
            { label: '嵌入模型', value: 'EMBEDDING' },
          ]}
          size="large"
          style={{
            backgroundColor: '#f1f5f9',
            padding: 4,
            height: 48,
          }}
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="outlined" style={{ marginBottom: 16, borderRadius: 8 }}>
              <Skeleton avatar paragraph={{ rows: 3 }} active />
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>
          {filteredConfigs.length === 0 ? (
            <Card variant="outlined" style={{ borderRadius: 12 }}>
              <Empty
                description={
                  <>
                    <h3 style={{ fontWeight: 500, color: '#475569', marginBottom: 8 }}>暂无配置</h3>
                    <p style={{ color: '#64748b', marginBottom: 24 }}>您还没有在该分类下添加任何供应商</p>
                    <Button
                      type="primary"
                      onClick={() => openCreateDialog(activeTab)}
                      style={{ backgroundColor: '#000', borderColor: '#000' }}
                    >
                      立即添加
                    </Button>
                  </>
                }
              />
            </Card>
          ) : (
            filteredConfigs.map((model) => (
              <Card
                key={model.id}
                variant="outlined"
                style={{
                  marginBottom: 16,
                  borderRadius: 12,
                  borderColor: model.isActive ? '#2563eb' : '#e2e8f0',
                  backgroundColor: model.isActive ? '#f0f7ff' : '#fff',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                hoverable
              >
                <div style={{ display: 'flex', alignItems: 'center', padding: 8 }}>
                  <Avatar
                    size={48}
                    style={{
                      backgroundColor: model.isActive ? '#2563eb' : '#e2e8f0',
                      color: model.isActive ? '#fff' : '#64748b',
                      marginRight: 16,
                      borderRadius: 8,
                    }}
                    icon={model.modelType === 'CHAT' ? <span>💬</span> : <span>🔍</span>}
                  />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, marginRight: 8 }}>
                        {model.modelName}
                      </span>
                      {model.isActive && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 10,
                            backgroundColor: '#2563eb',
                            color: '#fff',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: '#fff',
                              animation: 'pulse 2s infinite',
                            }}
                          />
                          默认
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>📦</span>
                        {providerLabel(model.provider)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>🔗</span>
                        {model.baseUrl || '默认终端地址'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {!model.isActive && (
                      <Button
                        type="primary"
                        size="small"
                        loading={activatingId === model.id}
                        onClick={() => handleActivate(model)}
                        style={{ fontWeight: 600 }}
                      >
                        设为默认
                      </Button>
                    )}
                    <Button
                      size="small"
                      onClick={() => handleTestConnection(model)}
                      loading={testingId === model.id}
                      style={{ borderColor: '#e2e8f0' }}
                    >
                      测试连接
                    </Button>
                    <Divider orientation="vertical" style={{ height: 24, margin: '0 4px' }} />
                    <Space size={4}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(model)}
                        style={{ color: '#475569' }}
                      />
                      <Popconfirm
                        title="确认删除"
                        description={`你确认要删除 ${model.modelName} 吗？`}
                        onConfirm={() => handleDelete(model)}
                        okText="确认"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </Space>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Config Dialog */}
      <Modal
        title={dialogTitle}
        open={dialogVisible}
        onCancel={closeDialog}
        onOk={handleSubmit}
        confirmLoading={saving}
        width={500}
        okText="确认保存"
        cancelText="取消"
        okButtonProps={{ style: { backgroundColor: '#000', borderColor: '#000' } }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="模型供应商"
            name="provider"
            rules={[{ required: true, message: '该字段为必填项' }]}
          >
            <Select
              options={providerOptions}
              onChange={handleProviderChange}
            />
          </Form.Item>

          <Form.Item
            label="模型名称"
            name="modelName"
            rules={[{ required: true, message: '该字段为必填项' }]}
          >
            <Input placeholder="例如: gpt-4o 或 deepseek-chat" />
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
            />
          </Form.Item>

          <Form.Item
            label="接口地址 (Base URL)"
            name="baseUrl"
            rules={[{ required: true, message: '该字段为必填项' }]}
          >
            <Input placeholder="https://api.example.com/v1" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, curValues) => prevValues.modelType !== curValues.modelType}
          >
            {() => {
              const modelType = form.getFieldValue('modelType');
              return modelType === 'CHAT' ? (
                <Form.Item label="Completions 路径" name="completionsPath">
                  <Input placeholder="默认 /v1/chat/completions" />
                </Form.Item>
              ) : (
                <Form.Item label="Embeddings 路径" name="embeddingsPath">
                  <Input placeholder="默认 /v1/embeddings" />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="modelType" hidden>
            <Input />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              label="温度系数"
              name="temperature"
              style={{ flex: 1 }}
            >
              <Slider min={0} max={2} step={0.1} />
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
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={100} max={10000} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default ModelConfigPage;
