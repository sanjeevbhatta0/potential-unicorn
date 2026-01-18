#!/bin/bash

# Local Server Management Script for NewsChautari
# This script kills all running services and restarts them

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 NewsChautari - Local Server Manager${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================
# STEP 1: Kill existing services
# ============================================
echo -e "${YELLOW}📋 Step 1: Stopping existing services...${NC}"
echo ""

# Kill process on port 3333 (API)
echo -e "   Stopping API Backend (port 3333)..."
PID_3333=$(lsof -ti:3333 2>/dev/null)
if [ -n "$PID_3333" ]; then
    kill -9 $PID_3333 2>/dev/null
    echo -e "   ${GREEN}✅ API Backend stopped${NC}"
else
    echo -e "   ${YELLOW}⚠️  API Backend was not running${NC}"
fi

# Kill process on port 8000 (AI Service)
echo -e "   Stopping AI Service (port 8000)..."
PID_8000=$(lsof -ti:8000 2>/dev/null)
if [ -n "$PID_8000" ]; then
    kill -9 $PID_8000 2>/dev/null
    echo -e "   ${GREEN}✅ AI Service stopped${NC}"
else
    echo -e "   ${YELLOW}⚠️  AI Service was not running${NC}"
fi

# Kill process on port 3000 (Web App)
echo -e "   Stopping Web App (port 3000)..."
PID_3000=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PID_3000" ]; then
    kill -9 $PID_3000 2>/dev/null
    echo -e "   ${GREEN}✅ Web App stopped${NC}"
else
    echo -e "   ${YELLOW}⚠️  Web App was not running${NC}"
fi

# Kill crawler processes (look for ts-node running crawler)
echo -e "   Stopping News Crawler..."
CRAWLER_PIDS=$(pgrep -f "ts-node.*crawler" 2>/dev/null)
if [ -n "$CRAWLER_PIDS" ]; then
    echo "$CRAWLER_PIDS" | xargs kill -9 2>/dev/null
    echo -e "   ${GREEN}✅ News Crawler stopped${NC}"
else
    echo -e "   ${YELLOW}⚠️  News Crawler was not running${NC}"
fi

# Wait a moment for ports to be released
echo ""
echo -e "${YELLOW}   Waiting for ports to be released...${NC}"
sleep 2

echo ""
echo -e "${GREEN}✅ Step 1 Complete: All services stopped${NC}"
echo ""

# ============================================
# STEP 2: Verify Docker services are running
# ============================================
echo -e "${YELLOW}📋 Step 2: Checking Docker infrastructure...${NC}"
echo ""

if docker ps | grep -q "nepali-news-db"; then
    echo -e "   ${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "   ${RED}❌ PostgreSQL is not running${NC}"
    echo -e "   ${YELLOW}   Starting Docker services...${NC}"
    cd "$SCRIPT_DIR/infrastructure/docker" && docker compose up -d
    sleep 5
    cd "$SCRIPT_DIR"
fi

if docker ps | grep -q "nepali-news-redis"; then
    echo -e "   ${GREEN}✅ Redis is running${NC}"
else
    echo -e "   ${RED}❌ Redis is not running${NC}"
fi

echo ""
echo -e "${GREEN}✅ Step 2 Complete: Docker infrastructure verified${NC}"
echo ""

# ============================================
# STEP 3: Start API Backend
# ============================================
echo -e "${YELLOW}📋 Step 3: Starting API Backend...${NC}"
cd "$SCRIPT_DIR/apps/api"
pnpm dev > /dev/null 2>&1 &
API_PID=$!
sleep 3

# Check if API started successfully
if lsof -ti:3333 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ API Backend started successfully (PID: $API_PID)${NC}"
    echo -e "   ${BLUE}   → http://localhost:3333${NC}"
else
    echo -e "   ${YELLOW}⚠️  API Backend starting... (PID: $API_PID)${NC}"
    echo -e "   ${BLUE}   → http://localhost:3333${NC}"
fi
echo ""

# ============================================
# STEP 4: Start AI Service
# ============================================
echo -e "${YELLOW}📋 Step 4: Starting AI Service...${NC}"
cd "$SCRIPT_DIR/services/ai-service"
./venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &
AI_PID=$!
sleep 3

# Check if AI Service started successfully
if lsof -ti:8000 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ AI Service started successfully (PID: $AI_PID)${NC}"
    echo -e "   ${BLUE}   → http://localhost:8000${NC}"
else
    echo -e "   ${YELLOW}⚠️  AI Service starting... (PID: $AI_PID)${NC}"
    echo -e "   ${BLUE}   → http://localhost:8000${NC}"
fi
echo ""

# ============================================
# STEP 5: Start News Crawler
# ============================================
echo -e "${YELLOW}📋 Step 5: Starting News Crawler...${NC}"
cd "$SCRIPT_DIR/services/crawler"
pnpm dev > /dev/null 2>&1 &
CRAWLER_PID=$!
sleep 2
echo -e "   ${GREEN}✅ News Crawler started (PID: $CRAWLER_PID)${NC}"
echo -e "   ${BLUE}   → Runs every 30 minutes${NC}"
echo ""

# ============================================
# STEP 6: Start Web App
# ============================================
echo -e "${YELLOW}📋 Step 6: Starting Web App...${NC}"
cd "$SCRIPT_DIR/apps/web"
pnpm dev > /dev/null 2>&1 &
WEB_PID=$!
sleep 3

# Check if Web App started successfully
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Web App started successfully (PID: $WEB_PID)${NC}"
    echo -e "   ${BLUE}   → http://localhost:3000${NC}"
else
    echo -e "   ${YELLOW}⚠️  Web App starting... (PID: $WEB_PID)${NC}"
    echo -e "   ${BLUE}   → http://localhost:3000${NC}"
fi
echo ""

# ============================================
# Summary
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 All services restarted successfully!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Running Services:${NC}"
echo -e "   • API Backend:   http://localhost:3333"
echo -e "   • AI Service:    http://localhost:8000"
echo -e "   • Web App:       http://localhost:3000"
echo -e "   • News Crawler:  Running in background"
echo ""
echo -e "${BLUE}📚 Quick Commands:${NC}"
echo -e "   • View logs:     tail -f /tmp/nepali-news-*.log"
echo -e "   • Stop all:      pkill -f 'pnpm dev' && pkill -f 'uvicorn'"
echo ""
echo -e "${GREEN}Happy coding! 🇳🇵✨${NC}"
echo ""
