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
package com.alibaba.cloud.ai.dataagent.dto.schema;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 表导入字段定义项
 *
 * @author DataAgent Team
 * @since 2026-06-10
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableImportItem {

	/**
	 * 字段名(必填)
	 */
	@ExcelProperty(value = "字段名*", index = 0)
	private String fieldName;

	/**
	 * 数据类型(必填),如: VARCHAR(255), INT, DECIMAL(10,2), DATE等
	 */
	@ExcelProperty(value = "数据类型*", index = 1)
	private String dataType;

	/**
	 * 是否主键: 是/否
	 */
	@ExcelProperty(value = "是否主键", index = 2)
	private String isPrimaryKey;

	/**
	 * 是否非空: 是/否
	 */
	@ExcelProperty(value = "是否非空", index = 3)
	private String isNotNull;

	/**
	 * 默认值
	 */
	@ExcelProperty(value = "默认值", index = 4)
	private String defaultValue;

	/**
	 * 字段注释
	 */
	@ExcelProperty(value = "字段注释", index = 5)
	private String comment;

}
