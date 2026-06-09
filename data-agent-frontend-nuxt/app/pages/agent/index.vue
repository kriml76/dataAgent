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
	<section class="agent-page page-shell">
		<div class="agent-header">
			<p class="magazine-label">Agent Directory</p>
			<h1 class="magazine-title">Your Intelligence Agents</h1>
			<p class="magazine-subtitle">
				Manage and configure your specialized AI agents
			</p>
			<div class="decorative-rule mt-4"></div>
		</div>

		<div class="agent-grid">
			<div v-for="i in 6" :key="i" class="agent-card magazine-card">
				<div class="agent-card-header">
					<v-avatar color="rgba(193, 127, 89, 0.1)" size="48" class="agent-avatar">
						<v-icon icon="mdi-robot" size="24" color="#c17f59" />
					</v-avatar>
					<v-chip size="small" variant="outlined" class="status-chip">
						<span class="status-dot"></span>
						Active
					</v-chip>
				</div>
				<div class="agent-card-content">
					<h3 class="agent-name">Agent {{ i }}</h3>
					<p class="agent-description">
						Specialized AI agent designed for data analysis and intelligent query processing.
					</p>
				</div>
				<div class="agent-card-footer">
					<p class="magazine-label mb-2">Capabilities</p>
					<div class="agent-tags">
						<span class="agent-tag">SQL</span>
						<span class="agent-tag">Analytics</span>
						<span class="agent-tag">Report</span>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts"></script>

<style scoped>
.agent-header {
	margin-bottom: 40px;
}

.agent-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 24px;
}

.agent-card {
	padding: 28px;
	display: flex;
	flex-direction: column;
	gap: 20px;
	position: relative;
}

.agent-card-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
}

.agent-avatar {
	border-radius: 12px;
}

.status-chip {
	border-color: var(--color-accent-light);
	color: var(--color-accent);
	font-family: var(--font-ui);
	font-size: 0.6875rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	padding: 4px 10px;
}

.status-dot {
	width: 6px;
	height: 6px;
	background: #6b8f71;
	border-radius: 50%;
	margin-right: 6px;
	animation: breathe 2s infinite ease-in-out;
}

@keyframes breathe {
	0%, 100% { opacity: 0.6; transform: scale(0.9); }
	50% { opacity: 1; transform: scale(1.1); }
}

.agent-name {
	font-family: var(--font-display);
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--color-ink);
	margin-bottom: 8px;
}

.agent-description {
	font-family: var(--font-body);
	font-size: 0.875rem;
	line-height: 1.6;
	color: var(--color-ink-muted);
}

.agent-card-footer {
	margin-top: auto;
	padding-top: 16px;
	border-top: 1px solid var(--color-border-light);
}

.agent-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.agent-tag {
	font-family: var(--font-ui);
	font-size: 0.6875rem;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--color-ink-light);
	background: var(--color-cream);
	padding: 4px 10px;
	border-radius: 4px;
	border: 1px solid var(--color-border-light);
}
</style>
