# Clash 代理管理指南

## ✅ 当前状态

Clash 已在服务器上正常运行：
- **HTTP 代理**: 127.0.0.1:8083 ✅ 工作正常
- **Dashboard**: http://YOUR_SERVER_IP:8084/ui/ ✅ 可访问
- **SOCKS5**: 127.0.0.1:7891

---

## 🎯 快速管理

服务器上已安装管理脚本 `~/clash-control.sh`，使用方法：

```bash
# 查看状态
~/clash-control.sh status

# 启动 Clash
~/clash-control.sh start

# 停止 Clash
~/clash-control.sh stop

# 重启 Clash
~/clash-control.sh restart

# 查看日志
~/clash-control.sh logs
```

---

## 📋 常用操作

### 查看状态
```bash
ssh ecs-user@YOUR_SERVER_IP
~/clash-control.sh status
```

预期输出：
```
✅ Clash 正在运行 (PID: 2577180)

端口状态:
  tcp6       0      0 :::8083                 :::*                    LISTEN
  tcp6       0      0 :::8084                 :::*                    LISTEN

代理测试:
  ✅ HTTP 代理 (8083) 工作正常
  ✅ Dashboard (8084) 可访问
```

### 测试代理
```bash
# 测试 HTTP 代理
curl -I --proxy http://127.0.0.1:8083 https://www.google.com

# 应该返回: HTTP/1.1 200 Connection established
```

### 访问 Dashboard
浏览器打开: http://YOUR_SERVER_IP:8084/ui/

---

## 🔧 配置文件

### 位置
```
~/.config/clash/
├── clash              # Clash 二进制文件
├── config.yaml        # 配置文件
├── dashboard/         # Web Dashboard
├── clash.log          # 运行日志
└── clash.pid          # 进程 PID
```

### 关键配置 (config.yaml)
```yaml
port: 8083                          # HTTP 代理端口
socks-port: 7891                    # SOCKS5 端口
allow-lan: true                     # 允许局域网访问
mode: Rule                          # 代理模式
external-controller: 0.0.0.0:8084   # Dashboard 端口
```

---

## 🚀 启动方式

### 方法1: 使用管理脚本（推荐）
```bash
~/clash-control.sh start
```

### 方法2: 手动启动
```bash
cd ~/.config/clash
nohup ./clash -d . > clash.log 2>&1 &
echo $! > clash.pid
```

### 方法3: 创建 systemd 服务（开机自启）
```bash
# 创建服务文件
sudo tee /etc/systemd/system/clash.service << 'EOF'
[Unit]
Description=Clash Proxy Service
After=network.target

[Service]
Type=simple
User=ecs-user
WorkingDirectory=/home/ecs-user/.config/clash
ExecStart=/home/ecs-user/.config/clash/clash -d /home/ecs-user/.config/clash
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

# 重新加载并启动
sudo systemctl daemon-reload
sudo systemctl start clash
sudo systemctl enable clash

# 查看状态
sudo systemctl status clash
```

---

## ❌ 停止 Clash

### 方法1: 使用脚本
```bash
~/clash-control.sh stop
```

### 方法2: 手动停止
```bash
# 如果有 PID 文件
kill $(cat ~/.config/clash/clash.pid)

# 或查找进程 ID
ps aux | grep '[c]lash -d'
kill <PID>
```

---

## 🔍 故障排查

### 问题1: 端口被占用
```bash
# 查看占用端口的进程
netstat -tuln | grep 8083
lsof -i :8083

# 杀掉占用进程
kill -9 <PID>
```

### 问题2: 代理不工作
```bash
# 检查 Clash 日志
tail -100 ~/.config/clash/clash.log

# 检查配置文件
cat ~/.config/clash/config.yaml | grep -E 'port|socks-port|external-controller'

# 重启 Clash
~/clash-control.sh restart
```

### 问题3: Dashboard 无法访问
```bash
# 检查外部控制器配置
cat ~/.config/clash/config.yaml | grep external-controller
# 应该是: external-controller: 0.0.0.0:8084

# 检查端口
netstat -tuln | grep 8084
# 应该监听在 0.0.0.0:8084

# 检查防火墙（如果有）
sudo firewall-cmd --list-ports
```

---

## 📊 监控和日志

### 查看实时日志
```bash
~/clash-control.sh logs

# 或
tail -f ~/.config/clash/clash.log
```

### 查看进程信息
```bash
ps aux | grep clash
```

### 查看端口状态
```bash
netstat -tuln | grep -E '8083|8084|7891'
```

---

## 🔄 更新 Clash

### 下载新版本
```bash
cd ~/.config/clash

# 备份当前版本
cp clash clash.backup

# 下载新版本（根据架构选择）
# Linux AMD64
wget https://github.com/Dreamacro/clash/releases/download/v1.18.0/clash-linux-amd64-v1.18.0.gz

# 解压
gunzip clash-linux-amd64-v1.18.0.gz
chmod +x clash-linux-amd64-v1.18.0
mv clash-linux-amd64-v1.18.0 clash

# 重启服务
~/clash-control.sh restart
```

---

## 🌐 环境变量配置

### 为当前 Shell 设置代理
```bash
export HTTP_PROXY=http://127.0.0.1:8083
export HTTPS_PROXY=http://127.0.0.1:8083
export ALL_PROXY=http://127.0.0.1:8083

# 测试
curl -I https://www.google.com
```

### 永久配置（添加到 ~/.bashrc）
```bash
cat >> ~/.bashrc << 'EOF'

# Clash 代理
export HTTP_PROXY=http://127.0.0.1:8083
export HTTPS_PROXY=http://127.0.0.1:8083
export ALL_PROXY=http://127.0.0.1:8083
EOF

source ~/.bashrc
```

---

## 📋 完整启动流程

### 服务器重启后启动所有服务
```bash
# 1. 连接服务器
ssh ecs-user@YOUR_SERVER_IP

# 2. 启动 Clash
~/clash-control.sh start

# 3. 等待 3 秒
sleep 3

# 4. 验证 Clash
~/clash-control.sh status

# 5. 启动 Claude Proxy
cd ~/antigravity-claude-proxy
pm2 start ecosystem.config.cjs

# 6. 验证服务
pm2 status
curl http://localhost:8082/health
curl http://localhost:8082/account-limits
```

### 一键启动脚本
创建 `~/start-all.sh`:
```bash
#!/bin/bash
echo "=== 启动所有服务 ==="

echo "1. 启动 Clash..."
~/clash-control.sh start

echo "2. 等待 Clash 就绪..."
sleep 3

echo "3. 启动 Claude Proxy..."
cd ~/antigravity-claude-proxy
pm2 start ecosystem.config.cjs

echo "4. 验证服务..."
sleep 5

echo "=== 服务状态 ==="
~/clash-control.sh status
echo ""
pm2 status

echo "=== 测试 Claude Proxy ==="
curl -s http://localhost:8082/health | jq .
echo ""
curl -s http://localhost:8082/account-limits | jq '.accounts[] | {email, status}'
```

使用方法：
```bash
chmod +x ~/start-all.sh
~/start-all.sh
```

---

## 🔗 相关资源

- **Clash Dashboard**: http://YOUR_SERVER_IP:8084/ui/
- **Clash 配置**: ~/.config/clash/config.yaml
- **管理脚本**: ~/clash-control.sh
- **日志文件**: ~/.config/clash/clash.log

---

**最后更新**: 2026-01-06
**维护者**: Dylan
