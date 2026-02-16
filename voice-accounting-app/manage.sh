#!/bin/bash

# 语音记账应用管理脚本

PROJECT_DIR="/root/voice-account/voice-accounting-app"
PID_FILE="$PROJECT_DIR/server.pid"
LOG_FILE="$PROJECT_DIR/server.log"

case "$1" in
    start)
        echo "启动语音记账应用..."
        cd "$PROJECT_DIR"
        
        # 检查是否已经运行
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p $PID > /dev/null 2>&1; then
                echo "应用已经在运行 (PID: $PID)"
                exit 1
            else
                rm -f "$PID_FILE"
            fi
        fi
        
        # 启动应用
        nohup npm run dev:https > "$LOG_FILE" 2>&1 & echo $! > "$PID_FILE"
        sleep 3
        
        # 检查是否启动成功
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p $PID > /dev/null 2>&1; then
                echo "✅ 应用启动成功!"
                echo "   PID: $PID"
                echo "   访问地址: https://192.168.2.28:3000"
                echo "   日志文件: $LOG_FILE"
            else
                echo "❌ 应用启动失败"
                rm -f "$PID_FILE"
                exit 1
            fi
        fi
        ;;
        
    stop)
        echo "停止语音记账应用..."
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p $PID > /dev/null 2>&1; then
                kill $PID
                sleep 2
                # 强制杀死如果还在运行
                if ps -p $PID > /dev/null 2>&1; then
                    kill -9 $PID
                fi
                echo "✅ 应用已停止"
            else
                echo "应用未运行"
            fi
            rm -f "$PID_FILE"
        else
            echo "PID文件不存在，应用可能未运行"
        fi
        
        # 清理所有相关进程
        pkill -f "node server.js" 2>/dev/null || true
        pkill -f "npm run dev:https" 2>/dev/null || true
        ;;
        
    restart)
        echo "重启语音记账应用..."
        $0 stop
        sleep 2
        $0 start
        ;;
        
    status)
        echo "检查语音记账应用状态..."
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p $PID > /dev/null 2>&1; then
                echo "✅ 应用正在运行"
                echo "   PID: $PID"
                echo "   访问地址: https://192.168.2.28:3000"
                
                # 显示最近的日志
                echo ""
                echo "最近的日志："
                tail -10 "$LOG_FILE" 2>/dev/null | grep -v "npm error" || echo "无新日志"
            else
                echo "❌ 应用未运行 (PID文件存在但进程不存在)"
                rm -f "$PID_FILE"
            fi
        else
            echo "❌ 应用未运行"
        fi
        ;;
        
    logs)
        echo "查看应用日志..."
        if [ -f "$LOG_FILE" ]; then
            tail -f "$LOG_FILE"
        else
            echo "日志文件不存在"
        fi
        ;;
        
    test)
        echo "测试应用是否响应..."
        response=$(curl -k -s https://192.168.2.28:3000/api/customers)
        if [ $? -eq 0 ] && [ "$response" != "" ]; then
            echo "✅ 应用响应正常"
            echo "   客户数量: $(echo "$response" | grep -o '"id"' | wc -l)"
        else
            echo "❌ 应用无响应"
        fi
        ;;
        
    *)
        echo "语音记账应用管理脚本"
        echo ""
        echo "用法: $0 {start|stop|restart|status|logs|test}"
        echo ""
        echo "命令说明:"
        echo "  start   - 启动应用"
        echo "  stop    - 停止应用"
        echo "  restart - 重启应用"
        echo "  status  - 查看运行状态"
        echo "  logs    - 查看实时日志"
        echo "  test    - 测试应用响应"
        echo ""
        exit 1
        ;;
esac