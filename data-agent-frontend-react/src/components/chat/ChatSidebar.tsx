import React, { useState } from 'react';
import {
  LeftOutlined,
  RightOutlined,
  EditOutlined,
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Modal } from 'antd';
import { useChatStore, type ExtendedChatSession } from '@/stores/chat';
import './ChatSidebar.css';

const { confirm } = Modal;

function formatTime(time: Date | string | undefined): string {
  if (!time) return '';
  const d = typeof time === 'string' ? new Date(time) : time;
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const pad = (n: number) => String(n).padStart(2, '0');
  if (isToday) return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const ChatSidebar: React.FC = () => {
  const store = useChatStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleCreateNewSession = async () => {
    if (!store.currentAgentId) return;
    try {
      await store.createNewSession(store.currentAgentId);
    } catch (e) {
      console.error('创建会话失败', e);
    }
  };

  const handleSelectSession = async (session: any) => {
    if (store.currentSession?.id === session.id) return;
    try {
      await store.selectSession(session);
    } catch (e) {
      console.error('切换会话失败', e);
    }
  };

  const startEdit = (session: ExtendedChatSession) => {
    setEditingId(session.id);
    setEditingTitle(session.title || '新会话');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveTitle = async (session: ExtendedChatSession) => {
    const newTitle = editingTitle.trim();
    if (!newTitle) {
      setEditingId(null);
      return;
    }
    if (newTitle === session.title) {
      setEditingId(null);
      return;
    }
    try {
      await store.renameSession(session, newTitle);
    } catch (e) {
      console.error('重命名失败', e);
    }
    setEditingId(null);
  };

  const handlePin = async (session: any) => {
    try {
      await store.pinSession(session);
    } catch (e) {
      console.error('置顶操作失败', e);
    }
  };

  const handleDelete = (session: any) => {
    confirm({
      title: '删除会话',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个会话吗？',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          await store.removeSession(session);
        } catch (e) {
          console.error('删除会话失败', e);
        }
      },
    });
  };

  return (
    <div className={`sidebar-wrapper ${store.chatSidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Expanded panel */}
      <div className="chat-sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <span className="sidebar-title">历史会话</span>
          <button
            className="toggle-btn"
            onClick={() => store.setChatSidebarCollapsed(true)}
            title="折叠侧边栏"
          >
            <LeftOutlined />
          </button>
        </div>

        {/* Session List */}
        <div className="session-list custom-scrollbar">
          <div className="session-group-label">最近任务</div>

          {store.sessions.map((session: any) => (
            <div
              key={session.id}
              className={`session-item ${store.currentSession?.id === session.id ? 'active' : ''}`}
              onClick={() => handleSelectSession(session)}
            >
              {editingId === session.id ? (
                <input
                  className="session-rename-input"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => handleSaveTitle(session)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle(session);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  autoFocus
                />
              ) : (
                <>
                  <div className="session-item-info" onDoubleClick={() => startEdit(session)}>
                    <span className="session-item-title">{session.title || '新会话'}</span>
                    <span className="session-item-time">
                      {formatTime(session.createTime || session.updateTime)}
                    </span>
                  </div>
                  <div className="session-item-actions">
                    <button
                      className="action-btn action-btn--edit"
                      title="重命名"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(session);
                      }}
                    >
                      <EditOutlined />
                    </button>
                    <button
                      className="action-btn action-btn--star"
                      title="收藏"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePin(session);
                      }}
                    >
                      {session.isPinned ? <StarFilled style={{ color: '#f59e0b' }} /> : <StarOutlined />}
                    </button>
                    <button
                      className="action-btn action-btn--danger"
                      title="删除"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(session);
                      }}
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {store.sessions.length === 0 && <div className="empty-sessions">暂无历史会话</div>}
        </div>

        {/* Bottom: New Session Button */}
        <div className="sidebar-bottom">
          <button className="new-session-btn" onClick={handleCreateNewSession}>
            <PlusOutlined style={{ marginRight: 8 }} />
            新建分析会话
          </button>
        </div>
      </div>

      {/* Collapsed FAB: floats at top-left of chat area */}
      {store.chatSidebarCollapsed && (
        <button
          className="expand-fab"
          onClick={() => store.setChatSidebarCollapsed(false)}
          title="展开历史会话"
        >
          <RightOutlined />
        </button>
      )}
    </div>
  );
};

export default ChatSidebar;
