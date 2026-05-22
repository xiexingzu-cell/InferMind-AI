# InferMind — Ubuntu 服务器 Docker Compose 部署指南

## 1. 服务器环境要求

| 项目 | 最低配置 |
|------|----------|
| 操作系统 | Ubuntu 20.04 / 22.04 / 24.04 |
| CPU | 1 核 |
| 内存 | 2 GB |
| 硬盘 | 20 GB |
| 网络 | 公网 IP，开放 80 端口（防火墙/安全组） |

## 2. 安装 Docker

```bash
# 卸载旧版本（如果存在）
sudo apt-get remove docker docker-engine docker.io containerd runc

# 安装依赖
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 添加 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin

# 将当前用户加入 docker 组（免 sudo）
sudo usermod -aG docker $USER

# 重新登录使权限生效，或执行:
newgrp docker
```

## 3. 安装 Docker Compose 插件

```bash
sudo apt-get install -y docker-compose-plugin

# 验证
docker compose version
```

> 如果系统没有 `docker-compose-plugin` 包，使用以下方式安装：
> ```bash
> sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
> sudo chmod +x /usr/local/bin/docker-compose
> docker-compose --version
> ```

## 4. 克隆项目

```bash
cd /opt
git clone https://github.com/xiexingzu-cell/InferMind-AI.git
cd InferMind-AI
```

## 5. 配置环境变量

```bash
# 复制模板
cp .env.production.example .env.production

# 编辑，填入真实值
nano .env.production
```

**必须修改的变量：**

| 变量 | 说明 |
|------|------|
| `POSTGRES_PASSWORD` | 设置一个强密码 |
| `DATABASE_URL` | 把密码部分替换为上面设置的密码 |
| `SECRET_KEY` | 运行 `python -c "import secrets; print(secrets.token_hex(32))"` 生成 |
| `INTERNAL_API_KEY` | 运行 `python -c "import secrets; print('gw-' + secrets.token_urlsafe(16))"` 生成 |
| `OPENAI_API_KEY` | 你的 OpenAI API Key |
| `DEEPSEEK_API_KEY` | 你的 DeepSeek API Key |
| `GEMINI_API_KEY` | 你的 Gemini API Key（可选） |

## 6. 启动服务

```bash
# 确保在项目根目录
cd /opt/InferMind-AI

# 启动所有服务（构建镜像 + 后台运行）
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

首次启动会拉取基础镜像并构建应用镜像，约 3—5 分钟。

## 7. 查看服务状态

```bash
# 查看所有容器
docker compose -f docker-compose.prod.yml ps

# 正常应该看到 5 个服务都是 Up 状态:
# infermind-nginx
# infermind-frontend
# infermind-backend
# infermind-postgres
# infermind-redis
```

## 8. 查看日志

```bash
# 查看所有服务日志
docker compose -f docker-compose.prod.yml logs -f

# 只看后端日志
docker compose -f docker-compose.prod.yml logs -f backend

# 只看 nginx 日志
docker compose -f docker-compose.prod.yml logs -f nginx

# 查看最近 50 行
docker compose -f docker-compose.prod.yml logs --tail=50
```

## 9. 重启服务

```bash
# 重启所有服务
docker compose -f docker-compose.prod.yml restart

# 重启单个服务
docker compose -f docker-compose.prod.yml restart backend
```

## 10. 停止服务

```bash
# 停止但保留数据卷
docker compose -f docker-compose.prod.yml down

# 停止并删除数据卷（⚠️ 会清空数据库）
docker compose -f docker-compose.prod.yml down -v
```

## 11. 更新代码并重新部署

```bash
cd /opt/InferMind-AI

# 拉取最新代码
git pull origin main

# 重新构建并启动（数据卷不会丢失）
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 清理旧的未使用镜像（节省磁盘）
docker image prune -f
```

## 12. 验证部署

```bash
# 健康检查
curl http://localhost/health
# 应返回: {"status":"ok","version":"0.1.0"}

# 模型列表
curl http://localhost/v1/models \
  -H "Authorization: Bearer gw-your_random_key_here"
```

用浏览器访问 `http://你的服务器公网IP` 应该能看到 InferMind 首页。

## 13. 常见问题排查

### 后端启动失败

```bash
# 查看后端详细日志
docker compose -f docker-compose.prod.yml logs backend

# 常见原因:
# 1. DATABASE_URL 格式错误 — 确保以 postgresql+asyncpg:// 开头
# 2. PostgreSQL 未就绪 — 等待几秒重试
# 3. SECRET_KEY 未设置
```

### 前端页面空白或 API 请求 404

检查 `NEXT_PUBLIC_API_URL` 是否为空（同源部署时应该为空）。

如果前端页面不显示，检查 nginx 是否正常运行：
```bash
docker compose -f docker-compose.prod.yml logs nginx
```

### Nginx 502 Bad Gateway

说明 nginx 无法连接后端或前端容器：
```bash
# 确认容器在运行
docker compose -f docker-compose.prod.yml ps

# 检查网络连通性
docker exec infermind-nginx ping -c 1 backend
docker exec infermind-nginx ping -c 1 frontend
```

### SSE 流式响应中断

确保 nginx 配置中对 `/v1` 路径设置了：
- `proxy_buffering off;`
- `proxy_read_timeout 300s;`

当前 nginx.conf 已包含这些配置，不要删除。

### PostgreSQL 连接超时

```bash
# 检查 PostgreSQL 是否就绪
docker exec infermind-postgres pg_isready -U gateway -d infermind

# 检查健康状态
docker compose -f docker-compose.prod.yml ps postgres
```

### 磁盘空间不足

```bash
# 查看 Docker 磁盘占用
docker system df

# 清理未使用的镜像、容器、卷
docker system prune -a --volumes -f
```
