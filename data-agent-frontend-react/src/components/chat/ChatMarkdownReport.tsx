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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import {
  FileTextOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import {
  Button,
  Space,
  Modal,
  Typography,
  Tooltip,
} from 'antd';
import { useChatStore } from '@/stores/chat';
import { renderMarkdownContent } from '@/utils/markdown';
import { buildReportHtml } from '@/utils/report-html-template';
import { useEchartsRenderer } from '@/hooks/useEchartsRenderer';
import './ChatMarkdownReport.css';

interface ChatMarkdownReportProps {
  content: string;
}

const ChatMarkdownReport: React.FC<ChatMarkdownReportProps> = ({ content }) => {
  const store = useChatStore();
  const [format, setFormat] = useState<'markdown' | 'html'>('markdown');
  const reportBodyRef = useRef<HTMLDivElement>(null);
  const htmlIframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null);
  const { renderECharts } = useEchartsRenderer();

  const renderMarkdown = useCallback((md: string): string => {
    if (!md) return '';
    return DOMPurify.sanitize(renderMarkdownContent(md), {
      ADD_TAGS: ['div', 'pre', 'code'],
      ADD_ATTR: ['style', 'class', 'data-echarts-config'],
    }) as string;
  }, []);

  const loadHtmlToIframe = useCallback(
    (iframe: HTMLIFrameElement | null, markdownContent: string) => {
      if (!iframe) return;
      if (!markdownContent) {
        iframe.srcdoc =
          '<html><body style="padding:20px;color:#666;">暂无报告内容</body></html>';
        return;
      }
      const html = buildReportHtml(markdownContent);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const onLoad = () => {
        URL.revokeObjectURL(url);
        iframe.removeEventListener('load', onLoad);
      };
      iframe.addEventListener('load', onLoad);
      iframe.src = url;
    },
    []
  );

  const renderedContent = renderMarkdown(content);

  useEffect(() => {
    if (format === 'markdown' && reportBodyRef.current) {
      renderECharts(reportBodyRef.current);
    }
  }, [renderedContent, format, renderECharts]);

  useEffect(() => {
    if (format === 'html') {
      loadHtmlToIframe(htmlIframeRef.current, content);
    }
  }, [format, content, loadHtmlToIframe]);

  useEffect(() => {
    if (store.showReportFullscreen && store.reportFormat === 'html') {
      loadHtmlToIframe(fullscreenIframeRef.current, store.fullscreenReportContent);
    }
  }, [store.showReportFullscreen, store.reportFormat, store.fullscreenReportContent, store.fullscreenReportTimestamp, loadHtmlToIframe]);

  const downloadMd = useCallback(() => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content]);

  const downloadHtml = useCallback(() => {
    if (!content) return;
    try {
      const html = buildReportHtml(content);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('下载HTML报告失败', e);
    }
  }, [content]);

  const handleCloseFullscreen = () => {
    store.closeReportFullscreen();
  };

  return (
    <div className="markdown-report">
      {/* Header */}
      <div className="report-header">
        <div className="report-title">
          <FileTextOutlined className="title-icon" />
          <Typography.Text strong style={{ fontSize: '13.5px', color: '#1e293b' }}>
            报告已生成
          </Typography.Text>
          <Space.Compact className="format-toggle">
            <Button
              type={format === 'markdown' ? 'primary' : 'default'}
              size="small"
              onClick={() => setFormat('markdown')}
            >
              Markdown
            </Button>
            <Button
              type={format === 'html' ? 'primary' : 'default'}
              size="small"
              onClick={() => setFormat('html')}
            >
              HTML
            </Button>
          </Space.Compact>
        </div>
        <Space size="small" className="report-actions">
          <Tooltip title="下载 MD">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={downloadMd}
            >
              MD
            </Button>
          </Tooltip>
          <Tooltip title="下载 HTML">
            <Button
              size="small"
              type="default"
              style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f', color: '#389e0d' }}
              icon={<DownloadOutlined />}
              onClick={downloadHtml}
            >
              HTML
            </Button>
          </Tooltip>
          <Tooltip title="全屏查看">
            <Button
              size="small"
              icon={<FullscreenOutlined />}
              onClick={() => store.openReportFullscreen(content)}
            />
          </Tooltip>
        </Space>
      </div>

      {/* Body */}
      <div ref={reportBodyRef} className="report-body">
        {format === 'markdown' ? (
          <div
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        ) : (
          <iframe
            ref={htmlIframeRef}
            className="html-iframe"
            sandbox="allow-scripts"
            title="HTML报告预览"
          />
        )}
      </div>

      {/* Fullscreen dialog */}
      <Modal
        open={store.showReportFullscreen}
        onCancel={handleCloseFullscreen}
        onOk={handleCloseFullscreen}
        cancelText="关闭"
        okText="确定"
        width="100vw"
        style={{ top: 0, maxWidth: '100vw', padding: 0 }}
        closeIcon={<CloseOutlined />}
        className="fullscreen-modal"
        centered={false}
      >
        <div className="fullscreen-header">
          <Typography.Text strong style={{ fontSize: '14px' }}>
            {store.reportFormat === 'markdown' ? 'Markdown 报告' : 'HTML 报告'}
          </Typography.Text>
          <Space.Compact size="small">
            <Button
              type={store.reportFormat === 'markdown' ? 'primary' : 'default'}
              size="small"
              onClick={() => store.setReportFormat('markdown')}
            >
              Markdown
            </Button>
            <Button
              type={store.reportFormat === 'html' ? 'primary' : 'default'}
              size="small"
              onClick={() => store.setReportFormat('html')}
            >
              HTML
            </Button>
          </Space.Compact>
        </div>
        <div className="fullscreen-content">
          {store.reportFormat === 'markdown' ? (
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(store.fullscreenReportContent),
              }}
            />
          ) : (
            <iframe
              ref={fullscreenIframeRef}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '600px',
                border: 'none',
              }}
              sandbox="allow-scripts"
              title="HTML报告预览"
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ChatMarkdownReport;
