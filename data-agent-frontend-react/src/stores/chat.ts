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

import { create } from 'zustand';
import chatService from '@/services/chat';
import graphService, { TextType } from '@/services/graph';
import agentDatasourceService from '@/services/agentDatasource';
import modelConfigService, { type ModelConfig } from '@/services/modelConfig';
import datasourceService, { type Datasource as DsDatasource } from '@/services/datasource';

export interface Datasource extends DsDatasource {
  isActive?: boolean;
}

export interface ChatSession {
  id: string;
  agentId: number;
  title: string;
  status: string;
  isPinned: boolean;
  userId?: number;
  createTime?: Date;
  updateTime?: Date;
}

export interface ExtendedChatSession extends ChatSession {
  editing?: boolean;
  editingTitle?: string;
}

export interface ChatMessage {
  id?: number;
  sessionId: string;
  role: string;
  content: string;
  messageType: string;
  metadata?: string;
  createTime?: Date;
  titleNeeded?: boolean;
}

export interface ChatRequestOptions {
  humanFeedback: boolean;
  nl2sqlOnly: boolean;
  showSqlResults: boolean;
  pageSize: number;
}

interface GraphNodeResponse {
  nodeName: string;
  text: string;
  textType?: string;
  error?: boolean;
  threadId?: string;
}

interface GraphRequest {
  agentId: string;
  query: string;
  humanFeedback: boolean;
  nl2sqlOnly: boolean;
  rejectedPlan: boolean;
  humanFeedbackContent?: string;
  threadId?: string;
}

interface SessionState {
  isStreaming: boolean;
  nodeBlocks: GraphNodeResponse[][];
  lastRequest?: GraphRequest;
  htmlReportContent: string;
  htmlReportSize: number;
  markdownReportContent: string;
  closeStream?: (() => void) | null;
}

interface ChatStore {
  // State
  sessions: ExtendedChatSession[];
  currentSession: ChatSession | null;
  currentMessages: ChatMessage[];
  isStreaming: boolean;
  nodeBlocks: GraphNodeResponse[][];
  showHumanFeedback: boolean;
  lastRequest: GraphRequest | null;
  feedbackContent: string;
  requestOptions: ChatRequestOptions;
  reportFormat: 'markdown' | 'html';
  showReportFullscreen: boolean;
  fullscreenReportContent: string;
  streamingReportContent: string;
  isReportStreaming: boolean;
  currentAgentId: number | undefined;
  chatSidebarCollapsed: boolean;
  activeChatModel: string;
  currentAgentName: string;
  currentAgentAvatar: string;
  currentAgentDescription: string;
  allDatasources: Datasource[];
  activeDatasource: Datasource | null;
  chatModels: ModelConfig[];
  activeModelConfig: ModelConfig | null;

  // Actions
  connectSessionStream: (agentId: number) => void;
  disconnectSessionStream: () => void;
  loadSessions: (agentId: number) => Promise<void>;
  createNewSession: (agentId: number) => Promise<ChatSession>;
  selectSession: (session: ChatSession) => Promise<void>;
  renameSession: (session: ExtendedChatSession, newTitle: string) => Promise<void>;
  pinSession: (session: ChatSession) => Promise<void>;
  removeSession: (session: ChatSession) => Promise<void>;
  clearSessions: (agentId: number) => Promise<void>;
  sendMessage: (query: string) => Promise<void>;
  stopStreaming: () => Promise<void>;
  submitFeedback: (rejected: boolean, content: string) => Promise<void>;
  openReportFullscreen: (content: string) => void;
  downloadHtmlReport: (content: string) => Promise<void>;
  switchDatasource: (ds: Datasource) => Promise<void>;
  switchModel: (modelId: number) => Promise<void>;
  setChatSidebarCollapsed: (collapsed: boolean) => void;
  setReportFormat: (format: 'markdown' | 'html') => void;
}

// Session state manager
const sessionStates = new Map<string, SessionState>();

function getSessionState(sessionId: string): SessionState {
  if (!sessionStates.has(sessionId)) {
    sessionStates.set(sessionId, {
      isStreaming: false,
      nodeBlocks: [],
      htmlReportContent: '',
      htmlReportSize: 0,
      markdownReportContent: '',
      closeStream: null,
    });
  }
  return sessionStates.get(sessionId)!;
}

