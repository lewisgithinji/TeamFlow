#!/bin/bash

# TeamFlow Attachment API Test Script
BASE_URL="http://localhost:4000"

echo "=== TeamFlow Attachment API Tests ==="
echo ""

# Step 1: Login
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@teamflow.dev","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "✓ Token obtained: ${TOKEN:0:50}..."
echo ""

# Step 2: Get first task ID from projects
echo "2. Getting task list..."
PROJECTS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/projects")
echo "Projects response: $PROJECTS" | head -c 200
echo ""

# For demo, let's use a mock task ID - replace with actual
TASK_ID="REPLACE_WITH_ACTUAL_TASK_ID"

echo "3. Testing attachment upload URL request..."
echo "POST $BASE_URL/api/tasks/$TASK_ID/attachments/upload-url"
UPLOAD_URL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tasks/$TASK_ID/attachments/upload-url" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test-document.pdf",
    "mimeType": "application/pdf",
    "size": 50000
  }')

echo "Response:"
echo $UPLOAD_URL_RESPONSE | head -c 500
echo ""

echo "=== Test script ready ==="
echo "Note: Update TASK_ID variable with an actual task ID from your database"
