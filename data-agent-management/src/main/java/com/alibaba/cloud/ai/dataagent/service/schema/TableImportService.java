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
package com.alibaba.cloud.ai.dataagent.service.schema;

import com.alibaba.cloud.ai.dataagent.bo.DbConfigBO;
import com.alibaba.cloud.ai.dataagent.connector.pool.DBConnectionPool;
import com.alibaba.cloud.ai.dataagent.dto.schema.TableStructureDTO;
import com.alibaba.cloud.ai.dataagent.entity.Datasource;
import com.alibaba.cloud.ai.dataagent.service.datasource.DatasourceService;
import com.alibaba.cloud.ai.dataagent.util.DdlGenerator;
import com.alibaba.cloud.ai.dataagent.vo.TableImportResult;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.sql.*;
import java.util.List;
import java.util.Map;

/**
 * 表导入服务
 * 负责执行DDL建表和批量插入数据
 *
 * @author DataAgent Team
 * @since 2026-06-10
 */
@Service
@Slf4j
@AllArgsConstructor
public class TableImportService {

	private final TableImportExcelService excelService;
	private final DatasourceService datasourceService;
	private final DBConnectionPool dbConnectionPool;
	private final DdlGenerator ddlGenerator;

	/**
	 * 从Excel导入表结构和数据
	 *
	 * @param inputStream Excel文件输入流
	 * @param filename 文件名
	 * @param datasourceId 数据源ID
	 * @return 导入结果
	 */
	@Transactional(rollbackFor = Exception.class)
	public TableImportResult importTableFromExcel(InputStream inputStream, String filename, Integer datasourceId) {
		log.info("开始从Excel导入表: datasourceId={}, filename={}", datasourceId, filename);

		TableImportResult result = TableImportResult.builder()
			.success(false)
			.rowCount(0)
			.build();

		Connection connection = null;
		try {
			// 1. 获取数据源配置
			Datasource datasource = datasourceService.getDatasourceById(datasourceId);
			if (datasource == null) {
				result.addError("数据源不存在: ID=" + datasourceId);
				return result;
			}

			DbConfigBO dbConfig = datasourceService.getDbConfig(datasource);
			String dialect = dbConfig.getDialectType();

			// 2. 解析Excel文件
			TableStructureDTO tableStructure;
			try {
				tableStructure = excelService.parseExcel(inputStream, filename);
			} catch (IOException e) {
				result.addError("Excel解析失败: " + e.getMessage());
				return result;
			}

			String tableName = tableStructure.getTableName();
			result.setTableName(tableName);

			log.info("解析Excel成功: 表名={}, 字段数={}, 数据行数={}", 
				tableName, 
				tableStructure.getColumns().size(),
				tableStructure.getDataRows() != null ? tableStructure.getDataRows().size() : 0);

			// 3. 获取数据库连接
			connection = dbConnectionPool.getConnection(dbConfig);
			connection.setAutoCommit(false);

			// 4. 生成并执行CREATE TABLE DDL
			String createTableSql = ddlGenerator.generateCreateTableSql(
				tableName, 
				tableStructure.getColumns(), 
				dialect
			);

			log.info("执行CREATE TABLE: {}", createTableSql);
			try (Statement statement = connection.createStatement()) {
				statement.execute(createTableSql);
				log.info("表 '{}' 创建成功", tableName);
			} catch (SQLException e) {
				result.addError("创建表失败: " + e.getMessage());
				connection.rollback();
				return result;
			}

			// 5. 批量插入数据
			List<Map<String, Object>> dataRows = tableStructure.getDataRows();
			if (dataRows != null && !dataRows.isEmpty()) {
				int insertedRows = insertDataBatch(connection, tableName, tableStructure.getColumns(), dataRows);
				result.setRowCount(insertedRows);
				log.info("成功插入 {} 行数据到表 '{}'", insertedRows, tableName);
			}

			// 6. 提交事务
			connection.commit();
			result.setSuccess(true);
			result.setMessage(String.format("表 '%s' 导入成功,共插入 %d 行数据", tableName, result.getRowCount()));

			log.info("Excel导入完成: {}", result.getMessage());
			return result;

		} catch (Exception e) {
			log.error("Excel导入失败", e);
			result.addError("导入失败: " + e.getMessage());
			
			if (connection != null) {
				try {
					connection.rollback();
					log.warn("事务已回滚");
				} catch (SQLException ex) {
					log.error("回滚失败", ex);
				}
			}
			
			return result;
		} finally {
			if (connection != null) {
				try {
					connection.close();
				} catch (SQLException e) {
					log.error("关闭连接失败", e);
				}
			}
		}
	}

