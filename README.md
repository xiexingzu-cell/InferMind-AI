# InferMind

InferMind 是一个面向科研、工程、技术研究与严肃知识工作的 AI 推理工作台。

它不是通用 AI 聊天平台，也不是普通 AI 聚合站。InferMind 的目标是让 AI 真正参与研究：帮助用户拆解问题、推导方法、建立模型、分析数据、生成技术报告，并逐步沉淀科研与工程工作流。

## 产品定位

InferMind 面向：

- 本科生、研究生、博士生
- 科研人员、工程师、技术创作者
- 理工科学生
- 数学建模与科研竞赛用户

优先支持的任务：

- 论文写作与文献综述
- 数学推导与建模
- MATLAB / Python 科学计算
- COMSOL 建模辅助
- 实验设计与数据分析
- 科研绘图与技术报告生成
- LaTeX 论文生成
- 科研项目管理
- 数学建模竞赛

核心理念：

```text
让 AI 真正参与研究，而不是聊天。
```

## 当前工程能力

当前版本提供科研工作台的 AI Gateway 底座：

- Next.js 前端工作台
- FastAPI 后端
- OpenAI 兼容 API：`/v1/chat/completions`
- SSE 流式输出
- Markdown 渲染与代码高亮
- 多模型 Provider 架构
- OpenAI / DeepSeek Provider
- API Key 管理
- 用量统计
- PostgreSQL 数据库
- Redis 限流
- Nginx 反向代理
- Docker Compose 单机生产部署

## 架构

```text
用户浏览器 / OpenAI SDK
        ↓
Nginx :80
        ↓
├── /        → frontend:3000
├── /api     → backend:8000
├── /v1      → backend:8000
└── /health  → backend:8000/health
```

后端内部：

```text
FastAPI Gateway
        ↓
Auth / Rate Limit
        ↓
Model Router
        ↓
Provider Registry
        ↓
OpenAIProvider / DeepSeekProvider / Future Providers
```

## 本地开发

### 1. 启动基础设施

```powershell
cd C:\Users\user\Documents\infermind
docker compose up -d
```

### 2. 启动后端

```powershell
cd C:\Users\user\Documents\infermind\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

后端地址：

```text
http://localhost:8000
```

健康检查：

```text
http://localhost:8000/health
```

创建第一个管理员 API Key：

```powershell
python scripts/seed_key.py --name "admin"
```

### 3. 启动前端

```powershell
cd C:\Users\user\Documents\infermind\frontend
npm install
npm run dev
```

前端地址：

```text
http://localhost:3000
```

## 生产部署

当前推荐部署方式：

```text
单台 Ubuntu 服务器 + Docker Compose + Nginx
```

启动命令：

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

部署文档：

```text
docs/deploy-vps.md
```

生产环境变量模板：

```text
.env.production.example
```

真实生产环境变量：

```text
.env.production
```

注意：`.env.production` 包含真实密钥和密码，不能提交到 Git，也不能公开展示。

## API

OpenAI 兼容接口：

```text
POST /v1/chat/completions
GET  /v1/models
```

管理接口：

```text
GET    /api/keys
POST   /api/keys
DELETE /api/keys/{id}
GET    /api/usage?days=30
GET    /health
```

OpenAI SDK 示例：

```python
from openai import OpenAI

client = OpenAI(
    api_key="gw-your-key",
    base_url="http://your-server-ip/v1",
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "你是一个严谨的科研推理助手。"},
        {"role": "user", "content": "请帮我拆解这个实验设计问题。"},
    ],
    stream=True,
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

## 支持模型

当前注册模型：

| Model | Provider |
| --- | --- |
| `gpt-4o` | OpenAI |
| `gpt-4o-mini` | OpenAI |
| `gpt-4-turbo` | OpenAI |
| `o1-mini` | OpenAI |
| `deepseek-chat` | DeepSeek |
| `deepseek-reasoner` | DeepSeek |

## 新增 Provider

新增模型供应商的推荐路径：

1. 在 `backend/app/providers/` 下创建新的 `<name>_provider.py`。
2. 继承 `AbstractProvider`。
3. 实现非流式与流式输出。
4. 在 `backend/app/providers/registry.py` 注册模型前缀。
5. 在 `backend/app/config.py` 和 `.env.production.example` 增加必要环境变量。

## 未来方向

InferMind 后续应优先演进为科研与工程工作流平台：

- 多 Agent 协同
- 推理过程可视化
- 项目长期记忆
- 科研上下文管理
- 工具链编排
- 云端计算
- 科学工作流自动化
- 文献库与引用管理
- 数据分析与科学绘图
- LaTeX / 技术报告生成
- 数学建模竞赛工作流

InferMind 最终不是“大模型聚合平台”，而是“面向科研与工程的下一代 AI 推理工作台”。
