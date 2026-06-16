#!/bin/bash
# Stops the ProjectFlow backend and frontend dev servers.

stopped=0

stop_port() {
  local port=$1
  local name=$2
  local pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Stopping $name (port $port, PID $pids)..."
    kill $pids 2>/dev/null
    stopped=$((stopped + 1))
  fi
}

stop_pattern() {
  local pattern=$1
  local name=$2
  local pids
  pids=$(pgrep -f "$pattern" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Stopping $name (PID $pids)..."
    kill $pids 2>/dev/null
    stopped=$((stopped + 1))
  fi
}

stop_port 4001 "backend"
stop_port 5173 "frontend"
stop_pattern "ngrok http" "ngrok"

if [ $stopped -eq 0 ]; then
  echo "No ProjectFlow services were running."
else
  echo "Done."
fi

