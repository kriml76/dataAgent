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

const API_BASE_URL = '/datasource';

/**
 * @description 从Excel导入表结构和数据 (标准模式)
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
 * @description 从Excel导入表结构和数据 (自动识别模式)
 * @param file - Excel文件对象
 * @param datasourceId - 数据源ID
 * @returns 导入结果
 */
export const importTableFromExcelAutoDetect = async (
  file: File,
  datasourceId: number
): Promise<TableImportResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response: any = await apiClient.post(
    `${API_BASE_URL}/${datasourceId}/import-table-auto`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response?.data || { success: false, errors: ['导入失败'] };
};

/**
 * @description 下载表导入模板
 * @returns void
 */
export const downloadTableImportTemplate = async (): Promise<void> => {
  try {
    const response = await fetch('/api/datasource/import-table/template');
    if (!response.ok) {
      throw new Error('下载模板失败');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'table_import_template.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('下载模板失败:', error);
    throw error;
  }
};
