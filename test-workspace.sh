#!/bin/bash

# Get auth token
TOKEN=$(curl -s http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@teamflow.dev","password":"password123"}' \
  | python -c "import sys, json; print(json.load(sys.stdin)['data']['accessToken'])")

echo "Token: $TOKEN"
echo ""

# Create workspace
echo "Creating workspace..."
curl -X POST http://localhost:4000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"My First Workspace","description":"Testing workspace creation"}' \
  | python -m json.tool

echo ""
echo "Listing workspaces..."
curl -X GET http://localhost:4000/api/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  | python -m json.tool
