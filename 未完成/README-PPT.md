# 自动生成PPT（教学用）说明

这是为项目添加的一个最小后端演示：使用 Flask + python-pptx 根据每首曲目的 JSON 元数据生成 PPTX 文件供教师下载。

快速上手（本地或服务器）：

1. 创建并激活虚拟环境：

```bash
python3 -m venv venv
source venv/bin/activate
```

2. 安装依赖：

```bash
pip install -r requirements.txt
```

3. 运行服务（开发模式）：

```bash
python3 ppt_generator.py
```

4. 在浏览器打开你的站点（或本地文件），在 `index.html` 中点击“生成PPT”按钮，服务会返回生成的 PPTX 文件。

文件与位置：
- `ppt_generator.py`：后端 Flask 接口实现，读取 `songs/<song>.json`。
- `songs/ode-to-joy.json`：示例元数据，请根据你的实际谱图和音频路径更新 `scoreImages` 与 `audio` 字段。

部署到服务器的建议：
- 推荐使用 `gunicorn` + `systemd` 或者容器（Docker）部署。
- 如果使用 `systemd`：创建一个虚拟环境，使用 `ExecStart=/path/to/venv/bin/gunicorn -w 2 -b 0.0.0.0:5000 ppt_generator:app` 启动。
- 如果你的站点是静态托管（如 Nginx），可以将此服务放在同一服务器并用反向代理（Nginx）转发 `/generate_ppt` 请求到 Flask 服务。

注意事项：
- `python-pptx` 无法简单地把音频嵌入并在 PowerPoint 播放（需要更复杂的 OOXML 操作），因此当前实现把音频路径写入幻灯片作为链接文本；如果需要把音频与 PPT 一起打包，可以实现 ZIP 打包下载（PPTX + 音频）或后续实现更复杂的嵌入逻辑。
- 请确认 `songs/*.json` 中的图片路径能被后端程序读取（建议使用服务器上真实文件路径或与项目相对路径）。

下一步：
- 我可以帮助你把服务打包为 Docker 镜像并给出部署/反向代理配置，或者把前端实现改为 `PptxGenJS`（无服务器）。请选择你想要的部署方式：`Docker`、`systemd`（在服务器直接运行）或 `前端静态（PptxGenJS）`。

Docker 部署（推荐）
------------------
下面是快速使用 Docker 在你的服务器上部署的步骤（假设服务器已安装 Docker 与 Docker Compose）：

1. 在项目根目录构建并启动（在服务器上执行）：

```bash
docker compose build
docker compose up -d
```

2. 检查服务状态：

```bash
docker compose ps
docker compose logs -f nginx
```

3. 访问站点：打开 `http://<服务器IP>/`，点击页面上的“生成PPT”按钮将触发 `/generate_ppt?song=...`，Nginx 会把请求反向代理到 Flask 服务并返回生成的 PPTX。

注意事项：
- `docker compose` 命令在较新版本的 Docker 中可能是 `docker compose`（空格），在旧版本是 `docker-compose`（连字符）。
- 如果你要通过域名并启用 HTTPS，建议在 Nginx 前再使用反向代理 + Certbot（Let’s Encrypt）或者使用负载均衡器/托管 TLS。也可以把 Nginx 设为 HTTPS 终端并挂载证书。

清理：

```bash
docker compose down --volumes --remove-orphans
```

