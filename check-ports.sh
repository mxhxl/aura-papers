#!/bin/bash

# Script to check which ports are in use on the VPS

echo "Checking commonly used ports..."
echo "================================"

for port in 3000 3001 3002 5000 5001 5002 8000 8080 8081 8082 8083 8084 8085 9000 9001
do
    if sudo lsof -i :$port -P -n > /dev/null 2>&1; then
        echo "Port $port: IN USE"
    else
        echo "Port $port: AVAILABLE"
    fi
done

echo ""
echo "Recommended configuration:"
echo "- Backend API: Use first available port from 5001-5010 range"
echo "- Frontend (nginx): Use first available port from 8083-8090 range"
