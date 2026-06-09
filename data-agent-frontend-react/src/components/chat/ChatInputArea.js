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
import { useState } from 'react';
import { useChatStore } from '@/stores/chat';
import { Button, Input, Space, Dropdown } from 'antd';
import { SendOutlined, StopOutlined, DatabaseOutlined, ThunderboltOutlined } from '@ant-design/icons';
const ChatInputArea = () => {
    const store = useChatStore();
    const [inputText, setInputText] = useState('');
    const [showDsMenu, setShowDsMenu] = useState(false);
    const [showModelMenu, setShowModelMenu] = useState(false);
    const handleSend = async () => {
        const query = inputText.trim();
        if (!query || !store.currentSession || store.isStreaming)
            return;
        setInputText('');
        try {
            await store.sendMessage(query);
        }
        catch (e) {
            console.error('发送失败', e);
        }
    };
    const handleStop = async () => {
        try {
            await store.stopStreaming();
        }
        catch (e) {
            console.error('停止失败', e);
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    const dsMenuItems = store.allDatasources.map((ds) => ({
        key: ds.id,
        label: (<div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{ds.name}</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{ds.type?.toUpperCase()}</span>
      </div>),
        onClick: () => {
            setShowDsMenu(false);
            store.switchDatasource(ds);
        },
    }));
    const modelMenuItems = store.chatModels.map((m) => ({
        key: m.id,
        label: (<div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{m.modelName}</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{m.provider}</span>
      </div>),
        onClick: () => {
            setShowModelMenu(false);
            store.switchModel(m.id);
        },
    }));
    return (<div className="input-area">
      {/* Status bar */}
      <div className="status-bar">
        <div className="status-chips">
          {/* Datasource selector */}
          <Dropdown menu={{ items: dsMenuItems }} trigger={['click']} open={showDsMenu} onOpenChange={(open) => !store.isStreaming && setShowDsMenu(open)}>
            <div className={`status-chip status-chip--ds ${store.isStreaming ? 'disabled' : ''}`} onClick={() => !store.isStreaming && setShowDsMenu(!showDsMenu)}>
              <DatabaseOutlined style={{ fontSize: 13, color: '#64748b' }}/>
              <span>{store.activeDatasource?.name || '选择数据库'}</span>
            </div>
          </Dropdown>

          {/* Model selector */}
          <Dropdown menu={{ items: modelMenuItems }} trigger={['click']} open={showModelMenu} onOpenChange={(open) => !store.isStreaming && store.chatModels.length > 0 && setShowModelMenu(open)}>
            <div className={`status-chip status-chip--model ${store.isStreaming || store.chatModels.length === 0 ? 'disabled' : ''}`} onClick={() => !store.isStreaming &&
            store.chatModels.length > 0 &&
            setShowModelMenu(!showModelMenu)}>
              <ThunderboltOutlined style={{ fontSize: 13, color: '#3b82f6' }}/>
              <span>{store.activeModelConfig?.modelName || '选择AI模型'}</span>
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Textarea */}
      <div className="textarea-wrap">
        <Input.TextArea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} disabled={store.isStreaming || store.showHumanFeedback} placeholder="在这里提问，例如：'分析上月各产品的销售增长情况'..." rows={3} autoSize={{ minRows: 3, maxRows: 10 }} className="chat-textarea"/>
      </div>

      {/* Action bar */}
      <div className="action-bar">
        <div className="action-bar-left">
          <Space size="small">
            <Button size="small" type={store.requestOptions.humanFeedback ? 'primary' : 'default'} disabled={store.requestOptions.nl2sqlOnly || store.isStreaming} onClick={() => store.requestOptions.humanFeedback = !store.requestOptions.humanFeedback}>
              人工反馈
            </Button>
            <Button size="small" type={store.requestOptions.nl2sqlOnly ? 'primary' : 'default'} disabled={store.isStreaming} onClick={() => {
            store.requestOptions.nl2sqlOnly = !store.requestOptions.nl2sqlOnly;
            if (store.requestOptions.nl2sqlOnly) {
                store.requestOptions.humanFeedback = false;
            }
        }}>
              仅NL2SQL
            </Button>
            <Button size="small" type={store.requestOptions.showSqlResults ? 'primary' : 'default'} disabled={store.isStreaming} onClick={() => store.requestOptions.showSqlResults = !store.requestOptions.showSqlResults}>
              显示SQL结果
            </Button>
          </Space>
        </div>

        <div className="action-bar-right">
          {!store.isStreaming ? (<Button type="primary" icon={<SendOutlined />} disabled={!inputText.trim() || store.showHumanFeedback} onClick={handleSend} className="send-btn">
              发送
            </Button>) : (<Button danger icon={<StopOutlined />} onClick={handleStop} className="stop-btn">
              停止
            </Button>)}
        </div>
      </div>

      {/* Human Feedback Panel */}
      {store.showHumanFeedback && (<div className="human-feedback-panel">
          <div className="feedback-header">
            <span style={{ marginRight: 4 }}>⚠️</span>
            <span>请确认执行计划</span>
          </div>
          <Input.TextArea value={store.feedbackContent} onChange={(e) => (store.feedbackContent = e.target.value)} rows={2} placeholder="输入您的反馈意见（留空表示接受计划）" className="feedback-textarea"/>
          <div className="feedback-actions">
            <Button type="primary" onClick={() => store.submitFeedback(false, store.feedbackContent)} className="feedback-btn feedback-btn--accept">
              ✓ 接受计划
            </Button>
            <Button danger onClick={() => store.submitFeedback(true, store.feedbackContent)} className="feedback-btn feedback-btn--reject">
              ✕ 拒绝重规划
            </Button>
          </div>
        </div>)}
    </div>);
};
export default ChatInputArea;
