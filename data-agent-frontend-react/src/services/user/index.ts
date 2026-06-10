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

import apiClient from '@/utils/request';
import type { ApiResponse } from '../common';

export interface UserVO {
  id: number;
  username: string;
  email?: string;
  nickname: string;
  avatar?: string;
  status: number; // 0-待审核, 1-已启用, 2-已禁用
  statusDescription: string;
  createTime: string;
  updateTime: string;
}

const API_BASE_URL = '/user';

/**
 * @description 获取所有用户列表
 */
export const getAllUsers = async (): Promise<ApiResponse<UserVO[]>> => {
  return apiClient.get<ApiResponse<UserVO[]>>(`${API_BASE_URL}/list`);
};

/**
 * @description 启用用户
 */
export const enableUser = async (userId: number): Promise<ApiResponse<void>> => {
  return apiClient.put<ApiResponse<void>>(`${API_BASE_URL}/${userId}/enable`);
};

/**
 * @description 禁用用户
 */
export const disableUser = async (userId: number): Promise<ApiResponse<void>> => {
  return apiClient.put<ApiResponse<void>>(`${API_BASE_URL}/${userId}/disable`);
};

/**
 * @description 删除用户
 */
export const deleteUser = async (userId: number): Promise<ApiResponse<void>> => {
  return apiClient.delete<ApiResponse<void>>(`${API_BASE_URL}/${userId}`);
};
