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
import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChatStore } from '@/stores/chat';
import agentService from '@/services/agent';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatInputArea from '@/components/chat/ChatInputArea';
import './ChatPage.css';

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const store = useChatStore();
  const prevAgentIdRef = useRef<number | undefined>(undefined);

  const currentAgentId = useMemo(() => {
    const q = searchParams.get('agentId');
    return q ? Number(q) : undefined;
  }, [searchParams]);

  const init = async (agentId: number) => {
    store.currentAgentId = agentId;
    try {
      const agent = await agentService.get(agentId);
      if (agent) {
        store.currentAgentName = agent.name || '';
        store.currentAgentAvatar = agent.avatar || '';
        store.currentAgentDescription = agent.description || '';
      }
    } catch {
      /* ignore */
    }
    store.connectSessionStream(agentId);
    await store.loadSessions(agentId);
  };

  useEffect(() => {
    if (currentAgentId) {
      if (prevAgentIdRef.current !== currentAgentId) {
        // 使用 Zustand 的 set 方法更新状态，确保触发重新渲染
        useChatStore.setState({
          sessions: [],
          currentSession: null,
          currentMessages: [],
          isStreaming: false,
          nodeBlocks: [],
        });
        init(currentAgentId);
        prevAgentIdRef.current = currentAgentId;
      }
    }
  }, [currentAgentId]);

  useEffect(() => {
    return () => {
      store.disconnectSessionStream();
    };
  }, []);

  return (
    <div className="chat-page">
      <ChatSidebar />
      <div className="chat-body">
        <div className="chat-messages-container">
          <ChatMessageList />
        </div>
        <div className="chat-input-wrapper">
          <ChatInputArea />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
