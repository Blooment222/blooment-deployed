#!/usr/bin/env python3

import requests
import json

# Test other endpoints that use different models to isolate the issue
BASE_URL = "https://petal-shop-api.preview.emergentagent.com/api"

def test_usuarios_endpoint():
    """Test usuarios endpoint to see if it works"""
    url = f"{BASE_URL}/usuarios"
    
    try:
        response = requests.get(url, timeout=10)
        print(f"GET /usuarios - Status: {response.status_code}")
        if response.status_code == 200:
            usuarios = response.json()
            print(f"   Found {len(usuarios)} usuarios")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"Error testing usuarios: {e}")
        return False

def test_admin_auth():
    """Test admin login to see if it works"""
    url = f"{BASE_URL}/auth/login"
    data = {"email": "admin@test.com", "password": "admin123"}
    
    try:
        response = requests.post(url, json=data, headers={"Content-Type": "application/json"}, timeout=10)
        print(f"POST /auth/login - Status: {response.status_code}")
        print(f"   Response: {response.text}")
        return response.status_code in [200, 401]  # 401 is expected if admin doesn't exist
    except Exception as e:
        print(f"Error testing admin auth: {e}")
        return False

def test_check_prisma_access():
    """Test to see which prisma models work"""
    # Try to create a simple usuario first to see if database is working
    url = f"{BASE_URL}/usuarios"
    data = {
        "nombre": "Test User", 
        "email": "testuser@example.com",
        "telefono": "123-456-7890"
    }
    
    try:
        response = requests.post(url, json=data, headers={"Content-Type": "application/json"}, timeout=10)
        print(f"POST /usuarios - Status: {response.status_code}")
        if response.status_code in [201, 409]:  # 409 if already exists
            print("   Usuario creation works, Prisma is connected")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"Error testing usuarios creation: {e}")
        return False

if __name__ == "__main__":
    print("=== TESTING DATABASE CONNECTIVITY ===")
    
    print("\n1. Testing usuarios endpoint:")
    test_usuarios_endpoint()
    
    print("\n2. Testing admin auth:")
    test_admin_auth()
    
    print("\n3. Testing usuarios creation:")
    test_check_prisma_access()
    
    print("\n=== DONE ===")