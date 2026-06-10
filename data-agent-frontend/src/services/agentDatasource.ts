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

import request from '@/utils/request';
import { ApiResponse } from '@/services/common';
import { AgentDatasource } from '@/services/datasource';

interface ToggleDatasourceDto {
  datasourceId?: number;
  isActive?: boolean;
}

interface UpdateDatasourceTablesDto {
  datasourceId?: number;
  tables?: string[];
}

const BASE_URL_FUNC = (agentId: string) => `/api/agent/${agentId}/datasources`;

class AgentDatasourceService {
  /**
   * 初始化数据源Schema
   * @param agentId 智能体ID
   */
  async initSchema(agentId: string): Promise<ApiResponse<null>> {
    return request.post<ApiResponse<null>>(`${BASE_URL_FUNC(agentId)}/init`);
  }

  /**
   * 获取智能体的数据源列表
   * @param agentId 智能体ID
   */
  async getAgentDatasource(agentId: number): Promise<AgentDatasource[]> {
    const response = await request.get<ApiResponse<AgentDatasource[]>>(
      BASE_URL_FUNC(String(agentId)),
    );
    if (response.success) {
      return response.data || [];
    }
    throw new Error(response.message);
  }

  /**
   * 获取当前激活的智能体
   * @param agentId 智能体ID
   */
  async getActiveAgentDatasource(agentId: number): Promise<AgentDatasource> {
    const response = await request.get<ApiResponse<AgentDatasource>>(
      BASE_URL_FUNC(String(agentId)) + '/active',
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
   * 为智能体添加数据源
   * @param agentId 智能体ID
   * @param datasourceId 数据源ID
   */
  async addDatasourceToAgent(
    agentId: string,
    datasourceId: number,
  ): Promise<ApiResponse<AgentDatasource>> {
    return request.post<ApiResponse<AgentDatasource>>(
      `${BASE_URL_FUNC(agentId)}/${datasourceId}`,
    );
  }

  /**
   * 从智能体移除数据源
   * @param agentId 智能体ID
   * @param datasourceId 数据源ID
   */
  async removeDatasourceFromAgent(
    agentId: string,
    datasourceId: number,
  ): Promise<ApiResponse<null>> {
    return request.delete<ApiResponse<null>>(`${BASE_URL_FUNC(agentId)}/${datasourceId}`);
  }

  /**
   * 启用/禁用智能体的数据源
   * @param agentId 智能体ID
   * @param dto 切换参数
   */
  async toggleDatasourceForAgent(
    agentId: string,
    dto: ToggleDatasourceDto,
  ): Promise<ApiResponse<AgentDatasource>> {
    return request.put<ApiResponse<AgentDatasource>>(
      `${BASE_URL_FUNC(agentId)}/toggle`,
      dto,
    );
  }

  /**
   * 更新数据源的表列表
   * @param agentId 智能体ID
   * @param dto 更新参数
   */
  async updateDatasourceTables(
    agentId: string,
    dto: UpdateDatasourceTablesDto,
  ): Promise<ApiResponse<null>> {
    return request.post<ApiResponse<null>>(`${BASE_URL_FUNC(agentId)}/tables`, dto);
  }
}

export default new AgentDatasourceService();
