import React, { useState, useRef, useEffect } from 'react';
import {
  UpOutlined,
  DownOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  TableOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  PauseCircleOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Tooltip, Select } from 'antd';
import { useChatStore } from '@/stores/chat';
import PresetQuestions from './PresetQuestions';
import './ChatInputArea.css';

const ChatInputArea: React.FC = () => {
  const store = useChatStore();
  const [inputText, setInputText] = useState('');
  const [showDsMenu, setShowDsMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [inputControlsCollapsed, setInputControlsCollapsed] = useState(false);
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
    // Reset textarea height after sending
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 0);

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

  const toggleDsMenu = () => {
    if (store.isStreaming) return;
    setShowDsMenu(!showDsMenu);
    if (!showDsMenu) {
      setShowModelMenu(false);
    }
  };

  const toggleModelMenu = () => {
    if (store.isStreaming || store.chatModels.length === 0) return;
    setShowModelMenu(!showModelMenu);
    if (!showModelMenu) {
      setShowDsMenu(false);
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

  const handlePresetQuestionClick = (question: string) => {
    setInputText(question);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handlePageSizeChange = (value: number) => {
    store.setRequestOptions({
      pageSize: value,
    });
  };

  return (
    <div className="input-area" ref={menuRef}>
      {/* Status bar */}
      <div className="status-bar">
        <div className="status-chips">
          {/* Datasource selector */}
          <div className="ds-chip-wrap" onClick={(e) => e.stopPropagation()}>
            <div
              className={`status-chip status-chip--ds ${store.isStreaming ? 'disabled' : ''}`}
              onClick={toggleDsMenu}
            >
              <DatabaseOutlined style={{ fontSize: 13, color: '#64748b' }} />
              <span>{store.activeDatasource?.name || '选择数据库'}</span>
              {showDsMenu ? (
                <UpOutlined style={{ fontSize: 13, color: '#94a3b8' }} />
              ) : (
                <DownOutlined style={{ fontSize: 13, color: '#94a3b8' }} />
              )}
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
          <div className="ds-chip-wrap" onClick={(e) => e.stopPropagation()}>
            <div
              className={`status-chip status-chip--model ${
                store.isStreaming || store.chatModels.length === 0 ? 'disabled' : ''
              }`}
              onClick={toggleModelMenu}
            >
              <ThunderboltOutlined style={{ fontSize: 13, color: '#3b82f6' }} />
              <span>{store.activeModelConfig?.modelName || '选择AI模型'}</span>
              {showModelMenu ? (
                <UpOutlined style={{ fontSize: 13, color: '#94a3b8' }} />
              ) : (
                <DownOutlined style={{ fontSize: 13, color: '#94a3b8' }} />
              )}
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

      {/* Input Controls (Collapsible) */}
      <div className="input-controls">
        <div
          className="input-controls-header"
          onClick={() => setInputControlsCollapsed(!inputControlsCollapsed)}
        >
          <div className="header-left">
            <SettingOutlined className="header-icon" />
            <span className="input-controls-title">更多选项</span>
          </div>
          <button
            type="button"
            className="input-controls-toggle-btn"
          >
            {inputControlsCollapsed ? (
              <>
                <DownOutlined className="input-controls-toggle-icon" />
                展开
              </>
            ) : (
              <>
                <UpOutlined className="input-controls-toggle-icon" />
                收起
              </>
            )}
          </button>
        </div>

        {!inputControlsCollapsed && (
          <div className="input-controls-body">
            {/* Preset Questions */}
            {store.currentSession && store.currentAgentId && (
              <PresetQuestions
                agentId={store.currentAgentId}
                onQuestionClick={handlePresetQuestionClick}
              />
            )}

            {/* Switch Group */}
            <div className="switch-group">
              <div className="switch-item">
                <Tooltip
                  open={store.requestOptions.nl2sqlOnly ? undefined : false}
                  title="该功能在NL2SQL模式下不能使用"
                  placement="top"
                >
                  <label
                    className={`option-chip ${
                      store.requestOptions.humanFeedback ? 'active' : ''
                    } ${
                      store.requestOptions.nl2sqlOnly || store.isStreaming || store.showHumanFeedback
                        ? 'disabled'
                        : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={store.requestOptions.humanFeedback}
                      disabled={
                        store.requestOptions.nl2sqlOnly ||
                        store.isStreaming ||
                        store.showHumanFeedback
                      }
                      className="hidden-checkbox"
                      onChange={() => {
                        store.setRequestOptions({
                          humanFeedback: !store.requestOptions.humanFeedback,
                        });
                      }}
                    />
                    <UserOutlined style={{ fontSize: 11 }} />
                    人工反馈
                  </label>
                </Tooltip>
              </div>

              <div className="switch-item">
                <label
                  className={`option-chip ${store.requestOptions.nl2sqlOnly ? 'active' : ''} ${
                    store.isStreaming || store.showHumanFeedback ? 'disabled' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={store.requestOptions.nl2sqlOnly}
                    disabled={store.isStreaming || store.showHumanFeedback}
                    className="hidden-checkbox"
                    onChange={() => {
                      const newNl2sqlOnly = !store.requestOptions.nl2sqlOnly;
                      store.setRequestOptions({
                        nl2sqlOnly: newNl2sqlOnly,
                        humanFeedback: newNl2sqlOnly ? false : store.requestOptions.humanFeedback,
                      });
                    }}
                  />
                  <SearchOutlined style={{ fontSize: 11 }} />
                    仅NL2SQL
                </label>
              </div>

              <div className="switch-item">
                <label className={`option-chip ${store.autoScroll ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={store.autoScroll}
                    className="hidden-checkbox"
                    onChange={() => {
                      store.setAutoScroll(!store.autoScroll);
                    }}
                  />
                  <ArrowRightOutlined style={{ fontSize: 11, transform: 'rotate(-90deg)' }} />
                    自动Scroll
                </label>
              </div>

              <div className="switch-item">
                <Tooltip
                  title="启用本功能会将SQL查询结果存储到DataAgent项目的数据库中，如果数据量较大不建议开启本功能"
                  placement="top"
                >
                  <label
                    className={`option-chip ${
                      store.requestOptions.showSqlResults ? 'active' : ''
                    } ${store.isStreaming || store.showHumanFeedback ? 'disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={store.requestOptions.showSqlResults}
                      disabled={store.isStreaming || store.showHumanFeedback}
                      className="hidden-checkbox"
                      onChange={() => {
                        store.setRequestOptions({
                          showSqlResults: !store.requestOptions.showSqlResults,
                        });
                      }}
                    />
                    <TableOutlined style={{ fontSize: 11 }} />
                    显示SQL结果
                  </label>
                </Tooltip>
              </div>

              <div className="switch-item">
                <span className="switch-label">每页数量</span>
                <Select
                  className="page-size-select"
                  value={store.requestOptions.pageSize}
                  disabled={store.isStreaming || store.showHumanFeedback}
                  onChange={handlePageSizeChange}
                  size="small"
                  style={{ width: 70 }}
                  options={[
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                    { value: 20, label: '20' },
                    { value: 50, label: '50' },
                    { value: 100, label: '100' },
                  ]}
                />
              </div>
            </div>
          </div>
        )}
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
        <div className="action-bar-left"></div>

        <div className="action-bar-right">
          {!store.isStreaming ? (
            <button
              className="send-btn"
              disabled={!inputText.trim() || store.showHumanFeedback}
              onClick={handleSend}
            >
              发送
              <ArrowRightOutlined style={{ marginLeft: 8, fontSize: 16 }} />
            </button>
          ) : (
            <button className="stop-btn" onClick={handleStop}>
              <PauseCircleOutlined style={{ marginRight: 8, fontSize: 16, color: 'white' }} />
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
