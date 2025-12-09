# SanHub - AI 创意工作室

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwindcss" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

<p align="center">
  融合 <b>OpenAI Sora</b>、<b>Google Gemini</b>、<b>Z-Image</b>、<b>Gitee AI</b> 等多种 AI 生成服务的统一创作平台
</p>

---

## ✨ 功能特性

### 🎬 视频生成
- Sora 视频生成（10s / 15s）
- 支持 16:9、9:16、1:1 多种比例
- 参考图/视频驱动生成
- 实时任务状态追踪

### 🎨 图像生成
- **Gemini Nano** - 极速出图模式
- **Gemini Pro** - 4K 高清模式
- **Z-Image** - ModelScope 图像生成
- **Gitee AI** - 国产 AI 图像服务
- 风格迁移与编辑

### 🖼️ 作品广场
- 瀑布流浏览社区作品
- 热门 / 最新排序
- 一键复制提示词
- 作品公开分享

### 🛠️ 系统管理
- 用户管理与权限控制
- API 密钥配置
- 积分定价自定义
- 系统公告发布
- 注册开关控制

### 🔐 安全特性
- NextAuth.js 认证
- 验证码保护
- 请求频率限制
- 用户禁用机制

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | Next.js 14 (App Router) |
| **语言** | TypeScript |
| **样式** | TailwindCSS + shadcn/ui 风格 |
| **认证** | NextAuth.js |
| **数据库** | SQLite / MySQL（可切换） |
| **图标** | Lucide React |
| **部署** | Docker / Vercel / EdgeOne |

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/sanhub.git
cd sanhub
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，配置必要的环境变量：

```env
# 必填 - 认证密钥
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# 管理员账号
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-password

# API 配置（按需填写）
SORA_API_KEY=
GEMINI_API_KEY=
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 首次运行

系统会自动：
- 创建数据库表结构
- 初始化系统配置
- 创建管理员账号

## 🐳 Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 💾 数据库选择

| 类型 | 优势 | 适用场景 |
|------|------|----------|
| **SQLite** | 零配置、开箱即用 | 开发环境、小规模部署 |
| **MySQL** | 高并发、多实例支持 | 生产环境 |

切换数据库只需修改 `.env.local`：

```env
# SQLite（默认）
DB_TYPE=sqlite

# MySQL
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=sanhub
```

## 📁 项目结构

```
sanhub/
├── app/
│   ├── (auth)/              # 登录/注册页面
│   ├── (dashboard)/         # 用户面板
│   │   ├── video/           # 视频生成
│   │   ├── image/           # 图像生成
│   │   ├── gallery/         # 作品广场
│   │   ├── history/         # 历史记录
│   │   └── settings/        # 用户设置
│   ├── admin/               # 管理后台
│   │   ├── users/           # 用户管理
│   │   ├── api/             # API 配置
│   │   ├── pricing/         # 定价设置
│   │   └── announcement/    # 公告管理
│   └── api/                 # API 路由
├── components/
│   ├── ui/                  # 基础 UI 组件
│   ├── generator/           # 生成器组件
│   └── layout/              # 布局组件
├── lib/
│   ├── db.ts                # 数据库操作
│   ├── db-adapter.ts        # 数据库适配器
│   ├── auth.ts              # 认证配置
│   ├── sora.ts              # Sora API 封装
│   ├── gemini.ts            # Gemini API 封装
│   └── zimage.ts            # Z-Image API 封装
└── types/                   # TypeScript 类型定义
```

## 💰 积分消耗（默认）

| 功能 | 消耗积分 |
|------|----------|
| Sora 视频 10s | 100 |
| Sora 视频 15s | 150 |
| Sora 图像 | 50 |
| Gemini Nano | 10 |
| Gemini Pro | 30 |
| Z-Image | 30 |
| Gitee AI | 30 |

> 💡 积分消耗可在管理后台 `/admin/pricing` 自定义调整

## 📖 环境变量

详见 [.env.example](./.env.example) 文件，包含所有可配置项及说明。

## 📸 截图预览

<details>
<summary>点击展开截图</summary>

### 首页
![首页](./docs/screenshots/home.png)

### 视频生成
![视频生成](./docs/screenshots/video.png)

### 图像生成
![图像生成](./docs/screenshots/image.png)

### 管理后台
![管理后台](./docs/screenshots/admin.png)

</details>

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](./LICENSE)

---

<p align="center">
  Made with ❤️ by SanHub Team
</p>
