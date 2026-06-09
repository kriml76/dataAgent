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
	<section class="new-agent-page page-shell">
		<div class="agent-header">
			<p class="magazine-label">Create</p>
			<h1 class="magazine-title">Create New Agent</h1>
			<p class="magazine-subtitle">
				Configure your specialized data intelligence agent with knowledge, prompts, and semantic capabilities.
			</p>
			<div class="decorative-rule mt-4"></div>
		</div>

		<div class="form-container magazine-card">
			<v-form ref="formRef">
				<div class="form-section">
					<p class="magazine-label mb-4">Identity</p>
					<div class="d-flex align-center gap-6 flex-wrap mb-6">
						<v-avatar size="88" rounded="lg" class="avatar-preview magazine-card">
							<v-img :src="agentForm.avatar" cover @error="handleImageError" />
						</v-avatar>
						<div class="d-flex gap-3">
							<button class="magazine-btn" @click="regenerateAvatar">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
									<path d="M23 4v6M1 20v-6M2.27 6.27a10 10 0 0 1 15.46-1.66M21.73 17.73a10 10 0 0 1-15.46 1.66" />
								</svg>
								Regenerate
							</button>
							<button class="magazine-btn" :disabled="uploading" @click="triggerFileUpload">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
									<polyline points="17 8 12 3 7 8" />
									<line x1="12" y1="3" x2="12" y2="15" />
								</svg>
								{{ uploading ? 'Uploading...' : 'Upload Image' }}
							</button>
							<input
								ref="fileInput"
								type="file"
								accept="image/*"
								style="display: none"
								@change="handleFileUpload"
							/>
						</div>
					</div>
				</div>

				<v-row>
					<v-col cols="12" md="6">
						<div class="form-field">
							<p class="magazine-label mb-2">Agent Name <span class="required">*</span></p>
							<v-text-field
								v-model="agentForm.name"
								placeholder="Enter agent name"
								variant="outlined"
								density="comfortable"
								:rules="[(v) => !!v?.trim() || 'Agent name is required']"
								hide-details="auto"
								class="magazine-input-field"
							/>
						</div>
					</v-col>
					<v-col cols="12" md="6">
						<div class="form-field">
							<p class="magazine-label mb-2">Tags</p>
							<v-text-field
								v-model="agentForm.tags"
								placeholder="e.g., SQL, Analytics, Report"
								variant="outlined"
								density="comfortable"
								hide-details="auto"
								class="magazine-input-field"
							/>
						</div>
					</v-col>
				</v-row>

				<div class="form-field">
					<p class="magazine-label mb-2">Description</p>
					<v-textarea
						v-model="agentForm.description"
						placeholder="Describe what this agent specializes in..."
						variant="outlined"
						density="comfortable"
						rows="3"
						hide-details="auto"
						class="magazine-input-field"
					/>
				</div>

				<div class="form-actions">
					<button class="magazine-btn" @click="goBack">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
							<path d="M19 12H5M12 19l-7-7 7-7" />
						</svg>
						Back to List
					</button>
					<button class="magazine-btn magazine-btn-primary" :disabled="loading" @click="createAgent">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
							<path d="M12 5v14M5 12h14" />
						</svg>
						{{ loading ? 'Creating...' : 'Create Agent' }}
					</button>
				</div>
			</v-form>
		</div>
	</section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import KnowledgePageHeader from '~/components/common/KnowledgePageHeader/index.vue';

const formRef = ref();
const loading = ref(false);
const uploading = ref(false);
const fileInput = ref();

const agentForm = ref({
	name: '',
	avatar: '',
	description: '',
	tags: '',
});

function handleImageError() {
	agentForm.value.avatar = '';
}

function regenerateAvatar() {
	// TODO: Implement avatar generation
	console.log('Regenerating avatar');
}

function triggerFileUpload() {
	fileInput.value?.click();
}

function handleFileUpload(event: Event) {
	const file = (event.target as HTMLInputElement).files?.[0];
	if (file) {
		uploading.value = true;
		// TODO: Implement file upload
		setTimeout(() => {
			uploading.value = false;
			console.log('File uploaded:', file.name);
		}, 1000);
	}
}

function goBack() {
	// TODO: Implement navigation back
	console.log('Going back');
}

function createAgent() {
	// TODO: Implement agent creation
	console.log('Creating agent:', agentForm.value);
}
</script>

<style scoped>
.agent-header {
	margin-bottom: 40px;
}

.form-container {
	padding: 40px;
}

.form-section {
	margin-bottom: 32px;
	padding-bottom: 32px;
	border-bottom: 1px solid var(--color-border-light);
}

.form-field {
	margin-bottom: 24px;
}

.avatar-preview {
	border: 2px solid var(--color-border);
	box-shadow: var(--shadow-subtle);
}

.required {
	color: #c75050;
}

.magazine-input-field :deep(.v-field__outline) {
	border-color: var(--color-border);
	transition: all 0.3s var(--ease-smooth);
}

.magazine-input-field :deep(.v-field--focused .v-field__outline) {
	border-color: var(--color-accent);
}

.magazine-input-field :deep(.v-field__input) {
	font-family: var(--font-body);
	font-size: 0.9375rem;
	color: var(--color-ink);
}

.magazine-input-field :deep(.v-field__input::placeholder) {
	color: var(--color-ink-light);
}

.form-actions {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	margin-top: 32px;
	padding-top: 32px;
	border-top: 1px solid var(--color-border-light);
}
</style>
