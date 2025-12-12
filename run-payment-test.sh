#!/bin/bash

# Floinvite Payment Enforcement Test Runner
# Quick script to run payment enforcement tests with detailed output

set -e

echo "=========================================="
echo "Floinvite Payment Enforcement Test Runner"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js and npm.${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if Playwright browsers are installed
echo -e "${YELLOW}Checking Playwright browsers...${NC}"
if ! npx playwright --version &> /dev/null; then
    echo -e "${YELLOW}Installing Playwright browsers...${NC}"
    npx playwright install chromium
fi

# Create test-results directory if it doesn't exist
mkdir -p test-results

echo ""
echo -e "${GREEN}Starting Payment Enforcement Tests...${NC}"
echo "Target: https://floinvite.com"
echo ""

# Parse command line arguments
HEADED=""
BROWSER="chromium"
UI_MODE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --headed)
            HEADED="--headed"
            shift
            ;;
        --ui)
            UI_MODE="--ui"
            shift
            ;;
        --browser)
            BROWSER="$2"
            shift
            shift
            ;;
        --debug)
            export PWDEBUG=1
            HEADED="--headed"
            shift
            ;;
        --help)
            echo "Usage: ./run-payment-test.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --headed         Run tests in headed mode (visible browser)"
            echo "  --ui             Run tests in interactive UI mode"
            echo "  --browser NAME   Specify browser (chromium, firefox, webkit)"
            echo "  --debug          Run in debug mode with browser visible"
            echo "  --help           Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./run-payment-test.sh                  # Run tests headless"
            echo "  ./run-payment-test.sh --headed         # Run with visible browser"
            echo "  ./run-payment-test.sh --ui             # Run in interactive UI"
            echo "  ./run-payment-test.sh --debug          # Run in debug mode"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run the test
if [ -n "$UI_MODE" ]; then
    echo -e "${GREEN}Running in UI mode...${NC}"
    npx playwright test payment-enforcement.spec.ts --ui
else
    echo -e "${GREEN}Running tests on $BROWSER...${NC}"
    npx playwright test payment-enforcement.spec.ts --project=$BROWSER $HEADED
fi

EXIT_CODE=$?

echo ""
echo "=========================================="

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Test artifacts saved to:"
    echo "  - Screenshots: test-results/*.png"
    echo "  - HTML Report: test-results/html-report/"
    echo ""
    echo "To view the HTML report, run:"
    echo "  npm run test:report"
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    echo ""
    echo "To view detailed results:"
    echo "  npm run test:report"
    echo ""
    echo "To debug failed tests:"
    echo "  ./run-payment-test.sh --debug"
fi

echo "=========================================="
echo ""

exit $EXIT_CODE
