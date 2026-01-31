import asyncio
import os
import uuid
import wave
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import uvicorn

import config
from audio_manager import DialogSession

app = FastAPI(
    title="豆包语音对话 API",
    description="接收录音文件，返回语音对话结果",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
MAX_SESSIONS = 5
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


def cleanup_old_files(directory: str, max_files: int = MAX_SESSIONS) -> int:
    try:
        files = []
        for f in os.listdir(directory):
            filepath = os.path.join(directory, f)
            if os.path.isfile(filepath):
                mtime = os.path.getmtime(filepath)
                files.append((filepath, mtime))
        
        files.sort(key=lambda x: x[1], reverse=True)
        
        deleted_count = 0
        for filepath, _ in files[max_files:]:
            try:
                os.remove(filepath)
                print(f"[CLEANUP] 删除旧文件: {filepath}")
                deleted_count += 1
            except Exception as e:
                print(f"[CLEANUP] 删除文件失败 {filepath}: {e}")
        
        return deleted_count
    except Exception as e:
        print(f"[CLEANUP] 清理目录失败 {directory}: {e}")
        return 0


@app.get("/")
async def root():
    return {
        "service": "豆包语音对话 API",
        "version": "1.0.0",
        "endpoints": {
            "POST /api/dialog/audio": "上传录音文件进行语音对话",
            "GET /api/dialog/output/{filename}": "获取对话输出音频文件",
            "GET /api/health": "健康检查"
        }
    }


@app.post("/api/dialog/audio")
async def dialog_with_audio(
    audio_file: UploadFile = File(...),
    recv_timeout: int = Form(default=30)
):
    if not audio_file.filename or not audio_file.filename.endswith(('.wav', '.WAV')):
        raise HTTPException(status_code=400, detail="仅支持 WAV 格式的音频文件")
    
    if recv_timeout < 10 or recv_timeout > 120:
        recv_timeout = max(10, min(120, recv_timeout))
    
    task_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    input_filename = f"{task_id}_{timestamp}_input.wav"
    input_filepath = os.path.join(UPLOAD_DIR, input_filename)
    
    try:
        content = await audio_file.read()
        with open(input_filepath, "wb") as f:
            f.write(content)
        
        print(f"[DEBUG] 创建 DialogSession - 输入文件: {input_filepath}")
        
        ws_config = {
            "base_url": config.ws_connect_config["base_url"],
            "headers": {
                **config.ws_connect_config["headers"],
                "X-Api-Connect-Id": str(uuid.uuid4())
            }
        }
        print(f"[DEBUG] 生成新的 Connect-Id: {ws_config['headers']['X-Api-Connect-Id']}")
        
        session = DialogSession(
            ws_config=ws_config,
            output_audio_format="pcm",
            audio_file_path=input_filepath,
            recv_timeout=recv_timeout
        )
        
        print(f"[DEBUG] 开始执行对话...")
        try:
            await session.start()
            print(f"[DEBUG] 对话执行完成")
        except Exception as session_error:
            print(f"[DEBUG] 对话执行出错: {session_error}")
            import traceback
            traceback.print_exc()
            raise
        
        output_filename = f"{task_id}_{timestamp}_output.pcm"
        output_filepath = os.path.join(OUTPUT_DIR, output_filename)
        
        audio_buffer_size = len(session.audio_buffer) if session.audio_buffer else 0
        logid = getattr(session.client, 'logid', None) if hasattr(session, 'client') else None
        
        print(f"[DEBUG] 会话完成 - task_id: {task_id}")
        print(f"[DEBUG] audio_buffer 大小: {audio_buffer_size} 字节")
        print(f"[DEBUG] logid: {logid}")
        
        if session.audio_buffer and len(session.audio_buffer) > 0:
            with open(output_filepath, "wb") as f:
                f.write(session.audio_buffer)
            print(f"[DEBUG] 输出音频已保存到: {output_filepath}")
            
            return JSONResponse(content={
                "success": True,
                "task_id": task_id,
                "audio_received": True,
                "audio_size": audio_buffer_size,
                "output_audio_url": f"/api/dialog/output/{output_filename}",
                "logid": logid,
                "message": "语音对话处理完成"
            })
        else:
            print(f"[DEBUG] 警告: 没有收到音频数据")
            return JSONResponse(content={
                "success": False,
                "task_id": task_id,
                "audio_received": False,
                "audio_size": 0,
                "output_audio_url": "",
                "logid": logid,
                "message": "语音对话完成，但未收到回复音频"
            })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")
    
    finally:
        cleanup_old_files(UPLOAD_DIR, MAX_SESSIONS)
        cleanup_old_files(OUTPUT_DIR, MAX_SESSIONS)


@app.get("/api/dialog/output/{filename}")
async def get_output_audio(filename: str):
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    return FileResponse(
        filepath,
        media_type="audio/pcm",
        filename=filename
    )


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
