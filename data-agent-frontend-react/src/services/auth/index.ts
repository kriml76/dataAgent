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

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  expiresIn: number;
  userInfo: UserInfo;
}

const API_BASE_URL = '/auth';

/**
 * @description 用户登录
 * @param credentials - 登录凭证
 * @returns 登录响应,包含Token和用户信息
 */
export const login = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  return apiClient.post<ApiResponse<LoginResponse>>(`${API_BASE_URL}/login`, credentials);
};

/**
 * @description 用户注册
 * @param credentials - 注册信息
 * @returns 注册响应,包含Token和用户信息
 */
export const register = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  return apiClient.post<ApiResponse<LoginResponse>>(`${API_BASE_URL}/register`, credentials);
};

/**
 * @description 验证Token有效性
 * @param token - JWT Token
 * @returns 用户信息
 */
export const verifyToken = async (token: string): Promise<ApiResponse<UserInfo>> => {
  return apiClient.get<ApiResponse<UserInfo>>(`${API_BASE_URL}/verify`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