	/**
	 * 批量插入数据
	 *
	 * @param connection 数据库连接
	 * @param tableName 表名
	 * @param columns 字段定义
	 * @param dataRows 数据行
	 * @return 插入的行数
	 */
	private int insertDataBatch(Connection connection, String tableName, 
								 List<com.alibaba.cloud.ai.dataagent.dto.schema.TableImportItem> columns,
								 List<Map<String, Object>> dataRows) throws SQLException {
		
		if (dataRows == null || dataRows.isEmpty()) {
			return 0;
		}

		// 构建INSERT语句
		List<String> fieldNames = columns.stream()
			.map(col -> "`" + col.getFieldName() + "`")
			.toList();
		
		String placeholders = String.join(", ", columns.stream().map(c -> "?").toList());
		String insertSql = "INSERT INTO `" + tableName + "` (" + 
			String.join(", ", fieldNames) + ") VALUES (" + placeholders + ")";

		log.debug("INSERT SQL: {}", insertSql);

		int totalInserted = 0;
		int batchSize = 1000; // 每批1000条
		
		try (PreparedStatement ps = connection.prepareStatement(insertSql)) {
			for (int i = 0; i < dataRows.size(); i++) {
				Map<String, Object> row = dataRows.get(i);
				
				// 设置参数
				for (int j = 0; j < columns.size(); j++) {
					com.alibaba.cloud.ai.dataagent.dto.schema.TableImportItem column = columns.get(j);
					Object value = row.get(column.getFieldName());
					
					if (value == null || ((String) value).trim().isEmpty()) {
						ps.setNull(j + 1, Types.VARCHAR);
					} else {
						setParameterValue(ps, j + 1, value.toString(), column.getDataType());
					}
				}
				
				ps.addBatch();
				
				// 每batchSize条执行一次
				if ((i + 1) % batchSize == 0 || i == dataRows.size() - 1) {
					int[] results = ps.executeBatch();
					totalInserted += results.length;
					log.debug("批次插入完成: 当前累计 {} 行", totalInserted);
				}
			}
		}

		return totalInserted;
	}

	/**
	 * 根据数据类型设置参数值
	 */
	private void setParameterValue(PreparedStatement ps, int index, String value, String dataType) throws SQLException {
		if (value == null || value.trim().isEmpty()) {
			ps.setNull(index, Types.VARCHAR);
			return;
		}

		String upperType = dataType.toUpperCase().trim();
		
		try {
			if (upperType.matches("^INT(\\d+)?$") || "INTEGER".equals(upperType)) {
				ps.setInt(index, Integer.parseInt(value));
			} else if (upperType.startsWith("DECIMAL") || upperType.startsWith("NUMERIC")) {
				ps.setBigDecimal(index, new java.math.BigDecimal(value));
			} else if ("DOUBLE".equals(upperType) || "FLOAT".equals(upperType)) {
				ps.setDouble(index, Double.parseDouble(value));
			} else if ("DATE".equals(upperType)) {
				ps.setDate(index, Date.valueOf(value));
			} else if ("DATETIME".equals(upperType) || "TIMESTAMP".equals(upperType)) {
				ps.setTimestamp(index, Timestamp.valueOf(value));
			} else if ("BOOLEAN".equals(upperType) || "BOOL".equals(upperType) || "TINYINT(1)".equals(upperType)) {
				ps.setInt(index, ("true".equalsIgnoreCase(value) || "1".equals(value) || "是".equals(value)) ? 1 : 0);
			} else {
				// 默认作为字符串处理
				ps.setString(index, value);
			}
		} catch (Exception e) {
			log.warn("类型转换失败,作为字符串处理: 字段值='{}', 类型='{}', 错误: {}", value, dataType, e.getMessage());
			ps.setString(index, value);
		}
	}

}
