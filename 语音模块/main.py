import asyncio
import argparse

import config
from audio_manager import DialogSession


async def main() -> None:
    parser = argparse.ArgumentParser(description="豆包语音对话命令行工具")
    parser.add_argument("--audio", type=str, required=True, help="输入音频文件路径（WAV 格式）")
    parser.add_argument("--format", type=str, default="pcm", help="输出音频格式，默认 pcm")
    parser.add_argument("--timeout", type=int, default=30, help="接收超时时间（秒），范围 10-120，默认 30")

    args = parser.parse_args()
    recv_timeout = max(10, min(120, args.timeout))

    session = DialogSession(
        ws_config=config.ws_connect_config, 
        output_audio_format=args.format, 
        audio_file_path=args.audio,
        recv_timeout=recv_timeout
    )
    await session.start()


if __name__ == "__main__":
    asyncio.run(main())
