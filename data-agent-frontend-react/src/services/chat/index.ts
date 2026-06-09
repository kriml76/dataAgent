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
 * @description 聊天会话服务，处理会话的创建、查询、删除、置顶以及消息的保存与报告下载
 */

import apiClient from '@/utils/request';
import type { ApiResponse } from '../common';
import type { ChatSession, ChatMessage } from '@/types/chat';

/**
 * @description 聊天业务逻辑处理类
 */
class ChatService {
  /**
   * @description 获取指定智能体的会话列表
   * @param {number} agentId - 智能体 ID
   * @returns {Promise<ChatSession[]>} 会话列表
   */
  async getAgentSessions(agentId: number): Promise<ChatSession[]> {
    return apiClient.get<ChatSession[]>(`/agent/${agentId}/sessions`);
  }

  /**
   * @description 创建新会话
   * @param {number} agentId - 智能体 ID
   * @param {string} [title] - 会话标题
   * @param {number} [userId] - 用户 ID
   * @returns {Promise<ChatSession>} 创建成功的会话详情
   */
  async createSession(agentId: number, title?: string, userId?: number): Promise<ChatSession> {
    const request = {
      title,
      userId,
    };

    return apiClient.post<ChatSession>(
      `/agent/${agentId}/sessions`,
      request
    );
  }

  /**
   * @description 清空指定智能体的所有会话
   * @param {number} agentId - 智能体 ID
   * @returns {Promise<ApiResponse>} 操作结果
   */
  async clearAgentSessions(agentId: number): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>(`/agent/${agentId}/sessions`);
  }

  /**
   * @description 获取指定会话的所有消息
   * @param {string} sessionId - 会话 ID
   * @returns {Promise<ChatMessage[]>} 消息列表
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    return apiClient.get<ChatMessage[]>(`/sessions/${sessionId}/messages`);
  }

  /**
   * @description 保存消息到指定会话
   * @param {string} sessionId - 会话 ID
   * @param {ChatMessage} message - 消息内容
   * @returns {Promise<ChatMessage>} 保存后的消息详情
   */
  async saveMessage(sessionId: string, message: ChatMessage): Promise<ChatMessage> {
    try {
      const messageData = {
        ...message,
        sessionId,
      };

      return apiClient.post<ChatMessage>(
        `/sessions/${sessionId}/messages`,
        messageData
      );
    } catch (error: any) {
      if (error.response?.status === 500) {
        throw new Error('保存消息失败');
      }
      throw error;
    }
  }

  /**
   * @description 置顶或取消置顶会话
   * @param {string} sessionId - 会话 ID
   * @param {boolean} isPinned - 是否置顶
   * @returns {Promise<ApiResponse>} 操作结果
   */
  async pinSession(sessionId: string, isPinned: boolean): Promise<ApiResponse> {
    try {
      return apiClient.put<ApiResponse>(
        `/sessions/${sessionId}/pin`,
        null,
        {
          params: { isPinned },
        }
      );
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('isPinned参数不能为空');
      }
      if (error.response?.status === 500) {
        throw new Error('操作失败');
      }
      throw error;
    }
  }

  /**
   * @description 重命名会话标题
   * @param {string} sessionId - 会话 ID
   * @param {string} title - 新标题
   * @returns {Promise<ApiResponse>} 操作结果
   */
  async renameSession(sessionId: string, title: string): Promise<ApiResponse> {
    try {
      if (!title || title.trim().length === 0) {
        throw new Error('标题不能为空');
      }

      return apiClient.put<ApiResponse>(
        `/sessions/${sessionId}/rename`,
        null,
        {
          params: { title: title.trim() },
        }
      );
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('标题不能为空');
      }
      if (error.response?.status === 500) {
        throw new Error('重命名失败');
      }
      throw error;
    }
  }

  /**
   * @description 删除指定会话
   * @param {string} sessionId - 会话 ID
   * @returns {Promise<ApiResponse>} 操作结果
   */
  async deleteSession(sessionId: string): Promise<ApiResponse> {
    try {
      return apiClient.delete<ApiResponse>(`/sessions/${sessionId}`);
    } catch (error: any) {
      if (error.response?.status === 500) {
        throw new Error('删除失败');
      }
      throw error;
    }
  }

  /**
   * @description 下载会话的 HTML 报告
   * @param {string} sessionId - 会话 ID
   * @param {string} content - 报告内容
   * @returns {Promise<void>}
   */
  async downloadHtmlReport(sessionId: string, content: string): Promise<void> {
    try {
      const response = await apiClient.post(
        `/sessions/${sessionId}/reports/html`,
        content,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
        }
      );

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'report.html';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^;"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = new Blob([response.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      if (error.response?.status === 500) {
        throw new Error(`下载失败: ${error.message}`);
      }
      throw error;
    }
  }
}

export default new ChatService();
