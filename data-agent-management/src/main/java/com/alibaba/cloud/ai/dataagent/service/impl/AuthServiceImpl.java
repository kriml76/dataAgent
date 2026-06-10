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
package com.alibaba.cloud.ai.dataagent.service.impl;

import com.alibaba.cloud.ai.dataagent.dto.LoginRequest;
import com.alibaba.cloud.ai.dataagent.entity.User;
import com.alibaba.cloud.ai.dataagent.exception.InvalidInputException;
import com.alibaba.cloud.ai.dataagent.mapper.UserMapper;
import com.alibaba.cloud.ai.dataagent.service.AuthService;
import com.alibaba.cloud.ai.dataagent.util.JwtUtil;
import com.alibaba.cloud.ai.dataagent.vo.LoginResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @description 认证服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    
    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    @Override
    public LoginResponse login(LoginRequest request) {
        // 查询用户
        User user = userMapper.findByUsername(request.getUsername());
        if (user == null) {
            throw new InvalidInputException("用户名或密码错误");
        }
        
        // 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidInputException("用户名或密码错误");
        }
        
        // 检查用户状态
        if (user.getStatus() == 0) {
            throw new InvalidInputException("账户已被禁用");
        }
        
        // 生成Token
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        
        // 构建响应
        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .build();
        
        return LoginResponse.builder()
                .token(token)
                .expiresIn(jwtUtil.getExpiration())
                .userInfo(userInfo)
                .build();
    }
    
    @Override
    @Transactional
    public LoginResponse register(LoginRequest request) {
        // 检查用户名是否已存在
        User existingUser = userMapper.findByUsername(request.getUsername());
        if (existingUser != null) {
            throw new InvalidInputException("用户名已存在");
        }
        
        // 创建新用户
        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setNickname(request.getUsername());
        newUser.setStatus(1);
        
        userMapper.insert(newUser);
        
        // 生成Token
        String token = jwtUtil.generateToken(newUser.getId(), newUser.getUsername());
        
        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id(newUser.getId())
                .username(newUser.getUsername())
                .nickname(newUser.getNickname())
                .build();
        
        return LoginResponse.builder()
                .token(token)
                .expiresIn(jwtUtil.getExpiration())
                .userInfo(userInfo)
                .build();
    }
    
    @Override
    public LoginResponse.UserInfo verifyToken(String token) {
        Long userId = jwtUtil.getUserIdFromToken(token);
        User user = userMapper.findById(userId);
        
        if (user == null || user.getStatus() == 0) {
            throw new InvalidInputException("用户不存在或已被禁用");
        }
        
        return LoginResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .build();
    }
}
