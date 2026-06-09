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
        
        {/* Chat page */}
        <Route path="/chat" element={<ChatPage />} />
        
        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Agent routes */}
        <Route path="/agent" element={<AgentListPage />} />
        <Route path="/agent/new" element={<NewAgentPage />} />
        <Route path="/agent/:id" element={<AgentDetailPage />} />
        
        {/* Knowledge routes */}
        <Route path="/knowledge/agents" element={<KnowledgeAgentsPage />} />
        <Route path="/knowledge/business" element={<KnowledgeBusinessPage />} />
        <Route path="/knowledge/semantic-models" element={<KnowledgeSemanticModelsPage />} />
        
        {/* System routes */}
        <Route path="/system/agents" element={<SystemAgentsPage />} />
        <Route path="/system/model-config" element={<ModelConfigPage />} />
        <Route path="/system/data-sources" element={<DataSourcesPage />} />
        
        {/* Prompt config */}
        <Route path="/prompt-config" element={<PromptConfigPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
