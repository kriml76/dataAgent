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

import 'highlight.js/styles/atom-one-light.css';
import hljs from 'highlight.js/lib/core';
import Sql from 'highlight.js/lib/languages/sql';
import Python from 'highlight.js/lib/languages/python';
import Json from 'highlight.js/lib/languages/json';
import JavaScript from 'highlight.js/lib/languages/javascript';
import MarkdownIt from 'markdown-it';

hljs.registerLanguage('sql', Sql);
hljs.registerLanguage('json', Json);
hljs.registerLanguage('python', Python);
hljs.registerLanguage('javascript', JavaScript);

const escapeAttr = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const highlightPlugin = (md: MarkdownIt) => {
  const originalFence = md.renderer.rules.fence!.bind(md.renderer.rules);
  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx];
    const code = token.content;
    const lang = token.info.trim();

    if (lang === 'echarts') {
      return originalFence(tokens, idx, options, env, slf);
    }

    const langObj = hljs.getLanguage(lang);
    let highlighted: string;
    if (langObj) {
      highlighted = hljs.highlight(code, { language: lang }).value;
    } else {
      highlighted = hljs.highlightAuto(code).value;
    }

    const langLabel = lang ? lang.toUpperCase() : 'TEXT';
    const langClass = lang ? lang.toLowerCase().replace(/[^a-z0-9_-]+/g, '') : 'plaintext';

    return `<div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-language">${escapeAttr(langLabel)}</span>
        <button class="code-copy-button" data-code="${escapeAttr(code)}">
          复制
        </button>
      </div>
      <pre class="hljs"><code class="language-${langClass}">${highlighted}</code></pre>
    </div>`;
  };
};

export default highlightPlugin;
