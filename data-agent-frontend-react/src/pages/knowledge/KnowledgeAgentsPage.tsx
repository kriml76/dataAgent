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
  Select,
  Upload,
  Alert,
  Pagination,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  FilterOutlined,
  UploadOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import agentKnowledgeService from '@/services/agentKnowledge';
import agentService from '@/services/agent';
import type { AgentKnowledge, AgentKnowledgeQueryDTO } from '@/services/agentKnowledge';
import type { Agent } from '@/services/agent';
import { useSearchParams } from 'react-router-dom';
import type { UploadFile } from 'antd/es/upload/interface';

interface KnowledgeForm extends AgentKnowledge {
  answer?: string;
  splitterType?: string;
}

const KnowledgeAgentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  // State management
  const [agentId, setAgentId] = useState<number>(0);
  const [dataSource, setDataSource] = useState<AgentKnowledge[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);
  const [retryLoadingMap, setRetryLoadingMap] = useState<Record<number, boolean>>({});
  
  // Dialog states
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<number | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [form] = Form.useForm<KnowledgeForm>();
  const [selectedFile, setSelectedFile] = useState<UploadFile | null>(null);
  
  // Query params
  const [queryParams, setQueryParams] = useState<AgentKnowledgeQueryDTO>({
    agentId: 0,
    title: '',
    type: '',
    embeddingStatus: '',
    pageNum: 1,
    pageSize: 10,
  });

  // Resolve agent ID on mount
  useEffect(() => {
    const resolveAgentId = async () => {
      const routeAgentId = Number(searchParams.get('agentId'));
      if (routeAgentId > 0) {
        setAgentId(routeAgentId);
        return;
      }
      
      try {
        const agents = await agentService.list();
        const fallbackId = agents.find((item) => item.id && item.id > 0)?.id;
        setAgentId(fallbackId || 0);
      } catch {
        setAgentId(0);
      }
    };
    
    resolveAgentId();
  }, [searchParams]);

  // Load data when agentId or queryParams change
  useEffect(() => {
    if (agentId > 0) {
      loadData();
    }
  }, [agentId, queryParams]);

  const loadData = async () => {
    if (agentId <= 0) return;
    
    try {
      setLoading(true);
      const result = await agentKnowledgeService.queryByPage({
        ...queryParams,
        agentId,
        type: queryParams.type || '',
        embeddingStatus: queryParams.embeddingStatus || '',
      });
      
      if (result.success) {
        setDataSource(result.data || []);
        setTotal(result.total || 0);
      } else {
        message.error(result.message || '加载知识列表失败');
      }
    } catch (error) {
      console.error('Failed to load knowledge:', error);
      message.error('加载知识列表失败');
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const getTypeLabel = (type?: string): string => {
    switch (type) {
      case 'DOCUMENT':
        return '文档';
      case 'QA':
        return '问答对';
      case 'FAQ':
        return 'FAQ';
      default:
        return type || '未知';
    }
  };

  const getTypeColor = (type?: string): string => {
    switch (type) {
      case 'DOCUMENT':
        return 'blue';
      case 'QA':
        return 'indigo';
      case 'FAQ':
        return 'cyan';
      default:
        return 'default';
    }
  };

  const getEmbeddingStatusColor = (status?: string): string => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PROCESSING':
        return 'processing';
      case 'FAILED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getEmbeddingStatusLabel = (status?: string): string => {
    switch (status) {
      case 'COMPLETED':
        return '已完成';
      case 'PROCESSING':
        return '处理中';
      case 'FAILED':
        return '失败';
      case 'PENDING':
        return '等待中';
      default:
        return status || '未知';
    }
  };

  const handleSearch = () => {
    setQueryParams(prev => ({ ...prev, pageNum: 1 }));
  };

  const clearFilters = () => {
    setQueryParams(prev => ({
      ...prev,
      type: '',
      embeddingStatus: '',
      pageNum: 1,
    }));
  };

  const handleSizeChange = (pageSize: number) => {
    setQueryParams(prev => ({ ...prev, pageSize, pageNum: 1 }));
  };

  const handlePageChange = (pageNum: number) => {
    setQueryParams(prev => ({ ...prev, pageNum }));
  };

  const openCreateDialog = () => {
    setIsEdit(false);
    setCurrentEditId(null);
    form.resetFields();
    form.setFieldsValue({
      agentId,
      type: 'DOCUMENT',
      isRecall: true,
      splitterType: 'recursive',
    });
    setSelectedFile(null);
    setDialogVisible(true);
  };

  const editKnowledge = (knowledge: AgentKnowledge) => {
    setIsEdit(true);
    setCurrentEditId(knowledge.id || null);
    form.setFieldsValue({
      ...knowledge,
      answer:
        knowledge.type === 'QA' || knowledge.type === 'FAQ'
          ? knowledge.content
          : '',
      splitterType: 'recursive',
    });
    setDialogVisible(true);
  };

  const handleTypeChange = () => {
    form.setFieldsValue({
      content: '',
      question: '',
      answer: '',
    });
    setSelectedFile(null);
  };

  const handleFileChange = (file: UploadFile) => {
    setSelectedFile(file);
  };

  const saveKnowledge = async () => {
    try {
      const values = await form.validateFields();
      
      // Validation
      if (values.type === 'DOCUMENT' && !isEdit && !selectedFile) {
        message.warning('请上传文件');
        return;
      }
      if (
        (values.type === 'QA' || values.type === 'FAQ') &&
        !values.question?.trim()
      ) {
        message.warning('请输入问题');
        return;
      }
      if (
        (values.type === 'QA' || values.type === 'FAQ') &&
        !values.answer?.trim()
      ) {
        message.warning('请输入答案');
        return;
      }

      setSaveLoading(true);

      if (isEdit && currentEditId) {
        const updateData = {
          ...values,
          type: values.type?.toUpperCase(),
          content:
            values.type === 'QA' || values.type === 'FAQ'
              ? values.answer
              : values.content,
        };
        const result = await agentKnowledgeService.update(currentEditId, updateData);
        if (result) {
          message.success('更新成功');
        } else {
          message.error('更新失败');
          return;
        }
      } else {
        const fd = new FormData();
        fd.append('agentId', String(agentId));
        fd.append('title', values.title || '');
        fd.append('type', values.type || 'DOCUMENT');
        fd.append('isRecall', values.isRecall ? '1' : '0');
        
        if (values.type === 'DOCUMENT' && selectedFile) {
          fd.append('file', selectedFile.originFileObj as File);
          if (values.splitterType) {
            fd.append('splitterType', values.splitterType);
          }
        } else {
          fd.append('question', values.question || '');
          fd.append('content', values.answer || '');
        }
        
        const result = await agentKnowledgeService.createWithFile(fd);
        if (result.success) {
          message.success('创建成功');
        } else {
          message.error(result.message || '创建失败');
          return;
        }
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

  const toggleStatus = (knowledge: AgentKnowledge) => {
    if (!knowledge.id) return;
    const nextRecallStatus = !knowledge.isRecall;
    
    Modal.confirm({
      title: '状态变更确认',
      content: `确定要${nextRecallStatus ? '设为召回' : '取消召回'}「${knowledge.title}」吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await agentKnowledgeService.updateRecallStatus(
            knowledge.id!,
            nextRecallStatus
          );
          if (result) {
            message.success(`${nextRecallStatus ? '设为召回' : '取消召回'}成功`);
            loadData();
          } else {
            message.error('操作失败');
          }
        } catch (error) {
          console.error('Toggle status failed:', error);
          message.error('操作失败');
        }
      },
    });
  };

  const handleRetry = async (knowledge: AgentKnowledge) => {
    if (!knowledge.id) return;
    setRetryLoadingMap(prev => ({ ...prev, [knowledge.id!]: true }));
    
    try {
      const success = await agentKnowledgeService.retryEmbedding(knowledge.id);
      if (success) {
        message.success('重试请求已发送');
        loadData();
      } else {
        message.error('重试失败');
      }
    } catch (error) {
      console.error('Retry failed:', error);
      message.error('重试失败');
    } finally {
      setRetryLoadingMap(prev => ({ ...prev, [knowledge.id!]: false }));
    }
  };

  const deleteKnowledge = async (knowledge: AgentKnowledge) => {
    if (!knowledge.id) return;
    
    try {
      const result = await agentKnowledgeService.delete(knowledge.id);
      if (result) {
        message.success('删除成功');
        loadData();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('删除失败');
    }
  };

  // Constants
  const knowledgeTypeOptions = [
    { label: '文档', value: 'DOCUMENT' },
    { label: '问答对', value: 'QA' },
    { label: '常见问题', value: 'FAQ' },
  ];

  const embeddingStatusOptions = [
    { label: '已完成', value: 'COMPLETED' },
    { label: '处理中', value: 'PROCESSING' },
    { label: '失败', value: 'FAILED' },
    { label: '等待中', value: 'PENDING' },
  ];

  const splitterTypeOptions = [
    { label: 'Token 分块', value: 'token' },
    { label: '递归分块', value: 'recursive' },
    { label: '句子分块', value: 'sentence' },
    { label: '段落分块', value: 'paragraph' },
    { label: '语义分块', value: 'semantic' },
  ];

  const totalPages = Math.max(1, Math.ceil(total / (queryParams.pageSize || 10)));

  const columns: ColumnsType<AgentKnowledge> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{getTypeLabel(type)}</Tag>
      ),
    },
    {
      title: '处理状态',
      dataIndex: 'embeddingStatus',
      key: 'embeddingStatus',
      width: 150,
      render: (embeddingStatus: string | undefined, record: AgentKnowledge) => (
        <Space>
          <Tag color={getEmbeddingStatusColor(embeddingStatus)}>
            {embeddingStatus === 'FAILED' && <ReloadOutlined style={{ marginRight: 4 }} />}
            {embeddingStatus === 'COMPLETED' && <span style={{ marginRight: 4 }}>✓</span>}
            {embeddingStatus === 'PROCESSING' && <span style={{ marginRight: 4 }}>⟳</span>}
            {getEmbeddingStatusLabel(embeddingStatus)}
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
          {isRecall ? '已召回' : '未召回'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: AgentKnowledge) => (
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
              onClick={() => handleRetry(record)}
            />
          )}
          <Popconfirm
            title={record.isRecall ? '取消召回' : '设为召回'}
            description={`确定要${record.isRecall ? '取消召回' : '设为召回'}「${record.title}」吗？`}
            onConfirm={() => toggleStatus(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              icon={<StarOutlined />}
              style={{ color: record.isRecall ? '#faad14' : undefined }}
            >
              <Tooltip title={record.isRecall ? '取消召回' : '设为召回'}>
                {record.isRecall ? '取消召回' : '设为召回'}
              </Tooltip>
            </Button>
          </Popconfirm>
          <Popconfirm
            title="删除确认"
            description={`确定要删除知识「${record.title}」吗？此操作不可恢复。`}
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
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, }}>
          智能体知识库
        </h1>
        <p style={{ color: '#6b6b6b', marginTop: 8 }}>
          维护智能体专属知识资源，支持文档上传、问答配置与向量召回。
        </p>
      </div>

      {/* Actions */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="请输入知识标题搜索"
            prefix={<SearchOutlined />}
            style={{ width: 420 }}
            value={queryParams.title}
            onChange={(e) =>
              setQueryParams(prev => ({ ...prev, title: e.target.value }))
            }
            onPressEnter={handleSearch}
            allowClear
            onClear={handleSearch}
          />
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterVisible(!filterVisible)}
            style={{
              backgroundColor: filterVisible ? '#1677ff' : undefined,
              color: filterVisible ? '#fff' : undefined,
            }}
          >
            筛选
          </Button>
          <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
            总数 {total}
          </Tag>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDialog}>
            添加知识
          </Button>
        </Space>

        {/* Filter panel */}
        {filterVisible && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <Space wrap>
              <Select
                placeholder="知识类型"
                style={{ width: 180 }}
                value={queryParams.type || undefined}
                options={knowledgeTypeOptions}
                allowClear
                onChange={(value) => {
                  setQueryParams(prev => ({ ...prev, type: value || '', pageNum: 1 }));
                }}
              />
              <Select
                placeholder="处理状态"
                style={{ width: 180 }}
                value={queryParams.embeddingStatus || undefined}
                options={embeddingStatusOptions}
                allowClear
                onChange={(value) => {
                  setQueryParams(prev => ({
                    ...prev,
                    embeddingStatus: value || '',
                    pageNum: 1,
                  }));
                }}
              />
              <Button icon={<FilterOutlined />} onClick={clearFilters}>
                清空筛选
              </Button>
            </Space>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card bordered={false}>
        <Spin spinning={loading}>
          {dataSource.length === 0 && !loading ? (
            <Empty
              description="暂无智能体知识"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <p style={{ color: '#6b6b6b', marginBottom: 16 }}>
                点击「添加知识」为智能体补充知识资源
              </p>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDialog}>
                添加知识
              </Button>
            </Empty>
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={dataSource}
                rowKey="id"
                pagination={false}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 16,
                  padding: '16px 0',
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <Select
                  value={queryParams.pageSize}
                  style={{ width: 120 }}
                  options={[
                    { label: '10 条/页', value: 10 },
                    { label: '20 条/页', value: 20 },
                    { label: '50 条/页', value: 50 },
                    { label: '100 条/页', value: 100 },
                  ]}
                  onChange={handleSizeChange}
                />
                <Pagination
                  current={queryParams.pageNum}
                  total={total}
                  pageSize={queryParams.pageSize}
                  showSizeChanger={false}
                  onChange={handlePageChange}
                />
              </div>
            </>
          )}
        </Spin>
      </Card>

      {/* Add/Edit Dialog */}
      <Modal
        title={
          <Space>
            {isEdit ? (
              <EditOutlined style={{ color: '#1677ff' }} />
            ) : (
              <PlusOutlined style={{ color: '#1677ff' }} />
            )}
            <span>{isEdit ? '编辑知识' : '添加新知识'}</span>
          </Space>
        }
        open={dialogVisible}
        onCancel={() => setDialogVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDialogVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={saveLoading}
            onClick={saveKnowledge}
          >
            {isEdit ? '保存更新' : '添加并处理'}
          </Button>,
        ]}
        width={820}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="知识类型"
            name="type"
            rules={[{ required: true, message: '知识类型不能为空' }]}
          >
            <Select
              placeholder="请选择知识类型"
              options={knowledgeTypeOptions}
              disabled={isEdit}
              onChange={handleTypeChange}
            />
          </Form.Item>

          {form.getFieldValue('type') === 'QA' && (
            <Alert
              message="请录入具体分析需求作为问题，并在答案中写出详细思考步骤与数据查找逻辑。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          {form.getFieldValue('type') === 'FAQ' && (
            <Alert
              message="请针对业务术语、指标口径或常见歧义进行问答定义，用于统一 AI 判断标准。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          {form.getFieldValue('type') === 'DOCUMENT' && (
            <Alert
              message="建议上传数据库表结构、码表映射字典或业务说明文档，便于 AI 检索字段含义。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item
            label="知识标题"
            name="title"
            rules={[{ required: true, message: '知识标题不能为空' }]}
          >
            <Input placeholder="为这份知识起一个易于识别的名称" />
          </Form.Item>

          {form.getFieldValue('type') === 'DOCUMENT' && (
            <>
              {!isEdit && (
                <Form.Item label="分块策略" name="splitterType">
                  <Select options={splitterTypeOptions} />
                </Form.Item>
              )}

              {!isEdit ? (
                <Form.Item label="上传文件">
                  <Upload
                    maxCount={1}
                    beforeUpload={() => false}
                    onChange={({ fileList }) => {
                      if (fileList.length > 0) {
                        handleFileChange(fileList[0]);
                      } else {
                        setSelectedFile(null);
                      }
                    }}
                    accept=".pdf,.doc,.docx,.txt,.md"
                  >
                    <Button icon={<PaperClipOutlined />}>选择文件</Button>
                  </Upload>
                  {selectedFile && (
                    <div style={{ marginTop: 8, color: '#6b6b6b' }}>
                      已选择: {selectedFile.name}
                    </div>
                  )}
                </Form.Item>
              ) : (
                <Alert
                  message="文档类型知识不支持修改文件内容，如需修改请删除后重新创建。"
                  type="info"
                  showIcon
                />
              )}
            </>
          )}

          {(form.getFieldValue('type') === 'QA' ||
            form.getFieldValue('type') === 'FAQ') && (
            <>
              <Form.Item
                label="问题"
                name="question"
                rules={[
                  {
                    validator: (_, value) => {
                      const type = form.getFieldValue('type');
                      if (
                        (type === 'QA' || type === 'FAQ') &&
                        !value?.trim()
                      ) {
                        return Promise.reject(new Error('问题不能为空'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input.TextArea
                  placeholder="输入用户可能会问的问题"
                  rows={2}
                />
              </Form.Item>
              <Form.Item
                label="答案"
                name="answer"
                rules={[
                  {
                    validator: (_, value) => {
                      const type = form.getFieldValue('type');
                      if (
                        (type === 'QA' || type === 'FAQ') &&
                        !value?.trim()
                      ) {
                        return Promise.reject(new Error('答案不能为空'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input.TextArea
                  placeholder="输入标准答案"
                  rows={5}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgeAgentsPage;
