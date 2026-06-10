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

import MarkdownIt from 'markdown-it';
import highlightPlugin from './markdown/markdown-plugin-highlight';
import echartsPlugin from './markdown/markdown-plugin-echarts';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

md.use(highlightPlugin);
md.use(echartsPlugin);

export function renderMarkdownContent(content: string): string {
  if (!content) return '';
  return md.render(content);
}

// Copy code block function using event delegation
function copyCodeBlock(btn: HTMLElement) {
  const code = btn.getAttribute('data-code');
  if (!code) return;

  const originalText = btn.textContent;
  const parser = new DOMParser();
  const decodedCode = parser
    .parseFromString(`<div>${code}</div>`, 'text/html')
    .querySelector('div')?.textContent;

  if (!decodedCode) return;

  navigator.clipboard
    .writeText(decodedCode)
    .then(() => {
      btn.textContent = '已复制!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('copied');
      }, 2000);
    })
    .catch(() => {
      btn.textContent = '复制失败';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    });
}

// Initialize event delegation for copy buttons
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('code-copy-button') || target.closest('.code-copy-button')) {
      const btn = target.classList.contains('code-copy-button') ? target : target.closest('.code-copy-button') as HTMLElement;
      copyCodeBlock(btn);
    }
  });
}