function syncStateToView(sessionId: string, set: any): void {
  const sessionState = getSessionState(sessionId);
  set({
    isStreaming: sessionState.isStreaming,
    nodeBlocks: [...sessionState.nodeBlocks],
    streamingReportContent: sessionState.markdownReportContent,
    isReportStreaming: sessionState.isStreaming && sessionState.markdownReportContent.length > 0,
  });
}

function saveViewToState(sessionId: string, get: any): void {
  const sessionState = getSessionState(sessionId);
  sessionState.isStreaming = get().isStreaming;
  sessionState.nodeBlocks = [...get().nodeBlocks];
  sessionState.markdownReportContent = get().streamingReportContent;
}

function deleteSessionState(sessionId: string): void {
  sessionStates.delete(sessionId);
}

// SSE session stream refs
let sessionEventSource: EventSource | null = null;
let sessionReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isStoreActive = true;

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  sessions: [],
  currentSession: null,
  currentMessages: [],
  isStreaming: false,
  nodeBlocks: [],
  showHumanFeedback: false,
  lastRequest: null,
  feedbackContent: '',
  requestOptions: {
    humanFeedback: false,
    nl2sqlOnly: false,
    showSqlResults: false,
    pageSize: 20,
  },
  reportFormat: 'markdown',
  showReportFullscreen: false,
  fullscreenReportContent: '',
  streamingReportContent: '',
  isReportStreaming: false,
  currentAgentId: undefined,
  chatSidebarCollapsed: false,
  activeChatModel: '',
  currentAgentName: '',
  currentAgentAvatar: '',
  currentAgentDescription: '',
  allDatasources: [],
  activeDatasource: null,
  chatModels: [],
  activeModelConfig: null,

  // Actions
  connectSessionStream: (agentId: number) => {
    if (sessionReconnectTimer) {
      clearTimeout(sessionReconnectTimer);
      sessionReconnectTimer = null;
    }
    if (sessionEventSource) sessionEventSource.close();

    const source = new EventSource(`/api/agent/${agentId}/sessions/stream`);
    source.addEventListener('title-updated', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent<string>).data) as {
          sessionId: string;
          title: string;
        };
        set((state) => {
          const target = state.sessions.find((s) => s.id === data.sessionId);
          if (target) {
            target.title = data.title;
            (target as ExtendedChatSession).editingTitle = data.title;
          }
          return {
            sessions: [...state.sessions],
            currentSession:
              state.currentSession?.id === data.sessionId
                ? { ...state.currentSession, title: data.title }
                : state.currentSession,
          };
        });
      } catch {
        /* ignore */
      }
    });
    source.onerror = () => {
      source.close();
      sessionEventSource = null;
      if (isStoreActive)
        sessionReconnectTimer = setTimeout(
          () => get().connectSessionStream(agentId),
          3000,
        );
    };
    sessionEventSource = source;
  },

  disconnectSessionStream: () => {
    isStoreActive = false;
    if (sessionReconnectTimer) clearTimeout(sessionReconnectTimer);
    if (sessionEventSource) {
      sessionEventSource.close();
      sessionEventSource = null;
    }
  },

  loadSessions: async (agentId: number) => {
    try {
      const sessions = await chatService.getAgentSessions(agentId);
      set({ sessions, currentAgentId: agentId });

      if (sessions.length > 0) {
        await get().selectSession(sessions[0]);
      } else {
        await get().createNewSession(agentId);
      }

      // Load global datasources (active)
      try {
        const list = await datasourceService.getAllDatasource('active');
        set({
          allDatasources: list,
          activeDatasource: list[0] || null,
        });
      } catch {
        /* ignore */
      }

      // Load chat models
      try {
        const models = await modelConfigService.list();
        const chatModelsList = models.filter((m: ModelConfig) => m.modelType === 'CHAT');
        const active = chatModelsList.find((m: ModelConfig) => m.isActive);
        set({
          chatModels: chatModelsList,
          activeModelConfig: active || null,
          activeChatModel: active?.modelName || '',
        });
      } catch {
        /* ignore */
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  },

  createNewSession: async (agentId: number) => {
    try {
      const newSession = await chatService.createSession(agentId, '新会话');
      set((state) => ({
        sessions: [newSession, ...state.sessions],
      }));
      await get().selectSession(newSession);
      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  },

  selectSession: async (session: ChatSession) => {
    const { currentSession: prevSession } = get();

    // Save current session state
    if (prevSession) {
      saveViewToState(prevSession.id, get);
    }

    set({ currentSession: session });

    // Sync state to view
    syncStateToView(session.id, set);

    try {
      const messages = await chatService.getSessionMessages(session.id);
      set({ currentMessages: messages });
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  },

  renameSession: async (session: ExtendedChatSession, newTitle: string) => {
    try {
      await chatService.renameSession(session.id, newTitle);
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === session.id ? { ...s, title: newTitle, editing: false } : s
        ),
        currentSession:
          state.currentSession?.id === session.id
            ? { ...state.currentSession, title: newTitle }
            : state.currentSession,
      }));
    } catch (error) {
      console.error('Failed to rename session:', error);
    }
  },

  pinSession: async (session: ChatSession) => {
    try {
      await chatService.pinSession(session.id, !session.isPinned);
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === session.id ? { ...s, isPinned: !s.isPinned } : s
        ),
      }));
    } catch (error) {
      console.error('Failed to pin session:', error);
    }
  },

  removeSession: async (session: ChatSession) => {
    try {
      await chatService.deleteSession(session.id);
      deleteSessionState(session.id);

      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== session.id),
        ...(state.currentSession?.id === session.id
          ? {
              currentSession: null,
              currentMessages: [],
              isStreaming: false,
              nodeBlocks: [],
            }
          : {}),
      }));
    } catch (error) {
      console.error('Failed to remove session:', error);
    }
  },

  clearSessions: async (agentId: number) => {
    try {
      await chatService.clearAgentSessions(agentId);

      get().sessions.forEach((s) => deleteSessionState(s.id));

      set({
        sessions: [],
        currentSession: null,
        currentMessages: [],
        isStreaming: false,
        nodeBlocks: [],
      });
    } catch (error) {
      console.error('Failed to clear sessions:', error);
    }
  },

  sendMessage: async (query: string) => {
    const { currentSession, currentAgentId, requestOptions } = get();
    if (!currentSession) return;

    const needsTitle =
      !currentSession.title || currentSession.title === '新会话';

    const userMessage: ChatMessage = {
      sessionId: currentSession.id,
      role: 'user',
      content: query,
      messageType: 'text',
      titleNeeded: needsTitle,
    };

    try {
      const saved = await chatService.saveMessage(currentSession.id, userMessage);
      set((state) => ({
        currentMessages: [...state.currentMessages, saved],
      }));

      const sessionState = getSessionState(currentSession.id);
      const request: GraphRequest = {
        agentId: String(currentAgentId || ''),
        query,
        humanFeedback: requestOptions.humanFeedback,
        nl2sqlOnly: requestOptions.nl2sqlOnly,
        rejectedPlan: false,
        humanFeedbackContent: undefined,
        threadId: sessionState.lastRequest?.threadId,
      };

      await _sendGraphRequest(set, get, request, false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  },

  stopStreaming: async () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const sessionId = currentSession.id;
    const sessionState = getSessionState(sessionId);

    if (sessionState.closeStream) {
      sessionState.closeStream();
      sessionState.closeStream = null;
    }

    sessionState.isStreaming = false;
    sessionState.nodeBlocks = [];

    // Save warning message
    const warningMsg: ChatMessage = {
      sessionId,
      role: 'assistant',
      content: '用户已终止本次对话。',
      messageType: 'warning',
    };

    try {
      await chatService.saveMessage(sessionId, warningMsg);
      const messages = await chatService.getSessionMessages(sessionId);
      set({
        isStreaming: false,
        nodeBlocks: [],
        isReportStreaming: false,
        streamingReportContent: '',
        currentMessages: messages,
      });
    } catch (error) {
      console.error('Failed to stop streaming:', error);
    }
  },

  submitFeedback: async (rejected: boolean, content: string) => {
    const { lastRequest } = get();
    if (!lastRequest) return;

    set({
      showHumanFeedback: false,
      feedbackContent: '',
    });

    const newRequest: GraphRequest = {
      ...lastRequest,
      rejectedPlan: rejected,
      humanFeedbackContent: content || 'Accept',
    };

    await _sendGraphRequest(set, get, newRequest, rejected);
  },

  openReportFullscreen: (content: string) => {
    set({
      fullscreenReportContent: content,
      showReportFullscreen: true,
    });
  },

  downloadHtmlReport: async (content: string) => {
    const { currentSession } = get();
    if (!currentSession) return;

    try {
      await chatService.downloadHtmlReport(currentSession.id, content);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  },

  switchDatasource: async (ds: Datasource) => {
    const { currentAgentId, activeDatasource } = get();
    const nextDatasourceId = ds?.id;

    if (!currentAgentId || !nextDatasourceId) {
      set({ activeDatasource: ds });
      return;
    }

    if (activeDatasource?.id === nextDatasourceId) {
      set({ activeDatasource: { ...ds, isActive: true } });
      return;
    }

    try {
      await agentDatasourceService.addDatasourceToAgent(
        String(currentAgentId),
        nextDatasourceId,
      );
      set((state) => ({
        allDatasources: state.allDatasources.map((item) => ({
          ...item,
          isActive: item.id === nextDatasourceId,
        })),
        activeDatasource: { ...ds, isActive: true },
      }));
    } catch (e) {
      console.error('切换数据源失败', e);
    }
  },

  switchModel: async (modelId: number) => {
    try {
      await modelConfigService.activate(modelId);
      const models = await modelConfigService.list();
      const chatModelsList = models.filter((m) => m.modelType === 'CHAT');
      const active = chatModelsList.find((m) => m.isActive);
      set({
        chatModels: chatModelsList,
        activeModelConfig: active || null,
        activeChatModel: active?.modelName || '',
      });
    } catch (e) {
      console.error('切换模型失败', e);
    }
  },

  setChatSidebarCollapsed: (collapsed: boolean) => {
    set({ chatSidebarCollapsed: collapsed });
  },

  setReportFormat: (format: 'markdown' | 'html') => {
    set({ reportFormat: format });
  },
}));

