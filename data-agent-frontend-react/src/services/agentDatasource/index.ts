/*
 * Copyright 2024-2025 the original author or authors.
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
 * @description 智能体数据源管理服务，处理智能体与数据源的关联、Schema 初始化及表同步
 */

import apiClient from '@/utils/request';
import type { ApiResponse } from '../common';

/**
 * @description 智能体数据源实体接口
 */
export interface AgentDatasource {
  /** 关联 ID */
  id?: number;
  /** 智能体 ID */
  agentId: number;
  /** 数据源 ID */
  datasourceId: number;
  /** 是否激活 */
  isActive: boolean;
  /** 选中的表列表 */
  tables?: string[];
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/**
 * @description 切换数据源状态的 DTO
 */
interface ToggleDatasourceDto {
  /** 数据源 ID */
  datasourceId?: number;
  /** 是否激活 */
  isActive?: boolean;
}

/**
 * @description 更新数据源表的 DTO
 */
interface UpdateDatasourceTablesDto {
  /** 数据源 ID */
  datasourceId?: number;
  /** 表名列表 */
  tables?: string[];
}

const BASE_URL_FUNC = (agentId: string) => `/api/agent/${agentId}/datasources`;

/**
 * @description 智能体数据源业务逻辑处理类
 */
class AgentDatasourceService {
  /**
   * @description 初始化数据源 Schema
   * @param {string} agentId - 智能体 ID
   * @returns {Promise<ApiResponse<null>>} 操作结果
   */
  async initSchema(agentId: string): Promise<ApiResponse<null>> {
    return await apiClient.post<ApiResponse<null>>(`${BASE_URL_FUNC(agentId)}/init`);
  }

  /**
   * @description 获取智能体关联的数据源列表
   * @param {number} agentId - 智能体 ID
   * @returns {Promise<AgentDatasource[]>} 数据源列表
   */
  async getAgentDatasource(agentId: number): Promise<AgentDatasource[]> {
    const response = await apiClient.get<ApiResponse<AgentDatasource[]>>(
      BASE_URL_FUNC(String(agentId))
    );
    if (response.success) {
      return response.data || [];
    }
    throw new Error(response.message);
  }

  /**
   * @description 获取当前智能体激活的数据源
   * @param {number} agentId - 智能体 ID
   * @returns {Promise<AgentDatasource>} 激活的数据源详情
   */
  async getActiveAgentDatasource(agentId: number): Promise<AgentDatasource> {
    const response = await apiClient.get<ApiResponse<AgentDatasource>>(
      `${BASE_URL_FUNC(String(agentId))}/active`
    );
    if (response.success) {
      if (response.data === undefined) {
        throw new Error('后端错误');
      }
      return response.data;
    }
    throw new Error(response.message);
  }

  /**
   * @description 为智能体添加数据源关联
   * @param {string} agentId - 智能体 ID
   * @param {number} datasourceId - 数据源 ID
   * @returns {Promise<ApiResponse<AgentDatasource>>} 操作结果
   */
  async addDatasourceToAgent(
    agentId: string,
    datasourceId: number
  ): Promise<ApiResponse<AgentDatasource>> {
    return await apiClient.post<ApiResponse<AgentDatasource>>(
      `${BASE_URL_FUNC(agentId)}/${datasourceId}`
    );
  }

  /**
   * @description 移除智能体与数据源的关联
   * @param {string} agentId - 智能体 ID
   * @param {number} datasourceId - 数据源 ID
   * @returns {Promise<ApiResponse<null>>} 操作结果
   */
  async removeDatasourceFromAgent(
    agentId: string,
    datasourceId: number
  ): Promise<ApiResponse<null>> {
    return await apiClient.delete<ApiResponse<null>>(
      `${BASE_URL_FUNC(agentId)}/${datasourceId}`
    );
  }

  /**
   * @description 启用或禁用智能体的数据源
   * @param {string} agentId - 智能体 ID
   * @param {ToggleDatasourceDto} dto - 切换参数
   * @returns {Promise<ApiResponse<AgentDatasource>>} 操作结果
   */
  async toggleDatasourceForAgent(
    agentId: string,
    dto: ToggleDatasourceDto
  ): Promise<ApiResponse<AgentDatasource>> {
    return await apiClient.put<ApiResponse<AgentDatasource>>(
      `${BASE_URL_FUNC(agentId)}/toggle`,
      dto
    );
  }

  /**
   * @description 更新智能体数据源选中的表列表
   * @param {string} agentId - 智能体 ID
   * @param {UpdateDatasourceTablesDto} dto - 更新参数
   * @returns {Promise<ApiResponse<null>>} 操作结果
   */
  async updateDatasourceTables(
    agentId: string,
    dto: UpdateDatasourceTablesDto
  ): Promise<ApiResponse<null>> {
    return await apiClient.post<ApiResponse<null>>(`${BASE_URL_FUNC(agentId)}/tables`, dto);
  }
}

export default new AgentDatasourceService();
