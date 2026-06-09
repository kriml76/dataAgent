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

import React from 'react';
import { Card } from 'antd';

const SystemAgentsPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Agent Studio</h1>
      <p style={{ color: '#6b6b6b', marginTop: 8 }}>
        Advanced agent configuration and system settings.
      </p>
      <Card bordered={false} style={{ marginTop: 24 }}>
        <div style={{ textAlign: 'center', padding: 40, color: '#6b6b6b' }}>
          Agent Studio coming soon...
        </div>
      </Card>
    </div>
  );
};

export default SystemAgentsPage;
