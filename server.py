from flask import Flask, request, jsonify
import requests
import urllib3
from config import MODEL, BASE_URL, API_KEY

# 禁用 SSL 警告（仅用于测试）
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)


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
    system_prompt: str = "你是一个友好、自然的中文数字人助手，名字叫晴子。"
) -> str:
    """
    通用 AI Chat API HTTP 调用模板
    适配 99% Chat / Completion 类模型
    """
    # 先检查简单问候，避免不必要的 API 调用
    if "你好" in user_text:
        return "你好，我的名字叫晴子，很高兴见到你！"
    elif "你是谁" in user_text:
        return "我的名字叫晴子，是一个ai数字人捏"

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
    app.run(port=5000, debug=True)
