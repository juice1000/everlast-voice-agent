#!/usr/bin/env zsh
# Run backend and frontend concurrently

# Ensure script runs from repo root
SCRIPT_DIR=${0:a:h}
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
NC='\033[0m' # No Color

print -- "${GREEN}Starting backend (nodemon + ts-node) and frontend (Vite) ...${NC}"

# Start backend
npm run dev &
BACKEND_PID=$!

# Start frontend
cd frontend && npm run dev &
FRONTEND_PID=$!

# Trap to cleanup on exit
cleanup() {
  echo "Stopping processes..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
}

trap cleanup INT TERM EXIT

# Wait for both
wait
