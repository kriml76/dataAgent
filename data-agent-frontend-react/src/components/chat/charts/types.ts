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

export interface ChartAxis {
  name: string;
  value: string;
  type?: 'x' | 'y' | 'series';
}

export interface ChartData {
  [key: string]: any;
}

export type ChartTypes = 'table' | 'bar' | 'column' | 'line' | 'pie';

export interface ResultDisplayStyleBO {
  type?: ChartTypes;
  title?: string;
  x?: string;
  y?: string[];
}

export interface ResultData {
  resultSet?: {
    column?: string[];
    data?: Record<string, any>[];
    errorMsg?: string;
  };
  displayStyle?: ResultDisplayStyleBO;
}

// 基础颜色面板
export const COLOR_PANEL = ['#5584FF', '#36CBCB', '#4ECB74', '#FAD337', '#F2637B', '#975FEE'];

// 扩展颜色数组
export const EXTENDED_COLORS = [
  ...COLOR_PANEL,
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
  '#ea7ccc',
  '#0082fc',
  '#fdd845',
  '#22ed7c',
  '#1d27c9',
  '#05f8d6',
  '#f9e264',
  '#f47a75',
  '#009db2',
];

// 生成随机颜色
export const generateRandomColor = (): string => {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
};

// 生成指定长度的唯一颜色数组
export const generateUniqueColors = (count: number): string[] => {
  const colors: string[] = [];
  const usedColors = new Set<string>();

  for (let i = 0; i < count; i++) {
    let color: string;

    if (i < EXTENDED_COLORS.length) {
      color = EXTENDED_COLORS[i];
      if (usedColors.has(color)) {
        do {
          color = generateRandomColor();
        } while (usedColors.has(color));
      }
    } else {
      do {
        color = generateRandomColor();
      } while (usedColors.has(color));
    }

    colors.push(color);
    usedColors.add(color);
  }

  return colors;
};
