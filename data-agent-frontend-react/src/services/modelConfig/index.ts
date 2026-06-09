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
 * @description 模型配置管理服务，处理 LLM 供应商信息、API 密钥、模型参数及就绪状态检查
 */

import apiClient from '@/utils/request';
import type { ApiResponse } from '../common';

export type ModelType = "CHAT" | "EMBEDDING";

export interface ModelConfig {
  id?: number;
  provider: string;
  apiKey: string;
  baseUrl: string;
  modelName: string;
  modelType: ModelType;
  temperature?: number;
  maxTokens?: number;
  isActive?: boolean;
  completionsPath?: string;
  embeddingsPath?: string;
}

export interface ModelCheckReady {
  chatModelReady: boolean;
  embeddingModelReady: boolean;
  ready: boolean;
}

const API_BASE_URL = "/model-config";

class ModelConfigService {
  async list(): Promise<ModelConfig[]> {
    const response = await apiClient.get<ApiResponse<ModelConfig[]>>(`${API_BASE_URL}/list`);
    return response.data || [];
  }

  async add(config: Omit<ModelConfig, "id">): Promise<ApiResponse<string>> {
    return apiClient.post<ApiResponse<string>>(`${API_BASE_URL}/add`, config);
  }

  async update(config: ModelConfig): Promise<ApiResponse<string>> {
    return apiClient.put<ApiResponse<string>>(`${API_BASE_URL}/update`, config);
  }

  async delete(id: number): Promise<ApiResponse<string>> {
    return apiClient.delete<ApiResponse<string>>(`${API_BASE_URL}/${id}`);
  }

  async activate(id: number): Promise<ApiResponse<string>> {
    return apiClient.post<ApiResponse<string>>(`${API_BASE_URL}/activate/${id}`);
  }

  async testConnection(config: Omit<ModelConfig, "id">): Promise<ApiResponse<string>> {
    return apiClient.post<ApiResponse<string>>(`${API_BASE_URL}/test`, config);
  }

  async checkReady(): Promise<ModelCheckReady> {
    const response = await apiClient.get<ApiResponse<ModelCheckReady>>(`${API_BASE_URL}/check-ready`);
    return response.data || {
      chatModelReady: false,
      embeddingModelReady: false,
      ready: false,
    };
  }
}

export default new ModelConfigService();
