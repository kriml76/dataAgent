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

import axios from 'axios';
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { ElMessage } from 'element-plus';

// Token key 常量
const TOKEN_KEY = 'token';

/**
 * 获取 token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 设置 token
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * 移除 token
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  error => {
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录');
          removeToken();
          break;
        case 403:
          ElMessage.error('没有权限访问');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器内部错误');
          break;
        default:
          ElMessage.error(response.data?.message || '请求失败');
      }
    } else if (error.message.includes('timeout')) {
      ElMessage.error('请求超时，请稍后重试');
    } else if (error.message.includes('Network')) {
      ElMessage.error('网络错误，请检查网络连接');
    } else {
      ElMessage.error(error.message || '请求失败');
    }

    return Promise.reject(error);
  },
);

// 封装请求方法
const request = {
  get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return service.get<T>(url, { params, ...config }).then(res => res.data);
  },

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.post<T>(url, data, config).then(res => res.data);
  },

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.put<T>(url, data, config).then(res => res.data);
  },

  delete<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return service.delete<T>(url, { params, ...config }).then(res => res.data);
  },

  // 保留原始 axios 实例用于特殊需求
  service,
};

export default request;
