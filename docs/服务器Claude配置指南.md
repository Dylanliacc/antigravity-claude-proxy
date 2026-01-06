# 服务器端 Claude Code 配置指南

> ⚠️ **重要提示**：由于 Claude Code 首次运行强制要求 OAuth 认证（需要浏览器），**不推荐在服务器上使用 Claude Code**。
>
> **推荐方案**：在本地电脑使用 Claude Code，通过网络连接到服务器上的代理服务。参见本文档末尾的"本地使用方案"。

---

## ⚠️ 服务器端使用限制

Claude Code v2.0.76 存在以下限制：

1. **首次运行强制 OAuth 认证**
   - 即使配置了环境变量和 API key，仍然要求浏览器认证
   - SSH 环境中无法完成浏览器交互
   - 需要手动复制认证链接到本地浏览器

2. **认证流程复杂**
   - 需要真实的 Anthropic Console 账号
   - 认证后的凭证绑定到特定账号
   - 不适合代理服务器场景

3. **推荐替代方案**
   - 服务器只运行代理服务（已完成）
   - 本地电脑运行 Claude Code
   - 通过网络连接到远程代理

---

## ✅ 推荐方案：本地使用 Claude Code

### 架构说明

```
┌──────────────┐      HTTP      ┌──────────────┐      ┌──────────────┐
│  本地电脑    │ ──────────────> │  服务器       │ ───> │ Google APIs  │
│  Claude Code │                 │  Proxy:8082  │      │ (via Clash)  │
└──────────────┘                 └──────────────┘      └──────────────┘
```

### 本地电脑配置步骤

**方式1: 使用环境变量**

```bash
# 在本地电脑的 ~/.bashrc 或 ~/.zshrc 中添加
export ANTHROPIC_BASE_URL=http://YOUR_SERVER_IP:8082/v1

# 重新加载
source ~/.bashrc  # 或 source ~/.zshrc

# 使用 Claude Code
claude 'hello'
```

**方式2: 使用配置文件（推荐）**

```bash
# 在本地电脑创建配置文件
mkdir -p ~/.config/claude-code

cat > ~/.config/claude-code/settings.json << 'EOF'
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://YOUR_SERVER_IP:8082/v1"
  },
  "theme": "dark",
  "model": "sonnet"
}
EOF

# 使用 Claude Code（首次运行需要完成认证）
claude 'hello'
```

**注意**：
- 本地使用时 BASE_URL 需要包含 `/v1` 后缀
- 首次运行仍需要完成 OAuth 认证，但本地有浏览器可以完成
- 认证完成后会保存凭证，后续使用不需要重新认证
- 所有请求会通过网络发送到服务器代理

### 验证连接

```bash
# 测试代理服务器是否可访问
curl http://YOUR_SERVER_IP:8082/health

# 测试模型列表
curl http://YOUR_SERVER_IP:8082/v1/models

# 使用 Claude Code
claude 'say hello'
```

---

## 🔧 如果仍想在服务器使用（高级）

如果你确实需要在服务器上使用 Claude Code，需要完成以下步骤：

### 步骤 1: 准备认证链接

运行 `claude` 命令后会显示类似：

```
Browser didn't open? Use the url below to sign in:
https://console.anthropic.com/oauth/authorize?code=...

Paste code here if prompted >
```

### 步骤 2: 在本地浏览器完成认证

1. 复制 URL 到本地浏览器
2. 登录你的 Anthropic Console 账号
3. 完成授权流程
4. 获取返回的 code

### 步骤 3: 粘贴 code 到服务器

将获取的 code 粘贴到服务器的 `Paste code here` 提示处

### 步骤 4: 完成配置

认证成功后，Claude Code 会保存凭证，后续使用不需要重新认证。

**缺点**：
- 需要真实的 Anthropic Console 账号
- 流程繁琐
- 不适合自动化场景

---

<details>
<summary>📖 以下是服务器端配置的技术文档（仅供参考）</summary>

---

## 📋 前提条件

1. ✅ Claude Code 已安装（v2.0.76 或更新版本）
2. ✅ Claude Proxy 服务正在运行（端口 8082）
3. ✅ 至少有一个可用的账号

