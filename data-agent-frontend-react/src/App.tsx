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
import PromptConfigPage from '@/pages/prompt-config/PromptConfigPage';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to agent/new */}
        <Route path="/" element={<Navigate to="/agent/new" replace />} />
        
        {/* Chat page with layout */}
        <Route path="/chat" element={<MainLayout><ChatPage /></MainLayout>} />
        
        {/* Dashboard with layout */}
        <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
        
        {/* Agent routes with layout */}
        <Route path="/agent" element={<MainLayout><AgentListPage /></MainLayout>} />
        <Route path="/agent/new" element={<MainLayout><NewAgentPage /></MainLayout>} />
        <Route path="/agent/:id" element={<MainLayout><AgentDetailPage /></MainLayout>} />
        
        {/* Knowledge routes with layout */}
        <Route path="/knowledge/agents" element={<MainLayout><KnowledgeAgentsPage /></MainLayout>} />
        <Route path="/knowledge/business" element={<MainLayout><KnowledgeBusinessPage /></MainLayout>} />
        <Route path="/knowledge/semantic-models" element={<MainLayout><KnowledgeSemanticModelsPage /></MainLayout>} />
        
        {/* System routes with layout */}
        <Route path="/system/agents" element={<MainLayout><SystemAgentsPage /></MainLayout>} />
        <Route path="/system/model-config" element={<MainLayout><ModelConfigPage /></MainLayout>} />
        <Route path="/system/data-sources" element={<MainLayout><DataSourcesPage /></MainLayout>} />
        
        {/* Prompt config with layout */}
        <Route path="/prompt-config" element={<MainLayout><PromptConfigPage /></MainLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
