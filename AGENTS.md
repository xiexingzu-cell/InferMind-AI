# InferMind 项目说明

本文档用于帮助后续接手本项目的 AI Agent 或开发者快速理解产品定位、代码结构、运行方式、部署方式和关键约定。不要在本文档中写入真实 API Key、服务器密码、数据库密码或任何敏感信息。

## 一、Project Manifest

InferMind 不是一个通用 AI 聊天平台，也不是普通 AI 聚合站。

InferMind 是一个面向科研、工程、技术研究与严肃知识工作的 AI 推理工作台。

核心理念：

```text
让 AI 真正参与研究，而不是聊天。
```

InferMind 的长期目标是成为面向研究与工程的下一代 AI 推理工作台，也可以理解为：

- AI 研究助手
- 科研工作台
- 技术工作流平台
- 推理引擎
- 面向研究与工程的 AI Operating System

InferMind 不追求：

- 娱乐化聊天
- AI 女友
- 情感陪伴
- 短视频文案
- 小红书爆款生成
- 泛娱乐 AI 工具集合
- “AI 玩具感”

InferMind 要帮助用户完成：

- 思考
- 推理
- 建模
- 仿真
- 分析
- 写作
- 研究
- 科研工作流

## 二、目标用户

InferMind 优先服务：

- 本科生
- 研究生
- 博士生
- 科研人员
- 工程师
- 技术创作者
- 理工科学生
- 数学建模与科研竞赛用户

典型使用场景：

- 论文写作
- 文献综述
- 数学推导
- MATLAB / Python 科学计算
- COMSOL 建模辅助
- 实验设计
- 数据分析
- 科研绘图
- LaTeX 论文生成
- 技术报告生成
- 科研项目管理
- 数学建模竞赛

## 三、产品气质

InferMind 的产品形态应该更像：

- Cursor
- Linear
- Notion
- Perplexity Labs
- 科研软件工作台

而不是：

- 普通 AI 聊天网页
- AI 聚合站
- AI 工具箱导航站
- 泛娱乐 AI 产品

UI 风格要求：

- 专业
- 极简
- 科技感
- 工程感
- 未来感
- 研究工作台风格

避免：

- 花哨渐变
- 过度动画
- 娱乐化视觉
- 泛社交化设计
- 过度营销化表达

## 四、AI 回答风格要求

InferMind 的回答应该：

1. 先理解真正问题
2. 拆解任务
3. 展示推理过程
4. 区分事实与假设
5. 指出限制与不确定性
6. 提供下一步研究建议

回答风格必须具备：

- 推理感
- 结构感
- 逻辑性
- 分析过程
- 问题拆解
- 方法论意识
- 假设条件说明
- 局限性说明
- 下一步研究方向

不应该：

- 像普通聊天机器人一样闲聊
- 输出空泛鸡汤
- 使用互联网式夸张表达
- 过度娱乐化
- 过度营销化

## 五、当前工程定位

当前代码版本仍保留 AI Gateway 的工程底座：

- Chat 网页端
- OpenAI 兼容 API
- 多模型 Provider 架构
- API Key 管理
- 用量统计
- Docker Compose 单机部署

但产品叙事和后续功能规划应统一转向“科研与工程 AI 推理工作台”。后续新增功能时，应优先考虑科研工作流，而不是泛聊天或娱乐工具。

## 六、主要技术栈

前端：

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui v4
- Framer Motion
- Recharts
- Markdown 渲染与代码高亮

后端：

- FastAPI
- SQLAlchemy Async
- PostgreSQL
- Redis
- OpenAI Python SDK
- structlog

部署：

- Docker Compose
- Nginx
- PostgreSQL volume
- Redis volume
- 单台 Ubuntu 服务器

## 七、项目目录

项目根目录：

```text
C:\Users\user\Documents\infermind
```

主要结构：

```text
infermind/
├── backend/                  # FastAPI 后端
├── frontend/                 # Next.js 前端
├── nginx/                    # Nginx 反向代理配置
├── docs/                     # 部署文档
├── docker-compose.prod.yml   # 单台服务器生产部署 Compose 文件
├── docker-compose.yml        # 本地开发用 PostgreSQL + Redis
├── .env.production.example   # 生产环境变量模板，不含真实密钥
├── .env.production           # 本地生产环境变量文件，包含敏感信息，不要提交
├── README.md                 # 对外项目说明
├── PLAN.md                   # 早期开发计划，可能偏旧
└── AGENTS.md                 # 当前项目认知与维护约定
```

注意：

- 项目已经从旧目录 `ai-gateway` 改名为 `infermind`。
- 真实生产变量在 `.env.production`，该文件包含敏感信息，不能复制到公开文档或提交到 Git。
- 当前实际生产部署以 `docker-compose.prod.yml` 和 `docs/deploy-vps.md` 为准。

