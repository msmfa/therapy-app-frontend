#!/bin/bash

# Environment Configuration Checker
# This script helps verify all required environment variables are properly set

echo "🔍 Checking Required Environment Variables..."
echo ""

# Load .env file if it exists
if [ -f .env ]; then
    echo "📄 Loading variables from .env file..."
    echo ""
    # Export variables from .env file
    set -a
    source .env
    set +a
else
    echo "⚠️  No .env file found in project root"
    echo "💡 Create one by running: cp .env.example .env"
    echo ""
fi

# Function to check if a variable is set
check_var() {
    local var_name=$1
    local var_value="${!var_name}"

    if [ -z "$var_value" ]; then
        echo "❌ $var_name is NOT set"
        return 1
    else
        # Show first 20 chars only for security
        local preview="${var_value:0:20}..."
        echo "✅ $var_name is set: $preview"
        return 0
    fi
}

# Track missing variables
missing_count=0

# Check API URL
echo "📡 API Configuration:"
check_var "EXPO_PUBLIC_API_URL" || ((missing_count++))
echo ""

# Check Apple OAuth
echo "🍎 Apple OAuth Configuration:"
check_var "EXPO_PUBLIC_APPLE_SERVICE_ID" || ((missing_count++))
check_var "EXPO_PUBLIC_APPLE_REDIRECT_URI" || ((missing_count++))
echo ""

# Check Store URLs
echo "🏪 App Store URLs:"
check_var "EXPO_PUBLIC_APP_STORE_URL" || ((missing_count++))
check_var "EXPO_PUBLIC_PLAY_STORE_URL" || ((missing_count++))
check_var "EXPO_PUBLIC_WEB_STORE_URL" || ((missing_count++))
echo ""

# Summary
echo "📊 Summary:"
if [ $missing_count -eq 0 ]; then
    echo "✅ All required environment variables are set!"
else
    echo "❌ $missing_count required variable(s) missing"
    echo ""
    echo "⚠️  WARNING: The app will not work correctly without all variables set."
    echo ""
    echo "💡 To fix this, create a .env file in your project root:"
    echo "   cp .env.example .env"
    echo "   # Then edit .env with your actual values"
    exit 1
fi
echo ""
