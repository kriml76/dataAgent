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
import { Card, Table, Button, Input, Space, Tag, Spin, Empty, Modal, Form, message, Tooltip, Popconfirm } from 'antd';
import { SearchOutlined, PlusOutlined, SyncOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, StarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import businessKnowledgeService from '@/services/businessKnowledge';
import type { BusinessKnowledgeVO, CreateBusinessKnowledgeDTO, UpdateBusinessKnowledgeDTO } from '@/services/businessKnowledge';
import { useSearchParams } from 'react-router-dom';

const KnowledgeBusinessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const agentId = Number(searchParams.get('agentId')) || 0;
  
  const [dataSource, setDataSource] = useState<BusinessKnowledgeVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [retryLoadingMap, setRetryLoadingMap] = useState<Record<number, boolean>>({});
  
  // Dialog states
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<number | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await businessKnowledgeService.list(agentId, searchKeyword || undefined);
      setDataSource(data);
    } catch (error) {
      console.error('Failed to load business knowledge:', error);
      message.error('加载业务知识失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [agentId]);

  // Utility functions
  const getVectorStatusColor = (status?: string): string => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'PENDING':
        return 'warning';
      case 'PROCESSING':
        return 'processing';
      default:
        return 'default';
    }
  };

  const getVectorStatusLabel = (status?: string): string => {
    switch (status) {
      case 'COMPLETED':
        return '已完成';
      case 'FAILED':
        return '失败';
      case 'PENDING':
        return '等待中';
      case 'PROCESSING':
        return '处理中';
      default:
        return '未知';
    }
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    loadData();
  };

  const openCreateDialog = () => {
    setIsEdit(false);
    setCurrentEditId(null);
    form.resetFields();
    form.setFieldsValue({ agentId });
    setDialogVisible(true);
  };

  const editKnowledge = (knowledge: BusinessKnowledgeVO) => {
    setIsEdit(true);
    setCurrentEditId(knowledge.id || null);
    form.setFieldsValue({
      businessTerm: knowledge.businessTerm,
      description: knowledge.description,
      synonyms: knowledge.synonyms,
      isRecall: knowledge.isRecall,
    });
    setDialogVisible(true);
  };

  const saveKnowledge = async () => {
    try {
      const values = await form.validateFields();
      setSaveLoading(true);
      
      if (isEdit && currentEditId) {
        const updateData: UpdateBusinessKnowledgeDTO = {
          businessTerm: values.businessTerm,
          description: values.description,
          synonyms: values.synonyms || '',
          agentId,
        };
        await businessKnowledgeService.update(currentEditId, updateData);
        message.success('更新成功');
      } else {
        const createData: CreateBusinessKnowledgeDTO = {
          businessTerm: values.businessTerm,
          description: values.description,
          synonyms: values.synonyms || '',
          isRecall: values.isRecall || false,
          agentId,
        };
        await businessKnowledgeService.create(createData);
        message.success('创建成功');
      }
      
      setDialogVisible(false);
      loadData();
    } catch (error) {
      console.error('Save failed:', error);
      message.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setSaveLoading(false);
    }
  };

  const deleteKnowledge = async (knowledge: BusinessKnowledgeVO) => {
    if (!knowledge.id) return;
    try {
      await businessKnowledgeService.delete(knowledge.id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('删除失败');
    }
  };

  const toggleRecall = async (knowledge: BusinessKnowledgeVO, isRecall: boolean) => {
    if (!knowledge.id) return;
    try {
      await businessKnowledgeService.recallKnowledge(knowledge.id, isRecall);
      message.success(isRecall ? '已设为召回' : '已取消召回');
      loadData();
    } catch (error) {
      console.error('Toggle recall failed:', error);
      message.error('操作失败');
    }
  };

  const retryEmbedding = async (knowledge: BusinessKnowledgeVO) => {
    if (!knowledge.id) return;
    setRetryLoadingMap(prev => ({ ...prev, [knowledge.id!]: true }));
    try {
      await businessKnowledgeService.retryEmbedding(knowledge.id);
      message.success('重试向量化成功');
      loadData();
    } catch (error) {
      console.error('Retry embedding failed:', error);
      message.error('重试向量化失败');
    } finally {
      setRetryLoadingMap(prev => ({ ...prev, [knowledge.id!]: false }));
    }
  };

  const handleRefreshVectorStore = () => {
    Modal.confirm({
      title: '确认同步',
      content: '如果所有向量状态正常，即无需同步。确定要清除现有数据并开始重新同步吗？',
      okText: '确定同步',
      cancelText: '取消',
      onOk: async () => {
        setRefreshLoading(true);
        try {
          await businessKnowledgeService.refreshAllKnowledgeToVectorStore(agentId.toString());
          message.success('同步到向量库成功');
          loadData();
        } catch (error) {
          console.error('Refresh vector store failed:', error);
          message.error('同步到向量库失败');
        } finally {
          setRefreshLoading(false);
        }
      },
    });
  };

  const columns: ColumnsType<BusinessKnowledgeVO> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '业务名词', dataIndex: 'businessTerm', key: 'businessTerm', width: 150 },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: {
        showTitle: false,
      },
      render: (description: string) => (
        <Tooltip placement="topLeft" title={description}>
          <span style={{ maxWidth: 200, display: 'inline-block' }} className="text-truncate">
            {description || '—'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '同义词',
      dataIndex: 'synonyms',
      key: 'synonyms',
      ellipsis: {
        showTitle: false,
      },
      render: (synonyms: string) => (
        <Tooltip placement="topLeft" title={synonyms}>
          <span style={{ maxWidth: 160, display: 'inline-block' }} className="text-truncate">
            {synonyms || '—'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '向量化状态',
      dataIndex: 'embeddingStatus',
      key: 'embeddingStatus',
      width: 140,
      render: (embeddingStatus: string | undefined, record: BusinessKnowledgeVO) => (
        <Space>
          <Tag color={getVectorStatusColor(embeddingStatus)}>
            {embeddingStatus === 'FAILED' && <ReloadOutlined style={{ marginRight: 4 }} />}
            {embeddingStatus === 'COMPLETED' && <span style={{ marginRight: 4 }}>✓</span>}
            {embeddingStatus === 'PROCESSING' && <span style={{ marginRight: 4 }}>⟳</span>}
            {getVectorStatusLabel(embeddingStatus)}
          </Tag>
          {embeddingStatus === 'FAILED' && record.errorMsg && (
            <Tooltip title={record.errorMsg}>
              <span style={{ cursor: 'help', color: '#ff4d4f' }}>ⓘ</span>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '召回状态',
      dataIndex: 'isRecall',
      key: 'isRecall',
      width: 120,
      render: (isRecall: boolean) => (
        <Tag color={isRecall ? 'blue' : 'default'}>
          {isRecall ? '召回中' : '未召回'}
        </Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createdTime', key: 'createdTime', width: 160 },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: BusinessKnowledgeVO) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => editKnowledge(record)}
          />
          {record.embeddingStatus === 'FAILED' && (
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
              loading={record.id ? retryLoadingMap[record.id] : false}
              onClick={() => retryEmbedding(record)}
            />
          )}
          {record.isRecall ? (
            <Popconfirm
              title="取消召回"
              description="确定要取消该知识的召回吗？"
              onConfirm={() => toggleRecall(record, false)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<StarOutlined />} style={{ color: '#faad14' }}>
                <Tooltip title="取消召回">取消召回</Tooltip>
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="设为召回"
              description="确定要将该知识设为召回吗？"
              onConfirm={() => toggleRecall(record, true)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<StarOutlined />}>
                <Tooltip title="设为召回">设为召回</Tooltip>
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="删除确认"
            description={`确定要删除业务知识「${record.businessTerm}」吗？此操作不可恢复。`}
            onConfirm={() => deleteKnowledge(record)}
            okText="确定删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>业务知识配置</h1>
        <p style={{ color: '#6b6b6b', marginTop: 8 }}>
          管理全局业务术语词汇表，支持同义词扩展与向量化召回。
        </p>
      </div>

      {/* Actions */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="请输入关键词搜索业务名词、描述或同义词..."
            prefix={<SearchOutlined />}
            style={{ width: 400 }}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={loadData}
            allowClear
            onClear={handleClearSearch}
          />
          <Button
            icon={<SyncOutlined />}
            loading={refreshLoading}
            onClick={handleRefreshVectorStore}
          >
            同步到向量库
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDialog}>
            添加知识
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card bordered={false}>
        <Spin spinning={loading}>
          {dataSource.length === 0 && !loading ? (
            <Empty
              description="暂无业务知识"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <p style={{ color: '#6b6b6b', marginBottom: 16 }}>
                点击「添加知识」开始配置业务术语词汇
              </p>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDialog}>
                添加知识
              </Button>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={dataSource}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
            />
          )}
        </Spin>
      </Card>

      {/* Add/Edit Dialog */}
      <Modal
        title={
          <Space>
            {isEdit ? <EditOutlined style={{ color: '#1677ff' }} /> : <PlusOutlined style={{ color: '#1677ff' }} />}
            <span>{isEdit ? '编辑业务知识' : '添加业务知识'}</span>
          </Space>
        }
        open={dialogVisible}
        onCancel={() => setDialogVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDialogVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={saveLoading} onClick={saveKnowledge}>
            {isEdit ? '保存更新' : '立即创建'}
          </Button>,
        ]}
        width={640}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            businessTerm: '',
            description: '',
            synonyms: '',
            isRecall: false,
            agentId,
          }}
        >
          <Form.Item
            label="业务名词"
            name="businessTerm"
            rules={[{ required: true, message: '业务名词不能为空' }]}
          >
            <Input placeholder="请输入业务名词，例如：月活用户、GMV" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: '描述不能为空' }]}
          >
            <Input.TextArea
              placeholder="请输入业务知识描述，详细说明该术语的含义与用法"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            label="同义词"
            name="synonyms"
          >
            <Input.TextArea
              placeholder="请输入同义词，多个同义词用逗号分隔，例如：MAU, 月活, 月活跃用户数"
              rows={2}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgeBusinessPage;
