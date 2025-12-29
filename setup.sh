#!/bin/bash

# Antigravity Claude Proxy 一键配置脚本
# 🤖 Generated with Claude Code

# 设置颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}   Antigravity Claude Proxy 一键配置工具      ${NC}"
echo -e "${BLUE}===============================================${NC}"

# 1. 检查 Node.js 环境
echo -e "\n${YELLOW}[1/4] 检查环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js，请先安装 Node.js (推荐 v18+)。${NC}"
    exit 1
fi
node_version=$(node -v)
echo -e "${GREEN}✓ Node.js 已安装 (${node_version})${NC}"

# 2. 安装依赖
echo -e "\n${YELLOW}[2/4] 安装项目依赖...${NC}"
if [ -f "package.json" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 依赖安装成功${NC}"
    else
        echo -e "${RED}错误: 依赖安装失败，请检查网络。${NC}"
        exit 1
    fi
else
    echo -e "${RED}错误: 未找到 package.json，请确保在项目根目录运行此脚本。${NC}"
    exit 1
fi

# 3. 配置账号
echo -e "\n${YELLOW}[3/4] 配置 Google 账号...${NC}"
echo -e "${BLUE}提示: 接下来将启动 OAuth 流程。请根据终端提示操作。${NC}"
echo -e "${BLUE}如果你的环境中已有配置好的账号，可以按 Ctrl+C 跳过此步骤。${NC}"

npm run accounts:add

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 账号配置完成${NC}"
else
    echo -e "${YELLOW}! 账号配置未完成或已跳过${NC}"
fi

# 4. 完成与启动建议
echo -e "\n${YELLOW}[4/4] 配置完成！${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "${GREEN}如何使用：${NC}"
echo -e "1. ${BLUE}启动代理服务器：${NC}"
echo -e "   npm start"
echo -e ""
echo -e "2. ${BLUE}配置 Claude Code 使用此代理：${NC}"
echo -e "   export ANTHROPIC_BASE_URL=http://localhost:8080/v1"
echo -e "   export ANTHROPIC_API_KEY=sk-ant-any-key (代理不验证此 Key)"
echo -e "   claude"
echo -e ""
echo -e "3. ${BLUE}管理账号：${NC}"
echo -e "   npm run accounts"
echo -e "${BLUE}===============================================${NC}"

# 询问是否现在启动
read -p "是否现在启动代理服务器？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}正在启动服务器...${NC}"
    npm start
fi
