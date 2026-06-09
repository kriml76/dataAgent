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
 * @description 预设问题管理服务，处理智能体首页展示的推荐问题
 */

import apiClient from '@/utils/request';

/**
 * @description 预设问题实体接口
 */
export interface PresetQuestion {
  /** 问题 ID */
  id?: number;
  /** 智能体 ID */
  agentId: number;
  /** 问题内容 */
  question: string;
  /** 排序序号 */
  sortOrder?: number;
  /** 是否激活 */
  isActive?: boolean;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/**
 * @description 预设问题传输对象
 */
export interface PresetQuestionDTO {
  /** 问题内容 */
  question: string;
  /** 是否激活 */
  isActive?: boolean;
}

const API_BASE_URL = '/api/agent';

/**
 * @description 预设问题业务逻辑处理类
 */
class PresetQuestionService {
  /**
   * @description 获取指定智能体的预设问题列表
   * @param {number} agentId - 智能体 ID
   * @returns {Promise<PresetQuestion[]>} 问题列表
   */
  async list(agentId: number): Promise<PresetQuestion[]> {
    return await apiClient.get<PresetQuestion[]>(
      `${API_BASE_URL}/${agentId}/preset-questions`
    );
  }

  /**
   * @description 批量保存智能体的预设问题
   * @param {number} agentId - 智能体 ID
   * @param {PresetQuestionDTO[]} questions - 问题列表
   * @returns {Promise<boolean>} 是否保存成功
   */
  async batchSave(agentId: number, questions: PresetQuestionDTO[]): Promise<boolean> {
    const questionsData = questions.map(q => ({
      question: q.question,
      isActive: q.isActive ?? true,
    }));
    const response = await apiClient.post(
      `${API_BASE_URL}/${agentId}/preset-questions`,
      questionsData
    );
    return response.status === 200 || response.status === 201;
  }

  /**
   * @description 删除指定的预设问题
   * @param {number} agentId - 智能体 ID
   * @param {number} questionId - 问题 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(agentId: number, questionId: number): Promise<boolean> {
    await apiClient.delete(`${API_BASE_URL}/${agentId}/preset-questions/${questionId}`);
    return true;
  }
}

export default new PresetQuestionService();
