#!/usr/bin/env python3

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BASE_URL = "https://petal-shop-api.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def log_test(message):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")

def make_request(method, endpoint, data=None, auth_token=None):
    """Make HTTP request and handle errors"""
    url = f"{BASE_URL}{endpoint}"
    headers = HEADERS.copy()
    
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=10)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        # Log request details
        log_test(f"{method.upper()} {endpoint} - Status: {response.status_code}")
        
        return response
    except requests.exceptions.RequestException as e:
        log_test(f"ERROR: Request failed - {str(e)}")
        return None

def test_client_register():
    """Test cliente registration endpoint"""
    log_test("=== TESTING CLIENTE REGISTER ===")
    
    try:
        # Test successful registration with unique email
        import time
        unique_id = int(time.time())
        
        client_data = {
            "nombre": "Sofia Hernández",
            "email": f"sofia.hernandez+{unique_id}@blooment.com",
            "password": "SecurePass123!",
            "telefono": "+1-555-0199", 
            "direccion": "Av. de las Flores 456, Ciudad de México"
        }
        
        response = make_request("POST", "/clientes/register", client_data)
        
        if not response:
            log_test("❌ Registration request failed")
            return False, None
        
        if response.status_code == 201:
            data = response.json()
            log_test("✅ POST /clientes/register working")
            log_test(f"   Registered client: {data['user']['nombre']}")
            log_test(f"   Client ID: {data['user']['id']}")
            log_test(f"   Token provided: {'token' in data}")
            
            # Verify password is not in response
            if 'password' not in data['user']:
                log_test("✅ Password properly excluded from response")
            else:
                log_test("❌ Security issue: password included in response")
                
            return True, data
        else:
            log_test(f"❌ Registration failed with status: {response.status_code}")
            if response.text:
                log_test(f"   Error: {response.text}")
            return False, None
    
    except Exception as e:
        log_test(f"❌ Cliente register error: {str(e)}")
        return False, None

def test_client_register_validation():
    """Test cliente registration validation"""
    log_test("=== TESTING CLIENTE REGISTER VALIDATION ===")
    
    try:
        # Test missing required fields
        invalid_cases = [
            {"email": "test@email.com", "password": "pass123"},  # Missing nombre
            {"nombre": "Test User", "password": "pass123"},      # Missing email
            {"nombre": "Test User", "email": "test@email.com"},  # Missing password
        ]
        
        for i, invalid_data in enumerate(invalid_cases):
            response = make_request("POST", "/clientes/register", invalid_data)
            if response and response.status_code == 400:
                log_test(f"✅ Registration validation {i+1} working (rejected invalid data)")
            else:
                log_test(f"❌ Registration validation {i+1} failed")
                return False
        
        return True
    
    except Exception as e:
        log_test(f"❌ Registration validation error: {str(e)}")
        return False

def test_client_login(client_data):
    """Test cliente login endpoint"""
    log_test("=== TESTING CLIENTE LOGIN ===")
    
    if not client_data:
        log_test("❌ Cannot test login - no client data from registration")
        return False, None
    
    try:
        # Test successful login
        login_data = {
            "email": client_data['user']['email'],  # Use the email from registration
            "password": "SecurePass123!"
        }
        
        response = make_request("POST", "/clientes/login", login_data)
        
        if not response:
            log_test("❌ Login request failed")
            return False, None
        
        if response.status_code == 200:
            data = response.json()
            log_test("✅ POST /clientes/login working")
            log_test(f"   Logged in client: {data['user']['nombre']}")
            log_test(f"   Token provided: {'token' in data}")
            
            # Verify password is not in response
            if 'password' not in data['user']:
                log_test("✅ Password properly excluded from response")
            else:
                log_test("❌ Security issue: password included in response")
                
            return True, data
        else:
            log_test(f"❌ Login failed with status: {response.status_code}")
            if response.text:
                log_test(f"   Error: {response.text}")
            return False, None
    
    except Exception as e:
        log_test(f"❌ Cliente login error: {str(e)}")
        return False, None

