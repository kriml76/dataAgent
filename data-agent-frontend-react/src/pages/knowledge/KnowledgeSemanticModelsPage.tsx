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
  Row,
  Col,
  Upload,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import semanticModelService from '@/services/semanticModel';
import type { SemanticModel, SemanticModelAddDto } from '@/services/semanticModel';
import { useSearchParams } from 'react-router-dom';
import type { UploadFile } from 'antd/es/upload/interface';

const KnowledgeSemanticModelsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const agentId = Number(searchParams.get('agentId')) || 0;

  // State management
  const [dataSource, setDataSource] = useState<SemanticModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // Dialog states
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<number | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [form] = Form.useForm<SemanticModel>();
  
  // Batch import states
  const [batchImportDialogVisible, setBatchImportDialogVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFile, setImportFile] = useState<UploadFile | null>(null);

  useEffect(() => {
    loadData();
  }, [agentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await semanticModelService.list(agentId, searchKeyword || undefined);
      setDataSource(data);
    } catch (error) {
      console.error('Failed to load semantic models:', error);
      message.error('加载语义模型失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const formatDateTime = (dateTime?: string): string => {
    if (!dateTime) return '-';
    try {
      return new Date(dateTime).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return dateTime;
    }
  };

  const openCreateDialog = () => {
    setIsEdit(false);
    setCurrentEditId(null);
    form.resetFields();
    form.setFieldsValue({
      agentId,
      status: 1,
    });
    setDialogVisible(true);
  };

  const editModel = (model: SemanticModel) => {
    setIsEdit(true);
    setCurrentEditId(model.id || null);
    form.setFieldsValue(model);
    setDialogVisible(true);
  };

  const saveModel = async () => {
    try {
      const values = await form.validateFields();
      setSaveLoading(true);

      if (isEdit && currentEditId) {
        const updateData: SemanticModel = {
          ...values,
          id: currentEditId,
        };
        const result = await semanticModelService.update(currentEditId, updateData);
        if (result) {
          message.success('更新成功');
        } else {
          message.error('更新失败');
          return;
        }
      } else {
        const createData: SemanticModelAddDto = {
          agentId,
          tableName: values.tableName,
          columnName: values.columnName,
          businessName: values.businessName,
          synonyms: values.synonyms || '',
          businessDescription: values.businessDescription || '',
          columnComment: values.columnComment || '',
          dataType: values.dataType,
        };
        const result = await semanticModelService.create(createData);
        if (result) {
          message.success('创建成功');
        } else {
          message.error('创建失败');
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

  const deleteModel = async (model: SemanticModel) => {
    if (!model.id) return;
    try {
      const result = await semanticModelService.delete(model.id);
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

  const toggleStatus = (model: SemanticModel, status: number) => {
    if (!model.id) return;
    const ids = [model.id];

    Modal.confirm({
      title: `${status === 1 ? '启用' : '停用'}确认`,
      content: `确定要${status === 1 ? '启用' : '停用'}语义模型「${model.businessName}」吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          let result = false;
          if (status === 1) {
            result = await semanticModelService.enable(ids);
          } else {
            result = await semanticModelService.disable(ids);
          }
          if (result) {
            message.success(`${status === 1 ? '启用' : '停用'}成功`);
            loadData();
          } else {
            message.error(`${status === 1 ? '启用' : '停用'}失败`);
          }
        } catch (error) {
          console.error('Toggle status failed:', error);
          message.error('操作失败');
        }
      },
    });
  };

  const batchDeleteModels = () => {
    if (selectedRowKeys.length === 0) return;
    const ids = selectedRowKeys as number[];

    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${ids.length} 个语义模型吗？`,
      okText: '确定删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const result = await semanticModelService.batchDelete(ids);
          if (result) {
            message.success(`成功删除 ${ids.length} 个语义模型`);
            setSelectedRowKeys([]);
            loadData();
          } else {
            message.error('批量删除失败');
          }
        } catch (error) {
          console.error('Batch delete failed:', error);
          message.error('批量删除失败');
        }
      },
    });
  };

  const downloadExcelTemplate = async () => {
    try {
      await semanticModelService.downloadTemplate();
      message.success('模板下载成功');
    } catch (error) {
      console.error('Download template failed:', error);
      message.error('模板下载失败');
    }
  };

  const executeExcelImport = async () => {
    if (!importFile || !importFile.originFileObj) {
      message.warning('请先选择 Excel 文件');
      return;
    }

    setImportLoading(true);
    try {
      const result = await semanticModelService.importExcel(
        importFile.originFileObj as File,
        agentId
      );
      message.success(`导入完成：成功 ${result.successCount} 条，失败 ${result.failCount} 条`);
      if (result.errors && result.errors.length > 0) {
        message.warning(`部分失败：${result.errors[0]}`);
      }
      setBatchImportDialogVisible(false);
      setImportFile(null);
      loadData();
    } catch (error) {
      console.error('Excel import failed:', error);
      message.error('Excel 导入失败');
    } finally {
      setImportLoading(false);
    }
  };

  const openBatchImportDialog = () => {
    setBatchImportDialogVisible(true);
    setImportFile(null);
  };

  const columns: ColumnsType<SemanticModel> = [
    {
      title: '表名',
      dataIndex: 'tableName',
      key: 'tableName',
      width: 130,
    },
    {
      title: '字段名',
      dataIndex: 'columnName',
      key: 'columnName',
      width: 140,
    },
    {
      title: '业务名称',
      dataIndex: 'businessName',
      key: 'businessName',
      width: 150,
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
          <span style={{ maxWidth: 180, display: 'inline-block' }} className="text-truncate">
            {synonyms || '—'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '数据类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'default'}>
          {status === 1 ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      key: 'createdTime',
      width: 180,
      render: (_, record: SemanticModel) =>
        formatDateTime(record.createdTime || record.updateTime),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: SemanticModel) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => editModel(record)}
          />
          <Popconfirm
            title={record.status === 1 ? '停用' : '启用'}
            description={`确定要${record.status === 1 ? '停用' : '启用'}语义模型「${record.businessName}」吗？`}
            onConfirm={() => toggleStatus(record, record.status === 1 ? 0 : 1)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              icon={record.status === 1 ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              style={{ color: record.status === 1 ? '#fa8c16' : '#52c41a' }}
            >
              <Tooltip title={record.status === 1 ? '停用' : '启用'}>
                {record.status === 1 ? '停用' : '启用'}
              </Tooltip>
            </Button>
          </Popconfirm>
          <Popconfirm
            title="删除确认"
            description={`确定要删除语义模型「${record.businessName}」吗？此操作不可恢复。`}
            onConfirm={() => deleteModel(record)}
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
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>语义模型配置</h1>
        <p style={{ color: '#6b6b6b', marginTop: 8 }}>
          维护字段语义映射，统一业务口径，提升 SQL 生成准确性。
        </p>
      </div>

      {/* Actions */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="请输入关键词搜索表名、字段名、业务名"
            prefix={<SearchOutlined />}
            style={{ width: 420 }}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
            onClear={handleSearch}
          />
          {selectedRowKeys.length > 0 && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={batchDeleteModels}
            >
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
          <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
            总数 {dataSource.length}
          </Tag>
          <Button
            icon={<UploadOutlined />}
            onClick={openBatchImportDialog}
          >
            批量导入
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDialog}>
            添加语义模型
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card bordered={false}>
        <Spin spinning={loading}>
          {dataSource.length === 0 && !loading ? (
            <Empty
              description="暂无语义模型"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <p style={{ color: '#6b6b6b', marginBottom: 16 }}>
                点击「添加语义模型」开始配置字段语义映射
              </p>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDialog}>
                添加语义模型
              </Button>
            </Empty>
          ) : (
            <Table
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
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
            {isEdit ? (
              <EditOutlined style={{ color: '#1677ff' }} />
            ) : (
              <PlusOutlined style={{ color: '#1677ff' }} />
            )}
            <span>{isEdit ? '编辑语义模型' : '添加语义模型'}</span>
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
            onClick={saveModel}
          >
            {isEdit ? '保存更新' : '立即创建'}
          </Button>,
        ]}
        width={760}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="表名"
                name="tableName"
                rules={[{ required: true, message: '表名不能为空' }]}
              >
                <Input placeholder="请输入表名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="字段名"
                name="columnName"
                rules={[{ required: true, message: '字段名不能为空' }]}
              >
                <Input placeholder="请输入数据库字段名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="业务名称"
                name="businessName"
                rules={[{ required: true, message: '业务名称不能为空' }]}
              >
                <Input placeholder="请输入业务名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="数据类型"
                name="dataType"
                rules={[{ required: true, message: '数据类型不能为空' }]}
              >
                <Input placeholder="如：int, varchar(64)" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="同义词" name="synonyms">
                <Input.TextArea
                  placeholder="多个同义词请用逗号分隔"
                  rows={2}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="业务描述" name="businessDescription">
                <Input.TextArea
                  placeholder="描述该字段业务意义和口径"
                  rows={3}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="字段注释" name="columnComment">
                <Input.TextArea
                  placeholder="数据库原始字段注释"
                  rows={2}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Batch Import Dialog */}
      <Modal
        title={
          <Space>
            <UploadOutlined style={{ color: '#1677ff' }} />
            <span>批量导入语义模型</span>
          </Space>
        }
        open={batchImportDialogVisible}
        onCancel={() => setBatchImportDialogVisible(false)}
        footer={null}
        width={760}
      >
        <div style={{ padding: '16px 0' }}>
          <Upload
            maxCount={1}
            beforeUpload={() => false}
            onChange={({ fileList }) => {
              if (fileList.length > 0) {
                setImportFile(fileList[0]);
              } else {
                setImportFile(null);
              }
            }}
            accept=".xlsx,.xls"
          >
            <Button icon={<FileExcelOutlined />}>选择 Excel 文件</Button>
          </Upload>
          {importFile && (
            <div style={{ marginTop: 8, color: '#6b6b6b' }}>
              已选择: {importFile.name}
            </div>
          )}
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={downloadExcelTemplate}
            >
              下载模板
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={importLoading}
              onClick={executeExcelImport}
            >
              开始导入
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KnowledgeSemanticModelsPage;
