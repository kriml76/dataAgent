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
	<v-app id="app">
		<v-main>
			<BaseDrawer v-model="drawer" :drawer-width="280">
				<template #drawer>
					<div class="d-flex flex-column h-100 drawer-container">
						<div class="pa-6 border-b border-white-5 drawer-header">
							<div class="d-flex align-center mb-5">
								<v-avatar color="transparent" size="44" class="mr-3 rounded-lg">
									<span class="brand-initial">D</span>
								</v-avatar>
								<div>
									<div class="text-subtitle-2 font-weight-bold text-white brand-title">
										Data Agent
									</div>
									<div class="brand-subtitle">
										SPRING AI ALBABABA
									</div>
								</div>
							</div>

							<div class="decorative-rule mb-4"></div>

							<div class="agent-switcher-box">
								<p class="magazine-label mb-3">
									Active Intelligence
								</p>
								<v-select
									v-model="selectedAgentId"
									:items="agentOptions"
									item-title="title"
									item-value="value"
									variant="outlined"
									density="compact"
									hide-details
									placeholder="Select an agent"
									class="agent-switcher"
									menu-icon="mdi-chevron-down"
									theme="dark"
									:menu-props="{
										contentClass: 'agent-switcher-menu',
										offset: [0, 8],
									}"
									:list-props="{ bgColor: '#1a1a1a', theme: 'dark' }"
									item-color="accent"
									@update:model-value="handleAgentSwitch"
								>
									<template #selection="{ item }">
										<div
											class="agent-option agent-option--selection d-flex align-center w-100"
										>
											<v-avatar size="26" class="mr-3 border border-white-10 agent-avatar">
												<v-img
													v-if="item.raw.avatar"
													:src="item.raw.avatar"
													cover
												/>
												<v-icon
													v-else
													icon="mdi-robot"
													size="14"
													color="#c17f59"
												/>
											</v-avatar>
											<div class="agent-option__text">
												<div
													class="agent-option__title agent-option__title--active"
												>
													{{ item.raw.title }}
												</div>
												<div class="agent-option__subtitle">
													{{ item.raw.subtitle }}
												</div>
											</div>
										</div>
									</template>
									<template #item="{ props, item }">
										<v-list-item
											v-bind="props"
											:title="undefined"
											:subtitle="undefined"
											class="agent-option"
											:class="{
												'agent-option--active':
													item.raw.value === selectedAgentId,
											}"
										>
											<template #prepend>
												<v-avatar size="30" class="mr-3 border border-white-10 agent-avatar">
													<v-img
														v-if="item.raw.avatar"
														:src="item.raw.avatar"
														cover
													/>
													<v-icon
														v-else
														icon="mdi-robot"
														size="16"
														color="#c17f59"
													/>
												</v-avatar>
											</template>
											<v-list-item-title class="agent-option__title">{{
												item.raw.title
											}}</v-list-item-title>
											<v-list-item-subtitle class="agent-option__subtitle">
												<span class="agent-tags-text">{{
													item.raw.subtitle
												}}</span>
											</v-list-item-subtitle>
											<template #append>
												<v-icon
													v-if="item.raw.value === selectedAgentId"
													icon="mdi-check"
													color="#c17f59"
													size="16"
												/>
											</template>
										</v-list-item>
									</template>
								</v-select>
							</div>
						</div>

						<v-list
							v-model:opened="openedGroups"
							density="compact"
							nav
							class="flex-grow-1 pa-4 px-6 custom-scrollbar bg-transparent"
							theme="dark"
						>
							<div class="nav-section-label mb-2 mt-2">Query</div>
							<v-list-item
								prepend-icon="mdi-chat-processing-outline"
								title="Data Dialogue"
								:active="isActive('/chat')"
								class="rounded-lg mb-1 navigation-item"
								color="#c17f59"
								@click="navigateToPath('/chat')"
							/>
							<v-list-item
								prepend-icon="mdi-auto-fix"
								:active="isActive('/prompt-config')"
								class="rounded-lg mb-1 navigation-item"
								color="#c17f59"
								title="Prompt Craft"
								@click="navigateToPath('/prompt-config')"
							/>

							<v-list-group value="knowledge">
								<template #activator="{ props }">
									<v-list-item
										v-bind="props"
										title="Knowledge Base"
										class="nav-section-label mt-4"
									/>
								</template>
								<v-list-item
									prepend-icon="mdi-book-open-variant"
									title="Business Lexicon"
									:active="isActive('/knowledge/business')"
									density="compact"
									class="rounded-lg mb-1 navigation-sub-item"
									color="#c17f59"
									@click="navigateToPath('/knowledge/business')"
								/>
								<v-list-item
									prepend-icon="mdi-brain"
									title="Agent Memory"
									:active="isActive('/knowledge/agents')"
									density="compact"
									class="rounded-lg mb-1 navigation-sub-item"
									color="#c17f59"
									@click="navigateToPath('/knowledge/agents')"
								/>
								<v-list-item
									prepend-icon="mdi-vector-intersection"
									title="Semantic Schema"
									:active="isActive('/knowledge/semantic-models')"
									density="compact"
									class="rounded-lg mb-1 navigation-sub-item"
									color="#c17f59"
									@click="navigateToPath('/knowledge/semantic-models')"
								/>
							</v-list-group>

							<v-list-group value="system">
								<template #activator="{ props }">
									<v-list-item
										v-bind="props"
										title="Configuration"
										class="nav-section-label mt-4"
									/>
								</template>
								<v-list-item
									prepend-icon="mdi-robot-outline"
									title="Agent Studio"
									:active="isActive('/system/agents')"
									density="compact"
									class="rounded-lg mb-1 navigation-sub-item"
									color="#c17f59"
									@click="navigateToPath('/system/agents')"
								/>
								<v-list-item
									prepend-icon="mdi-database-refresh-outline"
									title="Data Sources"
									:active="isActive('/system/data-sources')"
									density="compact"
									class="rounded-lg mb-1 navigation-sub-item"
									color="#c17f59"
									@click="navigateToPath('/system/data-sources')"
								/>
								<v-list-item
									prepend-icon="mdi-cpu-64-bit"
									title="Model Registry"
									:active="isActive('/system/model-config')"
									density="compact"
									class="rounded-lg mb-1 navigation-sub-item"
									color="#c17f59"
									@click="navigateToPath('/system/model-config')"
								/>
							</v-list-group>

							<div class="mt-6 pt-4 border-t border-white/5">
								<v-list-item
									color="#c17f59"
									density="compact"
									:active="isActive('/agent/new')"
									variant="flat"
									class="rounded-xl mx-2 shadow-lg new-agent-item"
									@click="navigateToPath('/agent/new')"
								>
									<div class="d-flex align-center justify-center gap-2 w-100">
										<v-icon icon="mdi-plus-box-outline" size="16" rounded />
										<span class="font-weight-bold text-caption mx-1"
											>Create Agent</span
										>
									</div>
								</v-list-item>
							</div>
						</v-list>
					</div>
				</template>

				<template #header="{ toggle, isOpen }">
					<v-btn icon variant="text" size="small" class="mr-3 header-toggle-btn" @click="toggle">
						<v-icon :icon="isOpen ? 'mdi-menu-open' : 'mdi-menu'" color="#6b6b6b" />
					</v-btn>
					<div class="header-title">
						{{ currentRouteTitle }}
					</div>
					<v-spacer />
					<div class="header-edition">
						<span class="edition-dot"></span>
						Alibaba Edition
					</div>
				</template>

				<slot />
			</BaseDrawer>
		</v-main>

		<ConfirmDialog
			v-model="dialogState.isVisible"
			:title="dialogState.title"
			:message="dialogState.message"
			:prepend-icon="dialogState.icon"
			:confirm-text="dialogState.confirmText"
			@confirm="handleGlobalConfirm"
		/>
		<Tip />
	</v-app>