验证前提条件：
```bash
# 检查 Claude Code 版本
claude --version

# 检查 Proxy 服务
curl http://localhost:8082/health

# 查看账号状态
curl http://localhost:8082/account-limits
```

---

## 🔧 配置步骤

### 步骤 1: 创建配置目录

```bash
mkdir -p ~/.config/claude-code
```

### 步骤 2: 创建配置文件

正确的配置文件位置是 `~/.config/claude-code/settings.json`（**不是** `~/.claude/claude-settings.json`）

```bash
cat > ~/.config/claude-code/settings.json << 'EOF'
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:8082",
    "ANTHROPIC_AUTH_TOKEN": "dummy"
  },
  "theme": "dark",
  "model": "sonnet"
}
EOF
```

**配置说明**:
- `ANTHROPIC_BASE_URL`: 指向本地代理服务器，**不要**添加 `/v1` 后缀
- `ANTHROPIC_AUTH_TOKEN`: 任意值即可（如 "dummy"），代理服务器不验证
- `theme`: 可选，预设主题为 "dark"
- `model`: 可选，默认模型档位为 "sonnet"

### 步骤 3: 验证配置文件

```bash
cat ~/.config/claude-code/settings.json
```

应该看到类似输出：
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:8082",
    "ANTHROPIC_AUTH_TOKEN": "dummy"
  },
  "theme": "dark",
  "model": "sonnet"
}
```

### 步骤 4: 首次运行 Claude Code

```bash
# 设置环境变量（可选，配置文件中已设置但环境变量优先级更高）
export ANTHROPIC_BASE_URL=http://localhost:8082
export ANTHROPIC_AUTH_TOKEN=dummy

# 首次运行
claude 'hello'
```

**首次运行时的交互**:

1. **主题选择**: 会显示主题选择界面，按回车选择默认的 "Dark mode"

2. **登录方式选择**: ⭐ **重要**
   ```
   Select login method:

   ❯ 1. Claude account with subscription · Pro, Max, Team, or Enterprise
     2. Anthropic Console account · API usage billing
   ```

   **选择选项 2**（向下箭头键选择，然后按回车）

   **为什么选择选项 2**:
   - 选项 1 会尝试浏览器登录，在SSH环境中不可用
   - 选项 2 会使用配置文件中的 `ANTHROPIC_AUTH_TOKEN`
   - 选项 2 会连接到你的本地代理 `http://localhost:8082`

3. **API Key 确认**（如果询问）:
   - 应该会自动检测到配置文件中的 "dummy" token
   - 直接按回车确认即可

4. **完成配置**: 之后 Claude Code 会开始处理你的请求

---

## ✅ 验证配置成功

### 测试 1: 简单问候

```bash
claude 'say hello'
```

**预期结果**: 应该看到 Claude 的回复（通过本地代理）

### 测试 2: 验证连接

如果 Claude Code 仍然尝试连接 `api.anthropic.com`，说明配置未生效。

**成功的标志**:
- ✅ Claude Code 启动正常
- ✅ 能够收到回复
- ✅ 没有 "Unable to connect to Anthropic services" 错误
- ✅ 没有 "Failed to connect to api.anthropic.com" 错误

---

## 🐛 常见问题

### 问题 1: Claude Code 仍然连接 api.anthropic.com

**症状**:
```
Unable to connect to Anthropic services
Failed to connect to api.anthropic.com: ERR_BAD_REQUEST
```

**解决方案**:

1. **检查配置文件位置**:
   ```bash
   ls -la ~/.config/claude-code/settings.json
   ```
   应该存在这个文件，**不是** `~/.claude/claude-settings.json`

2. **检查配置文件格式**:
   ```bash
   cat ~/.config/claude-code/settings.json
   ```
   必须使用 `"env"` 字段，不是 `"anthropicBaseUrl"`

3. **设置环境变量**:
   ```bash
   export ANTHROPIC_BASE_URL=http://localhost:8082
   export ANTHROPIC_AUTH_TOKEN=dummy
   claude 'test'
   ```

### 问题 2: URL 路径重复 (/v1/v1/messages)

**症状**:
```
API Error: 404 Endpoint POST /v1/v1/messages?beta=true not found
```

**原因**: `ANTHROPIC_BASE_URL` 包含了 `/v1` 后缀

