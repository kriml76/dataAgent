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

import com.alibaba.cloud.ai.dataagent.dto.schema.TableImportItem;
import com.alibaba.cloud.ai.dataagent.dto.schema.TableStructureDTO;
import com.alibaba.excel.EasyExcel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 表导入Excel解析服务
 *
 * @author DataAgent Team
 * @since 2026-06-10
 */
@Service
@Slf4j
public class TableImportExcelService {

	/**
	 * 解析Excel文件,提取表结构和数据
	 *
	 * @param inputStream Excel文件输入流
	 * @param filename 文件名
	 * @return 表结构DTO
	 * @throws IOException 解析失败时抛出异常
	 */
	public TableStructureDTO parseExcel(InputStream inputStream, String filename) throws IOException {
		log.info("开始解析Excel文件: {}", filename);

		try {
			// 将 InputStream 转换为 byte[] 以便重复读取
			byte[] excelBytes = inputStream.readAllBytes();

			// 先以原始方式读取，查看实际内容
			List<Map<Integer, String>> rawContent = EasyExcel.read(new java.io.ByteArrayInputStream(excelBytes))
				.sheet(0)
				.doReadSync();
			
			log.info("第一个Sheet原始行数: {}", rawContent != null ? rawContent.size() : 0);
			if (rawContent != null && !rawContent.isEmpty()) {
				log.info("第一行(表头): {}", rawContent.get(0));
				if (rawContent.size() > 1) {
					log.info("第二行(第一行数据): {}", rawContent.get(1));
				}
			}

			// 读取第一个Sheet获取表结构定义
			List<TableImportItem> columns = EasyExcel.read(new java.io.ByteArrayInputStream(excelBytes))
				.head(TableImportItem.class)
				.sheet(0)
				.doReadSync();

			log.info("解析到的表结构行数: {}", columns != null ? columns.size() : 0);

			if (columns == null || columns.isEmpty()) {
				StringBuilder hint = new StringBuilder("Excel文件中没有有效的表结构定义。");
				hint.append("\n请检查:");
				hint.append("\n1. 第一列标题应为'字段名'或'字段名*'");
				hint.append("\n2. 第二列标题应为'数据类型'或'数据类型*'");
				hint.append("\n3. 文件格式建议使用.xlsx(建议下载模板参考)");
				if (rawContent != null && !rawContent.isEmpty()) {
					hint.append("\n实际读取到的第一行内容: ").append(rawContent.get(0));
				}
				throw new IllegalArgumentException(hint.toString());
			}

			// 验证必填字段
			for (int i = 0; i < columns.size(); i++) {
				TableImportItem item = columns.get(i);
				int rowNum = i + 2; // Excel行号从2开始(第1行是表头)

				log.info("解析第{}行: fieldName='{}', dataType='{}'", 
					rowNum, item.getFieldName(), item.getDataType());

				if (item.getFieldName() == null || item.getFieldName().trim().isEmpty()) {
					throw new IllegalArgumentException(String.format(
						"第%d行: 字段名不能为空。请确保第一列表头为'字段名'或'字段名*'", rowNum));
				}
				if (item.getDataType() == null || item.getDataType().trim().isEmpty()) {
					throw new IllegalArgumentException(String.format(
						"第%d行: 数据类型不能为空。请确保第二列表头为'数据类型'或'数据类型*',且每行数据都已填写", rowNum));
				}

				// 清理字段值
				item.setFieldName(item.getFieldName().trim());
				item.setDataType(item.getDataType().trim());
				if (item.getIsPrimaryKey() != null) {
					item.setIsPrimaryKey(item.getIsPrimaryKey().trim());
				}
				if (item.getIsNotNull() != null) {
					item.setIsNotNull(item.getIsNotNull().trim());
				}
				if (item.getDefaultValue() != null) {
					item.setDefaultValue(item.getDefaultValue().trim());
				}
				if (item.getComment() != null) {
					item.setComment(item.getComment().trim());
				}
			}

			// 使用第一个字段名作为表名(或者可以从其他地方获取)
			// 这里我们假设表名需要从第二个Sheet的名称获取
			// 由于EasyExcel的限制,我们需要重新读取来获取Sheet名称
			// 简化处理: 使用第一个字段的注释作为表名,或者要求用户在文件名中指定
			
			// 读取第二个Sheet获取数据行
			List<Map<String, Object>> dataRows = new ArrayList<>();
			try {
				// 尝试读取所有Sheet,找到非表结构定义的Sheet
				List<Object> allSheets = EasyExcel.read(new java.io.ByteArrayInputStream(excelBytes)).doReadAllSync();
				
				log.info("Excel总Sheet数: {}", allSheets.size());
				
				if (allSheets.size() > 1) {
					// 第二个Sheet包含数据
					List<Map<Integer, String>> rawData = (List<Map<Integer, String>>) allSheets.get(1);
					
					log.info("第二个Sheet原始行数: {}", rawData != null ? rawData.size() : 0);
					log.info("表结构字段数: {}, 准备按索引匹配数据列", columns.size());
					
					if (rawData != null && !rawData.isEmpty()) {
						// 第一行是表头
						Map<Integer, String> headerRow = rawData.get(0);
						log.info("第二个Sheet表头: {}", headerRow);
						
						// 构建字段名映射（按索引匹配）
						Map<Integer, String> columnIndexMap = new LinkedHashMap<>();
						for (int i = 0; i < columns.size(); i++) {
							columnIndexMap.put(i, columns.get(i).getFieldName());
						}
						
						// 解析数据行
						for (int i = 1; i < rawData.size(); i++) {
							Map<Integer, String> row = rawData.get(i);
							if (row == null || row.isEmpty()) {
								continue;
							}
							
							Map<String, Object> dataRow = new LinkedHashMap<>();
							for (Map.Entry<Integer, String> entry : columnIndexMap.entrySet()) {
								String fieldName = entry.getValue();
								String value = row.get(entry.getKey());
								dataRow.put(fieldName, value);
							}
							
							// 只添加非空行
							if (!dataRow.values().stream().allMatch(v -> v == null || ((String) v).trim().isEmpty())) {
								dataRows.add(dataRow);
							}
						}
					}
				} else {
					log.info("只有1个Sheet,不导入数据");
				}
			} catch (Exception e) {
				log.warn("读取数据Sheet失败,将只导入表结构: {}", e.getMessage(), e);
			}

			// 生成表名: 从文件名提取或使用默认值
			String tableName = extractTableNameFromFilename(filename);

			TableStructureDTO result = TableStructureDTO.builder()
				.tableName(tableName)
				.columns(columns)
				.dataRows(dataRows)
				.build();

			log.info("成功解析Excel文件: 表名={}, 字段数={}, 数据行数={}", 
				tableName, columns.size(), dataRows.size());
			return result;
		}
		catch (Exception e) {
			log.error("解析Excel文件失败: {}", filename, e);
			throw new IOException("解析Excel文件失败: " + e.getMessage(), e);
		}
	}

