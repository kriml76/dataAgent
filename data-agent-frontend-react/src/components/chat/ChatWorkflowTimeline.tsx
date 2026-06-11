import React, { useState, useMemo, useCallback } from 'react';
import { PieChartOutlined, UpOutlined, DownOutlined, RocketOutlined } from '@ant-design/icons';
import hljs from 'highlight.js/lib/core';
import Sql from 'highlight.js/lib/languages/sql';
import Python from 'highlight.js/lib/languages/python';
import Json from 'highlight.js/lib/languages/json';
import JavaScript from 'highlight.js/lib/languages/javascript';
import DOMPurify from 'dompurify';
import ChatResultSet from './ChatResultSet';
import type { ResultData } from './charts/types';
import './ChatWorkflowTimeline.css';

hljs.registerLanguage('sql', Sql);
hljs.registerLanguage('json', Json);
hljs.registerLanguage('python', Python);
hljs.registerLanguage('javascript', JavaScript);

export interface GraphNodeResponse {
  nodeName: string;
  text: string;
  textType?: string;
  error?: boolean;
  threadId?: string;
}

interface ChatWorkflowTimelineProps {
  nodeBlocks: GraphNodeResponse[][];
  completed?: boolean;
}

interface NodeDef {
  nodeName: string;
  label: string;
  icon: string;
}

const NODE_LABEL_MAP: Record<string, NodeDef> = {
  IntentRecognitionNode: {
    nodeName: 'IntentRecognitionNode',
    label: '意图识别',
    icon: '🔍',
  },
  QueryEnhanceNode: {
    nodeName: 'QueryEnhanceNode',
    label: '查询增强',
    icon: '📝',
  },
  SchemaRecallNode: {
    nodeName: 'SchemaRecallNode',
    label: 'Schema 召回',
    icon: '🗄️',
  },
  FeasibilityAssessmentNode: {
    nodeName: 'FeasibilityAssessmentNode',
    label: '可行性评估',
    icon: '✅',
  },
  EvidenceRecallNode: {
    nodeName: 'EvidenceRecallNode',
    label: '证据召回',
    icon: '📁',
  },
  TableRelationNode: {
    nodeName: 'TableRelationNode',
    label: '表关系分析',
    icon: '🔗',
  },
  PlannerNode: {
    nodeName: 'PlannerNode',
    label: '制定计划',
    icon: '📋',
  },
  HumanFeedbackNode: {
    nodeName: 'HumanFeedbackNode',
    label: '人工反馈',
    icon: '👤',
  },
  PlanExecutorNode: {
    nodeName: 'PlanExecutorNode',
    label: '执行计划',
    icon: '▶️',
  },
  SqlGenerateNode: {
    nodeName: 'SqlGenerateNode',
    label: 'SQL 生成',
    icon: '💻',
  },
  SemanticConsistencyNode: {
    nodeName: 'SemanticConsistencyNode',
    label: '语义一致性校验',
    icon: '🔠',
  },
  SqlExecuteNode: {
    nodeName: 'SqlExecuteNode',
    label: 'SQL 执行',
    icon: '🗄️',
  },
  PythonGenerateNode: {
    nodeName: 'PythonGenerateNode',
    label: 'Python 生成',
    icon: '🐍',
  },
  PythonAnalyzeNode: {
    nodeName: 'PythonAnalyzeNode',
    label: 'Python 分析',
    icon: '📈',
  },
  PythonExecuteNode: {
    nodeName: 'PythonExecuteNode',
    label: 'Python 执行',
    icon: '▶️',
  },
  ReportGeneratorNode: {
    nodeName: 'ReportGeneratorNode',
    label: '报告生成',
    icon: '📊',
  },
};

interface TimelineStep extends NodeDef {
  status: 'pending' | 'active' | 'done';
  block: GraphNodeResponse[];
  expanded: boolean;
  isReport: boolean;
}

const CODE_TEXT_TYPES = new Set(['SQL', 'PYTHON', 'JSON']);

