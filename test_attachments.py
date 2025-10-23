import requests
import json

BASE_URL = "http://localhost:4000"

# 1. Login
print("=== Testing Attachment API ===\n")
print("1. Logging in...")
login_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"email": "demo@teamflow.dev", "password": "password123"}
)
token = login_response.json()["data"]["accessToken"]
print(f"✓ Token obtained\n")

headers = {"Authorization": f"Bearer {token}"}

# 2. Test upload URL request
task_id = "275a2ef2-5d81-4c94-b91c-ae2291e9d890"
print("2. Requesting upload URL...")
upload_url_response = requests.post(
    f"{BASE_URL}/api/tasks/{task_id}/attachments/upload-url",
    headers=headers,
    json={
        "filename": "test-document.pdf",
        "mimeType": "application/pdf",
        "size": 50000
    }
)

print(f"Status: {upload_url_response.status_code}")
print(f"Response: {json.dumps(upload_url_response.json(), indent=2)}\n")

# 3. List attachments
print("3. Listing attachments...")
list_response = requests.get(
    f"{BASE_URL}/api/tasks/{task_id}/attachments",
    headers=headers
)
print(f"Status: {list_response.status_code}")
print(f"Response: {json.dumps(list_response.json(), indent=2)}")

print("\n=== Tests Complete ===")
