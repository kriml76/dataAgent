import React, { useState, useRef, useEffect } from 'react';
import {
  SendOutlined,
  StopOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useChatStore } from '@/stores/chat';
import './ChatInputArea.css';

const ChatInputArea: React.FC = () => {
  const store = useChatStore();
  const [inputText, setInputText] = useState('');
  const [showDsMenu, setShowDsMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDsMenu(false);
        setShowModelMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  const handleSend = async () => {
    const query = inputText.trim();
    if (!query || !store.currentSession || store.isStreaming) return;

    setInputText('');
    try {
      await store.sendMessage(query);
    } catch (e) {
      console.error('发送失败', e);
    }
  };

  const handleStop = async () => {
    try {
      await store.stopStreaming();
    } catch (e) {
      console.error('停止失败', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectDs = async (ds: any) => {
    setShowDsMenu(false);
    await store.switchDatasource(ds);
  };

  const selectModel = async (m: any) => {
    setShowModelMenu(false);
    if (m.id !== undefined) await store.switchModel(m.id);
  };

  const handleNl2sqlChange = () => {
    if (store.requestOptions.nl2sqlOnly) {
      store.requestOptions.humanFeedback = false;
    }
  };

  return (
    <div className="input-area" ref={menuRef}>
      {/* Status bar */}
      <div className="status-bar">
        <div className="status-chips">
          {/* Datasource selector */}
          <div className="ds-chip-wrap">
            <div
              className={`status-chip status-chip--ds ${store.isStreaming ? 'disabled' : ''}`}
              onClick={() => !store.isStreaming && setShowDsMenu(!showDsMenu)}
            >
              <DatabaseOutlined style={{ fontSize: 13, color: '#64748b' }} />
              <span>{store.activeDatasource?.name || '选择数据库'}</span>
            </div>
            {showDsMenu && (
              <div className="chip-dropdown">
                {store.allDatasources.map((ds: any) => (
                  <div
                    key={ds.id}
                    className={`chip-dropdown-item ${store.activeDatasource?.id === ds.id ? 'active' : ''}`}
                    onClick={() => selectDs(ds)}
                  >
                    <span className="item-name">{ds.name}</span>
                    <span className="item-tag">{ds.type?.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model selector */}
          <div className="ds-chip-wrap">
            <div
              className={`status-chip status-chip--model ${
                store.isStreaming || store.chatModels.length === 0 ? 'disabled' : ''
              }`}
              onClick={() => !store.isStreaming && store.chatModels.length > 0 && setShowModelMenu(!showModelMenu)}
            >
              <ThunderboltOutlined style={{ fontSize: 13, color: '#3b82f6' }} />
              <span>{store.activeModelConfig?.modelName || '选择AI模型'}</span>
            </div>
            {showModelMenu && (
              <div className="chip-dropdown">
                {store.chatModels.map((m: any) => (
                  <div
                    key={m.id}
                    className={`chip-dropdown-item ${store.activeModelConfig?.id === m.id ? 'active' : ''}`}
                    onClick={() => selectModel(m)}
                  >
                    <span className="item-name">{m.modelName}</span>
                    <span className="item-tag">{m.provider}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Textarea */}
      <div className="textarea-wrap">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={store.isStreaming || store.showHumanFeedback}
          placeholder="在这里提问，例如：'分析上月各产品的销售增长情况'..."
          rows={3}
          className="chat-textarea"
        />
      </div>

      {/* Action bar */}
      <div className="action-bar">
        <div className="action-bar-left">
          <div className="extra-options">
            <label className={`option-chip ${store.requestOptions.humanFeedback ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={store.requestOptions.humanFeedback}
                disabled={store.requestOptions.nl2sqlOnly || store.isStreaming}
                className="hidden-checkbox"
                onChange={() => {
                  store.requestOptions.humanFeedback = !store.requestOptions.humanFeedback;
                }}
              />
              <CheckOutlined style={{ fontSize: 11 }} />
              人工反馈
            </label>
            <label className={`option-chip ${store.requestOptions.nl2sqlOnly ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={store.requestOptions.nl2sqlOnly}
                disabled={store.isStreaming}
                className="hidden-checkbox"
                onChange={() => {
                  store.requestOptions.nl2sqlOnly = !store.requestOptions.nl2sqlOnly;
                  handleNl2sqlChange();
                }}
              />
              <DatabaseOutlined style={{ fontSize: 11 }} />
              仅NL2SQL
            </label>
            <label className={`option-chip ${store.requestOptions.showSqlResults ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={store.requestOptions.showSqlResults}
                disabled={store.isStreaming}
                className="hidden-checkbox"
                onChange={() => {
                  store.requestOptions.showSqlResults = !store.requestOptions.showSqlResults;
                }}
              />
              <DatabaseOutlined style={{ fontSize: 11 }} />
              显示SQL结果
            </label>
          </div>
        </div>

        <div className="action-bar-right">
          {!store.isStreaming ? (
            <button
              className="send-btn"
              disabled={!inputText.trim() || store.showHumanFeedback}
              onClick={handleSend}
            >
              发送
              <SendOutlined style={{ marginLeft: 8, fontSize: 14 }} />
            </button>
          ) : (
            <button className="stop-btn" onClick={handleStop}>
              <StopOutlined style={{ marginRight: 8, fontSize: 14 }} />
              停止
            </button>
          )}
        </div>
      </div>

      {/* Human Feedback Panel */}
      {store.showHumanFeedback && (
        <div className="human-feedback-panel">
          <div className="feedback-header">
            <ExclamationCircleOutlined style={{ marginRight: 8, color: '#f59e0b' }} />
            <span>请确认执行计划</span>
          </div>
          <textarea
            value={store.feedbackContent}
            onChange={(e) => (store.feedbackContent = e.target.value)}
            rows={2}
            placeholder="输入您的反馈意见（留空表示接受计划）"
            className="feedback-textarea"
          />
          <div className="feedback-actions">
            <button
              className="feedback-btn feedback-btn--accept"
              onClick={() => store.submitFeedback(false, store.feedbackContent)}
            >
              <CheckOutlined style={{ marginRight: 4 }} />
              接受计划
            </button>
            <button
              className="feedback-btn feedback-btn--reject"
              onClick={() => store.submitFeedback(true, store.feedbackContent)}
            >
              <CloseOutlined style={{ marginRight: 4 }} />
              拒绝重规划
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInputArea;
