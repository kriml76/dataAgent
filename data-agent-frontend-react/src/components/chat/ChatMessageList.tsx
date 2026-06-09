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

import { useChatStore } from '@/stores/chat';

const ChatMessageList = () => {
  const store = useChatStore();

  return (
    <div className="message-list">
      {store.currentMessages.map((msg: any) => (
        <div key={msg.id} className={`message-item message-${msg.role}`}>
          <div className="message-content">{msg.content}</div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessageList;