</template>

<script setup lang="ts">
import BaseDrawer from '../components/BaseDrawer/index.vue';
import agentService from '~/services/agent/index';
import modelConfigService from '~/services/modelConfig/index';

const { dialogState, handleGlobalConfirm } = useConfirm();
const drawer = ref(true);
const router = useRouter();
const route = useRoute();
const openedGroups = ref(['knowledge', 'system']);

type DrawerAgentOption = {
	id: number;
	name: string;
	title: string;
	value: number;
	subtitle: string;
	avatar?: string;
	tags?: string;
};

const agents = ref<DrawerAgentOption[]>([]);
const selectedAgentId = ref<number | undefined>(undefined);
const globalChatModelName = ref('');

const routeTitleMap: Record<string, string> = {
	'/chat': 'Data Dialogue',
	'/dashboard': 'Data Insights',
	'/prompt-config': 'Prompt Craft',
	'/knowledge/business': 'Business Lexicon',
	'/knowledge/agents': 'Agent Memory',
	'/knowledge/semantic-models': 'Semantic Schema',
	'/system/data-sources': 'Data Sources',
	'/system/model-config': 'Model Registry',
	'/system/settings': 'Configuration',
	'/agent/new': 'Create Agent',
};

const agentOptions = computed(() => agents.value);

const currentRouteTitle = computed(() => {
	if (route.path.startsWith('/agent/') && route.path !== '/agent/new') {
		return 'Agent Profile';
	}
	return routeTitleMap[route.path] || 'Data Agent';
});

function parseRouteAgentId() {
	const pathId = Number(route.params.id);
	if (
		route.path.startsWith('/agent/') &&
		route.path !== '/agent/new' &&
		Number.isFinite(pathId) &&
		pathId > 0
	) {
		return pathId;
	}
	const queryId = Number(route.query.agentId);
	if (Number.isFinite(queryId) && queryId > 0) {
		return queryId;
	}
	return undefined;
}

function getQueryWithAgentId(agentId?: number) {
	const query: Record<string, string> = {};
	Object.keys(route.query).forEach((key) => {
		const value = route.query[key];
		if (key === 'agentId') return;
		if (Array.isArray(value)) {
			if (value[0]) query[key] = String(value[0]);
		} else if (value !== undefined) {
			query[key] = String(value);
		}
	});
	if (agentId) query.agentId = String(agentId);
	return query;
}

function applyAgentToCurrentRoute(agentId: number, replace = false) {
	if (route.path === '/agent/new') return;
	const target =
		route.path.startsWith('/agent/') && route.path !== '/agent/new'
			? { path: `/agent/${agentId}` }
			: { path: route.path, query: getQueryWithAgentId(agentId) };
	if (replace) {
		router.replace(target);
	} else {
		router.push(target);
	}
}

function navigateToPath(path: string) {
	if (path === '/agent/new') {
		if (route.path !== path) router.push({ path });
		return;
	}
	if (
		route.path === path &&
		path.startsWith('/agent/') &&
		selectedAgentId.value
	) {
		return;
	}
	if (selectedAgentId.value) {
		if (path.startsWith('/agent/') && path !== '/agent/new') {
			router.push({ path: `/agent/${selectedAgentId.value}` });
			return;
		}
		router.push({ path, query: { agentId: String(selectedAgentId.value) } });
		return;
	}
	router.push({ path });
}

function handleAgentSwitch(value: number | string | undefined) {
	const id = Number(value);
	if (!Number.isFinite(id) || id <= 0) return;
	selectedAgentId.value = id;
	applyAgentToCurrentRoute(id);
}

const isActive = (path: string) => route.path === path;

async function loadGlobalModelName() {
	try {
		const configs = await modelConfigService.list();
		const activeChat = configs.find(
			(item) => item.modelType === 'CHAT' && item.isActive,
		);
		globalChatModelName.value = activeChat?.modelName || '';
	} catch (e) {
		console.error('Failed to load global model name', e);
	}
}

async function loadAgents() {
	const list = await agentService.list();
	agents.value = list
		.filter((item) => item.id !== undefined && item.id > 0)
		.map((item) => {
			const raw = item as unknown as Record<string, unknown>;
			return {
				id: item.id as number,
				name: item.name || `Agent ${item.id}`,
				title: item.name || `Agent ${item.id}`,
				value: item.id as number,
				subtitle: typeof raw.tags === 'string' ? raw.tags : '',
				avatar: typeof raw.avatar === 'string' ? raw.avatar : undefined,
				tags: typeof raw.tags === 'string' ? raw.tags : '',
			};
		});
}

function syncSelectedFromRoute() {
	const routeAgentId = parseRouteAgentId();
	if (routeAgentId && agents.value.some((item) => item.id === routeAgentId)) {
		selectedAgentId.value = routeAgentId;
	}
}

onMounted(async () => {
	await loadGlobalModelName();
	await loadAgents();
	syncSelectedFromRoute();
	const firstAgent = agents.value[0];
	if (!selectedAgentId.value && firstAgent?.id) {
		selectedAgentId.value = firstAgent.id;
		applyAgentToCurrentRoute(selectedAgentId.value, true);
	}
});

watch(
	() => route.fullPath,
	() => {
		syncSelectedFromRoute();
	},
);
</script>

