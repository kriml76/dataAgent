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
	<section class="dashboard-page">
		<div class="dashboard-header">
			<p class="magazine-label">Overview</p>
			<h1 class="magazine-title">Data Insights</h1>
			<p class="magazine-subtitle">
				Performance metrics and analytics from your intelligent agents
			</p>
			<div class="decorative-rule mt-4"></div>
		</div>

		<div class="magazine-grid dashboard-grid">
			<div class="stat-card magazine-card" style="grid-column: span 3;">
				<div class="stat-card-inner">
					<div class="stat-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
						</svg>
					</div>
					<div class="stat-content">
						<p class="magazine-label">Conversations</p>
						<p class="stat-value">1,284</p>
						<p class="stat-change positive">+12.5% from last week</p>
					</div>
				</div>
			</div>

			<div class="stat-card magazine-card" style="grid-column: span 3;">
				<div class="stat-card-inner">
					<div class="stat-icon" style="color: #6b8f71;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 2L2 7l10 5 10-5-10-5z" />
							<path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
						</svg>
					</div>
					<div class="stat-content">
						<p class="magazine-label">Queries Processed</p>
						<p class="stat-value">8,429</p>
						<p class="stat-change positive">+8.3% from last week</p>
					</div>
				</div>
			</div>

			<div class="stat-card magazine-card" style="grid-column: span 3;">
				<div class="stat-card-inner">
					<div class="stat-icon" style="color: #8b7355;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
							<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
							<path d="M16 3.13a4 4 0 0 1 0 7.75" />
						</svg>
					</div>
					<div class="stat-content">
						<p class="magazine-label">Active Agents</p>
						<p class="stat-value">6</p>
						<p class="stat-change neutral">Active</p>
					</div>
				</div>
			</div>

			<div class="stat-card magazine-card" style="grid-column: span 3;">
				<div class="stat-card-inner">
					<div class="stat-icon" style="color: #a67f59;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
						</svg>
					</div>
					<div class="stat-content">
						<p class="magazine-label">Success Rate</p>
						<p class="stat-value">94.2%</p>
						<p class="stat-change positive">+2.1% from last week</p>
					</div>
				</div>
			</div>

			<div class="feature-card magazine-card" style="grid-column: span 8;">
				<div class="feature-card-header">
					<p class="magazine-label">Analytics</p>
					<h3 class="magazine-heading" style="font-size: 1.25rem;">Query Volume Over Time</h3>
				</div>
				<div class="feature-card-content">
					<div class="chart-placeholder">
						<div class="chart-bars">
							<div class="chart-bar" style="height: 60%;">
								<span class="chart-bar-label">Mon</span>
							</div>
							<div class="chart-bar" style="height: 80%;">
								<span class="chart-bar-label">Tue</span>
							</div>
							<div class="chart-bar" style="height: 45%;">
								<span class="chart-bar-label">Wed</span>
							</div>
							<div class="chart-bar" style="height: 90%;">
								<span class="chart-bar-label">Thu</span>
							</div>
							<div class="chart-bar" style="height: 75%;">
								<span class="chart-bar-label">Fri</span>
							</div>
							<div class="chart-bar" style="height: 50%;">
								<span class="chart-bar-label">Sat</span>
							</div>
							<div class="chart-bar" style="height: 65%;">
								<span class="chart-bar-label">Sun</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="feature-card magazine-card" style="grid-column: span 4;">
				<div class="feature-card-header">
					<p class="magazine-label">Top Agents</p>
					<h3 class="magazine-heading" style="font-size: 1.25rem;">Performance Leaders</h3>
				</div>
				<div class="feature-card-content">
					<div class="agent-ranking">
						<div class="agent-ranking-item">
							<div class="agent-ranking-position">01</div>
							<div class="agent-ranking-info">
								<p class="agent-ranking-name">Data Analyst Pro</p>
								<p class="agent-ranking-stats">1,248 queries • 98.5% accuracy</p>
							</div>
						</div>
						<div class="agent-ranking-item">
							<div class="agent-ranking-position">02</div>
							<div class="agent-ranking-info">
								<p class="agent-ranking-name">Business Insights</p>
								<p class="agent-ranking-stats">982 queries • 96.8% accuracy</p>
							</div>
						</div>
						<div class="agent-ranking-item">
							<div class="agent-ranking-position">03</div>
							<div class="agent-ranking-info">
								<p class="agent-ranking-name">SQL Master</p>
								<p class="agent-ranking-stats">876 queries • 95.2% accuracy</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<style scoped>
.dashboard-page {
	padding: 40px;
	background: var(--color-cream);
	min-height: 100%;
}

.dashboard-header {
	margin-bottom: 40px;
}

.dashboard-grid {
	gap: 24px;
}

.stat-card-inner {
	padding: 28px;
	display: flex;
	align-items: center;
	gap: 20px;
}

.stat-icon {
	width: 56px;
	height: 56px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, rgba(193, 127, 89, 0.1), rgba(193, 127, 89, 0.05));
	border-radius: 12px;
	color: var(--color-accent);
	flex-shrink: 0;
}

.stat-icon svg {
	width: 24px;
	height: 24px;
}

.stat-content {
	flex: 1;
	min-width: 0;
}

.stat-value {
	font-family: var(--font-display);
	font-size: 2.25rem;
	font-weight: 700;
	color: var(--color-ink);
	line-height: 1.1;
	margin: 8px 0 6px;
}

.stat-change {
	font-family: var(--font-ui);
	font-size: 0.75rem;
	font-weight: 500;
}

.stat-change.positive {
	color: #6b8f71;
}

.stat-change.negative {
	color: #c75050;
}

.stat-change.neutral {
	color: var(--color-ink-light);
}

.feature-card-header {
	padding: 24px 24px 0;
}

.feature-card-content {
	padding: 24px;
}

.chart-placeholder {
	height: 200px;
	display: flex;
	align-items: flex-end;
	justify-content: center;
}

.chart-bars {
	display: flex;
	align-items: flex-end;
	gap: 20px;
	height: 100%;
	width: 100%;
	padding: 0 20px;
}

.chart-bar {
	flex: 1;
	background: linear-gradient(180deg, var(--color-accent), var(--color-accent-light));
	border-radius: 6px 6px 0 0;
	position: relative;
	transition: all 0.3s var(--ease-smooth);
	min-width: 40px;
}

.chart-bar:hover {
	transform: scaleY(1.05);
	transform-origin: bottom;
}

.chart-bar-label {
	position: absolute;
	bottom: -24px;
	left: 50%;
	transform: translateX(-50%);
	font-family: var(--font-ui);
	font-size: 0.6875rem;
	color: var(--color-ink-light);
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.agent-ranking {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.agent-ranking-item {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 16px;
	background: rgba(193, 127, 89, 0.03);
	border-radius: 8px;
	transition: all 0.3s var(--ease-smooth);
}

.agent-ranking-item:hover {
	background: rgba(193, 127, 89, 0.08);
	transform: translateX(4px);
}

.agent-ranking-position {
	font-family: var(--font-display);
	font-size: 1.5rem;
	font-weight: 700;
	color: var(--color-accent);
	line-height: 1;
	width: 36px;
	text-align: center;
}

.agent-ranking-name {
	font-family: var(--font-ui);
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--color-ink);
	margin-bottom: 2px;
}

.agent-ranking-stats {
	font-family: var(--font-ui);
	font-size: 0.75rem;
	color: var(--color-ink-light);
}
</style>
