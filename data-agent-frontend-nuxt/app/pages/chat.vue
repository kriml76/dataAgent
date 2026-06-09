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

<template>
	<div class="chat-page">
		<div class="chat-sidebar magazine-card">
			<div class="chat-sidebar-header">
				<p class="magazine-label mb-2">Conversation History</p>
				<h2 class="magazine-heading" style="font-size: 1.125rem; margin-bottom: 0;">Archives</h2>
			</div>
			<ChatSidebar />
		</div>
		<div class="chat-body">
			<div class="chat-messages-container">
				<ChatMessageList />
			</div>
			<div class="chat-input-wrapper">
				<ChatInputArea />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, computed } from 'vue';
import { useChatStore } from '~/stores/chat';
import agentService from '~/services/agent/index';
import ChatSidebar from '~/components/chat/ChatSidebar.vue';
import ChatMessageList from '~/components/chat/ChatMessageList.vue';
import ChatInputArea from '~/components/chat/ChatInputArea.vue';

const route = useRoute();
const store = useChatStore();

const currentAgentId = computed(() => {
	const q = route.query.agentId;
	return q ? Number(q) : undefined;
});

async function init(agentId: number) {
	store.currentAgentId = agentId;

	try {
		const agent = await agentService.get(agentId);
		if (agent) {
			store.currentAgentName = agent.name || '';
			store.currentAgentAvatar = agent.avatar || '';
			store.currentAgentDescription = agent.description || '';
		}
	} catch { /* ignore */ }

	store.connectSessionStream(agentId);
	await store.loadSessions(agentId);
}

onMounted(async () => {
	if (currentAgentId.value) await init(currentAgentId.value);
});

watch(currentAgentId, async (newId, oldId) => {
	if (newId && newId !== oldId) {
		store.sessions = [];
		store.currentSession = null;
		store.currentMessages = [];
		store.isStreaming = false;
		store.nodeBlocks = [];
		await init(newId);
	}
});

onUnmounted(() => {
	store.disconnectSessionStream();
});
</script>

<style scoped>
.chat-page {
	display: flex;
	height: calc(100vh - 64px);
	overflow: hidden;
	background: var(--color-cream);
	gap: 24px;
	padding: 24px;
}

.chat-sidebar {
	width: 280px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	position: relative;
}

.chat-sidebar-header {
	padding: 24px 24px 16px;
	border-bottom: 1px solid var(--color-border);
}

.chat-body {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	min-width: 0;
	background: var(--color-paper);
	border-radius: 12px;
	box-shadow: var(--shadow-card);
	border: 1px solid var(--color-border-light);
}

.chat-messages-container {
	flex: 1;
	overflow-y: auto;
	position: relative;
}

.chat-messages-container::-webkit-scrollbar {
	width: 6px;
}

.chat-messages-container::-webkit-scrollbar-track {
	background: transparent;
}

.chat-messages-container::-webkit-scrollbar-thumb {
	background: var(--color-border);
	border-radius: 3px;
}

.chat-messages-container::-webkit-scrollbar-thumb:hover {
	background: var(--color-accent-light);
}

.chat-input-wrapper {
	border-top: 1px solid var(--color-border);
	background: linear-gradient(180deg, transparent, rgba(193, 127, 89, 0.02));
}
</style>
