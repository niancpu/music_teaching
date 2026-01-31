import os
import uuid
import pyaudio
from dotenv import load_dotenv

load_dotenv()

ws_connect_config = {
    "base_url": "wss://openspeech.bytedance.com/api/v3/realtime/dialogue",
    "headers": {
        "X-Api-App-ID": os.getenv("API_APP_ID"),
        "X-Api-Access-Key": os.getenv("API_ACCESS_KEY"),
        "X-Api-Resource-Id": "volc.speech.dialog",
        "X-Api-App-Key": os.getenv("API_APP_KEY"),
        "X-Api-Connect-Id": str(uuid.uuid4()),
    }
}

start_session_req = {
    "asr": {
        "extra": {
            "end_smooth_window_ms": 1500,
        },
    },
    "tts": {
        "speaker": "zh_male_yunzhou_jupiter_bigtts",
        "audio_config": {
            "channel": 1,
            "format": "pcm_s16le",
            "sample_rate": 24000
        },
    },
    "dialog": {
        "bot_name": "音乐老师",
        "system_role": "你是一位专业的音乐教师，拥有丰富的音乐理论知识和教学经验。你擅长钢琴、声乐和乐理教学，对古典音乐、流行音乐都有深入了解。你热爱音乐教育，善于用通俗易懂的方式讲解复杂的音乐概念，能够根据学生的水平调整教学内容。",
        "speaking_style": "你的说话风格温和耐心，善于鼓励学生。讲解时会用生动的比喻帮助理解，语速适中，语调富有感染力。",
        "location": {
          "city": "北京",
        },
        "extra": {
            "strict_audit": False,
            "audit_response": "支持客户自定义安全审核回复话术。",
            "recv_timeout": 10,
            "input_mod": "audio"
        }
    }
}

input_audio_config = {
    "chunk": 3200,
    "format": "pcm",
    "channels": 1,
    "sample_rate": 16000,
    "bit_size": pyaudio.paInt16
}

output_audio_config = {
    "chunk": 3200,
    "format": "pcm",
    "channels": 1,
    "sample_rate": 24000,
    "bit_size": pyaudio.paFloat32
}
