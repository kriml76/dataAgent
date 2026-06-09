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
 * @description 聊天会话实体接口
 */
export interface ChatSession {
  /** 会话 ID (UUID) */
  id: string;
  /** 关联的智能体 ID */
  agentId: number;
  /** 会话标题 */
  title: string;
  /** 状态 (active, archived, deleted) */
  status: string;
  /** 是否置顶 */
  isPinned: boolean;
  /** 用户 ID */
  userId?: number;
  /** 创建时间 */
  createTime?: Date;
  /** 更新时间 */
  updateTime?: Date;
}

/**
 * @description 聊天消息实体接口
 */
export interface ChatMessage {
  /** 消息 ID */
  id?: number;
  /** 所属会话 ID */
  sessionId: string;
  /** 角色 (user, assistant, system) */
  role: string;
  /** 消息内容 */
  content: string;
  /** 消息类型 (text, sql, result, error) */
  messageType: string;
  /** 元数据 (JSON 字符串) */
  metadata?: string;
  /** 创建时间 */
  createTime?: Date;
  /** 是否需要生成标题 */
  titleNeeded?: boolean;
}
