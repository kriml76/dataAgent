# JWT登录认证功能测试指南

## 功能概述

已成功为DataAgent项目实现完整的JWT Token认证系统,包括:
- ✅ 后端用户表、认证API、JWT工具类、安全拦截器
- ✅ 前端登录服务、路由守卫、Token管理和登出功能

## 快速开始

### 1. 数据库初始化

首次运行需要执行数据库初始化脚本:

```bash
# 设置环境变量以启用SQL初始化
export DATA_AGENT_DATASOURCE_SQL_INIT=always

# 或者在application.yml中修改
spring.sql.init.mode=always
```

这将自动创建`user`表并插入默认管理员账户:
- **用户名**: admin
- **密码**: admin123

### 2. 启动后端服务

```bash
cd /Users/liubenjun/Desktop/DataAgent/data-agent-management
mvn clean spring-boot:run
```

后端将在 `http://localhost:8065` 启动

### 3. 启动前端服务

```bash
cd /Users/liubenjun/Desktop/DataAgent/data-agent-frontend-react
npm run dev
```

前端将在 `http://localhost:8999` 启动

## 测试步骤

### 测试1: 登录功能

1. 打开浏览器访问: http://localhost:8999/login
2. 输入默认账户:
   - 用户名: `admin`
   - 密码: `admin123`
3. 点击"登录"按钮
4. **预期结果**:
   - 显示"登录成功!"提示
   - 自动跳转到 `/agent/new` 页面
   - localStorage中存在token
   - Header显示用户信息"管理员"

### 测试2: 路由守卫

1. 清除浏览器localStorage中的token(或等待2小时过期)
2. 直接访问受保护的路由,如: http://localhost:8999/chat
3. **预期结果**:
   - 自动重定向到 `/login` 页面
   - URL变为: http://localhost:8999/login

### 测试3: Token自动携带

1. 登录后访问任意页面
2. 打开浏览器开发者工具 → Network标签
3. 刷新页面或触发任意API请求
4. **预期结果**:
   - 请求头中包含: `Authorization: Bearer <token>`

### 测试4: 401未授权处理

1. 手动修改localStorage中的token为无效值
2. 刷新页面或触发API请求
3. **预期结果**:
   - 控制台输出: "未授权,请重新登录"
   - localStorage中的token被清除
   - 自动跳转到登录页

### 测试5: 登出功能

1. 登录后,在Header右侧找到用户信息区域
2. 点击"退出"按钮
3. 确认对话框中点击"确认"
4. **预期结果**:
   - 显示"已退出登录"提示
   - localStorage中的token被清除
   - 跳转到登录页

### 测试6: 后端API测试

使用curl或Postman测试登录API:

```bash
curl -X POST http://localhost:8065/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**预期响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200,
    "userInfo": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "avatar": null
    }
  }
}
```

测试受保护的API(需要先获取token):

```bash
curl -X GET http://localhost:8065/api/agent/list \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 文件清单

### 后端新增文件 (9个)
1. `entity/User.java` - 用户实体类
2. `mapper/UserMapper.java` - 用户数据访问接口
3. `dto/LoginRequest.java` - 登录请求DTO
4. `vo/LoginResponse.java` - 登录响应VO
5. `util/JwtUtil.java` - JWT工具类
6. `service/AuthService.java` - 认证服务接口
7. `service/impl/AuthServiceImpl.java` - 认证服务实现
8. `controller/AuthController.java` - 认证控制器
9. `config/AuthInterceptor.java` - JWT认证拦截器

### 后端修改文件 (4个)
1. `pom.xml` - 添加JWT和Spring Security依赖
2. `resources/sql/schema.sql` - 添加user表结构
3. `resources/sql/data.sql` - 添加默认管理员账户
4. `resources/application.yml` - 添加JWT配置
5. `config/WebConfig.java` - 注入AuthInterceptor

### 前端新增文件 (3个)
1. `services/auth/index.ts` - 认证API服务
2. `stores/auth.ts` - 认证状态管理Store
3. `components/ProtectedRoute.tsx` - 路由守卫组件

### 前端修改文件 (4个)
1. `pages/LoginPage.tsx` - 集成真实登录API
2. `utils/request.ts` - 添加Token拦截和401处理
3. `App.tsx` - 为所有路由添加ProtectedRoute包装
4. `components/Layout/MainLayout.tsx` - 添加用户信息和登出功能

## 技术细节

### JWT配置
- **密钥**: 通过环境变量 `JWT_SECRET` 配置,默认值为 `DataAgentSecretKey2026ForJWTTokenGenerationAndValidation`
- **过期时间**: 2小时(7200秒),可通过 `JWT_EXPIRATION` 环境变量调整
- **算法**: HS256 (HMAC-SHA256)

### 密码加密
- **算法**: BCrypt
- **强度**: 默认10轮迭代
- **示例哈希**: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` (对应明文: admin123)

### 白名单路径
以下路径不需要认证即可访问:
- `/api/auth/login` - 登录接口
- `/api/auth/register` - 注册接口
- `/api/auth/verify` - Token验证接口
- `/swagger-ui.html` - Swagger文档
- `/v3/api-docs` - OpenAPI文档
- `/uploads/**` - 文件上传目录

### Token存储
- **前端**: localStorage (key: `token`)
- **格式**: `Bearer <token>` (Authorization header)
- **持久化**: Zustand persist中间件自动同步到localStorage

## 常见问题

### Q1: 登录失败,提示"用户名或密码错误"
**A**: 检查数据库是否正确初始化,确认user表中存在admin账户。可以手动执行:
```sql
INSERT INTO user (username, password, nickname, status) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '管理员', 1);
```

### Q2: 前端无法连接后端API
**A**: 检查Vite代理配置(`vite.config.ts`),确保正确代理到后端8065端口。

### Q3: Token验证失败
**A**: 检查JWT_SECRET是否一致,前后端必须使用相同的密钥。生产环境务必通过环境变量设置强随机密钥。

### Q4: 跨域问题(CORS)
**A**: 当前项目使用Vite Proxy代理,开发环境不会出现跨域问题。生产环境需要在后端配置CORS。

### Q5: 如何注册用户?
**A**: 当前版本暂未开放注册页面,可以通过以下方式创建用户:
1. 直接使用注册API: `POST /api/auth/register`
2. 手动在数据库中插入用户记录(密码需用BCrypt加密)

## 安全建议

1. **生产环境**: 务必修改JWT_SECRET为强随机字符串
2. **HTTPS**: 生产环境强制使用HTTPS传输
3. **密码策略**: 建议添加密码复杂度验证
4. **登录限制**: 建议添加登录失败次数限制,防止暴力破解
5. **Token刷新**: 建议实现Refresh Token机制,提升用户体验
6. **日志审计**: 关键操作(登录、登出)应记录日志

## 下一步优化方向

1. 实现用户注册页面
2. 添加忘记密码/重置密码功能
3. 实现Refresh Token自动续期
4. 添加OAuth2第三方登录(GitHub、Google等)
5. 实现角色权限管理(RBAC)
6. 添加双因素认证(2FA)
7. 实现会话管理(查看活跃会话、强制登出)

## 联系与支持

如有问题,请参考项目文档或联系开发团队。
