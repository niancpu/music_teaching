from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import requests
import urllib3
import os
from config import MODEL, BASE_URL, API_KEY

# 禁用 SSL 警告（仅用于测试）
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 获取当前脚本所在目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')
CORS(app, resources={r"/*": {"origins": "*"}})


# ==================== 静态资源路由 ====================

@app.route('/assets/<path:filename>')
def assets(filename):
    """提供 assets 目录下的静态资源（音频、乐谱等）"""
    return send_from_directory(os.path.join(BASE_DIR, 'assets'), filename)


# ==================== 页面路由 ====================

@app.route("/")
def index():
    """首页"""
    return render_template('pages/index.html')


@app.route("/library")
def library():
    """音频库页面"""
    return render_template('pages/library.html')


# ==================== 曲目详情页路由 ====================

@app.route("/track/ode-to-joy")
def track_ode_to_joy():
    """欢乐颂详情页"""
    return render_template('tracks/ode-to-joy.html')


@app.route("/track/ode-to-joy-wavesurfer")
def track_ode_to_joy_wavesurfer():
    """欢乐颂波形播放器版本"""
    return render_template('tracks/ode-to-joy-wavesurfer.html')


@app.route("/track/four-little-swans")
def track_four_little_swans():
    """四小天鹅详情页"""
    return render_template('tracks/four-little-swans.html')


@app.route("/track/jasmine-flower")
def track_jasmine_flower():
    """茉莉花详情页"""
    return render_template('tracks/jasmine-flower.html')


@app.route("/track/little-hero")
def track_little_hero():
    """小英雄详情页"""
    return render_template('tracks/little-hero.html')


@app.route("/track/naples-dance")
def track_naples_dance():
    """那不勒斯舞曲详情页"""
    return render_template('tracks/naples-dance.html')


# ==================== 组件路由 ====================

@app.route("/score-viewer")
def score_viewer():
    """乐谱查看器"""
    return render_template('components/score-viewer.html')


@app.route("/score-detail")
def score_detail():
    """乐谱详情页"""
    return render_template('tracks/score-detail.html')


# ==================== API 路由 ====================

@app.route("/chat", methods=["POST"])
def chat():
    """AI 聊天接口"""
    data = request.json
    user_input = data.get("message", "")
    reply = generate_reply(user_input)
    return jsonify({
        "reply": reply
    })


def generate_reply(
    user_text: str,
    system_prompt: str = "你是一个专业的音乐教学助手，可以帮助用户分析乐曲、解答音乐理论问题、提供演奏建议等。请用简洁友好的语言回答问题。"
) -> str:
    """
    通用 AI Chat API HTTP 调用模板
    """
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
            verify=False
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        raise RuntimeError(f"AI API 请求失败: {e}")

    data = resp.json()

    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise RuntimeError(f"无法解析 AI 返回结果: {data}")


# ==================== 错误处理 ====================

@app.errorhandler(404)
def page_not_found(e):
    """404 错误处理"""
    return render_template('pages/index.html'), 404


if __name__ == "__main__":
    print(f"[INFO] 服务器启动中...")
    print(f"[INFO] 模板目录: {os.path.join(BASE_DIR, 'templates')}")
    print(f"[INFO] 静态资源目录: {os.path.join(BASE_DIR, 'static')}")
    print(f"[INFO] 媒体资源目录: {os.path.join(BASE_DIR, 'assets')}")
    app.run(port=5002, debug=True)
