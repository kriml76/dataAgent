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
// Session state manager (simplified version)
const sessionStates = new Map();
function getSessionState(sessionId) {
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
    return sessionStates.get(sessionId);
}
function syncStateToView(sessionId, state) {
    const sessionState = getSessionState(sessionId);
    if (state.isStreaming)
        state.isStreaming.current = sessionState.isStreaming;
    if (state.nodeBlocks)
        state.nodeBlocks.current = [...sessionState.nodeBlocks];
}
function saveViewToState(sessionId, state) {
    const sessionState = getSessionState(sessionId);
    if (state.isStreaming)
        sessionState.isStreaming = state.isStreaming.current;
    if (state.nodeBlocks)
        sessionState.nodeBlocks = [...state.nodeBlocks.current];
}
function deleteSessionState(sessionId) {
    sessionStates.delete(sessionId);
}
export const useChatStore = create((set, get) => ({
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
    connectSessionStream: (agentId) => {
        console.log('Connect session stream for agent:', agentId);
        // TODO: Implement SSE connection
    },
    disconnectSessionStream: () => {
        console.log('Disconnect session stream');
        // TODO: Close SSE connection
    },
    loadSessions: async (agentId) => {
        try {
            const sessions = await chatService.getAgentSessions(agentId);
            set({ sessions });
            if (sessions.length > 0) {
                await get().selectSession(sessions[0]);
            }
            else {
                await get().createNewSession(agentId);
            }
            // TODO: Load datasources and models
        }
        catch (error) {
            console.error('Failed to load sessions:', error);
        }
    },
    createNewSession: async (agentId) => {
        try {
            const newSession = await chatService.createSession(agentId, '新会话');
            set((state) => ({
                sessions: [newSession, ...state.sessions],
            }));
            await get().selectSession(newSession);
            return newSession;
        }
        catch (error) {
            console.error('Failed to create session:', error);
            throw error;
        }
    },
    selectSession: async (session) => {
        const { currentSession } = get();
        // Save current session state
        if (currentSession) {
            saveViewToState(currentSession.id, {
                isStreaming: { current: get().isStreaming },
                nodeBlocks: { current: get().nodeBlocks },
            });
        }
        set({ currentSession });
        // Sync state to view
        syncStateToView(session.id, {
            isStreaming: { current: null },
            nodeBlocks: { current: null },
        });
        try {
            const messages = await chatService.getSessionMessages(session.id);
            set({ currentMessages: messages });
        }
        catch (error) {
            console.error('Failed to load messages:', error);
        }
    },
    renameSession: async (session, newTitle) => {
        try {
            await chatService.renameSession(session.id, newTitle);
            set((state) => ({
                sessions: state.sessions.map((s) => s.id === session.id ? { ...s, title: newTitle, editing: false } : s),
                currentSession: state.currentSession?.id === session.id
                    ? { ...state.currentSession, title: newTitle }
                    : state.currentSession,
            }));
        }
        catch (error) {
            console.error('Failed to rename session:', error);
        }
    },
    pinSession: async (session) => {
        try {
            await chatService.pinSession(session.id, !session.isPinned);
            set((state) => ({
                sessions: state.sessions.map((s) => s.id === session.id ? { ...s, isPinned: !s.isPinned } : s),
            }));
        }
        catch (error) {
            console.error('Failed to pin session:', error);
        }
    },
    removeSession: async (session) => {
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
        }
        catch (error) {
            console.error('Failed to remove session:', error);
        }
    },
    clearSessions: async (agentId) => {
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
        }
        catch (error) {
            console.error('Failed to clear sessions:', error);
        }
    },
    sendMessage: async (query) => {
        const { currentSession, currentAgentId, requestOptions } = get();
        if (!currentSession)
            return;
        const needsTitle = !currentSession.title || currentSession.title === '新会话';
        const userMessage = {
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
            const request = {
                agentId: String(currentAgentId || ''),
                query,
                humanFeedback: requestOptions.humanFeedback,
                nl2sqlOnly: requestOptions.nl2sqlOnly,
                rejectedPlan: false,
                humanFeedbackContent: undefined,
                threadId: sessionState.lastRequest?.threadId,
            };
            // TODO: Implement graph request
            console.log('Send graph request:', request);
        }
        catch (error) {
            console.error('Failed to send message:', error);
        }
    },
    stopStreaming: async () => {
        const { currentSession } = get();
        if (!currentSession)
            return;
        const sessionId = currentSession.id;
        const sessionState = getSessionState(sessionId);
        if (sessionState.closeStream) {
            sessionState.closeStream();
            sessionState.closeStream = null;
        }
        sessionState.isStreaming = false;
        sessionState.nodeBlocks = [];
        // Save warning message
        const warningMsg = {
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
        }
        catch (error) {
            console.error('Failed to stop streaming:', error);
        }
    },
    submitFeedback: async (rejected, content) => {
        const { lastRequest } = get();
        if (!lastRequest)
            return;
        set({
            showHumanFeedback: false,
            feedbackContent: '',
        });
        const newRequest = {
            ...lastRequest,
            rejectedPlan: rejected,
            humanFeedbackContent: content || 'Accept',
        };
        // TODO: Resend graph request
        console.log('Submit feedback with new request:', newRequest);
    },
    openReportFullscreen: (content) => {
        set({
            fullscreenReportContent: content,
            showReportFullscreen: true,
        });
    },
    downloadHtmlReport: async (content) => {
        const { currentSession } = get();
        if (!currentSession)
            return;
        try {
            await chatService.downloadHtmlReport(currentSession.id, content);
        }
        catch (error) {
            console.error('Failed to download report:', error);
        }
    },
    switchDatasource: async (ds) => {
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
            // TODO: Call API to switch datasource
            set((state) => ({
                allDatasources: state.allDatasources.map((item) => ({
                    ...item,
                    isActive: item.id === nextDatasourceId,
                })),
                activeDatasource: { ...ds, isActive: true },
            }));
        }
        catch (error) {
            console.error('Failed to switch datasource:', error);
        }
    },
    switchModel: async (modelId) => {
        try {
            // TODO: Call API to activate model
            // Reload models
            set((state) => {
                const active = state.chatModels.find((m) => m.id === modelId);
                return {
                    activeModelConfig: active || null,
                    activeChatModel: active?.modelName || '',
                };
            });
        }
        catch (error) {
            console.error('Failed to switch model:', error);
        }
    },
    setChatSidebarCollapsed: (collapsed) => {
        set({ chatSidebarCollapsed: collapsed });
    },
}));