const SANITIZE_OPTIONS = {
  ADD_TAGS: ['pre', 'code', 'div'],
  ADD_ATTR: ['class', 'style'],
};

function safeParseJson(content: string): ResultData | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderCode(block: GraphNodeResponse[]): string {
  const lang = (block[0]?.textType || 'text').toLowerCase();
  const code = block.map((n) => n.text).join('');
  try {
    const h = hljs.highlight(code, { language: lang });
    return DOMPurify.sanitize(
      `<pre class="tl-code"><code class="hljs ${lang}">${h.value}</code></pre>`,
      SANITIZE_OPTIONS
    ) as string;
  } catch {
    return DOMPurify.sanitize(
      `<pre class="tl-code"><code>${escapeHtml(code)}</code></pre>`,
      SANITIZE_OPTIONS
    ) as string;
  }
}

function tryExtractJson(text: string): { before: string; json: string; after: string } | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.substring(start, end + 1);
  try {
    JSON.parse(candidate);
    return {
      before: text.substring(0, start).trim(),
      json: candidate,
      after: text.substring(end + 1).trim(),
    };
  } catch {
    return null;
  }
}

function renderTextWithJsonDetection(block: GraphNodeResponse[]): string {
  const fullText = block.map((n) => n.text).join('');

  const extracted = tryExtractJson(fullText);
  if (extracted) {
    const parts: string[] = [];
    if (extracted.before) {
      parts.push(
        `<div class="text-body">${escapeHtml(extracted.before).replace(/\n/g, '<br>')}</div>`
      );
    }
    try {
      const formatted = JSON.stringify(JSON.parse(extracted.json), null, 2);
      const h = hljs.highlight(formatted, { language: 'json' });
      parts.push(`<pre class="tl-code"><code class="hljs json">${h.value}</code></pre>`);
    } catch {
      parts.push(`<pre class="tl-code"><code>${escapeHtml(extracted.json)}</code></pre>`);
    }
    if (extracted.after) {
      parts.push(
        `<div class="text-body">${escapeHtml(extracted.after).replace(/\n/g, '<br>')}</div>`
      );
    }
    return DOMPurify.sanitize(parts.join(''), SANITIZE_OPTIONS) as string;
  }

  return DOMPurify.sanitize(
    `<div class="text-body">${escapeHtml(fullText).replace(/\n/g, '<br>')}</div>`,
    SANITIZE_OPTIONS
  ) as string;
}

function isPureCodeBlock(block: GraphNodeResponse[]): boolean {
  return block.length > 0 && block.every((n) => CODE_TEXT_TYPES.has(n.textType || ''));
}

