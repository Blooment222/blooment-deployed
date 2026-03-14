#!/usr/bin/env python3
"""
Direct Order Update Email Test
Tests the PUT /api/pedidos/cliente/:id/actualizar endpoint directly
Focus: Email notification flow via Resend
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
    """Get admin authentication token for order creation"""
    try:
        print(f"🔐 Admin login for order creation...")
        response = requests.post(f"{API_BASE}/auth/login", 
            json={"email": "admin@blooment.com", "password": "Blooment2025Secure!"},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            log_test("ADMIN_AUTH", True, f"Admin authentication successful")
            return token
        else:
            log_test("ADMIN_AUTH", False, f"Admin login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        log_test("ADMIN_AUTH", False, f"Admin auth error: {str(e)}")
        return None

def create_test_order(client_token: str, admin_token: str) -> str:
    """Create a test order for testing"""
    try:
        if not admin_token:
            log_test("CREATE_ORDER", False, "Admin token required")
            return None
            
        print("🔨 Creating test order...")
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
            
            # Initialize order with delivery details
            if order_id and client_token:
                update_response = requests.put(
                    f"{API_BASE}/pedidos/cliente/{order_id}/actualizar",
                    json={
                        "nombre_destinatario": "Original",
                        "tel_destinatario": "5512345678",
                        "horario_entrega": "9:00-12:00",
                        "dedicatoria": "Mensaje original"
                    },
                    headers={
                        'Authorization': f'Bearer {client_token}',
                        'Content-Type': 'application/json'
                    },
                    timeout=30
                )
                
                if update_response.status_code == 200:
                    log_test("CREATE_ORDER", True, f"Test order created and initialized: {order_id[:8]}")
                    return order_id
                else:
                    log_test("CREATE_ORDER", False, f"Failed to initialize order: {update_response.status_code}")
                    return order_id  # Return anyway, might still be usable
            
            log_test("CREATE_ORDER", True, f"Test order created: {order_id[:8]}")
            return order_id
        else:
            log_test("CREATE_ORDER", False, f"Failed to create order: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        log_test("CREATE_ORDER", False, f"Error: {str(e)}")
        return None

def test_order_update_with_email(client_token: str, order_id: str) -> bool:
    """Test order update with email notification"""
    try:
        if not order_id:
            log_test("ORDER_UPDATE_EMAIL", False, "No order ID provided")
            return False
            
        # Prepare update data with admin notification
        update_data = {
            "nombre_destinatario": "Modificado por Test",
            "tel_destinatario": "5598765432", 
            "horario_entrega": "14:00-17:00",
            "dedicatoria": "Mensaje modificado por testing",
            "notificar_admin": True,
            "cambios": {
                "cambiosRealizados": {
                    "nombre_destinatario": {
                        "anterior": "Original",
                        "nuevo": "Modificado por Test"
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
                        "anterior": "Mensaje original",
                        "nuevo": "Mensaje modificado por testing"
                    }
                }
            }
        }
        
        print(f"📝 Updating order {order_id[:8]} with admin notification...")
        print(f"📧 Expecting email to be sent to {ADMIN_EMAIL_DESTINATION}")
        
        response = requests.put(
            f"{API_BASE}/pedidos/cliente/{order_id}/actualizar",
            json=update_data,
            headers={
                'Authorization': f'Bearer {client_token}',
                'Content-Type': 'application/json'
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            log_test("ORDER_UPDATE_EMAIL", True, 
                f"Order update successful! Updated order: {order_id[:8]}")
            
            print(f"📩 Response: {json.dumps(result, indent=2)}")
            
            # Wait for async email processing
            print("⏳ Waiting 5 seconds for async email processing...")
            time.sleep(5)
            
            return True
        else:
            log_test("ORDER_UPDATE_EMAIL", False, 
                f"Update failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        log_test("ORDER_UPDATE_EMAIL", False, f"Error: {str(e)}")
        return False

def check_backend_logs() -> bool:
    """Check backend logs for email indicators"""
    try:
        print("\n📋 CHECKING BACKEND LOGS")
        print("-" * 50)
        
        # Get recent logs
        result = subprocess.run(
            ['tail', '-n', '100', '/var/log/supervisor/nextjs.out.log'],
            capture_output=True, text=True, timeout=10
        )
        
        if result.returncode != 0:
            log_test("BACKEND_LOGS", False, f"Cannot read logs: {result.stderr}")
            return False
            
        logs = result.stdout
        lines = logs.split('\n')
        
        # Look for email indicators
        email_indicators = [
            "📧 Intentando enviar email de notificación",
            "🔑 RESEND_API_KEY encontrada",
            "📨 Enviando email a blooment222@gmail.com",
            "✅ Email de notificación enviado exitosamente",
            "❌ RESEND_API_KEY no está configurada",
            "❌ Error enviando email al admin"
        ]
        
        found_indicators = []
        
        # Check last 30 lines for recent activity
        for line in lines[-30:]:
            for indicator in email_indicators:
                if indicator in line:
                    found_indicators.append(line.strip())
                    
        if found_indicators:
            print("\n🔍 EMAIL PROCESSING INDICATORS FOUND:")
            for indicator in found_indicators:
                if "✅" in indicator or "📧" in indicator or "🔑" in indicator or "📨" in indicator:
                    print(f"   ✅ {indicator}")
                else:
                    print(f"   ❌ {indicator}")
            
            success_count = sum(1 for ind in found_indicators 
                              if any(success in ind for success in ["✅", "📧", "🔑", "📨"]))
            error_count = sum(1 for ind in found_indicators 
                            if "❌" in ind)
            
            log_test("BACKEND_LOGS", success_count > error_count, 
                f"Found {len(found_indicators)} email indicators ({success_count} success, {error_count} errors)")
            return success_count > error_count
        else:
            print("   ℹ️ No email processing indicators found in recent logs")
            log_test("BACKEND_LOGS", False, "No email processing indicators found")
            return False
            
    except Exception as e:
        log_test("BACKEND_LOGS", False, f"Error checking logs: {str(e)}")
        return False

def main():
    """Main test execution"""
    print("📧 DIRECT ORDER UPDATE EMAIL NOTIFICATION TEST")
    print("=" * 60)
    print(f"🎯 Target: PUT /api/pedidos/cliente/:id/actualizar")
    print(f"📬 Admin Email: {ADMIN_EMAIL_DESTINATION}")
    print(f"🔑 Resend API Key: Configured")
    print(f"📨 Email Sender: onboarding@resend.dev")
    
    # Step 1: Get client token
    print("\n🚀 STEP 1: CLIENT AUTHENTICATION")
    print("-" * 40)
    client_token = get_client_token()
    if not client_token:
        print("❌ Cannot continue without client token")
        return
    
    # Step 2: Get admin token for order creation
    print("\n🚀 STEP 2: ADMIN AUTHENTICATION")
    print("-" * 40)
    admin_token = get_admin_token()
    
    # Step 3: Create test order
    print("\n🚀 STEP 3: TEST ORDER CREATION")
    print("-" * 40)
    order_id = create_test_order(client_token, admin_token)
    if not order_id:
        print("❌ Cannot continue without test order")
        return
        
    # Step 4: Test order update with email
    print("\n🚀 STEP 4: ORDER UPDATE WITH EMAIL NOTIFICATION")
    print("-" * 40)
    update_success = test_order_update_with_email(client_token, order_id)
    
    # Step 5: Check backend logs
    print("\n🚀 STEP 5: BACKEND LOG ANALYSIS")
    print("-" * 40)
    logs_success = check_backend_logs()
    
    # Results summary
    print("\n" + "=" * 60)
    print("🏁 FINAL RESULTS")
    print("=" * 60)
    
    print(f"\n📊 Test Results:")
    print(f"   Order Update: {'✅ Success' if update_success else '❌ Failed'}")
    print(f"   Email Logs:   {'✅ Found' if logs_success else '❌ Not Found'}")
    
    if update_success and logs_success:
        print(f"\n🎉 SUCCESS: Order update and email notification working correctly!")
        print(f"   - Order {order_id[:8]} updated successfully")
        print(f"   - Email notification indicators found in logs")
        print(f"   - Admin should receive notification at {ADMIN_EMAIL_DESTINATION}")
    elif update_success:
        print(f"\n⚠️ PARTIAL SUCCESS: Order updated but email status unclear")
        print(f"   - Check email delivery manually")
        print(f"   - Verify Resend API key configuration")
    else:
        print(f"\n❌ FAILURE: Order update process failed")
        print(f"   - Check client authentication")
        print(f"   - Verify order permissions")
        print(f"   - Review endpoint implementation")
    
    print(f"\n📋 Next Steps:")
    print(f"1. Monitor {ADMIN_EMAIL_DESTINATION} for email delivery")
    print(f"2. Review backend logs for any errors")
    print(f"3. Verify Resend API key is properly configured")
    print(f"4. Test with different order scenarios if needed")

if __name__ == "__main__":
    main()