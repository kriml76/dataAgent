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
import { Card, Table, Button, Space, Tag, Spin, Empty } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import datasourceService from '@/services/datasource';
import type { Datasource } from '@/services/datasource';

const DataSourcesPage: React.FC = () => {
  const [dataSource, setDataSource] = useState<Datasource[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await datasourceService.getAllDatasource();
      setDataSource(data);
    } catch (error) {
      console.error('Failed to load datasources:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Datasource> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Host', dataIndex: 'host', key: 'host' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color="green">{status}</Tag>,
    },
    {
      title: 'Test',
      dataIndex: 'testStatus',
      key: 'testStatus',
      render: (testStatus: string) => <Tag color={testStatus === 'success' ? 'green' : 'red'}>{testStatus}</Tag>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Data Sources</h1>
          <p style={{ color: '#6b6b6b', marginTop: 8 }}>
            Manage global database connection resources.
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />}>Add Data Source</Button>
        </Space>
      </div>

      {/* Table */}
      <Card bordered={false}>
        <Spin spinning={loading}>
          {dataSource.length === 0 && !loading ? (
            <Empty description="No data sources found" />
          ) : (
            <Table
              columns={columns}
              dataSource={dataSource}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default DataSourcesPage;