	/**
	 * 从文件名提取表名
	 */
	private String extractTableNameFromFilename(String filename) {
		if (filename == null || filename.isEmpty()) {
			return "imported_table";
		}
		
		// 去除扩展名
		int dotIndex = filename.lastIndexOf('.');
		String nameWithoutExt = dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
		
		// 替换非法字符
		String tableName = nameWithoutExt.replaceAll("[^a-zA-Z0-9_]", "_");
		
		// 确保以字母开头
		if (!tableName.matches("^[a-zA-Z].*")) {
			tableName = "t_" + tableName;
		}
		
		return tableName.toLowerCase();
	}

	/**
	 * 自动识别模式解析Excel - 第一行作为字段名，自动推断字段类型
	 */
	public TableStructureDTO parseExcelAutoDetect(byte[] excelBytes, String filename) throws IOException {
		log.info("自动识别模式解析Excel文件: {}", filename);
		
		try {
			// 读取第一个Sheet
			List<Map<Integer, String>> rawData = EasyExcel.read(new java.io.ByteArrayInputStream(excelBytes))
				.sheet(0)
				.doReadSync();
			
			if (rawData == null || rawData.isEmpty()) {
				throw new IllegalArgumentException("Excel文件为空");
			}
			
			// 第一行作为字段名
			Map<Integer, String> headerRow = rawData.get(0);
			log.info("检测到字段名: {}", headerRow);
			
			if (headerRow.isEmpty()) {
				throw new IllegalArgumentException("Excel第一行(表头)为空");
			}
			
			// 构建字段列表
			List<com.alibaba.cloud.ai.dataagent.dto.schema.TableImportItem> columns = new ArrayList<>();
			Map<Integer, String> columnIndexMap = new LinkedHashMap<>();
			
			for (Map.Entry<Integer, String> entry : headerRow.entrySet()) {
				String fieldName = entry.getValue();
				if (fieldName == null || fieldName.trim().isEmpty()) {
					continue;
				}
				
				// 清理字段名
				fieldName = fieldName.trim().replaceAll("[^a-zA-Z0-9_]", "_").toLowerCase();
				if (!fieldName.matches("^[a-zA-Z].*")) {
					fieldName = "col_" + fieldName;
				}
				
				com.alibaba.cloud.ai.dataagent.dto.schema.TableImportItem column = 
					com.alibaba.cloud.ai.dataagent.dto.schema.TableImportItem.builder()
					.fieldName(fieldName)
					.dataType("VARCHAR(255)") // 默认类型
					.isPrimaryKey("否")
					.isNotNull("否")
					.comment(entry.getValue())
					.build();
				
				columns.add(column);
				columnIndexMap.put(entry.getKey(), fieldName);
			}
			
			log.info("识别到 {} 个字段", columns.size());
			
			// 根据前10行数据推断字段类型
			int sampleRows = Math.min(10, rawData.size() - 1);
			if (sampleRows > 0) {
				inferColumnTypes(columns, columnIndexMap, rawData.subList(1, sampleRows + 1));
				log.info("类型推断完成: {}", columns.stream().map(c -> c.getFieldName() + ":" + c.getDataType()).toList());
			}
			
			// 解析所有数据行
			List<Map<String, Object>> dataRows = new ArrayList<>();
			for (int i = 1; i < rawData.size(); i++) {
				Map<Integer, String> row = rawData.get(i);
				if (row == null || row.isEmpty()) {
					continue;
				}
				
				Map<String, Object> dataRow = new LinkedHashMap<>();
				for (Map.Entry<Integer, String> entry : columnIndexMap.entrySet()) {
					String value = row.get(entry.getKey());
					dataRow.put(entry.getValue(), value);
				}
				
				// 只添加非空行
				if (!dataRow.values().stream().allMatch(v -> v == null || ((String) v).trim().isEmpty())) {
					dataRows.add(dataRow);
				}
			}
			
			String tableName = extractTableNameFromFilename(filename);
			
			log.info("自动识别解析完成: 表名={}, 字段数={}, 数据行数={}", 
				tableName, columns.size(), dataRows.size());
			
			return TableStructureDTO.builder()
				.tableName(tableName)
				.columns(columns)
				.dataRows(dataRows)
				.build();
				
		} catch (Exception e) {
			log.error("自动识别模式解析Excel失败: {}", filename, e);
			throw new IOException("解析Excel文件失败: " + e.getMessage(), e);
		}
	}
	
