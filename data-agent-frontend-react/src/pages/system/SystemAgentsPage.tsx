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
  Table,
  Button,
  Input,
  Space,
  Tag,
  Spin,
  Empty,
  Modal,
  Form,
  message,
  Tooltip,
  Popconfirm,
  Avatar,
  Segmented,
  Select,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import agentService from '@/services/agent';
import type { Agent } from '@/services/agent';
import { useNavigate } from 'react-router-dom';

const SystemAgentsPage: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [dataSource, setDataSource] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'published' | 'draft' | 'offline'>('all');
  
  // Edit dialog states
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [saveLoading, setSaveLoading] = useState(false);
  const [form] = Form.useForm<Partial<Agent>>();
  
  // Tags dialog states
  const [tagsDialogVisible, setTagsDialogVisible] = useState(false);
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  useEffect(() => {
    loadAgents();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await agentService.list();
      setDataSource(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
      message.error('加载智能体失败');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string): string => {
    if (!name) return 'AI';
    return name.substring(0, 2).toUpperCase();
  };

  const parseTags = (tags?: string): string[] => {
    if (!tags || tags.trim() === '') return [];
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  };

  const getStatusText = (status?: string): string => {
    const statusMap: Record<string, string> = {
      published: '已发布',
      draft: '草稿',
      offline: '已下线',
    };
    return statusMap[status || ''] || status || '未知';
  };

  const getStatusColor = (status?: string): string => {
    const colorMap: Record<string, string> = {
      published: 'success',
      draft: 'warning',
      offline: 'default',
    };
    return colorMap[status || ''] || 'default';
  };

  const formatTime = (time?: Date | string): string => {
    if (!time) return '';
    const date = typeof time === 'string' ? new Date(time) : time;
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const goToCreateAgent = () => {
    navigate('/agent/new');
  };

  const handleEdit = (agent: Agent) => {
    setEditingId(agent.id);
    form.setFieldsValue({
      name: agent.name,
      description: agent.description,
      category: agent.category,
      tags: agent.tags,
      status: agent.status,
    });
    setEditDialogVisible(true);
  };

  const closeEditDialog = () => {
    setEditDialogVisible(false);
    setEditingId(undefined);
    form.resetFields();
  };

  const saveEdit = async () => {
    try {
      const values = await form.validateFields();
      if (!editingId) {
        message.error('智能体ID不存在');
        return;
      }

      setSaveLoading(true);
      const result = await agentService.update(editingId, {
        name: values.name?.trim(),
        description: values.description?.trim(),
        category: values.category?.trim(),
        tags: values.tags?.trim(),
        status: values.status,
      });

      if (result) {
        message.success('智能体更新成功');
        closeEditDialog();
        loadAgents();
      } else {
        message.error('智能体更新失败');
      }
    } catch (error) {
      console.error('Save failed:', error);
      message.error('更新请求失败，请检查网络');
    } finally {
      setSaveLoading(false);
    }
  };

  const showAllTags = (agent: Agent) => {
    setCurrentTags(parseTags(agent.tags));
    setTagsDialogVisible(true);
  };

  const handleDelete = async (agent: Agent) => {
    if (!agent.id) {
      message.error('智能体ID不存在');
      return;
    }

    try {
      const success = await agentService.delete(agent.id);
      if (success) {
        message.success('智能体删除成功');
        loadAgents();
      } else {
        message.error('智能体删除失败');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('删除请求失败，请检查网络');
    }
  };

  // Computed values
  const publishedCount = dataSource.filter(a => a.status === 'published').length;
  const draftCount = dataSource.filter(a => a.status === 'draft').length;
  const offlineCount = dataSource.filter(a => a.status === 'offline').length;

  const filteredAgents = dataSource.filter(agent => {
    let filtered = true;
    
    // Filter by status
    if (activeFilter !== 'all') {
      filtered = agent.status === activeFilter;
    }
    
    // Filter by keyword
    if (debouncedSearch.trim()) {
      const keyword = debouncedSearch.toLowerCase().trim();
      const nameMatch = agent.name?.toLowerCase().includes(keyword);
      const descMatch = agent.description?.toLowerCase().includes(keyword);
      const idMatch = agent.id?.toString().includes(keyword);
      filtered = filtered && (nameMatch || descMatch || idMatch);
    }
    
    return filtered;
  });

  const columns: ColumnsType<Agent> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => (
        <span style={{ fontWeight: 500, color: '#6b6b6b' }}>{id}</span>
      ),
    },
    {
      title: '智能体',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (_: string, record: Agent) => (
        <Space size={12}>
          <Avatar size={40} shape="square">
            {record.avatar ? (
              <img src={record.avatar} alt={record.name} />
            ) : (
              getInitials(record.name)
            )}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#6b6b6b' }}>
              {record.category || '未分类'}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 280,
      render: (description: string) => (
        <div style={{ maxWidth: 300, color: '#6b6b6b' }}>
          {description || '暂无描述'}
        </div>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 240,
      render: (tags: string) => {
        const tagList = parseTags(tags);
        return (
          <Space size={4} wrap>
            {tagList.length > 0 ? (
              <>
                {tagList.slice(0, 4).map((tag, index) => (
                  <Tag key={index} color="blue">{tag}</Tag>
                ))}
                {tagList.length > 4 && (
                  <Button
                    type="text"
                    size="small"
                    icon={<span>···</span>}
                    onClick={() => showAllTags({ tags } as Agent)}
                  >
                    <Tooltip title="查看全部标签">查看全部</Tooltip>
                  </Button>
                )}
              </>
            ) : (
              <span style={{ fontSize: 12, color: '#999' }}>暂无标签</span>
            )}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 170,
      render: (createTime: Date | string) => (
        <span style={{ color: '#6b6b6b' }}>{formatTime(createTime)}</span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record: Agent) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            <Tooltip title="编辑">编辑</Tooltip>
          </Button>
          <Popconfirm
            title="删除确认"
            description={`确定要删除智能体 "${record.name}" 吗？此操作不可恢复。`}
            onConfirm={() => handleDelete(record)}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              <Tooltip title="删除">删除</Tooltip>
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      {/* Header Section */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>DATA AGENT</h1>
          <p style={{ color: '#6b6b6b', marginTop: 4 }}>
            创建和管理您的AI智能体，让数据分析更智能
          </p>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={loadAgents}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={goToCreateAgent}
            style={{ backgroundColor: '#000', borderColor: '#000' }}
          >
            新建智能体
          </Button>
        </Space>
      </div>

      {/* Filter and Search Section */}
      <Card bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input
            placeholder="搜索智能体名称、ID或描述..."
            prefix={<SearchOutlined />}
            style={{ width: 350 }}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            allowClear
          />
          <Segmented
            options={[
              {
                label: (
                  <Space>
                    全部智能体
                    <Tag style={{ margin: 0 }}>{dataSource.length}</Tag>
                  </Space>
                ),
                value: 'all',
              },
              {
                label: (
                  <Space>
                    已发布
                    <Tag color="success" style={{ margin: 0 }}>{publishedCount}</Tag>
                  </Space>
                ),
                value: 'published',
              },
              {
                label: (
                  <Space>
                    草稿
                    <Tag color="warning" style={{ margin: 0 }}>{draftCount}</Tag>
                  </Space>
                ),
                value: 'draft',
              },
              {
                label: (
                  <Space>
                    已下线
                    <Tag style={{ margin: 0 }}>{offlineCount}</Tag>
                  </Space>
                ),
                value: 'offline',
              },
            ]}
            value={activeFilter}
            onChange={(value) => setActiveFilter(value as any)}
            style={{ backgroundColor: '#f1f5f9', padding: 4 }}
          />
        </Space>
      </Card>

      {/* Data Table */}
      <Card bordered={false} style={{ borderRadius: 8 }}>
        <Spin spinning={loading}>
          {filteredAgents.length === 0 && !loading ? (
            <Empty
              description={activeFilter === 'all' ? '您还没有创建任何智能体' : '该分类下暂无智能体'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              {activeFilter === 'all' && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={goToCreateAgent}
                  style={{ backgroundColor: '#000', borderColor: '#000' }}
                >
                  新建智能体
                </Button>
              )}
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredAgents}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
            />
          )}
        </Spin>
      </Card>

      {/* Edit Dialog */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#1677ff' }} />
            <span>编辑智能体</span>
          </Space>
        }
        open={editDialogVisible}
        onCancel={closeEditDialog}
        footer={[
          <Button key="cancel" onClick={closeEditDialog}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={saveLoading}
            onClick={saveEdit}
            style={{ backgroundColor: '#1e40af', borderColor: '#1e40af' }}
          >
            保存修改
          </Button>,
        ]}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="智能体名称"
            name="name"
            rules={[{ required: true, message: '名称不能为空' }]}
          >
            <Input placeholder="请输入智能体名称" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea placeholder="请输入智能体描述" rows={3} />
          </Form.Item>

          <Form.Item label="分类" name="category">
            <Input placeholder="请输入分类" />
          </Form.Item>

          <Form.Item label="标签（逗号分隔）" name="tags">
            <Input placeholder="例如：数据分析，智能助手，推荐系统" />
          </Form.Item>

          <Form.Item label="状态" name="status">
            <Select
              options={[
                { label: '草稿', value: 'draft' },
                { label: '已发布', value: 'published' },
                { label: '已下线', value: 'offline' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Tags Dialog */}
      <Modal
        title={
          <Space>
            <span style={{ color: '#1677ff' }}>🏷️</span>
            <span>全部标签</span>
          </Space>
        }
        open={tagsDialogVisible}
        onCancel={() => setTagsDialogVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTagsDialogVisible(false)}>
            关闭
          </Button>,
        ]}
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          <Space wrap size={[8, 8]}>
            {currentTags.length > 0 ? (
              currentTags.map((tag, index) => (
                <Tag key={index} color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                  {tag}
                </Tag>
              ))
            ) : (
              <div style={{ textAlign: 'center', width: '100%', padding: 16, color: '#999' }}>
                暂无标签
              </div>
            )}
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default SystemAgentsPage;