## 八、整体架构

生产访问链路：

```text
用户浏览器 / OpenAI SDK
        ↓
Nginx :80
        ↓
├── /        → frontend:3000  (Next.js)
├── /api     → backend:8000   (平台管理 API)
├── /v1      → backend:8000   (OpenAI 兼容 API，支持 SSE 流式输出)
└── /health  → backend:8000/health
```

后端内部链路：

```text
FastAPI API Gateway
        ↓
Auth / Rate Limit
        ↓
Model Router
        ↓
Provider Registry
        ↓
OpenAIProvider / DeepSeekProvider / 后续 Provider
```

数据组件：

- PostgreSQL：保存 API Key 和用量日志。
- Redis：用于基于 API Key 的滑动窗口限流。

## 九、后端说明

后端目录：

```text
backend/
├── app/
│   ├── main.py              # FastAPI 入口、路由挂载、全局异常、/health
│   ├── config.py            # 环境变量读取和 Settings
│   ├── database.py          # async SQLAlchemy engine/session/create_tables
│   ├── redis_client.py      # Redis 连接池
│   ├── api/v1/              # API 路由
│   ├── core/                # 鉴权、限流、日志
│   ├── models/              # SQLAlchemy ORM 模型
│   ├── providers/           # 大模型 Provider 抽象和实现
│   ├── router/              # Model Router
│   └── schemas/             # Pydantic schema
├── scripts/seed_key.py      # 创建第一个管理 API Key
├── requirements.txt         # Python 依赖
└── Dockerfile               # 后端生产镜像
```

关键文件：

- `backend/app/main.py`
  - FastAPI 应用入口。
  - 应用标题为 `InferMind`。
  - `/health` 返回 `{"status": "ok", "version": "0.1.0"}`。
  - 启动时调用 `create_tables()` 自动创建表。
  - 挂载 `/v1/chat/completions`、`/v1/models`、`/api/keys`、`/api/usage`。

- `backend/app/config.py`
  - 使用 `pydantic-settings` 从环境变量读取配置。
  - 会把 `postgres://` 或 `postgresql://` 自动转换为 `postgresql+asyncpg://`。

- `backend/app/core/auth.py`
  - 所有受保护接口使用 Bearer Token。
  - 开发者 API Key 来自数据库 `api_keys` 表。
  - 前端公共工作台使用 `INTERNAL_API_KEY`，匹配后返回 `id=0` 的虚拟 ApiKey，不查数据库。

- `backend/app/api/v1/chat.py`
  - 实现 OpenAI 兼容接口：`POST /v1/chat/completions`。
  - 支持 `stream`。
  - 流式响应使用 `text/event-stream`，最后返回 `data: [DONE]`。
  - 内部 Key 不写入用量日志，也不更新数据库统计，避免外键问题。

- `backend/app/providers/base.py`
  - 所有 Provider 必须实现 `chat_completion`、`chat_completion_stream`、`supported_models`。

- `backend/app/providers/registry.py`
  - 当前路由规则：
    - `gpt-`、`o1-`、`o3-` → OpenAI
    - `deepseek-` → DeepSeek
  - 新增模型供应商时优先在这里注册前缀。

## 十、前端说明

前端目录：

```text
frontend/
├── app/                     # Next.js App Router 页面
├── components/              # UI、工作台、仪表盘、布局组件
├── lib/                     # API client、SSE 读取、工具函数
├── types/                   # TypeScript 类型
├── package.json
├── next.config.ts
└── Dockerfile
```

关键页面：

- `frontend/app/page.tsx`
  - Landing Page。
  - 应围绕“科研与工程 AI 推理工作台”表达，而不是“AI 聚合站”。

- `frontend/app/(app)/chat/page.tsx`
  - 当前仍是 Chat Playground 形态。
  - 后续建议逐步升级为“Research Workspace / 推理工作台”。
  - 默认模型是 `deepseek-chat`。
  - 使用 `NEXT_PUBLIC_INTERNAL_API_KEY`，用户无需自己输入模型供应商 API Key。

- `frontend/app/(app)/dashboard/page.tsx`
  - 仪表盘。
  - 展示请求数、Token 数、活跃 Key、模型使用情况。

- `frontend/app/(app)/keys/page.tsx`
  - API Key 管理页面。
  - 服务于开发者和管理员，不是普通用户使用入口。

关键工具：

- `frontend/lib/api-client.ts`
  - 所有前端 API 请求入口。
  - `NEXT_PUBLIC_API_URL` 为空时走同源路径，即由 Nginx 代理到后端。