**解决方案**:
```bash
# 错误 ❌
export ANTHROPIC_BASE_URL=http://localhost:8082/v1

# 正确 ✅
export ANTHROPIC_BASE_URL=http://localhost:8082
```

更新配置文件，确保不包含 `/v1`:
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:8082"
  }
}
```

### 问题 3: 配置文件格式错误

**错误格式** ❌:
```json
{
  "anthropicBaseUrl": "http://localhost:8082",
  "anthropicApiKey": "dummy"
}
```

**正确格式** ✅:
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:8082",
    "ANTHROPIC_AUTH_TOKEN": "dummy"
  }
}
```

### 问题 4: 代理服务未运行

**检查**:
```bash
curl http://localhost:8082/health
```

**如果失败**:
```bash
cd ~/antigravity-claude-proxy
pm2 start ecosystem.config.cjs
pm2 status
```

---

## 📝 完整配置示例

### 最小配置
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:8082",
    "ANTHROPIC_AUTH_TOKEN": "dummy"
  }
}
```

### 完整配置（带所有可选项）
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:8082",
    "ANTHROPIC_AUTH_TOKEN": "dummy",
    "ANTHROPIC_MODEL": "claude-sonnet-4-5-thinking",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-5-thinking",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-5-thinking",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-sonnet-4-5"
  },
  "theme": "dark",
  "model": "sonnet",
  "permissions": {
    "allow": [],
    "deny": [],
    "ask": []
  }
}
```

---

## 🔍 调试技巧

### 查看 Claude Code 配置

```bash
# 查看配置目录
ls -la ~/.config/claude-code/
ls -la ~/.claude/

# 查看环境变量
env | grep ANTHROPIC

# 查看 debug 日志
ls -lt ~/.claude/debug/*.log 2>&1 | head -5
```

### 测试代理 API

```bash
# 健康检查
curl http://localhost:8082/health

# 模型列表
curl http://localhost:8082/v1/models

# 账号状态
curl http://localhost:8082/account-limits
```

### 重置配置

如果配置混乱，可以重置：
```bash
# 删除旧配置
rm -f ~/.claude/claude-settings.json
rm -f ~/.config/claude-code/settings.json

# 重新创建
mkdir -p ~/.config/claude-code
cat > ~/.config/claude-code/settings.json << 'EOF'
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:8082",
    "ANTHROPIC_AUTH_TOKEN": "dummy"
  },
  "theme": "dark",
  "model": "sonnet"
}
EOF

# 首次运行
claude 'hello'
```

---

## 📚 相关文档

- [快速启动指南.md](./快速启动指南.md) - 服务启动和基本使用
- [部署配置文档.md](./部署配置文档.md) - 完整部署和故障排查
- [Claude Code 官方文档](https://docs.anthropic.com/claude/docs/claude-code)

---

## ✨ 配置成功后

一旦配置成功，你可以：

1. **在服务器上直接使用 Claude Code**:
   ```bash
   claude 'write a python script to read CSV files'
   ```

2. **选择不同的模型**:
   ```bash
   claude --model claude-opus-4-5-thinking 'complex task'
   claude --model gemini-3-flash 'simple query'
   ```

3. **使用所有 Claude Code 功能**:
   - 文件读写
   - 代码生成
   - 工具调用
   - 多轮对话

**注意**: 所有请求都会通过本地的 Antigravity Claude Proxy，不会直接连接 api.anthropic.com。

**注意**: 所有请求都会通过本地的 Antigravity Claude Proxy，不会直接连接 api.anthropic.com。

</details>

---

## 📚 总结

### ✅ 推荐方案（本地使用）

- **服务器**: 只运行代理服务 (Clash + PM2 + Claude Proxy)
- **本地电脑**: 运行 Claude Code，配置 ANTHROPIC_BASE_URL 指向服务器
- **优点**: 简单、直接、无需在服务器完成复杂认证

### ⚠️ 不推荐方案（服务器使用）

- **原因**: Claude Code 强制要求 OAuth 认证
- **限制**: SSH 环境中难以完成浏览器交互
- **如果必须**: 参见上方"如果仍想在服务器使用"章节

---

**最后更新**: 2026-01-06