<style scoped>
.drawer-container {
	background: linear-gradient(180deg, #1a1a1a 0%, #151515 100%);
}

.drawer-header {
	background: linear-gradient(180deg, rgba(193, 127, 89, 0.08) 0%, transparent 100%);
}

.border-white-5 {
	border-color: rgba(255, 255, 255, 0.05) !important;
}

.brand-initial {
	font-family: var(--font-display);
	font-size: 2rem;
	font-weight: 700;
	color: #c17f59;
	line-height: 1;
}

.brand-title {
	font-family: var(--font-display);
	font-size: 1.25rem;
	font-weight: 600;
	letter-spacing: 0.01em;
}

.brand-subtitle {
	font-family: var(--font-ui);
	font-size: 0.625rem;
	font-weight: 600;
	letter-spacing: 0.15em;
	color: #6b6b6b;
	text-transform: uppercase;
}

.nav-section-label {
	font-family: var(--font-ui);
	font-size: 0.625rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.15em;
	color: #6b6b6b;
	padding: 0 16px;
}

.decorative-rule {
	width: 32px;
	height: 2px;
	background: linear-gradient(90deg, #c17f59, transparent);
}

.agent-switcher :deep(.v-field) {
	background: rgba(255, 255, 255, 0.04);
	border-radius: 8px;
	border: 1px solid rgba(255, 255, 255, 0.08);
	transition: all 0.3s var(--ease-smooth);
}

.agent-switcher :deep(.v-field:hover) {
	border-color: rgba(193, 127, 89, 0.3);
}

.agent-switcher :deep(.v-field__input),
.agent-switcher :deep(.v-field-label),
.agent-switcher :deep(.v-icon) {
	color: #e5e0d8;
	font-family: var(--font-ui);
}

.agent-avatar {
	background: rgba(193, 127, 89, 0.1);
}

:deep(.agent-switcher-menu) {
	background: #1a1a1a !important;
	border: 1px solid rgba(193, 127, 89, 0.2) !important;
	border-radius: 12px !important;
	overflow: hidden;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

:deep(.agent-switcher-menu .v-list) {
	background: transparent !important;
	padding: 6px !important;
}

:deep(.agent-switcher-menu .v-list-item) {
	border-radius: 8px !important;
	margin-bottom: 2px !important;
	min-height: 48px !important;
	transition: all 0.2s var(--ease-smooth);
}

:deep(.agent-switcher-menu .v-list-item:hover) {
	background: rgba(193, 127, 89, 0.12) !important;
}

.agent-option__text {
	min-width: 0;
	flex: 1;
}

.agent-option__title {
	font-family: var(--font-ui);
	font-size: 0.8125rem;
	font-weight: 500;
	line-height: 1.3;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 170px;
	color: #e5e0d8;
}

.agent-option__title--active {
	color: #c17f59;
}

.agent-option__subtitle {
	font-family: var(--font-ui);
	font-size: 0.6875rem;
	line-height: 1.3;
	color: #6b6b6b;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 170px;
	margin-top: 2px;
}

.agent-tags-text {
	background: rgba(193, 127, 89, 0.15);
	color: #c17f59;
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 0.625rem;
	border: 1px solid rgba(193, 127, 89, 0.2);
	font-family: var(--font-ui);
	letter-spacing: 0.05em;
}

.agent-option--selection .agent-option__title {
	max-width: 145px;
}

.agent-option--selection .agent-option__subtitle {
	max-width: 145px;
}

.navigation-item {
	--v-list-item-padding-start: 16px;
	--v-list-item-min-height: 42px;
	transition: all 0.25s var(--ease-smooth);
}

.navigation-item:hover {
	transform: translateX(4px);
}

.navigation-item :deep(.v-list-item-title) {
	font-family: var(--font-ui);
	font-size: 0.8125rem;
	font-weight: 500;
	letter-spacing: 0.01em;
}

.navigation-sub-item {
	--v-list-item-padding-start: 28px;
	--v-list-item-min-height: 38px;
	transition: all 0.25s var(--ease-smooth);
}

.navigation-sub-item:hover {
	transform: translateX(4px);
}

.navigation-sub-item :deep(.v-list-item-title) {
	font-family: var(--font-ui);
	font-size: 0.75rem;
	font-weight: 400;
	letter-spacing: 0.01em;
}

.custom-scrollbar::-webkit-scrollbar {
	width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
	background: rgba(255, 255, 255, 0.1);
	border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background: rgba(193, 127, 89, 0.4);
}

:deep(.v-list-group__items .v-list-item) {
	padding-inline-start: 16px !important;
}

:deep(.flex-grow-1.v-list .v-list-item) {
	min-height: 40px !important;
}

:deep(.v-list-item__spacer) {
	width: 12px !important;
}

.new-agent-item {
	background: linear-gradient(135deg, rgba(193, 127, 89, 0.15) 0%, rgba(193, 127, 89, 0.05) 100%);
	border: 1px solid rgba(193, 127, 89, 0.2);
	transition: all 0.3s var(--ease-bounce);
}

.new-agent-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 16px rgba(193, 127, 89, 0.2);
	border-color: rgba(193, 127, 89, 0.4);
}

.new-agent-item :deep(.v-list-item-title) {
	color: #c17f59;
	font-family: var(--font-ui);
	font-weight: 600;
}

/* Header Styles */
.header-title {
	font-family: var(--font-display);
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--color-ink);
	letter-spacing: -0.01em;
}

.header-toggle-btn {
	transition: all 0.2s var(--ease-smooth);
}

.header-toggle-btn:hover {
	background: rgba(193, 127, 89, 0.1);
}

.header-edition {
	font-family: var(--font-ui);
	font-size: 0.6875rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: var(--color-ink-light);
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 12px;
	background: var(--color-paper);
	border: 1px solid var(--color-border);
	border-radius: 20px;
}

.edition-dot {
	width: 6px;
	height: 6px;
	background: #c17f59;
	border-radius: 50%;
	animation: breathe 2s infinite ease-in-out;
}

@keyframes breathe {
	0% { opacity: 0.6; transform: scale(0.9); }
	50% { opacity: 1; transform: scale(1.1); }
	100% { opacity: 0.6; transform: scale(0.9); }
}
</style>