- `frontend/lib/stream.ts`
  - 读取 SSE 响应。
  - 解析 `data: ...` 行。
  - 遇到 `[DONE]` 结束。

## 十一、Nginx 与 Docker Compose

Nginx 配置：

```text
nginx/nginx.conf
```

路由规则：

- `/` → `frontend:3000`
- `/v1` → `backend:8000`
- `/api` → `backend:8000`
- `/health` → `backend:8000/health`
- `/docs` → `backend:8000/docs`
- `/openapi.json` → `backend:8000/openapi.json`

生产 Compose 文件：

```text
docker-compose.prod.yml
```

服务：

- `infermind-nginx`
- `infermind-frontend`
- `infermind-backend`
- `infermind-postgres`
- `infermind-redis`

注意：

- 后端固定监听 `0.0.0.0:8000`，不依赖 Railway 的 `PORT`。
- 前端容器监听 `3000`。
- Nginx 容器监听宿主机 `80`。
- `/v1` 的 Nginx SSE 配置不要删除，否则流式输出可能被缓冲。

## 十二、环境变量

模板文件：

```text
.env.production.example
```

真实文件：

```text
.env.production
```

`.env.production` 包含敏感信息，不能提交、不能公开展示。

单机 Nginx 同源部署时：

```text
NEXT_PUBLIC_API_URL=
```

也就是保持为空，让浏览器请求 `/v1` 和 `/api`，再由 Nginx 转发到后端。

## 十三、常用命令

本地进入项目：

```powershell
cd C:\Users\user\Documents\infermind
```

本地开发基础设施：

```powershell
docker compose up -d
```

后端本地开发：

```powershell
cd C:\Users\user\Documents\infermind\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

前端本地开发：

```powershell
cd C:\Users\user\Documents\infermind\frontend
npm install
npm run dev
```

生产启动：

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

健康检查：

```bash
curl http://localhost/health
```

## 十四、开发约定

产品方向约定：

- 新功能优先服务科研、工程、技术研究、数学建模、实验分析和严肃知识工作。
- 不新增娱乐聊天、情感陪伴、短视频文案、小红书爆款等泛娱乐功能。
- Prompt、页面文案、功能命名都要避免“AI 玩具感”。
- Chat 页面后续应向“研究工作台”升级，例如任务拆解、推理步骤、引用材料、研究项目、文件上下文、实验记录等。

后端开发约定：

- 不要把所有 Provider 写进一个文件，新增供应商时创建新的 `backend/app/providers/<name>_provider.py`。
- 新增模型时优先修改 `backend/app/providers/registry.py`。
- OpenAI 兼容 schema 优先放在 `backend/app/schemas/chat.py`。
- 平台管理 API 放在 `/api` 前缀下。
- OpenAI 兼容 API 放在 `/v1` 前缀下。

前端开发约定：

- 页面放在 `frontend/app`。
- 通用 UI 组件放在 `frontend/components/ui`。
- 工作台/聊天相关组件放在 `frontend/components/chat`，后续可以逐步改名为 `workspace` 或 `research`。
- 仪表盘组件放在 `frontend/components/dashboard`。
- 后端请求统一通过 `frontend/lib/api-client.ts`。
- SSE 解析统一通过 `frontend/lib/stream.ts`。
- 不要让普通用户在工作台页面输入供应商 API Key；普通用户使用平台内部 Key。

部署约定：

- 当前部署方式是单台 Ubuntu 服务器 + Docker Compose + Nginx。
- 不要再引入 Railway、Vercel、Kubernetes 或 Serverless，除非用户明确要求。
- 国内服务器构建时保留镜像源优化：
  - backend apt：腾讯云源
  - backend pip：清华源
  - frontend npm：npmmirror
  - frontend Alpine：清华源

## 十五、安全注意事项

- `.env.production` 中有真实密钥和密码，不能提交到 Git，不能贴到公开对话。
- 如果密钥曾经被公开展示，应该在对应平台立即轮换。
- `INTERNAL_API_KEY` 会暴露到前端构建产物中。它适合当前公共工作台早期版本；生产环境如果要防滥用，需要进一步加登录、验证码、额度、IP 限流或计费系统。
- 当前 API Key 管理页只靠管理员 Key 控制，没有用户体系；上线后不要把管理员 Key 泄露给普通用户。
- `CORS_ORIGINS=*` 适合开发或单机同源代理阶段，正式多域名部署时应收敛到真实域名。

## 十六、未来架构方向

InferMind 后续应优先探索：

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

最终目标不是“大模型聚合平台”，而是“面向科研与工程的下一代 AI 推理工作台”。
注意；当前agents也只是此阶段的目标及想法，可能会随时间改变，真实意图以开发者具体要求为主
