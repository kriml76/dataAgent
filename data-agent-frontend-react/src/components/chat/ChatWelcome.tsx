import React from 'react';
import { useChatStore } from '@/stores/chat';
import './ChatWelcome.css';

const ChatWelcome: React.FC = () => {
  const store = useChatStore();

  return (
    <div className="welcome-wrap">
      {/* Agent Avatar */}
      <div className="agent-avatar-wrap">
        <div
          className="agent-avatar"
          style={{
            backgroundImage: store.currentAgentAvatar ? `url(${store.currentAgentAvatar})` : undefined,
          }}
        >
          {!store.currentAgentAvatar && (
            <span className="agent-avatar-emoji">🤖</span>
          )}
        </div>
      </div>

      {/* Agent Name */}
      <h2 className="welcome-title">
        您好，我是 <span className="agent-name">{store.currentAgentName || '数据助手'}</span>
      </h2>

      {/* Agent Description */}
      <p className="welcome-desc">
        {store.currentAgentDescription || '我可以为您分析数据库中的表结构、生成 SQL 或可视化图表。'}
      </p>
    </div>
  );
};

export default ChatWelcome;
