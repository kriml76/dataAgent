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

import com.alibaba.cloud.ai.dataagent.dto.LoginRequest;
import com.alibaba.cloud.ai.dataagent.service.AuthService;
import com.alibaba.cloud.ai.dataagent.vo.ApiResponse;
import com.alibaba.cloud.ai.dataagent.vo.LoginResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * @description 认证控制器,处理登录、注册等认证相关请求
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    /**
     * 用户登录
     * @param request 登录请求
     * @return 登录响应
     */
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.success("登录成功", response);
    }
    
    /**
     * 用户注册
     * @param request 注册请求
     * @return 注册响应
     */
    @PostMapping("/register")
    public ApiResponse<LoginResponse> register(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.register(request);
        return ApiResponse.success("注册成功", response);
    }
    
    /**
     * 验证Token
     * @param authorization Authorization头
     * @return 用户信息
     */
    @GetMapping("/verify")
    public ApiResponse<LoginResponse.UserInfo> verifyToken(
            @RequestHeader("Authorization") String authorization) {
        String token = extractToken(authorization);
        LoginResponse.UserInfo userInfo = authService.verifyToken(token);
        return ApiResponse.success("Token有效", userInfo);
    }
    
    /**
     * 从Authorization头中提取Token
     */
    private String extractToken(String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            return authorization.substring(7);
        }
        throw new IllegalArgumentException("无效的Authorization头");
    }
}
