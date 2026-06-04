# InferMind — Ubuntu 服务器 Docker Compose 部署指南

## 1. 服务器环境要求

| 项目 | 最低配置 |
|------|----------|
| 操作系统 | Ubuntu 20.04 / 22.04 / 24.04 |
| CPU | 1 核 |
| 内存 | 2 GB |
| 硬盘 | 20 GB |
| 网络 | 公网 IP，开放 80 端口（防火墙/安全组） |

## 2. 服务器初始化：国内镜像加速

部署前先配置国内镜像源，大幅提升构建和下载速度。

### 2.1 apt 源（腾讯云）

```bash
sudo sed -i 's/deb.debian.org/mirrors.tencent.com/g' /etc/apt/sources.list.d/debian.sources
sudo sed -i 's/archive.ubuntu.com/mirrors.tencent.com/g' /etc/apt/sources.list
sudo sed -i 's/security.ubuntu.com/mirrors.tencent.com/g' /etc/apt/sources.list
sudo apt-get update
```

### 2.2 Docker 镜像加速

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.m.daocloud.io"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 2.3 pip 源（清华）

```bash
mkdir -p ~/.pip
cat > ~/.pip/pip.conf <<'EOF'
[global]
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
trusted-host = pypi.tuna.tsinghua.edu.cn
EOF
```

### 2.4 npm 源（npmmirror）

```bash
npm config set registry https://registry.npmmirror.com
```

---

## 3. 安装 Docker

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

## 4. 安装 Docker Compose 插件

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

## 5. 克隆项目

```bash
cd /opt
git clone https://github.com/xiexingzu-cell/InferMind-AI.git
cd InferMind-AI
```

## 6. 配置环境变量

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
| `DOCKER_GID` | 运行 `stat -c '%g' /var/run/docker.sock` 获取，供竞赛 Worker 以非 root 用户启动私有 Runner |

## 7. 启动服务

```bash
# 确保在项目根目录
cd /opt/InferMind-AI

# 首次部署或科学计算依赖更新后，先构建私有 Python Runner 镜像
docker compose -f docker-compose.prod.yml --env-file .env.production --profile runner-build build competition-runner-image

# 启动所有服务（构建镜像 + 后台运行）
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

首次启动会拉取基础镜像并构建应用镜像，约 3—5 分钟。

`competition-worker` 会通过 Docker Socket 启动临时 Runner 容器。Runner 默认断网、限制 CPU、内存和进程数，并使用临时工作目录。不要将 Docker Socket 挂载到 Nginx、前端或 API 容器。

## 8. 查看服务状态

```bash
# 查看所有容器
docker compose -f docker-compose.prod.yml ps

# 正常应该看到 6 个服务都是 Up 状态:
# infermind-nginx
# infermind-frontend
# infermind-backend
# infermind-competition-worker
# infermind-postgres
# infermind-redis
```

## 9. 查看日志

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

## 10. 重启服务

```bash
# 重启所有服务
docker compose -f docker-compose.prod.yml restart

# 重启单个服务
docker compose -f docker-compose.prod.yml restart backend
```

## 11. 停止服务

```bash
# 停止但保留数据卷
docker compose -f docker-compose.prod.yml down

# 停止并删除数据卷（⚠️ 会清空数据库）
docker compose -f docker-compose.prod.yml down -v
```

## 12. 更新代码并重新部署

```bash
cd /opt/InferMind-AI

# 拉取最新代码
git pull origin main

# 重新构建并启动（数据卷不会丢失）
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 清理旧的未使用镜像（节省磁盘）
docker image prune -f
```

## 13. 验证部署

```bash
# 健康检查
curl http://localhost/health
# 应返回: {"status":"ok","version":"0.1.0"}

# 模型列表
curl http://localhost/v1/models \
  -H "Authorization: Bearer gw-your_random_key_here"
```

用浏览器访问 `http://你的服务器公网IP` 应该能看到 InferMind 首页。

## 14. 常见问题排查

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
