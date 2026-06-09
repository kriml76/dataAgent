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

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChatStore } from '@/stores/chat';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatInputArea from '@/components/chat/ChatInputArea';

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const store = useChatStore();

  const currentAgentId = useMemo(() => {
    const q = searchParams.get('agentId');
    return q ? Number(q) : undefined;
  }, [searchParams]);

  useEffect(() => {
    if (currentAgentId) {
      init(currentAgentId);
    }
  }, [currentAgentId]);

  const init = async (agentId: number) => {
    store.currentAgentId = agentId;

    // TODO: Load agent info
    // try {
    //   const agent = await agentService.get(agentId);
    //   if (agent) {
    //     store.currentAgentName = agent.name || '';
    //     store.currentAgentAvatar = agent.avatar || '';
    //     store.currentAgentDescription = agent.description || '';
    //   }
    // } catch { /* ignore */ }

    store.connectSessionStream(agentId);
    await store.loadSessions(agentId);
  };

  useEffect(() => {
    return () => {
      store.disconnectSessionStream();
    };
  }, []);

  return (
    <div className="chat-page">
      <div className="chat-sidebar magazine-card">
        <div className="chat-sidebar-header">
          <p className="magazine-label mb-2">Conversation History</p>
          <h2 className="magazine-heading" style={{ fontSize: '1.125rem', marginBottom: 0 }}>
            Archives
          </h2>
        </div>
        <ChatSidebar />
      </div>
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
