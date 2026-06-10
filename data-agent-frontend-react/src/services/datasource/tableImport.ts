/*
 * Copyright 2024-2026 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import apiClient from '@/utils/request';
import type { TableImportResult } from '@/types/tableImport';

const API_BASE_URL = '/api/datasource';

/**
 * @description 从Excel导入表结构和数据
 * @param file - Excel文件对象
 * @param datasourceId - 数据源ID
 * @returns 导入结果
 */
export const importTableFromExcel = async (
  file: File,
  datasourceId: number
): Promise<TableImportResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response: any = await apiClient.post(
    `${API_BASE_URL}/${datasourceId}/import-table`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  // apiClient响应拦截器已解包response.data,这里再取data字段
  return response?.data || { success: false, errors: ['导入失败'] };
};

/**
 * @description 下载表导入模板
 * @returns void
 */
export const downloadTableImportTemplate = async (): Promise<void> => {
  // 由于我们无法直接生成Excel文件,这里提供一个示例说明
  // 实际项目中应该由后端提供模板下载接口
  const templateContent = `表导入模板说明:

第一个Sheet(表结构定义):
| 字段名* | 数据类型* | 是否主键 | 是否非空 | 默认值 | 字段注释 |
|---------|----------|---------|---------|--------|---------|
| id      | INT      | 是      | 是      |        | 主键ID  |
| name    | VARCHAR(100) | 否   | 是      |        | 姓名    |
| age     | INT      | 否      | 否      | 0      | 年龄    |

第二个Sheet(数据行,以表名命名):
| id | name | age |
|----|------|-----|
| 1  | 张三 | 25  |
| 2  | 李四 | 30  |

注意:
1. 带*号的列为必填项
2. 数据类型支持: INT, VARCHAR(n), DECIMAL(p,s), DATE, DATETIME, BOOLEAN等
3. 是否主键/是否非空填写"是"或"否"
4. 文件名将作为表名使用(自动转换为合法格式)
`;

  const blob = new Blob([templateContent], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'table_import_template_guide.txt');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