def test_client_login_validation():
    """Test cliente login validation"""
    log_test("=== TESTING CLIENTE LOGIN VALIDATION ===")
    
    try:
        # Test missing credentials
        invalid_cases = [
            {"email": "test@email.com"},                               # Missing password
            {"password": "pass123"},                                   # Missing email
            {"email": "wrong@email.com", "password": "wrongpass"},     # Wrong credentials
            {"email": "sofia.hernandez@blooment.com", "password": "wrongpass"}  # Wrong password
        ]
        
        for i, invalid_data in enumerate(invalid_cases):
            response = make_request("POST", "/clientes/login", invalid_data)
            if response and response.status_code in [400, 401]:
                log_test(f"✅ Login validation {i+1} working (rejected invalid credentials)")
            else:
                log_test(f"❌ Login validation {i+1} failed")
                return False
        
        return True
    
    except Exception as e:
        log_test(f"❌ Login validation error: {str(e)}")
        return False

def test_client_profile_get(auth_token):
    """Test GET /clientes/me endpoint"""
    log_test("=== TESTING GET CLIENTE PROFILE ===")
    
    if not auth_token:
        log_test("❌ Cannot test profile - no auth token")
        return False
    
    try:
        # Test successful profile retrieval
        response = make_request("GET", "/clientes/me", auth_token=auth_token)
        
        if not response:
            log_test("❌ Profile request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            log_test("✅ GET /clientes/me working")
            log_test(f"   Client profile: {data['user']['nombre']}")
            log_test(f"   Email: {data['user']['email']}")
            
            # Verify password is not in response
            if 'password' not in data['user']:
                log_test("✅ Password properly excluded from profile")
            else:
                log_test("❌ Security issue: password in profile response")
                
            return True
        else:
            log_test(f"❌ Profile retrieval failed with status: {response.status_code}")
            if response.text:
                log_test(f"   Error: {response.text}")
            return False
    
    except Exception as e:
        log_test(f"❌ Cliente profile error: {str(e)}")
        return False

def test_client_profile_unauthorized():
    """Test GET /clientes/me without authorization"""
    log_test("=== TESTING PROFILE UNAUTHORIZED ACCESS ===")
    
    try:
        # Test without token
        response = make_request("GET", "/clientes/me")
        
        if response and response.status_code == 401:
            log_test("✅ Profile endpoint properly protected (401 without token)")
        else:
            log_test("❌ Profile endpoint not properly protected")
            return False
        
        # Test with invalid token
        response = make_request("GET", "/clientes/me", auth_token="invalid_token")
        
        if response and response.status_code == 401:
            log_test("✅ Profile endpoint rejects invalid token (401)")
        else:
            log_test("❌ Profile endpoint should reject invalid token")
            return False
        
        return True
    
    except Exception as e:
        log_test(f"❌ Profile unauthorized test error: {str(e)}")
        return False

def test_client_profile_update(auth_token):
    """Test PUT /clientes/me endpoint"""
    log_test("=== TESTING UPDATE CLIENTE PROFILE ===")
    
    if not auth_token:
        log_test("❌ Cannot test profile update - no auth token")
        return False
    
    try:
        # Test successful profile update
        update_data = {
            "nombre": "Sofia Hernández Actualizada",
            "telefono": "+1-555-0299",
            "direccion": "Nueva Dirección: Calle Renovada 789, CDMX"
        }
        
        response = make_request("PUT", "/clientes/me", update_data, auth_token=auth_token)
        
        if not response:
            log_test("❌ Profile update request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            log_test("✅ PUT /clientes/me working")
            log_test(f"   Updated name: {data['nombre']}")
            log_test(f"   Updated phone: {data['telefono']}")
            log_test(f"   Updated address: {data['direccion']}")
            return True
        else:
            log_test(f"❌ Profile update failed with status: {response.status_code}")
            if response.text:
                log_test(f"   Error: {response.text}")
            return False
    
    except Exception as e:
        log_test(f"❌ Cliente profile update error: {str(e)}")
        return False

def test_client_orders(auth_token):
    """Test GET /clientes/pedidos endpoint"""
    log_test("=== TESTING GET CLIENTE ORDERS ===")
    
    if not auth_token:
        log_test("❌ Cannot test orders - no auth token")
        return False
    
    try:
        # Test successful orders retrieval (should be empty initially)
        response = make_request("GET", "/clientes/pedidos", auth_token=auth_token)
        
        if not response:
            log_test("❌ Orders request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            log_test("✅ GET /clientes/pedidos working")
            log_test(f"   Orders count: {len(data)}")
            
            if len(data) == 0:
                log_test("✅ Empty orders list (expected for new client)")
            else:
                log_test(f"   First order ID: {data[0].get('id', 'N/A')}")
                # Check if orders include details
                if 'detallesPedido' in data[0]:
                    log_test("✅ Orders include detallesPedido relation")
                else:
                    log_test("❌ Orders missing detallesPedido relation")
            
            return True
        else:
            log_test(f"❌ Orders retrieval failed with status: {response.status_code}")
            if response.text:
                log_test(f"   Error: {response.text}")
            return False
    
    except Exception as e:
        log_test(f"❌ Cliente orders error: {str(e)}")
        return False

def get_available_products():
    """Get available products for checkout testing"""
    log_test("=== GETTING AVAILABLE PRODUCTS ===")
    
    try:
        response = make_request("GET", "/productos")
        
        if response and response.status_code == 200:
            productos = response.json()
            log_test(f"✅ Found {len(productos)} products available")
            
            # Filter products with stock > 0
            available_products = [p for p in productos if p.get('stock', 0) > 0]
            log_test(f"   {len(available_products)} products with stock")
            
            if available_products:
                for product in available_products[:3]:  # Show first 3
                    log_test(f"   - {product['nombre']}: ${product['precio']} (Stock: {product['stock']})")
            
            return available_products
        else:
            log_test("❌ Failed to get products")
            return []
    
    except Exception as e:
        log_test(f"❌ Get products error: {str(e)}")
        return []

def test_checkout_session(auth_token):
    """Test POST /checkout endpoint"""
    log_test("=== TESTING STRIPE CHECKOUT SESSION ===")
    
    if not auth_token:
        log_test("❌ Cannot test checkout - no auth token")
        return False
    
    try:
        # Get available products first
        products = get_available_products()
        
        if not products:
            log_test("❌ Cannot test checkout - no products available")
            return False
        
        # Create checkout with available products
        checkout_data = {
            "items": [
                {
                    "id": products[0]["id"],
                    "cantidad": 1
                }
            ],
            "origin": "http://localhost:3000"
        }
        
        # Add second product if available
        if len(products) > 1 and products[1].get('stock', 0) >= 2:
            checkout_data["items"].append({
                "id": products[1]["id"],
                "cantidad": 2
            })
        
        log_test(f"   Testing checkout with {len(checkout_data['items'])} items")
        
        response = make_request("POST", "/checkout", checkout_data, auth_token=auth_token)
        
        if not response:
            log_test("❌ Checkout request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            log_test("✅ POST /checkout working")
            log_test(f"   Checkout URL provided: {'url' in data}")
            log_test(f"   Session ID provided: {'sessionId' in data}")
            
            if 'url' in data and data['url'].startswith('https://checkout.stripe.com'):
                log_test("✅ Valid Stripe checkout URL generated")
            else:
                log_test("❌ Invalid checkout URL generated")
                
            return True
        else:
            log_test(f"❌ Checkout failed with status: {response.status_code}")
            if response.text:
                log_test(f"   Error: {response.text}")
                
                # Check if it's a Stripe API error
                if "stripe" in response.text.lower():
                    log_test("   Note: This may be a Stripe API configuration issue")
            return False
    
    except Exception as e:
        log_test(f"❌ Checkout session error: {str(e)}")
        return False

def test_checkout_validation(auth_token):
    """Test checkout endpoint validation"""
    log_test("=== TESTING CHECKOUT VALIDATION ===")
    
    if not auth_token:
        log_test("❌ Cannot test checkout validation - no auth token")
        return False
    
    try:
        # Test empty cart
        response = make_request("POST", "/checkout", {"items": [], "origin": "http://localhost:3000"}, auth_token=auth_token)
        if response and response.status_code == 400:
            log_test("✅ Checkout validation: empty cart rejected")
        else:
            log_test("❌ Checkout validation: empty cart not rejected")
            return False
        
        # Test missing origin
        products = get_available_products()
        if products:
            response = make_request("POST", "/checkout", {"items": [{"id": products[0]["id"], "cantidad": 1}]}, auth_token=auth_token)
            if response and response.status_code == 400:
                log_test("✅ Checkout validation: missing origin rejected")
            else:
                log_test("❌ Checkout validation: missing origin not rejected")
                return False
        
        # Test without authentication
        response = make_request("POST", "/checkout", {"items": [{"id": "test", "cantidad": 1}], "origin": "http://localhost:3000"})
        if response and response.status_code == 401:
            log_test("✅ Checkout validation: unauthenticated request rejected")
        else:
            log_test("❌ Checkout validation: unauthenticated request not rejected")
            return False
        
        return True
    
    except Exception as e:
        log_test(f"❌ Checkout validation error: {str(e)}")
        return False

def main():
    """Main test execution for customer endpoints"""
    log_test("🌸 STARTING CUSTOMER ENDPOINTS TESTING 🌸")
    log_test(f"Base URL: {BASE_URL}")
    
    results = {
        'client_register': False,
        'client_register_validation': False,
        'client_login': False,
        'client_login_validation': False,
        'client_profile_get': False,
        'client_profile_unauthorized': False,
        'client_profile_update': False,
        'client_orders': False,
        'checkout_session': False,
        'checkout_validation': False
    }
    
    # Store auth data
    client_data = None
    auth_token = None
    
    # Test client registration
    results['client_register'], client_data = test_client_register()
    time.sleep(1)
    
    # Test registration validation (including duplicate email if registration succeeded)
    results['client_register_validation'] = test_client_register_validation()
    if client_data:
        # Test duplicate email with the actual registered email
        try:
            duplicate_data = {
                "nombre": "Duplicate User",
                "email": client_data['user']['email'],
                "password": "AnotherPass123!"
            }
            response = make_request("POST", "/clientes/register", duplicate_data)
            if response and response.status_code == 409:
                log_test("✅ Duplicate email validation working (rejected duplicate)")
            else:
                log_test("❌ Duplicate email validation failed")
                results['client_register_validation'] = False
        except Exception as e:
            log_test(f"❌ Duplicate email test error: {str(e)}")
            results['client_register_validation'] = False
    time.sleep(1)
    
    # Test client login
    results['client_login'], login_data = test_client_login(client_data)
    if login_data:
        auth_token = login_data.get('token')
    time.sleep(1)
    
    # Test login validation
    results['client_login_validation'] = test_client_login_validation()
    time.sleep(1)
    
    # Test profile endpoints (require authentication)
    results['client_profile_get'] = test_client_profile_get(auth_token)
    time.sleep(1)
    
    results['client_profile_unauthorized'] = test_client_profile_unauthorized()
    time.sleep(1)
    
    results['client_profile_update'] = test_client_profile_update(auth_token)
    time.sleep(1)
    
    results['client_orders'] = test_client_orders(auth_token)
    time.sleep(1)
    
    # Test checkout endpoints
    results['checkout_session'] = test_checkout_session(auth_token)
    time.sleep(1)
    
    results['checkout_validation'] = test_checkout_validation(auth_token)
    
    # Summary
    log_test("=== CUSTOMER ENDPOINTS TEST SUMMARY ===")
    passed = sum(1 for r in results.values() if r)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        log_test(f"{test_name.upper().replace('_', ' ')}: {status}")
    
    log_test(f"\nOVERALL: {passed}/{total} tests passed")
    
    if passed == total:
        log_test("🎉 ALL CUSTOMER ENDPOINT TESTS PASSED!")
        return True
    else:
        log_test(f"⚠️  {total - passed} tests failed. Please check the issues above.")
        
        # Note about potential Stripe issues
        if not results['checkout_session']:
            log_test("\n📝 Note: Checkout failures might be due to Stripe API key configuration.")
            log_test("    Verify STRIPE_SECRET_KEY in .env is valid for test environment.")
        
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)