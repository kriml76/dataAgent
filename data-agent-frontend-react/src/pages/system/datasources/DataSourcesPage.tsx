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
  Space,
  Tag,
  Spin,
  Empty,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Avatar,
  Checkbox,
  Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  DownOutlined,
  UpOutlined,
  TableOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import datasourceService, { type Datasource, type LogicalRelation } from '@/services/datasource';
import agentDatasourceService from '@/services/agentDatasource';
import { useSearchParams } from 'react-router-dom';

const DataSourcesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('agentId');

  // Main table states
  const [dataSource, setDataSource] = useState<Datasource[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null);
  const [initLoading, setInitLoading] = useState(false);
  
  // Form dialog states
  const [formDialogVisible, setFormDialogVisible] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState<'create' | 'edit'>('create');
  const [formDialogTarget, setFormDialogTarget] = useState<Datasource | null>(null);
  const [form] = Form.useForm();
  
  // Expanded row states
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [tableLists, setTableLists] = useState<Record<number, string[]>>({});
  const [selectedTables, setSelectedTables] = useState<Record<number, string[]>>({});
  const [loadingTablesId, setLoadingTablesId] = useState<number | null>(null);
  const [tableFetchError, setTableFetchError] = useState<Record<number, boolean>>({});
  const [updatingTablesId, setUpdatingTablesId] = useState<number | null>(null);
  
  // Foreign key dialog states
  const [fkDialogVisible, setFkDialogVisible] = useState(false);
  const [fkDatasourceId, setFkDatasourceId] = useState<number>(0);
  const [fkDatasourceName, setFkDatasourceName] = useState<string>('');
  const [logicalRelations, setLogicalRelations] = useState<LogicalRelation[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(false);
  const [deletingRelationId, setDeletingRelationId] = useState<number | null>(null);
  const [addingRelation, setAddingRelation] = useState(false);
  
  // FK form states
  const [tables, setTables] = useState<string[]>([]);
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [targetColumns, setTargetColumns] = useState<string[]>([]);
  const [loadingSourceColumns, setLoadingSourceColumns] = useState(false);
  const [loadingTargetColumns, setLoadingTargetColumns] = useState(false);
  const [fkForm, setFkForm] = useState({
    sourceTableName: '',
    sourceColumnName: '',
    targetTableName: '',
    targetColumnName: '',
    relationType: '1:N',
  });

  useEffect(() => {
    loadData();
  }, []);

  // Watch expanded rows to load tables
  useEffect(() => {
    const loadTablesForExpandedRows = async () => {
      for (const key of expandedRowKeys) {
        const dsId = Number(key);
        if (dsId && !tableLists[dsId]) {
          setSelectedTables(prev => ({ ...prev, [dsId]: prev[dsId] || [] }));
          await fetchTablesForDatasource(dsId);
        }
      }
    };
    loadTablesForExpandedRows();
  }, [expandedRowKeys]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await datasourceService.getAllDatasource();
      setDataSource(data);
    } catch (error) {
      console.error('Failed to load datasources:', error);
      message.error('获取数据源列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getDbIcon = (type?: string): React.ReactNode => {
    if (type === 'mysql') return <DatabaseOutlined />;
    if (type === 'postgresql') return <span>🐘</span>;
    if (type === 'oracle') return <span>⭕</span>;
    return <DatabaseOutlined />;
  };

  const getStatusText = (status?: string): string => {
    if (status === 'success') return '连接成功';
    if (status === 'fail') return '连接失败';
    return '未测试';
  };

  // Form dialog functions
  const openFormDialog = (mode: 'create' | 'edit', item?: Datasource) => {
    setFormDialogMode(mode);
    setFormDialogTarget(mode === 'edit' && item ? { ...item } : null);
    if (mode === 'edit' && item) {
      form.setFieldsValue(item);
    } else {
      form.resetFields();
      form.setFieldsValue({ type: 'mysql', port: 3306 });
    }
    setFormDialogVisible(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (formDialogMode === 'create') {
        await datasourceService.createDatasource(values);
        message.success('创建成功');
      } else if (formDialogTarget?.id) {
        await datasourceService.updateDatasource(formDialogTarget.id, values);
        message.success('更新成功');
      }
      setFormDialogVisible(false);
      loadData();
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请检查表单输入');
      } else {
        message.error('操作失败，请检查配置或参数');
      }
    } finally {
      setSaving(false);
    }
  };

  // Test connection function
  const handleTestConnection = async (item: Datasource) => {
    if (!item.id) return;
    setTestingId(item.id);
    try {
      const res = await datasourceService.testConnection(item.id);
      if (res.success) {
        message.success('连接测试成功');
        item.testStatus = 'success';
        loadData();
      } else {
        message.error('连接测试失败');
        item.testStatus = 'fail';
        loadData();
      }
    } catch {
      message.error('连接测试请求失败');
      item.testStatus = 'fail';
      loadData();
    } finally {
      setTestingId(null);
    }
  };

  // Toggle status function
  const handleToggleStatus = async (item: Datasource) => {
    if (!item.id) return;
    setTogglingStatusId(item.id);
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      await datasourceService.updateDatasource(item.id, {
        ...item,
        status: newStatus,
      });
      message.success(newStatus === 'active' ? '已启用' : '已禁用');
      loadData();
    } catch {
      message.error('操作失败');
    } finally {
      setTogglingStatusId(null);
    }
  };

  // Delete function
  const handleDelete = async (item: Datasource) => {
    if (!item.id) return;
    try {
      const res = await datasourceService.deleteDatasource(item.id);
      if (res.success) {
        message.success('删除成功');
        loadData();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  // Foreign key dialog functions
  const openFkDialog = async (item: Datasource) => {
    if (!item.id) return;
    setFkDatasourceId(item.id);
    setFkDatasourceName(item.name || '');
    setFkDialogVisible(true);
    await loadLogicalRelations(item.id);
    await loadTables(item.id);
    resetFkForm();
  };

  const loadLogicalRelations = async (datasourceId: number) => {
    setLoadingRelations(true);
    try {
      const res = await datasourceService.getLogicalRelations(datasourceId);
      setLogicalRelations(res.data || []);
    } catch {
      message.error('获取逻辑外键关系失败');
    } finally {
      setLoadingRelations(false);
    }
  };

  const loadTables = async (datasourceId: number) => {
    try {
      const tableData = await datasourceService.getDatasourceTables(datasourceId);
      setTables(tableData || []);
    } catch {
      message.error('获取数据表列表失败');
    }
  };

  const resetFkForm = () => {
    setFkForm({
      sourceTableName: '',
      sourceColumnName: '',
      targetTableName: '',
      targetColumnName: '',
      relationType: '1:N',
    });
    setSourceColumns([]);
    setTargetColumns([]);
  };

  const fetchColumns = async (tableName: string, type: 'source' | 'target') => {
    if (!fkDatasourceId || !tableName) return;
    
    if (type === 'source') {
      setFkForm(prev => ({ ...prev, sourceColumnName: '' }));
      setSourceColumns([]);
      setLoadingSourceColumns(true);
    } else {
      setFkForm(prev => ({ ...prev, targetColumnName: '' }));
      setTargetColumns([]);
      setLoadingTargetColumns(true);
    }

    try {
      const columns = await datasourceService.getTableColumns(fkDatasourceId, tableName);
      if (type === 'source') {
        setSourceColumns(columns);
      } else {
        setTargetColumns(columns);
      }
    } catch {
      if (type === 'source') {
        setSourceColumns([]);
      } else {
        setTargetColumns([]);
      }
    } finally {
      if (type === 'source') {
        setLoadingSourceColumns(false);
      } else {
        setLoadingTargetColumns(false);
      }
    }
  };

  const isFormValid = fkForm.sourceTableName && 
                      fkForm.sourceColumnName && 
                      fkForm.targetTableName && 
                      fkForm.targetColumnName && 
                      fkForm.relationType;

  const handleAddRelation = async () => {
    if (!fkDatasourceId || !isFormValid) return;
    
    setAddingRelation(true);
    try {
      const res = await datasourceService.addLogicalRelation(fkDatasourceId, {
        sourceTableName: fkForm.sourceTableName,
        sourceColumnName: fkForm.sourceColumnName,
        targetTableName: fkForm.targetTableName,
        targetColumnName: fkForm.targetColumnName,
        relationType: fkForm.relationType,
        description: '',
      });
      
      if (res.success && res.data) {
        setLogicalRelations(prev => [...prev, res.data!]);
        message.success('添加关系成功');
        resetFkForm();
      } else {
        message.error(res.message || '添加失败');
      }
    } catch {
      message.error('添加失败');
    } finally {
      setAddingRelation(false);
    }
  };

  const handleDeleteRelation = (relationId: number) => {
    Modal.confirm({
      title: '删除确认',
      content: '确定要删除该逻辑外键吗？',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        setDeletingRelationId(relationId);
        try {
          const res = await datasourceService.deleteLogicalRelation(fkDatasourceId, relationId);
          if (res.success) {
            setLogicalRelations(prev => prev.filter(item => item.id !== relationId));
            message.success('删除成功');
          } else {
            message.error(res.message || '删除失败');
          }
        } catch {
          message.error('删除失败');
        } finally {
          setDeletingRelationId(null);
        }
      },
    });
  };

  // Expanded row functions
  const fetchTablesForDatasource = async (datasourceId: number) => {
    setLoadingTablesId(datasourceId);
    setTableFetchError(prev => ({ ...prev, [datasourceId]: false }));
    try {
      const tables = await datasourceService.getDatasourceTables(datasourceId);
      setTableLists(prev => ({ ...prev, [datasourceId]: tables || [] }));
      setSelectedTables(prev => ({ ...prev, [datasourceId]: prev[datasourceId] || [] }));
    } catch {
      setTableLists(prev => ({ ...prev, [datasourceId]: [] }));
      setSelectedTables(prev => ({ ...prev, [datasourceId]: [] }));
      setTableFetchError(prev => ({ ...prev, [datasourceId]: true }));
    } finally {
      setLoadingTablesId(null);
    }
  };

  const retryFetchTables = (item: Datasource) => {
    if (item.id) fetchTablesForDatasource(item.id);
  };

  const updateTables = async (item: Datasource) => {
    if (!item.id) return;
    setUpdatingTablesId(item.id);
    try {
      const selectedCount = selectedTables[item.id]?.length || 0;
      message.info(`已选择 ${selectedCount} 个表（表选择在智能体关联数据源时可配置）`);
    } finally {
      setUpdatingTablesId(null);
    }
  };

  const selectAllTables = (datasourceId: number) => {
    setSelectedTables(prev => ({
      ...prev,
      [datasourceId]: [...(tableLists[datasourceId] || [])],
    }));
  };

  const clearAllTables = (datasourceId: number) => {
    setSelectedTables(prev => ({
      ...prev,
      [datasourceId]: [],
    }));
  };

  const handleInitDatasource = async () => {
    if (!agentId) {
      message.error('缺少智能体ID，无法初始化数据源');
      return;
    }
    setInitLoading(true);
    try {
      const activeDatasource = await agentDatasourceService.getActiveAgentDatasource(Number(agentId));
      if (!activeDatasource) {
        message.error('当前智能体没有启用的数据源！请先添加并启用数据源');
        return;
      }
      if (!activeDatasource.tables || activeDatasource.tables.length === 0) {
        message.error('当前启用的数据源没有选择相应的数据表！请先选择数据表并更新');
        return;
      }
      const res = await agentDatasourceService.initSchema(agentId);
      if (res.success) {
        message.success('初始化数据源成功');
      } else {
        message.error(res.message || '初始化数据源失败');
      }
    } catch (error: any) {
      message.error(error?.message || '初始化数据源失败');
    } finally {
      setInitLoading(false);
    }
  };

  const columns: ColumnsType<Datasource> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: Datasource) => (
        <Space size={12}>
          <Avatar
            size={36}
            shape="square"
            style={{ backgroundColor: '#e6f7ff' }}
            icon={<span style={{ color: '#1677ff' }}>{getDbIcon(record.type)}</span>}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#6b6b6b' }}>
              {record.host}:{record.port}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      align: 'center',
      render: (type: string) => <Tag>{type?.toUpperCase()}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '连接状态',
      dataIndex: 'testStatus',
      key: 'testStatus',
      width: 120,
      align: 'center',
      render: (testStatus: string) => (
        <Tag
          color={
            testStatus === 'success'
              ? 'blue'
              : testStatus === 'fail'
              ? 'error'
              : 'default'
          }
        >
          <Space size={4}>
            {testStatus === 'success' && (
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#52c41a',
                  animation: 'pulse 2s infinite',
                }}
              />
            )}
            {getStatusText(testStatus)}
          </Space>
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 350,
      align: 'end',
      render: (_, record: Datasource) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            loading={togglingStatusId === record.id}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
          <Button
            type="link"
            size="small"
            loading={testingId === record.id}
            onClick={() => handleTestConnection(record)}
          >
            测试连接
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => openFkDialog(record)}
          >
            逻辑外键
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openFormDialog('edit', record)}
          />
          <Popconfirm
            title="删除确认"
            description={`确定要删除数据源「${record.name}」吗？此操作不可恢复。`}
            onConfirm={() => handleDelete(record)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Render expanded row content
  const renderExpandedRow = (record: Datasource) => {
    const dsId = record.id || 0;
    const tables = tableLists[dsId] || [];
    const selected = selectedTables[dsId] || [];
    const isLoading = loadingTablesId === dsId;
    const hasError = tableFetchError[dsId];
    const isUpdating = updatingTablesId === dsId;

    return (
      <div style={{ padding: 24, backgroundColor: '#fafafa' }}>
        <Card bordered={false} style={{ background: 'white', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Space>
              <TableOutlined style={{ color: '#1677ff' }} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>数据表管理</span>
              <span style={{ fontSize: 12, color: '#6b6b6b' }}>
                已选择 {selected.length} 个表
              </span>
            </Space>
            <Space>
              <Button size="small" onClick={() => selectAllTables(dsId)}>全选</Button>
              <Button size="small" onClick={() => clearAllTables(dsId)}>清空</Button>
              <Button 
                type="primary" 
                size="small" 
                loading={isUpdating}
                onClick={() => updateTables(record)}
              >
                更新数据表
              </Button>
            </Space>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Spin />
            </div>
          ) : hasError ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <DatabaseOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 12 }} />
              <p style={{ color: '#6b6b6b', marginBottom: 8 }}>数据获取失败</p>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>
                无法拉取数据表列表，请检查连接后重试
              </p>
              <Button onClick={() => retryFetchTables(record)}>重试</Button>
            </div>
          ) : tables.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <TableOutlined style={{ fontSize: 40, color: '#d9d9d9', marginBottom: 8 }} />
              <p style={{ color: '#6b6b6b' }}>暂无表数据，请确保数据源连接正常后刷新</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12 
            }}>
              {tables.map(tbl => (
                <Checkbox
                  key={tbl}
                  checked={selected.includes(tbl)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectedTables(prev => ({
                      ...prev,
                      [dsId]: checked 
                        ? [...(prev[dsId] || []), tbl]
                        : (prev[dsId] || []).filter(t => t !== tbl),
                    }));
                  }}
                >
                  {tbl}
                </Checkbox>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
            数据源配置
          </h1>
          <p style={{ color: '#6b6b6b', marginTop: 4 }}>
            管理全局数据库连接资源，配置连接信息与逻辑外键。
          </p>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={loadData}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openFormDialog('create')}
          >
            添加数据源
          </Button>
          {agentId && (
            <Button
              type="primary"
              icon={<DatabaseOutlined />}
              loading={initLoading}
              onClick={handleInitDatasource}
            >
              {initLoading ? '初始化中...' : '初始化数据源'}
            </Button>
          )}
        </Space>
      </div>

      {/* Table */}
      <Card bordered={false}>
        <Spin spinning={loading}>
          {dataSource.length === 0 && !loading ? (
            <Empty
              description="暂无数据源"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openFormDialog('create')}
              >
                添加数据源
              </Button>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={dataSource}
              rowKey="id"
              expandable={{
                expandedRowKeys,
                onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as React.Key[]),
                expandIcon: ({ expanded, onExpand, record }) => {
                  const canExpand =
                    record.status === 'active' && record.testStatus === 'success';
                  return canExpand ? (
                    <Button
                      type="text"
                      size="small"
                      icon={expanded ? <UpOutlined /> : <DownOutlined />}
                      onClick={(e) => onExpand(record, e)}
                    />
                  ) : (
                    <Button
                      type="text"
                      size="small"
                      icon={<DownOutlined />}
                      disabled
                      style={{ opacity: 0.4, cursor: 'not-allowed' }}
                    />
                  );
                },
                expandedRowRender: renderExpandedRow,
              }}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
            />
          )}
        </Spin>
      </Card>

      {/* Add/Edit Dialog */}
      <Modal
        title={formDialogMode === 'create' ? '添加数据源' : '编辑数据源'}
        open={formDialogVisible}
        onCancel={() => setFormDialogVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setFormDialogVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={saving}
            onClick={handleFormSubmit}
          >
            {formDialogMode === 'create' ? '创建' : '保存'}
          </Button>,
        ]}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              label="数据源名称"
              name="name"
              rules={[{ required: true, message: '请输入数据源名称' }]}
            >
              <Input placeholder="请输入名称" />
            </Form.Item>
            
            <Form.Item
              label="数据库类型"
              name="type"
              rules={[{ required: true, message: '请选择数据库类型' }]}
            >
              <Select options={[
                { label: 'MySQL', value: 'mysql' },
                { label: 'PostgreSQL', value: 'postgresql' },
                { label: 'SQL Server', value: 'sqlserver' },
                { label: '达梦', value: 'dameng' },
                { label: 'Oracle', value: 'oracle' },
              ]} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <Form.Item
              label="主机地址"
              name="host"
              rules={[{ required: true, message: '请输入主机地址' }]}
            >
              <Input placeholder="localhost 或 IP 地址" />
            </Form.Item>
            
            <Form.Item
              label="端口号"
              name="port"
              rules={[{ required: true, message: '请输入端口号' }]}
            >
              <InputNumber style={{ width: '100%' }} min={1} max={65535} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: form.getFieldValue('type') === 'postgresql' || form.getFieldValue('type') === 'oracle' ? '1fr 1fr' : '1fr', gap: 16 }}>
            <Form.Item
              label="数据库名"
              name="databaseName"
              rules={[{ required: true, message: '请输入数据库名' }]}
            >
              <Input placeholder="Database Name" />
            </Form.Item>
            
            {(form.getFieldValue('type') === 'postgresql' || form.getFieldValue('type') === 'oracle') && (
              <Form.Item label="Schema 名" name="schemaName">
                <Input placeholder="如 public" />
              </Form.Item>
            )}
          </div>

          <Form.Item label="JDBC 连接地址 (可选)" name="connectionUrl">
            <Input placeholder="若不填则自动生成" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="Username" />
            </Form.Item>
            
            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
          </div>

          <Form.Item label="描述信息" name="description">
            <Input.TextArea rows={2} placeholder="可选描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Foreign Key Dialog */}
      <Modal
        title={
          <Space>
            <LinkOutlined style={{ color: '#1677ff' }} />
            <span>逻辑外键配置 - {fkDatasourceName}</span>
          </Space>
        }
        open={fkDialogVisible}
        onCancel={() => setFkDialogVisible(false)}
        footer={[
          <Button key="close" onClick={() => setFkDialogVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>已生效的关系列表</div>
          <Spin spinning={loadingRelations}>
            {logicalRelations.length === 0 ? (
              <Empty description="暂无逻辑外键配置" />
            ) : (
              <Table
                dataSource={logicalRelations}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: '主表 (Source)',
                    key: 'source',
                    render: (_, record: LogicalRelation) => (
                      <div>
                        <div style={{ fontWeight: 600, color: '#0958d9' }}>{record.sourceTableName}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.sourceColumnName}</div>
                      </div>
                    ),
                  },
                  {
                    title: '关系',
                    key: 'relation',
                    width: 100,
                    align: 'center',
                    render: (_, record: LogicalRelation) => (
                      <div style={{ textAlign: 'center' }}>
                        <LinkOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#434343' }}>
                          {record.relationType}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: '关联表 (Target)',
                    key: 'target',
                    render: (_, record: LogicalRelation) => (
                      <div>
                        <div style={{ fontWeight: 600, color: '#237804' }}>{record.targetTableName}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.targetColumnName}</div>
                      </div>
                    ),
                  },
                  {
                    title: '操作',
                    key: 'actions',
                    width: 80,
                    align: 'right',
                    render: (_, record: LogicalRelation) => (
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deletingRelationId === record.id}
                        onClick={() => handleDeleteRelation(record.id!)}
                      />
                    ),
                  },
                ]}
              />
            )}
          </Spin>
        </div>

        <div style={{ 
          background: '#f5f5f5', 
          padding: 20, 
          borderRadius: 8,
          border: '1px solid #d9d9d9'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '5fr 2fr 5fr', gap: 16, alignItems: 'start' }}>
            {/* Source side */}
            <div>
              <Select
                value={fkForm.sourceTableName || undefined}
                onChange={(value) => {
                  setFkForm(prev => ({ ...prev, sourceTableName: value }));
                  fetchColumns(value, 'source');
                }}
                placeholder="请选择主表"
                style={{ width: '100%', marginBottom: 12 }}
                options={tables.map(t => ({ label: t, value: t }))}
                allowClear
              />
              <Select
                value={fkForm.sourceColumnName || undefined}
                onChange={(value) => setFkForm(prev => ({ ...prev, sourceColumnName: value }))}
                placeholder={!fkForm.sourceTableName ? "先选择主表" : "请选择主表字段"}
                style={{ width: '100%' }}
                options={sourceColumns.map(c => ({ label: c, value: c }))}
                disabled={!fkForm.sourceTableName}
                loading={loadingSourceColumns}
                allowClear
              />
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 20 }}>
              <span style={{ fontSize: 24, color: '#d9d9d9' }}>→</span>
            </div>

            {/* Target side */}
            <div>
              <Select
                value={fkForm.targetTableName || undefined}
                onChange={(value) => {
                  setFkForm(prev => ({ ...prev, targetTableName: value }));
                  fetchColumns(value, 'target');
                }}
                placeholder="请选择关联表"
                style={{ width: '100%', marginBottom: 12 }}
                options={tables.map(t => ({ label: t, value: t }))}
                allowClear
              />
              <Select
                value={fkForm.targetColumnName || undefined}
                onChange={(value) => setFkForm(prev => ({ ...prev, targetColumnName: value }))}
                placeholder={!fkForm.targetTableName ? "先选择关联表" : "请选择关联字段"}
                style={{ width: '100%' }}
                options={targetColumns.map(c => ({ label: c, value: c }))}
                disabled={!fkForm.targetTableName}
                loading={loadingTargetColumns}
                allowClear
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Select
              value={fkForm.relationType}
              onChange={(value) => setFkForm(prev => ({ ...prev, relationType: value }))}
              style={{ flex: 1 }}
              options={[
                { label: '1:1', value: '1:1' },
                { label: '1:N', value: '1:N' },
                { label: 'N:1', value: 'N:1' },
              ]}
            />
            <Button
              type="primary"
              style={{ height: 32 }}
              loading={addingRelation}
              disabled={!isFormValid}
              onClick={handleAddRelation}
            >
              添加关系
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default DataSourcesPage;
