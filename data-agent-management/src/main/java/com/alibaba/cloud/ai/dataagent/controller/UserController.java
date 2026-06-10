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
package com.alibaba.cloud.ai.dataagent.controller;

import com.alibaba.cloud.ai.dataagent.service.UserService;
import com.alibaba.cloud.ai.dataagent.vo.ApiResponse;
import com.alibaba.cloud.ai.dataagent.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @description 用户管理控制器
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    /**
     * 获取所有用户列表
     */
    @GetMapping("/list")
    public ApiResponse<List<UserVO>> getAllUsers() {
        List<UserVO> users = userService.getAllUsers();
        return ApiResponse.success("查询成功", users);
    }
    
    /**
     * 启用用户
     */
    @PutMapping("/{userId}/enable")
    public ApiResponse<Void> enableUser(@PathVariable Long userId) {
        userService.enableUser(userId);
        return ApiResponse.success("用户已启用", null);
    }
    
    /**
     * 禁用用户
     */
    @PutMapping("/{userId}/disable")
    public ApiResponse<Void> disableUser(@PathVariable Long userId) {
        userService.disableUser(userId);
        return ApiResponse.success("用户已禁用", null);
    }
    
    /**
     * 删除用户
     */
    @DeleteMapping("/{userId}")
    public ApiResponse<Void> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ApiResponse.success("用户已删除", null);
    }
}
