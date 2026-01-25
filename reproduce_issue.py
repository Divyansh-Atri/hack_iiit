
import requests
import os

class_id = "ZgTJiZAW7Ht5qxzU3hTB"
session_title = "Test Session via Python"
url = "http://localhost:3001/api/sessions/create"

payload = {
    "classId": class_id,
    "title": session_title,
    "createdBy": "real-time-recognition"
}

print(f"Sending payload: {payload}")

try:
    response = requests.post(url, json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