const ChatWorkflowTimeline: React.FC<ChatWorkflowTimelineProps> = ({ nodeBlocks, completed = false }) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [allExpandedState, setAllExpandedState] = useState(false);

  const getDefaultExpanded = useCallback((nodeName: string): boolean => {
    if (!completed) return true;
    if (nodeName === 'ReportGeneratorNode') return true;
    return false;
  }, [completed]);

  const timelineSteps = useMemo<TimelineStep[]>(() => {
    const seen = new Set<string>();
    const orderedNodeNames: string[] = [];
    for (const block of nodeBlocks) {
      const name = block[0]?.nodeName;
      if (name && !seen.has(name)) {
        seen.add(name);
        orderedNodeNames.push(name);
      }
    }

    if (orderedNodeNames.length === 0) return [];
    const lastIdx = orderedNodeNames.length - 1;

    return orderedNodeNames.map((nodeName, idx) => {
      const def = NODE_LABEL_MAP[nodeName] || {
        nodeName,
        label: nodeName,
        icon: '⚡',
      };
      const block = nodeBlocks.find((b) => b[0]?.nodeName === nodeName) || [];
      const isReport = nodeName === 'ReportGeneratorNode';

      let status: 'pending' | 'active' | 'done' = 'pending';
      if (completed) {
        status = 'done';
      } else {
        status = idx < lastIdx ? 'done' : 'active';
      }

      return {
        ...def,
        status,
        block,
        expanded: expandedSteps[nodeName] ?? getDefaultExpanded(nodeName),
        isReport,
      };
    });
  }, [nodeBlocks, completed, expandedSteps, getDefaultExpanded]);

  const allExpanded = useMemo(() => {
    if (timelineSteps.length === 0) return false;
    return timelineSteps.some((s) => s.expanded);
  }, [timelineSteps]);

  const toggleAll = () => {
    const shouldExpand = !allExpanded;
    const newExpanded: Record<string, boolean> = {};
    for (const step of timelineSteps) {
      newExpanded[step.nodeName] = shouldExpand;
    }
    setExpandedSteps(newExpanded);
    setAllExpandedState(shouldExpand);
  };

  const toggleStep = (nodeName: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [nodeName]: !(prev[nodeName] ?? getDefaultExpanded(nodeName)),
    }));
  };

  const getDotColor = (status: string): string => {
    if (status === 'done') return '#22c55e';
    if (status === 'active') return '#3b82f6';
    return '#cbd5e1';
  };

  const renderStepContent = (step: TimelineStep) => {
    if (step.block[0]?.textType === 'RESULT_SET' && step.block[0]?.text) {
      return <ChatResultSet data={safeParseJson(step.block[0].text)} pageSize={10} />;
    }

    if (step.isReport) {
      return (
        <div className="text-body report-brief">
          <PieChartOutlined style={{ color: '#16a34a', marginRight: 8 }} />
          {step.status === 'active' ? (
            <span>正在生成报告，内容在下方实时展示...</span>
          ) : (
            <span>报告已生成完毕，查看下方报告卡片</span>
          )}
        </div>
      );
    }

    if (isPureCodeBlock(step.block)) {
      return <div dangerouslySetInnerHTML={{ __html: renderCode(step.block) }} />;
    }

    return <div dangerouslySetInnerHTML={{ __html: renderTextWithJsonDetection(step.block) }} />;
  };

  return (
    <div className="workflow-timeline">
      {/* Title + global toggle */}
      <div className="timeline-title-bar">
        <div className="timeline-title">
          <RocketOutlined style={{ color: '#3b82f6', marginRight: 8 }} />
          任务开始
        </div>
        <button className="toggle-all-btn" onClick={toggleAll}>
          {allExpanded ? <UpOutlined /> : <DownOutlined />}
          {allExpanded ? '折叠全部' : '展开全部'}
        </button>
      </div>

      <div className="timeline-container">
        {timelineSteps.map((step, idx) => (
          <div key={step.nodeName} className="timeline-item">
            <div className="timeline-dot-container">
              <div
                className="timeline-dot"
                style={{ backgroundColor: getDotColor(step.status) }}
              >
                {step.status === 'done' ? (
                  <span className="dot-check">✓</span>
                ) : step.status === 'active' ? (
                  <span className="dot-active" />
                ) : null}
              </div>
              {idx < timelineSteps.length - 1 && (
                <div
                  className="timeline-line"
                  style={{ backgroundColor: step.status === 'done' ? '#22c55e' : '#e2e8f0' }}
                />
              )}
            </div>

            <div className="timeline-content">
              {/* Step header */}
              <div className="step-header" onClick={() => toggleStep(step.nodeName)}>
                <div className="step-header-left">
                  <span className="step-icon">{step.icon}</span>
                  <span className="step-label">{step.label}</span>
                  {step.status === 'active' && (
                    <span className="step-badge active">
                      <span className="badge-dot" />
                      进行中
                    </span>
                  )}
                  {step.status === 'done' && (
                    <span className="step-badge done">完成</span>
                  )}
                </div>
                <span className="step-toggle">
                  {step.expanded ? <UpOutlined /> : <DownOutlined />}
                </span>
              </div>

              {/* Collapsible content */}
              {step.expanded && (
                <div className={`step-content ${step.status === 'done' && !step.isReport ? 'is-muted' : ''}`}>
                  {renderStepContent(step)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatWorkflowTimeline;
