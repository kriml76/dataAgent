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
import { Table, Button, Tag, Space, Modal, message, Card } from 'antd';
import { CheckOutlined, CloseOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAllUsers, enableUser, disableUser, deleteUser, type UserVO } from '@/services/user';

/**
 * @description 用户管理页面,支持查看用户列表、启用/禁用用户
 */
const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserVO[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        message.error(response.message || '加载用户列表失败');
      }
    } catch (error: any) {
      message.error(error.message || '加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 启用用户
  const handleEnable = (userId: number, username: string) => {
    Modal.confirm({
      title: '确认启用',
      content: `确定要启用用户 "${username}" 吗?`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await enableUser(userId);
          message.success('用户已启用');
          loadUsers();
        } catch (error: any) {
          message.error(error.message || '启用失败');
        }
      },
    });
  };

  // 禁用用户
  const handleDisable = (userId: number, username: string) => {
    Modal.confirm({
      title: '确认禁用',
      content: `确定要禁用用户 "${username}" 吗?禁用后该用户将无法登录。`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await disableUser(userId);
          message.success('用户已禁用');
          loadUsers();
        } catch (error: any) {
          message.error(error.message || '禁用失败');
        }
      },
    });
  };

  // 删除用户
  const handleDelete = (userId: number, username: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${username}" 吗?此操作不可恢复!`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteUser(userId);
          message.success('用户已删除');
          loadUsers();
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  // 获取状态标签
  const getStatusTag = (status: number, description: string) => {
    const colorMap: Record<number, string> = {
      0: 'orange',    // 待审核
      1: 'green',     // 已启用
      2: 'red',       // 已禁用
    };
    return <Tag color={colorMap[status]}>{description}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<UserVO> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 150,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: string) => email || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: number, record: UserVO) => getStatusTag(status, record.statusDescription),
    },
    {
      title: '注册时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: any, record: UserVO) => (
        <Space size="small">
          {record.status === 0 && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleEnable(record.id, record.username)}
            >
              通过审核
            </Button>
          )}
          {record.status === 1 && (
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => handleDisable(record.id, record.username)}
            >
              禁用
            </Button>
          )}
          {record.status === 2 && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleEnable(record.id, record.username)}
            >
              启用
            </Button>
          )}
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, record.username)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="用户管理"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={loadUsers}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个用户`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default UserManagementPage;
