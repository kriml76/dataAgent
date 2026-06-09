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

/**
 * @description 数据源管理服务，处理基础数据源的增删改查、连接测试及逻辑外键管理
 */

import apiClient from '@/utils/request';
import type { ApiResponse } from '../common';

/**
 * @description 数据源实体接口
 */
export interface Datasource {
  /** 数据源 ID */
  id?: number;
  /** 数据源名称 */
  name?: string;
  /** 数据源类型 (如 MySQL, PostgreSQL) */
  type?: string;
  /** 主机地址 */
  host?: string;
  /** 端口号 */
  port?: number;
  /** 数据库名称 */
  databaseName?: string;
  /** Schema 名称 */
  schemaName?: string;
  /** 用户名 */
  username?: string;
  /** 密码 */
  password?: string;
  /** 连接 URL */
  connectionUrl?: string;
  /** 状态 */
  status?: string;
  /** 测试连接状态 */
  testStatus?: string;
  /** 描述 */
  description?: string;
  /** 创建者 ID */
  creatorId?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/**
 * @description 逻辑外键关系实体接口
 */
export interface LogicalRelation {
  /** 关系 ID */
  id?: number;
  /** 数据源 ID */
  datasourceId?: number;
  /** 源表名 */
  sourceTableName: string;
  /** 源列名 */
  sourceColumnName: string;
  /** 目标表名 */
  targetTableName: string;
  /** 目标列名 */
  targetColumnName: string;
  /** 关系类型 (1:1, 1:N, N:1) */
  relationType: string;
  /** 描述 */
  description?: string;
}

/**
 * @description 创建逻辑外键关系的 DTO
 */
export interface CreateLogicalRelationDTO {
  /** 源表名 */
  sourceTableName: string;
  /** 源列名 */
  sourceColumnName: string;
  /** 目标表名 */
  targetTableName: string;
  /** 目标列名 */
  targetColumnName: string;
  /** 关系类型 */
  relationType: string;
  /** 描述 */
  description?: string;
}

const API_BASE_URL = '/datasource';

/**
 * @description 数据源业务逻辑处理类
 */
class DatasourceService {
  async getAllDatasource(status?: string, type?: string): Promise<Datasource[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (type) params.type = type;

    return apiClient.get<Datasource[]>(API_BASE_URL, { params });
  }

  async getDatasourceById(id: number): Promise<Datasource | null> {
    try {
      return await apiClient.get<Datasource>(`${API_BASE_URL}/${id}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getDatasourceTables(id: number): Promise<string[]> {
    try {
      return await apiClient.get<string[]>(`${API_BASE_URL}/${id}/tables`);
    } catch (error: any) {
      if (error.response?.status === 400) {
        return [];
      }
      throw error;
    }
  }

  async getTableColumns(datasourceId: number, tableName: string): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<string[]>>(
        `${API_BASE_URL}/${datasourceId}/tables/${encodeURIComponent(tableName)}/columns`
      );
      return response.data ?? [];
    } catch {
      return [];
    }
  }

  async createDatasource(datasource: Datasource): Promise<Datasource> {
    return apiClient.post<Datasource>(API_BASE_URL, datasource);
  }

  async updateDatasource(id: number, datasource: Datasource): Promise<Datasource> {
    return apiClient.put<Datasource>(`${API_BASE_URL}/${id}`, datasource);
  }

  async deleteDatasource(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`${API_BASE_URL}/${id}`);
  }

  async testConnection(id: number): Promise<ApiResponse<boolean>> {
    return apiClient.post<ApiResponse<boolean>>(`${API_BASE_URL}/${id}/test`);
  }

  async getLogicalRelations(id: number): Promise<ApiResponse<LogicalRelation[]>> {
    return apiClient.get<ApiResponse<LogicalRelation[]>>(`${API_BASE_URL}/${id}/logical-relations`);
  }

  async addLogicalRelation(id: number, dto: CreateLogicalRelationDTO): Promise<ApiResponse<LogicalRelation>> {
    return apiClient.post<ApiResponse<LogicalRelation>>(`${API_BASE_URL}/${id}/logical-relations`, dto);
  }

  async deleteLogicalRelation(datasourceId: number, relationId: number): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`${API_BASE_URL}/${datasourceId}/logical-relations/${relationId}`);
  }
}

export default new DatasourceService();
