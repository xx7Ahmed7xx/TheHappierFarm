#!/bin/bash
# docker-verify.sh - Linux Deployment Verification Script
# Usage: ./docker-verify.sh <ip> <api_port> <front_port>

IP="${1:-57.129.191.113}"
API_PORT="${2:-8080}"
FRONT_PORT="${3:-80}"

echo "============================================"
echo "Happier Farm Deployment Verification"
echo "VPS IP: $IP"
echo "API Port: $API_PORT"
echo "Frontend Port: $FRONT_PORT"
echo "============================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL=0
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local url="$1"
    local method="${2:-GET}"
    local expected_status="${3:-200}"
    
    echo -n "Testing: $url... "
    
    TOTAL=$((TOTAL + 1))
    
    response=$(curl -s -o /dev -w "%{http_code}" --max-time 10 "$url" "$method" 2>/dev/null)
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status $response)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $response)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to test port listening
test_port() {
    local port="$1"
    local description="$2"
    
    echo -n "Checking port $port ($description)... "
    
    TOTAL=$((TOTAL + 1))
    
    if ss -tln | grep -q ":${port} "; then
        echo -e "${GREEN}✓ PASS${NC} (Listening)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Not listening)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "--- API Checks ---"
echo -n "Testing /api/health... "
TOTAL=$((TOTAL + 1))
response=$(curl -s -o /dev -w "%{http_code}" --max-time 10 "https://$IP/api/health" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $response)"
    FAILED=$((FAILED + 1))
fi

echo -n "Testing /api/animals... "
TOTAL=$((TOTAL + 1))
response=$(curl -s -o /dev -w "%{http_code}" --max-time 10 "https://$IP/api/animals" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $response)"
    FAILED=$((FAILED + 1))
fi

echo -n "Testing /api/factories... "
TOTAL=$((TOTAL + 1))
response=$(curl -s -o /dev -w "%{http_code}" --max-time 10 "https://$IP/api/factories" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $response)"
    FAILED=$((FAILED + 1))
fi

echo -n "Testing /api/crops... "
TOTAL=$((TOTAL + 1))
response=$(curl -s -o /dev -w "%{http_code}" --max-time 10 "https://$IP/api/crops" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $response)"
    FAILED=$((FAILED + 1))
fi

echo -n "Testing /api/resources... "
TOTAL=$((TOTAL + 1))
response=$(curl -s -o /dev -w "%{http_code}" --max-time 10 "https://$IP/api/resources" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $response)"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "--- Frontend Checks ---"
echo -n "Testing /frontend... "
TOTAL=$((TOTAL + 1))
response=$(curl -s -o /dev -w "%{http_code}" --max-time 10 "https://$IP/frontend" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $response)"
    FAILED=$((FAILED + 1))
fi

echo -n "Testing /frontend/assets... "
TOTAL=$((TOTAL + 1))
response=$(curl -s -o /dev -w "%{http_code}" --max-time 10 "https://$IP/frontend/assets" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $response)"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "--- Port Checks ---"
echo -n "API port $API_PORT... "
TOTAL=$((TOTAL + 1))
if ss -tln | grep -q ":${API_PORT} "; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

echo -n "Frontend port $FRONT_PORT... "
TOTAL=$((TOTAL + 1))
if ss -tln | grep -q ":${FRONT_PORT} "; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "--- SSH/Docker Checks ---"
if ssh root@$IP "docker ps --format '{{{.Name}}}'" >/dev/null 2>&1; then
    echo -n "SSH/Docker connectivity... "
    TOTAL=$((TOTAL + 1))
    if ssh root@$IP "docker ps" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}"
        FAILED=$((FAILED + 1))
    fi
else
    echo -n "SSH/Docker connectivity... "
    TOTAL=$((TOTAL + 1))
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "--- Caddy Configuration ---"
echo -n "Checking Caddy SSLOptions... "
TOTAL=$((TOTAL + 1))
if ssh root@$IP "caddy show -d \"$IP\" 2>/dev/null | grep -q 'ssl_options'" 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "--- Upgrade Handler Check ---"
echo -n "Testing WebSocket/Upgrade... "
TOTAL=$((TOTAL + 1))
upgrade_code=$(curl -s -o /dev -w "%{http_code}" --max-time 10 "https://$IP/api/realtime" 2>/dev/null)
if [ "$upgrade_code" = "101" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 101, got $upgrade_code)"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "============================================"
echo "SUMMARY"
echo "============================================"
echo "Tests:     $TOTAL"
echo -e "Passed:    $PASSED  ${GREEN}✓${NC}"
echo -e "Failed:    $FAILED  ${RED}✗${NC}"

if [ $FAILED -gt 0 ]; then
    echo ""
    echo "Failed Tests:"
    # List failed tests
    echo ""
    exit 1
else
    echo ""
    echo "All tests passed!"
    exit 0
fi
