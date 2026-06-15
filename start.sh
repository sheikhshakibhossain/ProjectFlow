#!/bin/bash
# Starts the ProjectFlow backend and frontend dev servers together.
#
# Usage:
#   ./start.sh           Start backend + frontend, reachable on localhost and LAN.
#   ./start.sh --ngrok   Also expose the frontend publicly via an ngrok tunnel.
#                         (Only the frontend is tunneled; it proxies /api requests
#                          to the backend directly on this machine.)

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BACKEND_PORT=4001
FRONTEND_PORT=5173

USE_NGROK=false
for arg in "$@"; do
  case "$arg" in
    --ngrok) USE_NGROK=true ;;
  esac
done

port_in_use() {
  (echo > "/dev/tcp/127.0.0.1/$1") >/dev/null 2>&1
}

if port_in_use "$BACKEND_PORT"; then
  echo "Error: port $BACKEND_PORT is already in use (backend). Stop whatever is using it and try again."
  exit 1
fi

if port_in_use "$FRONTEND_PORT"; then
  echo "Error: port $FRONTEND_PORT is already in use (frontend). Stop whatever is using it and try again."
  exit 1
fi

if [ "$USE_NGROK" = true ] && ! command -v ngrok >/dev/null 2>&1; then
  echo "Error: --ngrok was given but ngrok is not installed or not on PATH."
  exit 1
fi

cleanup() {
  echo ""
  echo "Stopping servers..."
  kill "$BACKEND_PID" "$FRONTEND_PID" "$NGROK_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "Starting backend on http://localhost:$BACKEND_PORT ..."
(cd "$ROOT_DIR/backend" && npm start) &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:$FRONTEND_PORT ..."
(cd "$ROOT_DIR" && npm run dev) &
FRONTEND_PID=$!

sleep 2

LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"

echo ""
echo "=================================="
echo "  Backend:        http://localhost:$BACKEND_PORT"
echo "  Frontend:       http://localhost:$FRONTEND_PORT"
if [ -n "$LAN_IP" ]; then
  echo "  Frontend (LAN): http://$LAN_IP:$FRONTEND_PORT"
fi
echo "=================================="

if [ "$USE_NGROK" = true ]; then
  echo "Starting ngrok tunnel for the frontend (port $FRONTEND_PORT) ..."
  ngrok http "$FRONTEND_PORT" --log=stdout > /tmp/ngrok.log 2>&1 &
  NGROK_PID=$!

  NGROK_URL=""
  for i in $(seq 1 20); do
    NGROK_URL="$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)"
    [ -n "$NGROK_URL" ] && break
    sleep 0.5
  done

  if [ -n "$NGROK_URL" ]; then
    echo "  Public URL:     $NGROK_URL"
  else
    echo "  Warning: could not determine the ngrok public URL. Check /tmp/ngrok.log"
  fi
  echo "=================================="
fi

echo "Press Ctrl+C to stop all servers."
echo ""

wait
