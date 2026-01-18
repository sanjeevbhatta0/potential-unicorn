#!/bin/bash

# Regression Test Runner for Nepali News Hub
# This script runs all regression tests across the project
#
# Usage:
#   ./run-regression-tests.sh           # Run all tests
#   ./run-regression-tests.sh api       # Run only API tests
#   ./run-regression-tests.sh ai        # Run only AI Service tests
#   ./run-regression-tests.sh crawler   # Run only Crawler tests
#   ./run-regression-tests.sh integration # Run only integration tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_SUITES=()

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Nepali News Hub - Regression Test Runner${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to check if services are running
check_services() {
    echo -e "${YELLOW}📋 Checking if services are running...${NC}"
    echo ""
    
    local all_running=true
    
    # Check API
    if curl -s http://localhost:3333 > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ API Backend (localhost:3333)${NC}"
    else
        echo -e "   ${RED}❌ API Backend not running${NC}"
        all_running=false
    fi
    
    # Check AI Service
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ AI Service (localhost:8000)${NC}"
    else
        echo -e "   ${RED}❌ AI Service not running${NC}"
        all_running=false
    fi
    
    # Check PostgreSQL
    if docker ps | grep -q "nepali-news-db"; then
        echo -e "   ${GREEN}✅ PostgreSQL (Docker)${NC}"
    else
        echo -e "   ${RED}❌ PostgreSQL not running${NC}"
        all_running=false
    fi
    
    # Check Redis
    if docker ps | grep -q "nepali-news-redis"; then
        echo -e "   ${GREEN}✅ Redis (Docker)${NC}"
    else
        echo -e "   ${RED}❌ Redis not running${NC}"
        all_running=false
    fi
    
    echo ""
    
    if [ "$all_running" = false ]; then
        echo -e "${YELLOW}⚠️  Some services are not running. Run ./local-server.sh first.${NC}"
        echo ""
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Function to run API tests
run_api_tests() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📦 Running API Backend Tests${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    cd "$SCRIPT_DIR/apps/api"
    
    # Check if test dependencies are installed
    if [ ! -d "node_modules/@nestjs/testing" ]; then
        echo -e "${YELLOW}Installing test dependencies...${NC}"
        pnpm add -D @nestjs/testing supertest @types/supertest ts-jest jest
    fi
    
    # Run E2E tests
    if pnpm jest --config test/jest-e2e.json --passWithNoTests 2>&1; then
        echo -e "${GREEN}✅ API Backend tests passed${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ API Backend tests failed${NC}"
        ((TESTS_FAILED++))
        FAILED_SUITES+=("API Backend")
    fi
    
    cd "$SCRIPT_DIR"
}

# Function to run AI Service tests
run_ai_tests() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🤖 Running AI Service Tests${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    cd "$SCRIPT_DIR/services/ai-service"
    
    # Check if pytest is available
    if [ -f "./venv/bin/pytest" ]; then
        if ./venv/bin/pytest tests/ -v --tb=short 2>&1; then
            echo -e "${GREEN}✅ AI Service tests passed${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}❌ AI Service tests failed${NC}"
            ((TESTS_FAILED++))
            FAILED_SUITES+=("AI Service")
        fi
    else
        echo -e "${YELLOW}⚠️  pytest not found in venv, installing...${NC}"
        ./venv/bin/pip install pytest pytest-asyncio httpx
        
        if ./venv/bin/pytest tests/ -v --tb=short 2>&1; then
            echo -e "${GREEN}✅ AI Service tests passed${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}❌ AI Service tests failed${NC}"
            ((TESTS_FAILED++))
            FAILED_SUITES+=("AI Service")
        fi
    fi
    
    cd "$SCRIPT_DIR"
}

# Function to run Crawler tests
run_crawler_tests() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🕷️  Running Crawler Tests${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    cd "$SCRIPT_DIR/services/crawler"
    
    # Check if tests exist
    if [ -d "test" ] && [ "$(ls -A test/*.ts 2>/dev/null)" ]; then
        if pnpm jest --passWithNoTests 2>&1; then
            echo -e "${GREEN}✅ Crawler tests passed${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}❌ Crawler tests failed${NC}"
            ((TESTS_FAILED++))
            FAILED_SUITES+=("Crawler")
        fi
    else
        echo -e "${YELLOW}⚠️  No crawler tests found yet${NC}"
    fi
    
    cd "$SCRIPT_DIR"
}

# Function to run Integration tests
run_integration_tests() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🔗 Running Integration Tests${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    cd "$SCRIPT_DIR/tests"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing integration test dependencies...${NC}"
        pnpm install
    fi
    
    if pnpm test 2>&1; then
        echo -e "${GREEN}✅ Integration tests passed${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ Integration tests failed${NC}"
        ((TESTS_FAILED++))
        FAILED_SUITES+=("Integration")
    fi
    
    cd "$SCRIPT_DIR"
}

# Function to print summary
print_summary() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📊 Test Summary${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "   ${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "   ${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -gt 0 ]; then
        echo -e "${RED}Failed test suites:${NC}"
        for suite in "${FAILED_SUITES[@]}"; do
            echo -e "   ${RED}• $suite${NC}"
        done
        echo ""
        echo -e "${RED}❌ Regression tests failed!${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ All regression tests passed!${NC}"
        exit 0
    fi
}

# Main execution
main() {
    local test_target="${1:-all}"
    
    echo -e "${BLUE}Target: $test_target${NC}"
    echo ""
    
    # Check services first
    check_services
    
    case "$test_target" in
        api)
            run_api_tests
            ;;
        ai)
            run_ai_tests
            ;;
        crawler)
            run_crawler_tests
            ;;
        integration)
            run_integration_tests
            ;;
        all)
            run_api_tests
            run_ai_tests
            run_crawler_tests
            run_integration_tests
            ;;
        *)
            echo -e "${RED}Unknown test target: $test_target${NC}"
            echo "Usage: $0 [api|ai|crawler|integration|all]"
            exit 1
            ;;
    esac
    
    print_summary
}

# Run main function
main "$@"
