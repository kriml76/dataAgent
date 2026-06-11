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

import React, { useMemo, useState, useEffect } from 'react';
import {
  InfoCircleOutlined,
  BarChartOutlined,
  TableOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';
import ChatChartComponent from './ChatChartComponent';
import type { ResultData } from './charts/types';
import './ChatResultSet.css';

interface ChatResultSetProps {
  data: ResultData | null;
  pageSize?: number;
}

const ChatResultSet: React.FC<ChatResultSetProps> = ({ data, pageSize = 20 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isChartView, setIsChartView] = useState(true);

  const columns = useMemo(() => data?.resultSet?.column || [], [data]);
  const allRows = useMemo(() => data?.resultSet?.data || [], [data]);
  const totalRows = allRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const errorMsg = data?.resultSet?.errorMsg || '';

  // 判断是否支持图表显示
  const showChart = useMemo(() => {
    return (
      data &&
      data.displayStyle?.type &&
      data.displayStyle?.type !== 'table' &&
      allRows.length > 0
    );
  }, [data, allRows.length]);

  // 默认显示图表
  useEffect(() => {
    setIsChartView(showChart);
  }, [showChart]);

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allRows.slice(start, start + pageSize);
  }, [allRows, currentPage, pageSize]);

  const copyJsonData = () => {
    try {
      const jsonData = JSON.stringify(allRows, null, 2);
      navigator.clipboard
        .writeText(jsonData)
        .then(() => {
          message.success('数据已复制到剪贴板');
        })
        .catch(() => {
          message.error('复制失败');
        });
    } catch {
      message.error('复制失败');
    }
  };

  if (errorMsg) {
    return (
      <div className="result-set-wrap">
        <div className="result-error">
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          {errorMsg}
        </div>
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="result-set-wrap">
        <div className="result-empty">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="result-set-wrap">
      {/* 头部工具栏 */}
      <div className="result-set-header-bar">
        <div className="result-set-title">
          {data?.displayStyle?.title || '查询结果'}
        </div>
        {showChart && (
          <div className="result-set-tools">
            <Tooltip title="图表">
              <Button
                type="text"
                size="small"
                icon={<BarChartOutlined />}
                className={`tool-btn ${isChartView ? 'view-active' : ''}`}
                onClick={() => setIsChartView(true)}
              />
            </Tooltip>
            <Tooltip title="表格">
              <Button
                type="text"
                size="small"
                icon={<TableOutlined />}
                className={`tool-btn ${!isChartView ? 'view-active' : ''}`}
                onClick={() => setIsChartView(false)}
              />
            </Tooltip>
            <Tooltip title="复制JSON">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                className="tool-btn"
                onClick={copyJsonData}
              />
            </Tooltip>
          </div>
        )}
      </div>

      {/* 显示区域 */}
      <div className="result-show-area">
        {isChartView && showChart ? (
          <ChatChartComponent resultData={data!} />
        ) : (
          <>
            <div className="result-header">
              <div className="result-info">
                <span>查询结果 (共 {totalRows} 条记录)</span>
                <div className="pagination-controls">
                  <span className="pagination-info">
                    第 <span className="current-page">{currentPage}</span> 页，共 {totalPages} 页
                  </span>
                  <div className="pagination-buttons">
                    <button
                      className="pagination-btn pagination-prev"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      上一页
                    </button>
                    <button
                      className="pagination-btn pagination-next"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="table-container custom-scrollbar">
              <table className="result-table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((row, i) => (
                    <tr key={i}>
                      {columns.map((col) => (
                        <td key={col}>{row[col] ?? ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatResultSet;
