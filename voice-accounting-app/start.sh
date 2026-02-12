#!/bin/bash

echo "==================================="
echo "语音记账应用快速启动脚本"
echo "==================================="
echo ""

# 检查是否已安装依赖
if [ ! -d "/root/jizhang/voice-accounting-app/node_modules" ]; then
    echo "检测到未安装依赖，正在安装..."
    cd /root/jizhang/voice-accounting-app
    npm install
fi

# 使用管理脚本启动应用
/root/jizhang/voice-accounting-app/manage.sh start

echo ""
echo "==================================="
echo "应用信息："
echo "  访问地址: https://192.168.2.28:3000"
echo "  测试页面: https://192.168.2.28:3000/test-customer.html"
echo ""
echo "管理命令："
echo "  查看状态: ./manage.sh status"
echo "  查看日志: ./manage.sh logs"
echo "  停止应用: ./manage.sh stop"
echo "  重启应用: ./manage.sh restart"
echo "==================================="