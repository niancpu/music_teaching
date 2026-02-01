# 豆包语音对话后端服务

基于字节跳动豆包 API 的实时语音对话后端服务，提供语音对话 API 接口。

## 功能特点

- 🤖 AI 对话：调用豆包实时语音对话 API
- 🔊 语音合成：返回 AI 回复的语音音频
- 🎭 角色定制：可自定义 AI 角色和说话风格

## 项目结构

```
├── api_server.py              # FastAPI 后端服务
├── audio_manager.py           # 音频会话管理
├── config.py                  # 配置文件（API 密钥、角色设定等）
├── protocol.py                # WebSocket 协议定义
├── realtime_dialog_client.py  # 豆包 API 客户端
├── main.py                    # 命令行入口（可选）
├── .env                       # 环境变量配置
├── uploads/                   # 上传的录音文件（自动清理）
└── outputs/                   # AI 回复音频文件（自动清理）
```

## 环境要求

- Python 3.10+

## 安装

语音对话模块的依赖已合并到主项目 `backend/requirements.txt`。

在主项目根目录执行：

```bash
pip install -r backend/requirements.txt
```

或单独安装语音对话所需依赖：

```bash
pip install fastapi uvicorn python-multipart websockets pyaudio
```

## 配置

编辑 `config.py`，填入你的豆包 API 密钥：

```python
ws_connect_config = {
    "headers": {
        "X-Api-App-ID": "你的 App ID",
        "X-Api-Access-Key": "你的 Access Key",
        "X-Api-App-Key": "你的 App Key",
    }
}
```

## 运行

```bash
cd 语音对话
python api_server.py
```

后端将在 `http://localhost:8000` 启动。

## 前端集成

前端已集成到主项目中：
- 组件位置：`frontend/src/components/VoiceChat.tsx`
- 主页展示：`frontend/src/app/page.tsx`

启动主项目前端后，在首页即可使用语音对话功能。

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/dialog/audio` | POST | 上传录音进行对话 |
| `/api/dialog/output/{filename}` | GET | 获取 AI 回复音频 |

### POST /api/dialog/audio

上传 WAV 格式录音文件，返回 AI 回复。

**请求参数**：
- `audio_file`: WAV 音频文件（16kHz，16位，单声道）
- `recv_timeout`: 超时时间（秒），默认 30

**响应示例**：
```json
{
  "success": true,
  "task_id": "uuid",
  "audio_received": true,
  "audio_size": 102940,
  "output_audio_url": "/api/dialog/output/xxx_output.pcm",
  "logid": "xxx",
  "message": "语音对话处理完成"
}
```

## 音频格式

- **输入**：WAV 格式，16kHz 采样率，16 位，单声道
- **输出**：PCM 格式（pcm_s16le），24kHz 采样率，16 位，单声道

## 配置说明

### 修改 AI 角色

编辑 `config.py` 中的 `start_session_req.dialog` 部分：

```python
"dialog": {
    "bot_name": "音乐老师",  # AI 名称
    "system_role": "你是一位专业的音乐教师...",  # 角色设定
    "speaking_style": "你的说话风格温和耐心...",  # 说话风格
}
```

### 修改语音音色

编辑 `config.py` 中的 `start_session_req.tts.speaker`：

```python
"tts": {
    "speaker": "zh_male_yunzhou_jupiter_bigtts",  # 音色 ID
}
```

## 注意事项

- 文件会自动清理，只保留最近 5 个会话的文件
- 确保豆包 API 密钥配置正确
- 如遇代理问题，请检查系统代理设置

## 许可证

MIT License
