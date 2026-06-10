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
package com.alibaba.cloud.ai.dataagent.util;

import com.alibaba.cloud.ai.dataagent.dto.schema.TableImportItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

/**
 * DDL语句生成器
 * 根据不同数据库方言生成CREATE TABLE语句
 *
 * @author DataAgent Team
 * @since 2026-06-10
 */
@Component
@Slf4j
public class DdlGenerator {

	private static final Pattern VALID_IDENTIFIER_PATTERN = Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_]*$");

	/**
	 * 生成CREATE TABLE SQL语句
	 *
	 * @param tableName 表名
	 * @param columns 字段定义列表
	 * @param dialect 数据库方言(mysql, postgresql, oracle, sqlserver等)
	 * @return CREATE TABLE SQL语句
	 */
	public String generateCreateTableSql(String tableName, List<TableImportItem> columns, String dialect) {
		// 验证表名
		validateIdentifier(tableName, "表名");

		StringBuilder sql = new StringBuilder();
		
		// 根据方言选择包装符号
		String quoteChar = getQuoteChar(dialect);
		
		sql.append("CREATE TABLE IF NOT EXISTS ").append(quoteChar).append(tableName).append(quoteChar).append(" (\n");

		List<String> columnDefinitions = new java.util.ArrayList<>();
		List<String> primaryKeys = new java.util.ArrayList<>();

		for (TableImportItem column : columns) {
			// 验证字段名
			validateIdentifier(column.getFieldName(), "字段名");

			StringBuilder columnDef = new StringBuilder();
			columnDef.append("  ").append(quoteChar).append(column.getFieldName()).append(quoteChar);
			columnDef.append(" ").append(normalizeDataType(column.getDataType(), dialect));

			// 处理NOT NULL约束
			if ("是".equals(column.getIsNotNull()) || "true".equalsIgnoreCase(column.getIsNotNull())) {
				columnDef.append(" NOT NULL");
			}

			// 处理默认值
			if (column.getDefaultValue() != null && !column.getDefaultValue().trim().isEmpty()) {
				columnDef.append(" DEFAULT ").append(formatDefaultValue(column.getDefaultValue(), column.getDataType()));
			}

			// 添加注释
			if (column.getComment() != null && !column.getComment().trim().isEmpty()) {
				if ("mysql".equalsIgnoreCase(dialect)) {
					columnDef.append(" COMMENT '").append(escapeSql(column.getComment())).append("'");
				}
			}

			columnDefinitions.add(columnDef.toString());

			// 收集主键字段
			if ("是".equals(column.getIsPrimaryKey()) || "true".equalsIgnoreCase(column.getIsPrimaryKey())) {
				primaryKeys.add(quoteChar + column.getFieldName() + quoteChar);
			}
		}

		// 添加字段定义
		sql.append(String.join(",\n", columnDefinitions));

		// 添加主键约束
		if (!primaryKeys.isEmpty()) {
			sql.append(",\n  PRIMARY KEY (").append(String.join(", ", primaryKeys)).append(")");
		}

		sql.append("\n)");

		// 添加表级选项(针对MySQL)
		if ("mysql".equalsIgnoreCase(dialect)) {
			sql.append(" ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='").append(escapeSql(tableName)).append("'");
		}

		sql.append(";");

		log.debug("Generated DDL for table '{}': {}", tableName, sql);
		return sql.toString();
	}

	/**
	 * 获取不同数据库的标识符包装字符
	 */
	private String getQuoteChar(String dialect) {
		if ("postgresql".equalsIgnoreCase(dialect) || "postgres".equalsIgnoreCase(dialect)) {
			return "\"";
		} else if ("oracle".equalsIgnoreCase(dialect)) {
			return "\"";
		} else if ("sqlserver".equalsIgnoreCase(dialect) || "mssql".equalsIgnoreCase(dialect)) {
			return "\"";
		} else {
			// MySQL, H2, Dameng等使用反引号
			return "`";
		}
	}

	/**
	 * 标准化数据类型,根据不同数据库方言进行转换
	 */
	private String normalizeDataType(String dataType, String dialect) {
		if (dataType == null || dataType.trim().isEmpty()) {
			return "VARCHAR(255)";
		}

		String normalized = dataType.trim().toUpperCase();

		// 通用类型映射
		if (normalized.matches("^INT(\\d+)?$") || "INTEGER".equals(normalized)) {
			return "INTEGER";
		} else if (normalized.startsWith("VARCHAR")) {
			return normalized;
		} else if (normalized.startsWith("CHAR")) {
			return normalized;
		} else if (normalized.startsWith("DECIMAL") || normalized.startsWith("NUMERIC")) {
			return normalized;
		} else if ("DOUBLE".equals(normalized) || "FLOAT".equals(normalized)) {
			return normalized;
		} else if ("DATE".equals(normalized)) {
			return "DATE";
		} else if ("DATETIME".equals(normalized) || "TIMESTAMP".equals(normalized)) {
			if ("postgresql".equalsIgnoreCase(dialect)) {
				return "TIMESTAMP";
			}
			return "DATETIME";
		} else if ("BOOLEAN".equals(normalized) || "BOOL".equals(normalized)) {
			if ("mysql".equalsIgnoreCase(dialect)) {
				return "TINYINT(1)";
			}
			return "BOOLEAN";
		} else if ("TEXT".equals(normalized)) {
			if ("mysql".equalsIgnoreCase(dialect)) {
				return "TEXT";
			} else if ("postgresql".equalsIgnoreCase(dialect)) {
				return "TEXT";
			} else if ("oracle".equalsIgnoreCase(dialect)) {
				return "CLOB";
			}
			return "TEXT";
		}

		// 如果无法识别,返回原始值
		return dataType.trim();
	}

	/**
	 * 格式化默认值
	 */
	private String formatDefaultValue(String defaultValue, String dataType) {
		if (defaultValue == null || defaultValue.trim().isEmpty()) {
			return "NULL";
		}

		String value = defaultValue.trim();

		// 数字类型不需要引号
		if (dataType.toUpperCase().matches("^(INT|INTEGER|DECIMAL|NUMERIC|DOUBLE|FLOAT|BIGINT|SMALLINT).*")) {
			return value;
		}

		// 布尔类型
		if (dataType.toUpperCase().matches("^(BOOLEAN|BOOL|TINYINT\\(1\\))")) {
			if ("true".equalsIgnoreCase(value) || "1".equals(value) || "是".equals(value)) {
				return "1";
			}
			return "0";
		}

		// 字符串类型需要引号
		return "'" + escapeSql(value) + "'";
	}

	/**
	 * 转义SQL字符串中的特殊字符
	 */
	private String escapeSql(String value) {
		if (value == null) {
			return "";
		}
		return value.replace("'", "''").replace("\\", "\\\\");
	}

	/**
	 * 验证标识符(表名、字段名)是否合法
	 */
	private void validateIdentifier(String identifier, String fieldName) {
		if (identifier == null || identifier.trim().isEmpty()) {
			throw new IllegalArgumentException(fieldName + "不能为空");
		}

		String trimmed = identifier.trim();
		if (!VALID_IDENTIFIER_PATTERN.matcher(trimmed).matches()) {
			throw new IllegalArgumentException(fieldName + " '" + trimmed + 
				"' 包含非法字符,只允许字母、数字和下划线,且必须以字母或下划线开头");
		}

		// 检查长度
		if (trimmed.length() > 64) {
			throw new IllegalArgumentException(fieldName + "长度不能超过64个字符");
		}
	}

}
