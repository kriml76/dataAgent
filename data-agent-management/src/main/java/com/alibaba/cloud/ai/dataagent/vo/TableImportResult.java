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
package com.alibaba.cloud.ai.dataagent.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 表导入结果
 *
 * @author DataAgent Team
 * @since 2026-06-10
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableImportResult {

	/**
	 * 是否成功
	 */
	private Boolean success;

	/**
	 * 结果消息
	 */
	private String message;

	/**
	 * 表名
	 */
	private String tableName;

	/**
	 * 导入的行数
	 */
	private Integer rowCount;

	/**
	 * 错误信息列表
	 */
	@Builder.Default
	private List<String> errors = new ArrayList<>();

	/**
	 * 添加错误信息
	 */
	public void addError(String error) {
		if (this.errors == null) {
			this.errors = new ArrayList<>();
		}
		this.errors.add(error);
	}

}
