#!/usr/bin/env python3

import requests
import json

BASE_URL = "https://petal-shop-api.preview.emergentagent.com/api"

# First register and login to get a token
def get_auth_token():
    import time
    unique_id = int(time.time())
    
    # Register
    client_data = {
        "nombre": "Test Checkout User",
        "email": f"checkout.test+{unique_id}@test.com",
        "password": "test123"
    }
    
    response = requests.post(f"{BASE_URL}/clientes/register", json=client_data)
    if response.status_code == 201:
        return response.json()['token']
    return None

def test_checkout_debug():
    token = get_auth_token()
    if not token:
        print("❌ Could not get auth token")
        return
    
    print(f"✅ Got auth token: {token[:20]}...")
    
    # Get products
    response = requests.get(f"{BASE_URL}/productos")
    if response.status_code != 200:
        print("❌ Could not get products")
        return
    
    products = response.json()
    if not products:
        print("❌ No products available")
        return
    
    print(f"✅ Found {len(products)} products")
    
    # Test checkout
    checkout_data = {
        "items": [{"id": products[0]["id"], "cantidad": 1}],
        "origin": "http://localhost:3000"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    print("Testing checkout...")
    response = requests.post(f"{BASE_URL}/checkout", json=checkout_data, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

if __name__ == "__main__":
    test_checkout_debug()