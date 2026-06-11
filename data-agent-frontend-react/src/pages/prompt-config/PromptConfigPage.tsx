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
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Space,
  Tag,
  Popconfirm,
  Checkbox,
  Tooltip,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { promptService, type PromptConfig } from '@/services/prompt';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const PromptConfigPage: React.FC = () => {
  // 状态管理
  const [configs, setConfigs] = useState<PromptConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPriorityModalVisible, setIsPriorityModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PromptConfig | null>(null);
  const [priorityConfig, setPriorityConfig] = useState<PromptConfig | null>(null);
  const [form] = Form.useForm();
  const [priorityForm] = Form.useForm();

  // 从 URL 获取智能体 ID
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('agentId');
  const promptType = 'report-generator'; // 默认提示词类型

  // 加载配置列表
  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await promptService.listByType(promptType, agentId);
      setConfigs(data);
      // 如果配置列表为空，自动关闭批量操作面板
      if (data.length === 0) {
        setShowBatchActions(false);
        setSelectedRowKeys([]);
      }
    } catch (error) {
      message.error('加载优化配置失败');
      console.error('加载优化配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, [agentId]);

  // 保存配置
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const configData: PromptConfig = {
        ...values,
        promptType,
        agentId: agentId ? Number(agentId) : null,
        enabled: true,
        creator: 'user',
        priority: values.priority || 0,
        displayOrder: values.displayOrder || 0,
      };

      if (editingConfig?.id) {
        configData.id = editingConfig.id;
      }

      const result = await promptService.save(configData);
      if (result.success) {
        message.success(result.message || '保存成功');
        handleCloseModal();
        loadConfigs();
      } else {
        message.error(result.message || '保存失败');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败');
    }
  };

  // 切换启用/禁用状态
  const handleToggleEnable = async (config: PromptConfig) => {
    try {
      const result = config.enabled
        ? await promptService.disable(config.id!)
        : await promptService.enable(config.id!);

      if (result.success) {
        message.success(result.message || '操作成功');
        loadConfigs();
      } else {
        message.error(result.message || '操作失败');
      }
    } catch (error) {
      console.error('切换配置状态失败:', error);
      message.error('操作失败');
    }
  };

  // 删除配置
  const handleDelete = async (id: number) => {
    try {
      const result = await promptService.delete(id);
      if (result.success) {
        message.success(result.message || '删除成功');
        loadConfigs();
        // 从选中列表中移除
        setSelectedRowKeys(selectedRowKeys.filter((key) => key !== id));
      } else {
        message.error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除配置失败:', error);
      message.error('删除配置失败');
    }
  };

  // 编辑配置
  const handleEdit = (config: PromptConfig) => {
    setEditingConfig(config);
    form.setFieldsValue({
      name: config.name,
      description: config.description,
      optimizationPrompt: config.optimizationPrompt,
      priority: config.priority || 0,
      displayOrder: config.displayOrder || 0,
    });
    setIsModalVisible(true);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingConfig(null);
    form.resetFields();
  };

  // 批量启用
  const handleBatchEnable = async () => {
    if (selectedRowKeys.length === 0) return;

    try {
      const result = await promptService.batchEnable(selectedRowKeys as number[]);
      if (result.success) {
        message.success(result.message || '批量启用成功');
        loadConfigs();
        setSelectedRowKeys([]);
        setShowBatchActions(false);
      } else {
        message.error(result.message || '批量启用失败');
      }
    } catch (error) {
      console.error('批量启用失败:', error);
      message.error('批量启用失败');
    }
  };

  // 批量禁用
  const handleBatchDisable = async () => {
    if (selectedRowKeys.length === 0) return;

    try {
      const result = await promptService.batchDisable(selectedRowKeys as number[]);
      if (result.success) {
        message.success(result.message || '批量禁用成功');
        loadConfigs();
        setSelectedRowKeys([]);
        setShowBatchActions(false);
      } else {
        message.error(result.message || '批量禁用失败');
      }
    } catch (error) {
      console.error('批量禁用失败:', error);
      message.error('批量禁用失败');
    }
  };

  // 清除选择
  const handleClearSelection = () => {
    setSelectedRowKeys([]);
    setShowBatchActions(false);
  };

  // 显示优先级设置对话框
  const handleShowPriorityDialog = (config: PromptConfig) => {
    setPriorityConfig(config);
    priorityForm.setFieldsValue({
      priority: config.priority || 0,
      displayOrder: config.displayOrder || 0,
    });
    setIsPriorityModalVisible(true);
  };

  // 更新优先级
  const handleUpdatePriority = async () => {
    try {
      const values = await priorityForm.validateFields();
      if (!priorityConfig?.id) return;

      const result = await promptService.updatePriority(priorityConfig.id, values.priority);
      if (result.success) {
        message.success('优先级更新成功');
        loadConfigs();
        handleClosePriorityModal();
      } else {
        message.error(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新优先级失败:', error);
      message.error('更新优先级失败');
    }
  };

  // 关闭优先级模态框
  const handleClosePriorityModal = () => {
    setIsPriorityModalVisible(false);
    setPriorityConfig(null);
    priorityForm.resetFields();
  };

  // 表格列定义
  const columns: ColumnsType<PromptConfig> = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: number) => (
        <Tag color="blue">{priority !== undefined ? priority : 0}</Tag>
      ),
    },
    {
      title: '显示顺序',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 100,
      render: (order: number) => order !== undefined ? order : 0,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '已启用' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Switch
            checked={record.enabled}
            onChange={() => handleToggleEnable(record)}
            checkedChildren="启用"
            unCheckedChildren="禁用"
            size="small"
          />
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="优先级">
            <Button
              type="link"
              icon={<ArrowUpOutlined />}
              onClick={() => handleShowPriorityDialog(record)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个优化配置吗？"
            onConfirm={() => handleDelete(record.id!)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>增强式Prompt优化配置</Title>
      <Paragraph type="secondary">
        配置的Prompt仅用作效果优化，支持多个提示词配置，在原始模板基础上进行增强。
      </Paragraph>
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Paragraph>
          <Text strong>示例配置：</Text>
        </Paragraph>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>1. 查询的年销售额精确到小数点后两位。</li>
          <li>2. 报告第一章节请先总结年销售额</li>
        </ul>
      </Card>

      {/* 智能体Prompt展示 */}
      <Card title="智能体Prompt" bordered={false} style={{ marginBottom: 16 }}>
        <Text>
          你是一个销售数据分析专家，能够帮助用户分析销售趋势，客户行为和业务指标。
        </Text>
      </Card>

      {/* 优化配置列表 */}
      <Card
        title="优化配置列表"
        bordered={false}
        extra={
          <Space>
            {configs.length > 0 && (
              <Button
                icon={<SettingOutlined />}
                onClick={() => setShowBatchActions(!showBatchActions)}
              >
                批量操作
              </Button>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
              添加优化配置
            </Button>
          </Space>
        }
      >
        {/* 批量操作面板 */}
        {showBatchActions && (
          <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <Checkbox
                  checked={selectedRowKeys.length === configs.length && configs.length > 0}
                  indeterminate={
                    selectedRowKeys.length > 0 && selectedRowKeys.length < configs.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRowKeys(configs.map((config) => config.id!));
                    } else {
                      setSelectedRowKeys([]);
                    }
                  }}
                >
                  <Text>
                    {selectedRowKeys.length === configs.length && configs.length > 0
                      ? '已全选'
                      : `已选择 ${selectedRowKeys.length} 个配置`}
                  </Text>
                </Checkbox>
              </Space>
              <Space>
                <Button
                  type="primary"
                  ghost
                  onClick={handleBatchEnable}
                  disabled={selectedRowKeys.length === 0}
                >
                  批量启用
                </Button>
                <Button
                  danger
                  ghost
                  onClick={handleBatchDisable}
                  disabled={selectedRowKeys.length === 0}
                >
                  批量禁用
                </Button>
                <Button onClick={handleClearSelection}>取消选择</Button>
              </Space>
            </Space>
          </Card>
        )}

        {/* 配置表格 */}
        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={false}
          locale={{ emptyText: '暂无优化配置，点击"添加优化配置"开始配置' }}
        />
      </Card>

      {/* 添加/编辑配置对话框 */}
      <Modal
        title={editingConfig ? '编辑优化配置' : '添加优化配置'}
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            label="配置名称"
            name="name"
            rules={[{ required: true, message: '请输入配置名称' }]}
          >
            <Input placeholder="请输入配置名称" />
          </Form.Item>

          <Form.Item label="配置描述" name="description">
            <Input placeholder="请输入配置描述" />
          </Form.Item>

          <Form.Item
            label="优化提示词内容"
            name="optimizationPrompt"
            rules={[{ required: true, message: '请输入优化提示词内容' }]}
          >
            <TextArea
              rows={6}
              placeholder="请输入优化提示词内容，支持模板变量如 {user_requirements_and_plan}"
            />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item label="优先级" name="priority" style={{ flex: 1 }}>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0-100，数字越大优先级越高"
                style={{ width: 300 }}
              />
            </Form.Item>
            <Form.Item label="显示顺序" name="displayOrder" style={{ flex: 1 }}>
              <Input type="number" min={0} placeholder="显示顺序，数字越小越靠前" style={{ width: 300 }} />
            </Form.Item>
          </Space>

          <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={handleCloseModal}>取消</Button>
              <Button type="primary" htmlType="submit">
                保存配置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 优先级设置对话框 */}
      <Modal
        title="设置优先级"
        open={isPriorityModalVisible}
        onCancel={handleClosePriorityModal}
        footer={null}
      >
        <Form form={priorityForm} layout="vertical" onFinish={handleUpdatePriority}>
          <Form.Item
            label="优先级 (0-100)"
            name="priority"
            rules={[{ required: true, message: '请输入优先级' }]}
          >
            <Input type="number" min={0} max={100} placeholder="数字越大优先级越高" />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            优先级越高，该配置在多个配置中的执行顺序越靠前
          </Text>

          <Form.Item label="显示顺序" name="displayOrder" style={{ marginTop: 16 }}>
            <Input type="number" min={0} placeholder="数字越小越靠前" />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            控制配置在列表中的显示顺序
          </Text>

          <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={handleClosePriorityModal}>取消</Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromptConfigPage;