	/**
	 * 根据数据样例推断字段类型
	 */
	private void inferColumnTypes(List<com.alibaba.cloud.ai.dataagent.dto.schema.TableImportItem> columns,
			Map<Integer, String> columnIndexMap, List<Map<Integer, String>> sampleData) {
		
		Map<String, Integer> maxLengthMap = new java.util.HashMap<>();
		Map<String, Boolean> isIntegerMap = new java.util.HashMap<>();
		Map<String, Boolean> isDecimalMap = new java.util.HashMap<>();
		Map<String, Boolean> isDateMap = new java.util.HashMap<>();
		
		// 初始化
		for (com.alibaba.cloud.ai.dataagent.dto.schema.TableImportItem column : columns) {
			maxLengthMap.put(column.getFieldName(), 0);
			isIntegerMap.put(column.getFieldName(), true);
			isDecimalMap.put(column.getFieldName(), true);
			isDateMap.put(column.getFieldName(), true);
		}
		
		// 分析每一行数据
		for (Map<Integer, String> row : sampleData) {
			for (Map.Entry<Integer, String> entry : columnIndexMap.entrySet()) {
				String fieldName = entry.getValue();
				String value = row.get(entry.getKey());
				
				if (value == null || value.trim().isEmpty()) {
					continue;
				}
				
				value = value.trim();
				
				// 更新最大长度
				maxLengthMap.put(fieldName, Math.max(maxLengthMap.get(fieldName), value.length()));
				
				// 检查是否为整数
				if (isIntegerMap.get(fieldName)) {
					isIntegerMap.put(fieldName, value.matches("^-?\\d+$"));
				}
				
				// 检查是否为小数
				if (isDecimalMap.get(fieldName)) {
					isDecimalMap.put(fieldName, value.matches("^-?\\d+\\.\\d+$") || isIntegerMap.get(fieldName));
				}
				
				// 检查是否为日期 (简化判断)
				if (isDateMap.get(fieldName)) {
					isDateMap.put(fieldName, 
						value.matches("^\\d{4}-\\d{2}-\\d{2}.*") || 
						value.matches("^\\d{4}/\\d{2}/\\d{2}.*"));
				}
			}
		}
		
		// 设置字段类型
		for (com.alibaba.cloud.ai.dataagent.dto.schema.TableImportItem column : columns) {
			String fieldName = column.getFieldName();
			
			if (Boolean.TRUE.equals(isIntegerMap.get(fieldName))) {
				column.setDataType("BIGINT");
			} else if (Boolean.TRUE.equals(isDecimalMap.get(fieldName))) {
				column.setDataType("DECIMAL(20,6)");
			} else if (Boolean.TRUE.equals(isDateMap.get(fieldName))) {
				column.setDataType("DATETIME");
			} else {
				Integer maxLen = maxLengthMap.get(fieldName);
				if (maxLen != null && maxLen > 0) {
					if (maxLen > 2000) {
						column.setDataType("TEXT");
					} else {
						column.setDataType("VARCHAR(" + Math.max(255, maxLen * 2) + ")");
					}
				} else {
					column.setDataType("VARCHAR(255)");
				}
			}
		}
	}

}
