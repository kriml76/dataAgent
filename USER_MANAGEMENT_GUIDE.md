# 用户管理功能说明

## 功能概述

已为DataAgent项目实现完整的用户管理系统,包括:
- ✅ 新用户注册需人工审核(默认状态:待审核)
- ✅ 管理员可查看所有用户列表
- ✅ 管理员可启用/禁用用户
- ✅ 管理员可删除用户
- ✅ 待审核和已禁用的用户无法登录

## 用户状态说明

| 状态码 | 状态名称 | 说明 | 是否可登录 |
|--------|----------|------|-----------|
| 0 | 待审核 | 新注册用户,等待管理员审核 | ❌ 否 |
| 1 | 已启用 | 已通过审核,正常使用 | ✅ 是 |
| 2 | 已禁用 | 被管理员禁用 | ❌ 否 |

## 后端API

### 1. 获取用户列表
```
GET /api/user/list
响应: { success: true, data: [UserVO...] }
```

### 2. 启用用户
```
PUT /api/user/{userId}/enable
响应: { success: true, message: "用户已启用" }
```

### 3. 禁用用户
```
PUT /api/user/{userId}/disable
响应: { success: true, message: "用户已禁用" }
```

### 4. 删除用户
```
DELETE /api/user/{userId}
响应: { success: true, message: "用户已删除" }
```

## 前端页面

### 访问路径
- URL: `/system/users`
- 菜单位置: 通用设置 → 用户管理

### 页面功能
1. **用户列表展示**
   - ID、用户名、昵称、邮箱
   - 状态标签(待审核/已启用/已禁用)
   - 注册时间
   
2. **操作按钮**
   - 待审核用户: 显示"通过审核"按钮
   - 已启用用户: 显示"禁用"按钮
   - 已禁用用户: 显示"启用"按钮
   - 所有用户: 显示"删除"按钮

3. **刷新功能**
   - 右上角刷新按钮可重新加载用户列表

## 使用流程

### 场景1: 新用户注册
1. 用户访问注册页面(需先实现注册UI)
2. 填写用户名和密码提交
3. 系统创建用户,状态设为"待审核"(status=0)
4. 用户尝试登录时提示:"账户待审核,请联系管理员"

### 场景2: 管理员审核用户
1. 管理员登录系统
2. 进入"通用设置 → 用户管理"
3. 查看待审核用户列表(橙色标签)
4. 点击"通过审核"按钮
5. 用户状态变为"已启用",可以正常登录

### 场景3: 禁用违规用户
1. 管理员在用户管理页面找到目标用户
2. 点击"禁用"按钮
3. 确认操作
4. 用户状态变为"已禁用",无法登录
5. 用户尝试登录时提示:"账户已被禁用"

### 场景4: 重新启用用户
1. 管理员在用户管理页面找到已禁用用户
2. 点击"启用"按钮
3. 用户状态恢复为"已启用",可以登录

## 测试步骤

### 1. 测试新用户注册(待审核状态)
```bash
# 注册新用户
curl -X POST http://localhost:8065/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "password": "123456"}'

# 尝试登录(应该失败)
curl -X POST http://localhost:8065/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "password": "123456"}'
# 预期响应: {"success":false,"message":"账户待审核,请联系管理员"}
```

### 2. 测试管理员审核
```bash
# 管理员登录(admin/admin123)
# 访问 http://localhost:8999/system/users
# 找到newuser,点击"通过审核"

# 再次尝试登录(应该成功)
curl -X POST http://localhost:8065/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "password": "123456"}'
# 预期响应: 包含token的成功响应
```

### 3. 测试禁用用户
```bash
# 在用户管理页面点击"禁用"按钮
# 或直接调用API
curl -X PUT http://localhost:8065/api/user/5/disable \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 尝试登录(应该失败)
curl -X POST http://localhost:8065/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "password": "123456"}'
# 预期响应: {"success":false,"message":"账户已被禁用"}
```

## 数据库变更

### user表status字段说明
```sql
ALTER TABLE user MODIFY COLUMN status TINYINT DEFAULT 0 COMMENT '状态: 0-待审核, 1-已启用, 2-已禁用';
```

**注意**: 需要更新现有用户的状态
```sql
-- 将现有status=0的用户改为已启用(兼容旧数据)
UPDATE user SET status = 1 WHERE status = 0;
```

## 文件清单

### 后端新增文件 (5个)
1. `enums/UserStatus.java` - 用户状态枚举
2. `vo/UserVO.java` - 用户信息VO
3. `service/UserService.java` - 用户服务接口
4. `service/impl/UserServiceImpl.java` - 用户服务实现
5. `controller/UserController.java` - 用户管理控制器

### 后端修改文件 (3个)
1. `entity/User.java` - 更新status字段注释
2. `mapper/UserMapper.java` - 添加findAll方法
3. `service/impl/AuthServiceImpl.java` - 修改注册和登录逻辑

### 前端新增文件 (2个)
1. `services/user/index.ts` - 用户管理API服务
2. `pages/system/UserManagementPage.tsx` - 用户管理页面

### 前端修改文件 (2个)
1. `App.tsx` - 添加用户管理路由
2. `components/Layout/MainLayout.tsx` - 添加菜单项和路由标题

## 注意事项

1. **首次部署**: 需要执行SQL更新现有用户状态
   ```sql
   UPDATE user SET status = 1 WHERE status = 0;
   ```

2. **admin账户**: 确保admin账户状态为已启用(status=1)

3. **权限控制**: 当前所有登录用户都可以访问用户管理页面,建议后续添加角色权限控制,只有管理员才能访问

4. **注册页面**: 当前只有注册API,需要创建注册页面供用户使用

5. **删除用户**: 删除功能已预留,但UserMapper中需要添加delete方法才能真正实现

## 后续优化建议

1. **角色权限系统**: 实现RBAC,区分管理员和普通用户
2. **批量操作**: 支持批量启用/禁用/删除用户
3. **用户搜索**: 添加用户名、邮箱搜索功能
4. **分页优化**: 后端实现真正的分页查询
5. **审计日志**: 记录用户状态变更历史
6. **邮件通知**: 审核通过后发送邮件通知用户
7. **注册页面**: 创建美观的注册页面
8. **个人资料**: 允许用户编辑自己的基本信息
