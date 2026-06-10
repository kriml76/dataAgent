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

import com.alibaba.cloud.ai.dataagent.entity.User;
import com.alibaba.cloud.ai.dataagent.enums.UserStatus;
import com.alibaba.cloud.ai.dataagent.exception.InvalidInputException;
import com.alibaba.cloud.ai.dataagent.mapper.UserMapper;
import com.alibaba.cloud.ai.dataagent.service.UserService;
import com.alibaba.cloud.ai.dataagent.vo.UserVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * @description 用户管理服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    private final UserMapper userMapper;
    
    @Override
    public List<UserVO> getAllUsers() {
        List<User> users = userMapper.findAll();
        return users.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }
    
    /**
     * 转换User实体为UserVO
     */
    private UserVO convertToVO(User user) {
        UserStatus status = UserStatus.fromCode(user.getStatus());
        return UserVO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .status(user.getStatus())
                .statusDescription(status.getDescription())
                .createTime(user.getCreateTime())
                .updateTime(user.getUpdateTime())
                .build();
    }
    
    @Override
    public void enableUser(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new InvalidInputException("用户不存在");
        }
        
        user.setStatus(UserStatus.ACTIVE.getCode());
        userMapper.update(user);
        log.info("用户已启用: userId={}, username={}", userId, user.getUsername());
    }
    
    @Override
    public void disableUser(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new InvalidInputException("用户不存在");
        }
        
        user.setStatus(UserStatus.DISABLED.getCode());
        userMapper.update(user);
        log.info("用户已禁用: userId={}, username={}", userId, user.getUsername());
    }
    
    @Override
    public void deleteUser(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new InvalidInputException("用户不存在");
        }
        
        // 不允许删除自己
        // TODO: 需要从当前登录用户上下文获取userId进行比较
        
        userMapper.deleteById(userId);
        log.info("用户已删除: userId={}, username={}", userId, user.getUsername());
    }
}
