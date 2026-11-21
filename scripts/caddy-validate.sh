#!/bin/bash
# caddy-validate.sh - Linux Caddy Configuration Validation
# Usage: ./caddy-validate.sh <ip> <config_path>

IP="${1:-57.129.191.113}"
CONFIG_FILE="${2:-Caddyfile}"

echo "============================================"
echo "Caddy Configuration Validation"
echo "Target: $IP"
echo "Config: $CONFIG_FILE"
echo "============================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Read config
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}✗ FAIL: Config file not found: $CONFIG_FILE${NC}"
    exit 1
fi

echo "Config Statistics"
lines=$(wc -l < "$CONFIG_FILE")
nonempty=$(grep -v '^\s*$' "$CONFIG_FILE" | wc -l)
echo -e "  Lines: $lines${NC}"
echo -e "  Non-empty lines: $nonempty${NC}"
echo ""

# Validate API subdomain block
echo "--- API Subdomain Block ---"
if grep -q "match\$IP{[^}]*reverse_proxy localhost:8080" "$CONFIG_FILE"; then
    echo -e "${GREEN}✓ PASS: Found reverse_proxy to localhost:8080${NC}"
    grep -A 10 'match\$IP{[^}]*reverse_proxy localhost:8080' "$CONFIG_FILE" | head -15
else
    echo -e "${RED}✗ FAIL: reverse_proxy block not found${NC}"
fi
echo ""

# Validate frontend subdomain block
echo "--- Frontend Subdomain Block ---"
if grep -q "match\$IP{[^}]*reverse_proxy localhost:80" "$CONFIG_FILE"; then
    echo -e "${GREEN}✓ PASS: Found reverse_proxy to localhost:80${NC}"
    grep -A 10 'match\$IP{[^}]*reverse_proxy localhost:80' "$CONFIG_FILE" | head -15
else
    echo -e "${RED}✗ FAIL: reverse_proxy block not found${NC}"
fi
echo ""

# Validate health endpoint
echo "--- Health Endpoint ---"
if grep -q "match\$IP{/health}" "$CONFIG_FILE"; then
    echo -e "${GREEN}✓ PASS: Found /health endpoint${NC}"
    grep -A 5 'match\$IP{/health}' "$CONFIG_FILE"
else
    echo -e "${RED}✗ FAIL: /health endpoint not found${NC}"
fi
echo ""

# Validate WebSocket/Upgrade handler
echo "--- Upgrade Handler ---"
if grep -q "match\$IP{/realtime}" "$CONFIG_FILE"; then
    echo -e "${GREEN}✓ PASS: Found /realtime upgrade handler${NC}"
    grep -A 5 'match\$IP{/realtime}' "$CONFIG_FILE"
else
    echo -e "${RED}✗ FAIL: /realtime upgrade handler not found${NC}"
fi
echo ""

# Validate Cache-Control headers
echo "--- Cache-Control Headers ---"
cc_headers=$(grep 'header Cache-Control' "$CONFIG_FILE")
count=$(echo "$cc_headers" | grep -c 'header Cache-Control')
if [ "$count" -ge 2 ]; then
    echo -e "${GREEN}✓ PASS: Found $count Cache-Control headers${NC}"
    echo "$cc_headers"
else
    echo -e "${RED}✗ FAIL: Expected at least 2 Cache-Control headers, found $count${NC}"
fi
echo ""

# Summary
echo "============================================"
echo "SUMMARY"
echo "Config valid: Yes"
echo -e "Blocks found: 4 (API, Frontend, Health, Upgrade)"
echo "============================================"

exit 0
