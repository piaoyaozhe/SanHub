# SanHub - AI 内容生成平台

整合多种 AI 生成服务的统一平台，支持 **Sora**、**Gemini**、**Z-Image**、**Gitee AI** 等。

## 功能特性

- **视频生成**: Sora 视频生成 (10s/15s)，多种比例
- **图像生成**: Sora / Gemini / Z-Image / Gitee AI 多引擎支持
- **作品广场**: 瀑布流浏览社区作品，支持热门/最新排序，一键复制提示词
- **AI 对话**: 多模型智能对话，支持图像理解与创意构思
- **用户系统**: 注册、登录、积分余额管理
- **管理后台**: 用户管理、余额调整、API 配置、定价设置
- **历史记录**: 查看、下载、批量管理所有生成记录
- **数据存储**: SQLite / MySQL 可切换
- **Docker 部署**: 支持容器化一键部署

## 技术栈

- **框架**: Next.js 14 (App Router)
- **UI**: TailwindCSS + shadcn/ui 风格组件
- **认证**: NextAuth.js
- **数据库**: SQLite / MySQL（可切换）
- **图标**: Lucide React
- **部署**: Docker / Vercel / EdgeOne

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制环境变量模板并编辑：

```bash
cp .env.example .env.local
```

根据需要编辑 `.env.local`，配置数据库、API 密钥等。详见 `.env.example` 中的注释说明。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 首次运行

首次运行会自动：
- 创建数据库表结构
- 初始化系统配置
- 创建管理员账号（使用环境变量中配置的邮箱和密码）

## Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 数据库选择

| 类型 | 优势 | 适用场景 |
|------|------|----------|
| **SQLite** | 零配置、开箱即用 | 开发环境、小规模部署 |
| **MySQL** | 高并发、多实例支持 | 生产环境 |

## 项目结构

```
sanhub/
├── app/
│   ├── (auth)/          # 登录/注册页面
│   ├── (dashboard)/     # 主面板
│   │   ├── video/       # 视频生成
│   │   ├── image/       # 图像生成
│   │   ├── gallery/     # 作品广场
│   │   ├── chat/        # AI 对话
│   │   └── history/     # 历史记录
│   ├── admin/           # 管理后台
│   └── api/             # API 路由
├── components/
│   ├── ui/              # 基础 UI 组件
│   ├── generator/       # 生成器组件
│   └── layout/          # 布局组件
├── lib/
│   ├── db.ts            # 数据库操作
│   ├── db-adapter.ts    # 数据库适配器
│   ├── auth.ts          # 认证配置
│   ├── sora.ts          # Sora API
│   ├── gemini.ts        # Gemini API
│   ├── zimage.ts        # Z-Image API
│   └── cache.ts         # 缓存管理
└── types/               # TypeScript 类型
```

## 积分消耗（默认）

| 功能 | 消耗积分 |
|------|----------|
| Sora 视频 10s | 100 |
| Sora 视频 15s | 150 |
| Sora 图像 | 50 |
| Gemini Nano | 10 |
| Gemini Pro | 30 |
| Z-Image | 30 |
| Gitee AI | 30 |
| AI 对话 | 1/条 |

> 积分消耗可在管理后台自定义调整

## 环境变量

详见 [.env.example](./.env.example) 文件，包含所有可配置项及说明。

## 许可证

MIT
