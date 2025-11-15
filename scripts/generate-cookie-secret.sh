#!/bin/bash
set -e

echo "Generating OAuth2-Proxy Cookie Secret..."
echo ""

# Check if python3 is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: python3 is required but not found in PATH"
    echo ""
    echo "Please install Python 3:"
    echo "  - Ubuntu/Debian: sudo apt-get install python3"
    echo "  - macOS: brew install python3"
    echo "  - Windows: Download from https://www.python.org/downloads/"
    echo ""
    exit 1
fi

# Generate 32-byte random secret and base64 encode
SECRET=$(python3 -c 'import os,base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode())')

echo "Your cookie secret:"
echo ""
echo "  $SECRET"
echo ""
echo "Add this to your .env file:"
echo "  AUTH_COOKIE_SECRET=$SECRET"
echo ""
echo "Keep this secret secure! Do not commit it to version control."
