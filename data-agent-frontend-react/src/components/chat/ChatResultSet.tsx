import React, { useMemo, useState } from 'react';
import { LeftOutlined, RightOutlined, InfoCircleOutlined } from '@ant-design/icons';
import './ChatResultSet.css';

export interface ResultData {
  resultSet?: {
    column?: string[];
    data?: Record<string, any>[];
    errorMsg?: string;
  };
}

interface ChatResultSetProps {
  data: ResultData | null;
  pageSize?: number;
}

const ChatResultSet: React.FC<ChatResultSetProps> = ({ data, pageSize = 20 }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const columns = useMemo(() => data?.resultSet?.column || [], [data]);
  const allRows = useMemo(() => data?.resultSet?.data || [], [data]);
  const totalRows = allRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const errorMsg = data?.resultSet?.errorMsg || '';

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allRows.slice(start, start + pageSize);
  }, [allRows, currentPage, pageSize]);

  if (errorMsg) {
    return (
      <div className="result-set-wrap">
        <div className="result-error">
          <InfoCircleOutlined style={{ marginRight: 4 }} />
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
      <div className="result-header">
        <span className="result-count">共 {totalRows} 条记录</span>
        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">第 {currentPage} / {totalPages} 页</span>
            <button
              className="page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <LeftOutlined />
            </button>
            <button
              className="page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <RightOutlined />
            </button>
          </div>
        )}
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
    </div>
  );
};

export default ChatResultSet;
