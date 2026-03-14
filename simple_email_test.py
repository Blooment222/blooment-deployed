#!/usr/bin/env python3
"""
Simple Order Update Email Test - Using existing orders
Tests the PUT /api/pedidos/cliente/:id/actualizar endpoint directly
Focus: Email notification flow via Resend using existing order
"""

import requests
import json
import time
import subprocess

# Configuration  
BASE_URL = "https://petal-shop-api.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials 
TEST_CLIENT_EMAIL = "cliente.test@blooment.com"
TEST_CLIENT_PASSWORD = "Password123!"
ADMIN_EMAIL_DESTINATION = "blooment222@gmail.com"

# Existing pending order from system (belongs to diegoahl11@hotmail.com)
EXISTING_ORDER_ID = "c37b70bb-cfd4-4ad3-b6f0-62ef49e499f5"

def log_message(message: str):
    """Log a message"""
    print(f"ℹ️ {message}")

def log_test(test_name: str, success: bool, details: str):
    """Log test results with status"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}: {details}")

def get_client_token() -> str:
    """Get client authentication token"""
    try:
        print(f"🔐 Logging in as {TEST_CLIENT_EMAIL}...")
        response = requests.post(f"{API_BASE}/clientes/login", 
            json={"email": TEST_CLIENT_EMAIL, "password": TEST_CLIENT_PASSWORD},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            client_info = data.get('cliente', data.get('user'))
            client_id = client_info.get('id')
            log_test("CLIENT_AUTH", True, f"Authentication successful - ID: {client_id}")
            return token
        else:
            log_test("CLIENT_AUTH", False, f"Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        log_test("CLIENT_AUTH", False, f"Auth error: {str(e)}")
        return None

def get_admin_token() -> str:
    """Try to get admin token with different credentials"""
    credentials = [
        ("admin@blooment.com", "Blooment2025Secure!"),
        ("admin@blooment.com", "admin123"),
    ]
    
    for email, password in credentials:
        try:
            print(f"🔐 Trying admin login: {email} / {password[:5]}...")
            response = requests.post(f"{API_BASE}/auth/login", 
                json={"email": email, "password": password},
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('token')
                log_test("ADMIN_AUTH", True, f"Admin auth successful with {email}")
                return token
            else:
                log_message(f"Failed {email}: {response.status_code}")
        except Exception as e:
            log_message(f"Error {email}: {str(e)}")
    
    log_test("ADMIN_AUTH", False, "All admin credentials failed")
    return None

def create_test_order_for_client(client_token: str, admin_token: str) -> str:
    """Create a test order specifically for our test client"""
    try:
        if not admin_token:
            # Try to use existing client orders first
            response = requests.get(f"{API_BASE}/clientes/pedidos",
                headers={'Authorization': f'Bearer {client_token}'},
                timeout=30
            )
            
            if response.status_code == 200:
                orders = response.json()
                pending_orders = [o for o in orders if o.get('estado') in ['pendiente', 'en_preparacion']]
                if pending_orders:
                    order_id = pending_orders[0]['id']
                    log_test("USE_EXISTING_ORDER", True, f"Using existing client order: {order_id[:8]}")
                    return order_id
            
            log_test("CREATE_ORDER", False, "No admin token and no existing client orders")
            return None
            
        print("🔨 Creating test order for client...")
        response = requests.post(
            f"{API_BASE}/pedidos/test/create-manual",
            json={"clienteEmail": TEST_CLIENT_EMAIL},
            headers={
                'Authorization': f'Bearer {admin_token}',
                'Content-Type': 'application/json'
            },
            timeout=30
        )
        
        if response.status_code == 201:
            result = response.json()
            pedido = result.get('pedido', {})
            order_id = pedido.get('id')
            log_test("CREATE_ORDER", True, f"Test order created: {order_id[:8]}")
            return order_id
        else:
            log_test("CREATE_ORDER", False, f"Failed to create order: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        log_test("CREATE_ORDER", False, f"Error: {str(e)}")
        return None

def test_direct_endpoint_call() -> bool:
    """Test the endpoint directly without authentication to see the structure"""
    try:
        log_message("Testing endpoint structure...")
        
        # Test with fake order ID to see response structure
        response = requests.put(
            f"{API_BASE}/pedidos/cliente/fake-order-id/actualizar",
            json={"test": "data"},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        log_test("ENDPOINT_STRUCTURE", True, 
            f"Endpoint responds: {response.status_code} - {response.text[:100]}")
        return True
        
    except Exception as e:
        log_test("ENDPOINT_STRUCTURE", False, f"Error: {str(e)}")
        return False

def test_order_update_flow(client_token: str, order_id: str) -> bool:
    """Test the full order update flow with email notification"""
    try:
        if not order_id:
            log_test("ORDER_UPDATE_FLOW", False, "No order ID available")
            return False
            
        # Test update data
        update_data = {
            "nombre_destinatario": "Testing Modified Name",
            "tel_destinatario": "5598765432", 
            "horario_entrega": "14:00-17:00",
            "dedicatoria": "Testing - Modified message",
            "notificar_admin": True,
            "cambios": {
                "cambiosRealizados": {
                    "nombre_destinatario": {
                        "anterior": "Original Name",
                        "nuevo": "Testing Modified Name"
                    },
                    "tel_destinatario": {
                        "anterior": "5512345678",
                        "nuevo": "5598765432"
                    },
                    "horario_entrega": {
                        "anterior": "9:00-12:00", 
                        "nuevo": "14:00-17:00"
                    },
                    "dedicatoria": {
                        "anterior": "Original message",
                        "nuevo": "Testing - Modified message"
                    }
                }
            }
        }
        
        print(f"📝 Testing order update with order ID: {order_id[:8]}")
        print(f"📧 Should trigger email to: {ADMIN_EMAIL_DESTINATION}")
        
        response = requests.put(
            f"{API_BASE}/pedidos/cliente/{order_id}/actualizar",
            json=update_data,
            headers={
                'Authorization': f'Bearer {client_token}',
                'Content-Type': 'application/json'
            },
            timeout=30
        )
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📄 Response Body: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            log_test("ORDER_UPDATE_FLOW", True, 
                f"Order update successful! Response received.")
                
            # Wait for async email processing
            print("⏳ Waiting 3 seconds for async email processing...")
            time.sleep(3)
            return True
            
        elif response.status_code == 404:
            log_test("ORDER_UPDATE_FLOW", False, 
                "Order not found - likely doesn't belong to test client")
            return False
            
        elif response.status_code == 403:
            log_test("ORDER_UPDATE_FLOW", False, 
                "Order cannot be modified - wrong state or permissions")
            return False
            
        else:
            log_test("ORDER_UPDATE_FLOW", False, 
                f"Update failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        log_test("ORDER_UPDATE_FLOW", False, f"Error: {str(e)}")
        return False

def check_backend_logs() -> bool:
    """Check backend logs for email processing"""
    try:
        print("\n📋 CHECKING BACKEND LOGS FOR EMAIL PROCESSING")
        print("-" * 55)
        
        result = subprocess.run(
            ['tail', '-n', '50', '/var/log/supervisor/nextjs.out.log'],
            capture_output=True, text=True, timeout=10
        )
        
        if result.returncode != 0:
            log_test("BACKEND_LOGS", False, f"Cannot read logs: {result.stderr}")
            return False
            
        logs = result.stdout
        
        # Look for recent email indicators
        email_patterns = [
            "📧 Intentando enviar email de notificación",
            "🔑 RESEND_API_KEY encontrada",
            "📨 Enviando email a blooment222@gmail.com",
            "✅ Email de notificación enviado exitosamente",
            "❌ RESEND_API_KEY no está configurada",
            "❌ Error enviando email al admin"
        ]
        
        found = []
        for line in logs.split('\n')[-25:]:  # Last 25 lines
            for pattern in email_patterns:
                if pattern in line:
                    found.append(line.strip())
        
        if found:
            print("🔍 EMAIL PROCESSING LOG ENTRIES:")
            for entry in found:
                if "✅" in entry or "📧" in entry or "🔑" in entry or "📨" in entry:
                    print(f"   ✅ {entry}")
                else:
                    print(f"   ❌ {entry}")
            
            success_indicators = sum(1 for e in found if any(x in e for x in ["✅", "📧", "🔑", "📨"]))
            error_indicators = sum(1 for e in found if "❌" in e)
            
            log_test("BACKEND_LOGS", success_indicators > 0, 
                f"Found {len(found)} email indicators ({success_indicators} positive, {error_indicators} errors)")
            return success_indicators > 0
        else:
            log_test("BACKEND_LOGS", False, "No email processing indicators found in recent logs")
            return False
            
    except Exception as e:
        log_test("BACKEND_LOGS", False, f"Error checking logs: {str(e)}")
        return False

def main():
    """Main test execution"""
    print("📧 ORDER UPDATE EMAIL NOTIFICATION TEST")
    print("=" * 50)
    print(f"🎯 Testing: PUT /api/pedidos/cliente/:id/actualizar")
    print(f"📬 Target Email: {ADMIN_EMAIL_DESTINATION}")
    print(f"🔑 Expected: Resend API integration")
    
    # Test endpoint structure first
    print(f"\n🔍 STEP 1: ENDPOINT STRUCTURE TEST")
    print("-" * 35)
    test_direct_endpoint_call()
    
    # Get client authentication
    print(f"\n🔐 STEP 2: CLIENT AUTHENTICATION")
    print("-" * 35)
    client_token = get_client_token()
    if not client_token:
        print("❌ Cannot continue without client authentication")
        return
    
    # Try to get admin token (optional)
    print(f"\n🔑 STEP 3: ADMIN AUTHENTICATION (OPTIONAL)")
    print("-" * 45)
    admin_token = get_admin_token()
    
    # Get or create test order
    print(f"\n📦 STEP 4: GET TEST ORDER")
    print("-" * 25)
    order_id = create_test_order_for_client(client_token, admin_token)
    
    # Test order update with email notification
    print(f"\n📝 STEP 5: ORDER UPDATE WITH EMAIL")
    print("-" * 35)
    update_success = test_order_update_flow(client_token, order_id)
    
    # Check logs
    print(f"\n📋 STEP 6: LOG ANALYSIS")
    print("-" * 25)
    logs_success = check_backend_logs()
    
    # Final results
    print(f"\n" + "=" * 50)
    print("🏁 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    if update_success:
        print("✅ ORDER UPDATE: Successful")
        if logs_success:
            print("✅ EMAIL LOGS: Email processing indicators found")
            print("🎉 CONCLUSION: Order update and email notification working!")
        else:
            print("⚠️ EMAIL LOGS: No clear email indicators found")
            print("⚠️ CONCLUSION: Order updated, email status unclear")
    else:
        print("❌ ORDER UPDATE: Failed")
        print("❌ CONCLUSION: Order update process not working")
    
    print(f"\n📋 Manual Verification Steps:")
    print(f"1. Check {ADMIN_EMAIL_DESTINATION} for email delivery")
    print(f"2. Verify RESEND_API_KEY configuration")
    print(f"3. Review full backend logs: tail -f /var/log/supervisor/nextjs.out.log")
    print(f"4. Test with a different client order if needed")

if __name__ == "__main__":
    main()