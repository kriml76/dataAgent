/*
 * Copyright 2026 the original author or authors.
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
package com.alibaba.cloud.ai.dataagent.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * @description 用户实体类
 */
@Data
public class User {
    private Long id;
    private String username;      // 用户名(唯一)
    private String password;      // BCrypt加密后的密码
    private String email;         // 邮箱(可选)
    private String nickname;      // 昵称
    private String avatar;        // 头像URL
    private Integer status;       // 状态: 1-启用, 0-禁用
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