// Private: Send graph request with streaming
async function _sendGraphRequest(
  set: any,
  get: any,
  request: GraphRequest,
  _rejectedPlan: boolean,
) {
  const { currentSession, requestOptions } = get();
  if (!currentSession) return;

  const sessionId = currentSession.id;
  const sessionTitle = currentSession.title;
  const sessionState = getSessionState(sessionId);

  set({
    lastRequest: request,
    isStreaming: true,
    nodeBlocks: [],
  });

  sessionState.isStreaming = true;
  sessionState.nodeBlocks = [];
  sessionState.lastRequest = request;
  sessionState.htmlReportContent = '';
  sessionState.htmlReportSize = 0;
  sessionState.markdownReportContent = '';

  set({
    streamingReportContent: '',
    isReportStreaming: false,
  });

  let currentNodeName: string | null = null;
  let currentBlockIndex = -1;

  let viewSyncRafId: number | null = null;
  function scheduleViewSync() {
    if (viewSyncRafId) return;
    viewSyncRafId = requestAnimationFrame(() => {
      viewSyncRafId = null;
      if (get().currentSession?.id === sessionId) {
        set({ nodeBlocks: [...sessionState.nodeBlocks] });
      }
    });
  }

  // Throttle report content pushes: batch SSE chunks and push at most
  // once every ~80ms. This prevents excessive re-renders while keeping
  // the typewriter animation looking smooth on the frontend.
  let reportSyncTimer: ReturnType<typeof setTimeout> | null = null;
  const REPORT_SYNC_INTERVAL = 80; // ms
  function scheduleReportSync() {
    if (reportSyncTimer) return;
    reportSyncTimer = setTimeout(() => {
      reportSyncTimer = null;
      if (get().currentSession?.id === sessionId) {
        set({
          isReportStreaming: true,
          streamingReportContent: sessionState.markdownReportContent,
        });
      }
    }, REPORT_SYNC_INTERVAL);
  }

  function flushPendingSync() {
    if (viewSyncRafId) {
      cancelAnimationFrame(viewSyncRafId);
      viewSyncRafId = null;
    }
    if (reportSyncTimer) {
      clearTimeout(reportSyncTimer);
      reportSyncTimer = null;
    }
    if (get().currentSession?.id === sessionId) {
      set({ nodeBlocks: [...sessionState.nodeBlocks] });
      if (sessionState.markdownReportContent) {
        set({
          isReportStreaming: true,
          streamingReportContent: sessionState.markdownReportContent,
        });
      }
    }
  }

  const closeStream = await graphService.streamSearch(
    request,
    async (response: GraphNodeResponse) => {
      if (response.error) return;
      if (sessionState.lastRequest)
        sessionState.lastRequest.threadId = response.threadId;

      if (response.nodeName === 'ReportGeneratorNode') {
        const isNewNode =
          currentNodeName === null || response.nodeName !== currentNodeName;
        if (isNewNode) {
          sessionState.nodeBlocks.push([{ ...response }]);
          currentBlockIndex = sessionState.nodeBlocks.length - 1;
          currentNodeName = response.nodeName;
        }
        if (response.textType === 'HTML') {
          sessionState.htmlReportContent += response.text;
          sessionState.htmlReportSize = sessionState.htmlReportContent.length;
          const rn = sessionState.nodeBlocks.find(
            (b) =>
              b.length > 0 &&
              b[0].nodeName === 'ReportGeneratorNode' &&
              b[0].textType === 'HTML',
          );
          if (rn)
            rn[0].text = `正在收集HTML报告... 已收集 ${sessionState.htmlReportSize} 字节`;
          else
            sessionState.nodeBlocks.push([
            { ...response, text: `正在收集HTML报告...` },
          ]);
        } else if (response.textType === 'MARK_DOWN') {
          sessionState.markdownReportContent += response.text;
          scheduleReportSync();
          const rn = sessionState.nodeBlocks.find(
            (b) =>
              b.length > 0 &&
              b[0].nodeName === 'ReportGeneratorNode' &&
              b[0].textType === 'MARK_DOWN',
          );
          if (rn) rn[0].text = sessionState.markdownReportContent;
          else
            sessionState.nodeBlocks.push([
            { ...response, text: response.text },
          ]);
        }
      } else if (response.textType === TextType.RESULT_SET) {
        currentNodeName = 'result_set';
        sessionState.nodeBlocks.push([{ ...response }]);
        currentBlockIndex = sessionState.nodeBlocks.length - 1;
      } else {
        const isNewNode =
          currentNodeName === null || response.nodeName !== currentNodeName;
        if (isNewNode) {
          sessionState.nodeBlocks.push([{ ...response }]);
          currentBlockIndex = sessionState.nodeBlocks.length - 1;
          currentNodeName = response.nodeName;
        } else {
          const currentBlock =
            currentBlockIndex >= 0
              ? sessionState.nodeBlocks[currentBlockIndex]
              : undefined;
          if (currentBlock) {
            currentBlock.push({ ...response });
          } else {
            sessionState.nodeBlocks.push([{ ...response }]);
            currentBlockIndex = sessionState.nodeBlocks.length - 1;
            currentNodeName = response.nodeName;
          }
        }
      }

      scheduleViewSync();
    },
    async (error: Error) => {
      console.error('Stream error:', error);
      flushPendingSync();

      if (sessionState.nodeBlocks.length > 0) {
        const msg: ChatMessage = {
          sessionId,
          role: 'assistant',
          content: JSON.stringify(sessionState.nodeBlocks),
          messageType: 'timeline',
        };
        await chatService
          .saveMessage(sessionId, msg)
          .catch((e) => console.error(e));
      }

      // Save error message
      const errorMsg: ChatMessage = {
        sessionId,
        role: 'assistant',
        content: error.message || '请求失败，请检查网络连接并重试。',
        messageType: 'error',
      };
      await chatService
        .saveMessage(sessionId, errorMsg)
        .catch((e) => console.error(e));

      sessionState.isStreaming = false;
      sessionState.closeStream = null;
      currentNodeName = null;
      if (get().currentSession?.id === sessionId) {
        const messages = await chatService.getSessionMessages(sessionId);
        set({
          isStreaming: false,
          isReportStreaming: false,
          streamingReportContent: '',
          currentMessages: messages,
        });
      }
    },
    async () => {
      flushPendingSync();

      if (sessionState.nodeBlocks.length > 0) {
        const timelineMsg: ChatMessage = {
          sessionId,
          role: 'assistant',
          content: JSON.stringify(sessionState.nodeBlocks),
          messageType: 'timeline',
        };
        const savedTimeline = await chatService
          .saveMessage(sessionId, timelineMsg)
          .catch((e) => {
            console.error(e);
            return null;
          });
        if (savedTimeline && get().currentSession?.id === sessionId)
          set((state: any) => ({
            currentMessages: [...state.currentMessages, savedTimeline],
          }));
      }

      if (requestOptions.humanFeedback && _rejectedPlan) {
        set({ showHumanFeedback: true });
      } else {
        sessionState.isStreaming = false;
        if (get().currentSession?.id === sessionId) set({ isStreaming: false });
      }

      if (get().currentSession?.id === sessionId) {
        set({
          isReportStreaming: false,
          streamingReportContent: '',
        });
      }

      currentNodeName = null;
      closeStream();
      if (get().currentSession?.id === sessionId) {
        const messages = await chatService.getSessionMessages(sessionId);
        set({
          currentMessages: messages,
          nodeBlocks: [],
        });
      }
      console.log(`会话[${sessionTitle}]处理完成`);
    },
  );
  sessionState.closeStream = closeStream;
}
