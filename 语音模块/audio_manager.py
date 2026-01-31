import asyncio
import signal
import uuid
import wave
from dataclasses import dataclass
from typing import Dict, Any

import config
from realtime_dialog_client import RealtimeDialogClient


@dataclass
class AudioConfig:
    format: str
    bit_size: int
    channels: int
    sample_rate: int
    chunk: int


class DialogSession:

    def __init__(self, ws_config: Dict[str, Any], output_audio_format: str = "pcm", 
                 audio_file_path: str = "", recv_timeout: int = 10):
        self.audio_file_path = audio_file_path
        self.recv_timeout = recv_timeout
        self.session_id = str(uuid.uuid4())
        
        self.client = RealtimeDialogClient(
            config=ws_config, 
            session_id=self.session_id,
            output_audio_format=output_audio_format, 
            mod="audio_file", 
            recv_timeout=recv_timeout
        )
        
        self.is_running = True
        self.is_session_finished = False
        self.audio_buffer = b''
        
        signal.signal(signal.SIGINT, self._keyboard_signal)

    def handle_server_response(self, response: Dict[str, Any]) -> None:
        if not response:
            return
            
        message_type = response.get('message_type')
        
        if message_type == 'SERVER_ACK' and isinstance(response.get('payload_msg'), bytes):
            audio_data = response['payload_msg']
            self.audio_buffer += audio_data
            
        elif message_type == 'SERVER_FULL_RESPONSE':
            event = response.get('event')
            print(f"[服务器事件] event={event}")
            
        elif message_type == 'SERVER_ERROR':
            error_msg = response.get('payload_msg', '未知错误')
            print(f"[服务器错误] {error_msg}")
            raise Exception(f"服务器错误: {error_msg}")

    def _keyboard_signal(self, sig, frame):
        print("\n收到中断信号，正在停止...")
        self.stop()

    def stop(self):
        self.is_running = False

    async def receive_loop(self):
        try:
            while self.is_running:
                response = await self.client.receive_server_response()
                self.handle_server_response(response)
                
                event = response.get('event')
                if event in [152, 153]:
                    print(f"[会话结束] event={event}")
                    self.is_session_finished = True
                    break
                if event == 359:
                    print("[TTS 结束]")
                    self.is_session_finished = True
                    break
                    
        except asyncio.CancelledError:
            print("[接收任务已取消]")
        except Exception as e:
            print(f"[接收错误] {e}")
        finally:
            self.stop()
            self.is_session_finished = True

    async def process_audio_file(self) -> None:
        with wave.open(self.audio_file_path, 'rb') as wf:
            chunk_size = config.input_audio_config["chunk"]
            framerate = wf.getframerate()
            sleep_seconds = chunk_size / framerate
            
            print(f"[开始处理] 音频文件: {self.audio_file_path}")
            print(f"[音频信息] 采样率: {framerate}Hz, 块大小: {chunk_size}")

            while True:
                audio_data = wf.readframes(chunk_size)
                if not audio_data:
                    break

                await self.client.task_request(audio_data)
                await asyncio.sleep(sleep_seconds)

            print("[发送完成] 等待服务器响应...")

    async def start(self) -> None:
        try:
            await self.client.connect()
            print(f"[已连接] session_id: {self.session_id}")
            
            asyncio.create_task(self.process_audio_file())
            await self.receive_loop()
            
            await self.client.finish_session()
            while not self.is_session_finished:
                await asyncio.sleep(0.1)
            await self.client.finish_connection()
            await asyncio.sleep(0.1)
            await self.client.close()
            
            print(f"[会话完成] logid: {self.client.logid}")
            print(f"[音频数据] 接收到 {len(self.audio_buffer)} 字节")
            
        except Exception as e:
            print(f"[会话错误] {e}")
            raise
