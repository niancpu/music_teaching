from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
import urllib3
import os
from config import MODEL, BASE_URL, API_KEY

# 禁用 SSL 警告（仅用于测试）
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 获取当前脚本所在目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # 启用 CORS 支持，允许所有来源


@app.route("/")
def index():
    html_path = os.path.join(BASE_DIR, 'ode-to-joy.html')
    print(f"[DEBUG] 尝试读取文件: {html_path}")
    print(f"[DEBUG] 文件是否存在: {os.path.exists(html_path)}")
    
    if os.path.exists(html_path):
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return Response(content, mimetype='text/html')
    else:
        return f"文件不存在: {html_path}", 404


@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_input = data.get("message", "")
    reply = generate_reply(user_input)
    return jsonify({
        "reply": reply
    })


def generate_reply(
    user_text: str,
    system_prompt: str = "数字人助手"
) -> str:
    """
    通用 AI Chat API HTTP 调用模板
    适配 99% Chat / Completion 类模型
    """
   
    # 其他情况调用 AI API
    url = f"{BASE_URL}/chat/completions"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ],
        "temperature": 0.7,
        "max_tokens": 1024
    }

    try:
        resp = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=30,
            verify=False  # 禁用 SSL 验证（仅用于测试）
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        raise RuntimeError(f"AI API 请求失败: {e}")

    data = resp.json()

    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise RuntimeError(f"无法解析 AI 返回结果: {data}")


if __name__ == "__main__":
    app.run(port=5002, debug=True)
