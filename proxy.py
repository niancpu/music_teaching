from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

AUDD_API_KEY = 'a614eaee55a298b2625726b1915f3a0a'
AUDD_API_URL = 'https://api.audd.io/analysis/'

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    files = {'file': (file.filename, file.stream, file.mimetype)}
    data = {
        'api_token': AUDD_API_KEY,
        'return': 'genre, mood'
    }

    try:
        resp = requests.post(AUDD_API_URL, files=files, data=data)
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/scores', methods=['GET'])
def get_scores():
    scores_dir = os.path.join(os.path.dirname(__file__), '欢乐颂乐谱')
    try:
        files = os.listdir(scores_dir)
        # 只返回文件，不包含子文件夹
        files = [f for f in files if os.path.isfile(os.path.join(scores_dir, f))]
        return jsonify({'scores': files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)