#!/usr/bin/env python3

import requests
import json

# Test a simple registration to see the actual error
BASE_URL = "https://petal-shop-api.preview.emergentagent.com/api"

def test_simple_registration():
    url = f"{BASE_URL}/clientes/register"
    data = {
        "nombre": "Test User",
        "email": "test@example.com", 
        "password": "test123"
    }
    
    try:
        response = requests.post(url, json=data, headers={"Content-Type": "application/json"}, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text}")
        return response
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    print("Testing customer registration endpoint...")
    test_simple_registration()