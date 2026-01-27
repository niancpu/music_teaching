import os
from dotenv import load_dotenv
load_dotenv()
API_KEY=os.getenv("API_KEY")
BASE_URL=os.getenv("BASE_URL")
MODEL=os.getenv("MODEL")
if not API_KEY:
    raise RuntimeError(" AI API_KEY 未配置")
if not BASE_URL:
    raise RuntimeError(" AI BASE_URL 未配置")
if not MODEL:
    raise RuntimeError(" AI MODEL 未配置")