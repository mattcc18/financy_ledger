#!/bin/bash
# Script to stop any process running on port 8000

echo "Finding process on port 8000..."

# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Stopped process on port 8000"
else
    echo "No process found on port 8000"
fi



