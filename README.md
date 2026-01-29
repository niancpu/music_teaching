# 🎵 音乐教学音频社区

一个为音乐教师设计的管弦乐教学资源平台，提供分轨音频播放、乐谱查看和外部演奏监听功能。

## ✨ 功能特性

- **多轨音频播放器** - 同步播放管弦乐各声部，支持独立音量控制
- **乐谱查看器** - PDF 格式总谱和分谱在线预览
- **外部演奏监听** - 通过麦克风检测学生演奏，自动暂停/恢复伴奏
- **曲目库** - 古典音乐和民歌分类管理

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| 后端 | FastAPI, Python 3.11, uvicorn |
| 部署 | Docker Compose, Nginx |

## 🚀 快速开始

### 开发环境

**前端**

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

**后端**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 生产环境 (Docker)

```bash
docker-compose up --build    # http://localhost
```

## 📁 项目结构

```
music_teaching/
├── frontend/                # Next.js 前端
│   ├── src/
│   │   ├── app/            # 页面路由
│   │   ├── components/     # React 组件
│   │   └── data/           # 曲目数据
│   └── public/             # 静态资源 (音频/乐谱)
├── backend/                 # FastAPI 后端
│   └── app/
│       ├── api/v1/         # API 路由
│       ├── schemas/        # Pydantic 模型
│       └── services/       # 业务逻辑
├── nginx/                   # Nginx 配置
└── docker-compose.yml
```

## ⚙️ 环境变量

复制 `backend/.env.example` 到 `backend/.env`：

```env
AUDD_API_KEY=xxx        # 音频分析 API
AI_API_KEY=xxx          # AI 聊天 API
AI_BASE_URL=xxx         # AI API 地址
AI_MODEL=xxx            # AI 模型名称
CORS_ORIGINS=["http://localhost:3000"]
```

## 🎼 曲目列表

| 曲目 | 作曲家 | 分轨 |
|------|--------|------|
| 欢乐颂 | 贝多芬 | ✅ 9 声部 |
| 四小天鹅 | 柴可夫斯基 | - |
| 茉莉花 | 中国民歌 | - |
| 小小少年 | 中国儿歌 | - |
| 那不勒斯舞曲 | 柴可夫斯基 | - |

## 📄 许可证

MIT License
