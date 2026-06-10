import React, { useMemo, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { UserOutlined, RobotOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useChatStore } from '@/stores/chat';
import { renderMarkdownContent } from '@/utils/markdown';
import { useEchartsRenderer } from '@/hooks/useEchartsRenderer';
import ChatWelcome from './ChatWelcome';
import ChatResultSet, { type ResultData } from './ChatResultSet';
import ChatWorkflowTimeline, { type GraphNodeResponse } from './ChatWorkflowTimeline';
import ChatMarkdownReport from './ChatMarkdownReport';
import './ChatMessageList.css';

const TIMELINE_ABSORBED_TYPES = new Set(['result-set', 'markdown-report', 'html']);

const SANITIZE_OPTIONS = {
  ADD_TAGS: ['div', 'pre', 'code', 'button'],
  ADD_ATTR: ['class', 'style', 'onclick', 'data-code'],
  ALLOW_DATA_ATTR: true,
};

function renderMarkdown(content: string): string {
  if (!content) return '';
  return DOMPurify.sanitize(renderMarkdownContent(content), SANITIZE_OPTIONS) as string;
}

function sanitizeHtml(content: string): string {
  if (!content) return '';
  return DOMPurify.sanitize(content, SANITIZE_OPTIONS) as string;
}

function safeParseJson(content: string): ResultData | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function safeParseBlocks(content: string): GraphNodeResponse[][] {
  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function extractReportContent(timelineJson: string): string | null {
  try {
    const blocks = JSON.parse(timelineJson) as GraphNodeResponse[][];
    for (const block of blocks) {
      if (
        block[0]?.nodeName === 'ReportGeneratorNode' &&
        block[0]?.textType === 'MARK_DOWN' &&
        block[0]?.text
      ) {
        return block[0].text;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const ChatMessageList: React.FC = () => {
  const store = useChatStore();
  const listRef = useRef<HTMLDivElement>(null);
  const { renderECharts } = useEchartsRenderer();

  const filteredMessages = useMemo(() => {
    const msgs = store.currentMessages;
    console.log(msgs);
    if (!msgs.length) return msgs;

    const result: typeof msgs = [];
    for (let i = 0; i < msgs.length; i++) {
      const msg = msgs[i];
      if (!msg) continue;
      if (
        msg.role === 'assistant' &&
        TIMELINE_ABSORBED_TYPES.has(msg.messageType)
      ) {
        const surroundHasTimeline = msgs.some(
          (m, j) =>
            j !== i &&
            m.role === 'assistant' &&
            m.messageType === 'timeline' &&
            m.sessionId === msg.sessionId
        );
        if (surroundHasTimeline) continue;
      }
      result.push(msg);
    }
    return result;
  }, [store.currentMessages]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
      renderECharts(listRef.current);
    }
  }, [filteredMessages.length, store.nodeBlocks, store.streamingReportContent, renderECharts]);

  const renderMessageContent = (message: any) => {
    if (message.role === 'user') {
      return (
        <div
          className="user-card"
          dangerouslySetInnerHTML={{
            __html: escapeHtml(message.content).replace(/\n/g, '<br>'),
          }}
        />
      );
    }

    switch (message.messageType) {
      case 'html':
        return (
          <div className="ai-card">
            <div className="md-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.content) }} />
          </div>
        );

      case 'result-set':
        return (
          <div className="ai-card">
            <ChatResultSet data={safeParseJson(message.content)} pageSize={store.requestOptions.pageSize} />
          </div>
        );

      case 'markdown-report':
        return (
          <div className="ai-card report-card">
            <ChatMarkdownReport content={message.content} />
          </div>
        );

      case 'timeline':
        return (
          <div className="ai-card timeline-card">
            <ChatWorkflowTimeline nodeBlocks={safeParseBlocks(message.content)} completed />
          </div>
        );

      case 'warning':
        return (
          <div className="status-banner status-banner--warning">
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            {message.content}
          </div>
        );

      case 'error':
        return (
          <div className="status-banner status-banner--error">
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            {message.content}
          </div>
        );

      default:
        return (
          <div className="ai-card">
            <div className="md-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
          </div>
        );
    }
  };

  const renderReportCard = (message: any) => {
    if (message.messageType !== 'timeline') return null;
    const reportContent = extractReportContent(message.content);
    if (!reportContent) return null;

    return (
      <div className="message-wrapper">
        <div className="row ai-row">
          <div className="avatar" style={{ visibility: 'hidden' }} />
          <div className="ai-card report-card">
            <div className="md-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(reportContent) }} />
          </div>
        </div>
      </div>
    );
  };

  if (!store.currentSession) {
    return (
      <div className="message-list custom-scrollbar">
        <ChatWelcome />
      </div>
    );
  }

  return (
    <div ref={listRef} className="message-list custom-scrollbar">
      <div className="messages-inner">
        {filteredMessages.map((message) => (
          <React.Fragment key={message.id}>
            <div className="message-wrapper">
              <div className={`row ${message.role === 'user' ? 'user-row' : 'ai-row'}`}>
                {message.role === 'user' ? (
                  <>
                    {renderMessageContent(message)}
                    <div className="avatar">
                      <UserOutlined />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="avatar">
                      <RobotOutlined />
                    </div>
                    {renderMessageContent(message)}
                  </>
                )}
              </div>
            </div>
            {renderReportCard(message)}
          </React.Fragment>
        ))}

        {/* Streaming workflow timeline */}
        {store.isStreaming && store.nodeBlocks.length > 0 && (
          <div className="row ai-row">
            <div className="avatar">
              <RobotOutlined />
            </div>
            <div className="ai-card timeline-card">
              <ChatWorkflowTimeline nodeBlocks={store.nodeBlocks} completed={false} />
            </div>
          </div>
        )}

        {/* Streaming report */}
        {store.isReportStreaming && store.streamingReportContent && (
          <div className="row ai-row">
            <div className="avatar" style={{ visibility: 'hidden' }} />
            <div className="ai-card report-card">
              <div className="md-body streaming" dangerouslySetInnerHTML={{ __html: renderMarkdown(store.streamingReportContent) }} />
            </div>
          </div>
        )}

        {/* Thinking dots */}
        {store.isStreaming && store.nodeBlocks.length === 0 && (
          <div className="row ai-row">
            <div className="avatar">
              <RobotOutlined />
            </div>
            <div className="ai-card">
              <div className="thinking-dots">
                <span className="dot" />
                <span className="dot dot-2" />
                <span className="dot dot-3" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageList;
