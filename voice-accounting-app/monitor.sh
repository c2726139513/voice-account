#!/bin/bash

# 监控脚本 - 确保应用持续运行

PROJECT_DIR="/root/jizhang/voice-accounting-app"
PID_FILE="$PROJECT_DIR/server.pid"
LOG_FILE="$PROJECT_DIR/server.log"
CHECK_INTERVAL=30  # 检查间隔（秒）

echo "开始监控语音记账应用..."
echo "检查间隔: ${CHECK_INTERVAL}秒"
echo "按 Ctrl+C 停止监控"
echo ""

while true; do
    # 检查PID文件是否存在
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        
        # 检查进程是否还在运行
        if ps -p $PID > /dev/null 2>&1; then
            # 进程存在，检查是否响应
            if curl -k -s https://192.168.2.28:3000/api/customers > /dev/null 2>&1; then
                echo "$(date '+%Y-%m-%d %H:%M:%S') - 应用运行正常"
            else
                echo "$(date '+%Y-%m-%d %H:%M:%S') - ⚠️ 应用无响应，重启中..."
                kill $PID 2>/dev/null
                sleep 2
                cd "$PROJECT_DIR"
                nohup npm run dev:https > "$LOG_FILE" 2>&1 & echo $! > "$PID_FILE"
                sleep 3
                echo "$(date '+%Y-%m-%d %H:%M:%S') - ✅ 应用已重启"
            fi
        else
            # 进程不存在，重新启动
            echo "$(date '+%Y-%m-%d %H:%M:%S') - ⚠️ 应用进程不存在，重启中..."
            cd "$PROJECT_DIR"
            nohup npm run dev:https > "$LOG_FILE" 2>&1 & echo $! > "$PID_FILE"
            sleep 3
            echo "$(date '+%Y-%m-%d %H:%M:%S') - ✅ 应用已重启"
        fi
    else
        # PID文件不存在，启动应用
        echo "$(date '+%Y-%m-%d %H:%M:%S') - ⚠️ PID文件不存在，启动应用..."
        cd "$PROJECT_DIR"
        nohup npm run dev:https > "$LOG_FILE" 2>&1 & echo $! > "$PID_FILE"
        sleep 3
        echo "$(date '+%Y-%m-%d %H:%M:%S') - ✅ 应用已启动"
    fi
    
    # 等待下次检查
    sleep $CHECK_INTERVAL
done