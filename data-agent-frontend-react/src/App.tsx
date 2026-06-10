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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import ChatPage from '@/pages/ChatPage';
import DashboardPage from '@/pages/DashboardPage';
import AgentListPage from '@/pages/agent/AgentListPage';
import AgentDetailPage from '@/pages/agent/AgentDetailPage';
import NewAgentPage from '@/pages/agent/NewAgentPage';
import KnowledgeAgentsPage from '@/pages/knowledge/KnowledgeAgentsPage';
import KnowledgeBusinessPage from '@/pages/knowledge/KnowledgeBusinessPage';
import KnowledgeSemanticModelsPage from '@/pages/knowledge/KnowledgeSemanticModelsPage';
import SystemAgentsPage from '@/pages/system/SystemAgentsPage';
import ModelConfigPage from '@/pages/system/ModelConfigPage';
import DataSourcesPage from '@/pages/system/datasources/DataSourcesPage';
import AccessApiPage from '@/pages/system/AccessApiPage';
import PromptConfigPage from '@/pages/prompt-config/PromptConfigPage';
import LoginPage from '@/pages/LoginPage';
import ProtectedRoute from '@/components/ProtectedRoute';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 - 不需要认证 */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* 受保护路由 - 需要认证 */}
        <Route path="/chat" element={
          <ProtectedRoute>
            <MainLayout><ChatPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout><DashboardPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/agent" element={
          <ProtectedRoute>
            <MainLayout><AgentListPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/agent/new" element={
          <ProtectedRoute>
            <MainLayout><NewAgentPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/agent/:id" element={
          <ProtectedRoute>
            <MainLayout><AgentDetailPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/knowledge/agents" element={
          <ProtectedRoute>
            <MainLayout><KnowledgeAgentsPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/knowledge/business" element={
          <ProtectedRoute>
            <MainLayout><KnowledgeBusinessPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/knowledge/semantic-models" element={
          <ProtectedRoute>
            <MainLayout><KnowledgeSemanticModelsPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/system/agents" element={
          <ProtectedRoute>
            <MainLayout><SystemAgentsPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/system/model-config" element={
          <ProtectedRoute>
            <MainLayout><ModelConfigPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/system/data-sources" element={
          <ProtectedRoute>
            <MainLayout><DataSourcesPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/system/access-api" element={
          <ProtectedRoute>
            <MainLayout><AccessApiPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/prompt-config" element={
          <ProtectedRoute>
            <MainLayout><PromptConfigPage /></MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
