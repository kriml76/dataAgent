---
name: "local-start"
description: "Starts the DataAgent project locally (frontend + backend + MySQL). Invoke when user asks to run, start, or launch the project locally."
---

# Local Start

启动 DataAgent 本地开发环境（不使用 Docker）。

## 环境要求

- JDK 17+
- MySQL 8.0+
- Node.js 16+

## 启动步骤

### 1. 启动 MySQL 服务

```bash
# macOS (Homebrew)
brew services start mysql

# Linux (Ubuntu/Debian)
sudo systemctl start mysql
```

### 2. 创建数据库和用户

登录 MySQL 命令行：

```bash
mysql -u root -p
```

执行以下 SQL 命令：

```sql
-- 创建数据库
CREATE DATABASE data_agent_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选）
CREATE USER 'dataagent'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON data_agent_management.* TO 'dataagent'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 初始化数据库表结构

```bash
# 导入数据库 schema
mysql -h 127.0.0.1 -u root -padmin123456 data_agent_management < data-agent-management/src/main/resources/sql/schema.sql

# 导入初始数据
mysql -h 127.0.0.1 -u root -padmin123456 data_agent_management < data-agent-management/src/main/resources/sql/data.sql

# 导入产品数据（可选）
mysql -h 127.0.0.1 -u root -padmin123456 data_agent_management < data-agent-management/src/main/resources/sql/product_schema.sql
mysql -h 127.0.0.1 -u root -padmin123456 data_agent_management < data-agent-management/src/main/resources/sql/product_data.sql
```
### 4. 启动前端

```bash
cd data-agent-frontend
npm install  # 如依赖已安装可跳过
npm run dev
```
### 5. 启动后端

从项目根目录执行：

```bash
./mvnw -f data-agent-management/pom.xml spring-boot:run
```

后端端口: 8065



前端访问: http://localhost:3000

## 数据库配置

后端默认配置：

```yaml
# data-agent-management/src/main/resources/application.yml
server:
  port: 8065

spring:
  datasource:
    url: ${DATA_AGENT_DATASOURCE_URL:jdbc:mysql://127.0.0.1:3306/data_agent_management?useUnicode=true&characterEncoding=utf-8&zeroDateTimeBehavior=convertToNull&transformedBitIsBoolean=true&allowMultiQueries=true&allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=Asia/Shanghai}
    username: ${DATA_AGENT_DATASOURCE_USERNAME:root}
    password: ${DATA_AGENT_DATASOURCE_PASSWORD:admin123456}
    driver-class-name: com.mysql.cj.jdbc.Driver
  sql:
    init:
      mode: ${DATA_AGENT_DATASOURCE_SQL_INIT:never}
```

### 修改密码的方式

**方式一：修改配置文件**
直接编辑 `application.yml` 文件中的 `password` 字段。

**方式二：使用环境变量（推荐）**
启动后端时设置环境变量：

```bash
export DATA_AGENT_DATASOURCE_PASSWORD=your_new_password
cd data-agent-management
./mvnw spring-boot:run
```

**方式三：使用命令行参数**
```bash
cd data-agent-management
./mvnw spring-boot:run -DDATA_AGENT_DATASOURCE_PASSWORD=your_new_password
```
