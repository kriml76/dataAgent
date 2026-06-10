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

/**
 * 表导入字段项
 */
export interface TableImportItem {
  fieldName: string;
  dataType: string;
  isPrimaryKey?: string;
  isNotNull?: string;
  defaultValue?: string;
  comment?: string;
}

/**
 * 表导入结果
 */
export interface TableImportResult {
  success: boolean;
  message?: string;
  tableName?: string;
  rowCount?: number;
  errors?: string[];
}
