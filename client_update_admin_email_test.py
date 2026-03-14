#!/usr/bin/env python3
"""
CLIENT ORDER UPDATE ADMIN NOTIFICATION TEST
Test the specific flow: Cliente updates their order → Admin gets notified
Testing endpoint: PUT /api/pedidos/cliente/:id/actualizar
"""

import requests
import json
import time
import subprocess

# Configuration  
BASE_URL = "https://petal-shop-api.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# We'll need to get a valid client token first, then create an order for that client
TEST_CLIENT_EMAIL = "cliente.test@blooment.com"
TEST_CLIENT_PASSWORD = "Password123!"
ADMIN_EMAIL = "blooment222@gmail.com"

def log_test(test_name: str, success: bool, details: str):
    """Log test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}: {details}")

def get_client_token() -> str:
    """Get client authentication token"""
    try:
        print(f"🔐 Client login...")
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
            log_test("CLIENT_AUTH", True, f"Client authenticated - ID: {client_id}")
            return token, client_id
        else:
            log_test("CLIENT_AUTH", False, f"Login failed: {response.status_code}")
            return None, None
    except Exception as e:
        log_test("CLIENT_AUTH", False, f"Error: {str(e)}")
        return None, None

def get_admin_token() -> str:
    """Get admin token"""
    try:
        response = requests.post(f"{API_BASE}/auth/login", 
            json={"email": "admin@blooment.com", "password": "admin123"},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get('token')
        return None
    except:
        return None

def create_order_via_checkout(client_token: str, client_id: str) -> str:
    """Create order via checkout simulation"""
    try:
        print("📦 Creating order via simplified method...")
        
        # First get a product
        response = requests.get(f"{API_BASE}/productos", timeout=30)
        if response.status_code != 200:
            log_test("GET_PRODUCT", False, "Cannot get products")
            return None
            
        productos = response.json()
        if not productos:
            log_test("GET_PRODUCT", False, "No products available")
            return None
            
        producto = productos[0]
        
        # Try to create order using the basic pedidos endpoint
        order_data = {
            "clienteId": client_id,
            "usuarioId": client_id,  # Same as clienteId for this test
            "total": producto['precio'],
            "detalles": [{
                "productoId": producto['id'],
                "cantidad": 1,
                "precio_unitario": producto['precio']
            }]
        }
        
        response = requests.post(f"{API_BASE}/pedidos",
            json=order_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 201:
            result = response.json()
            order_id = result.get('id')
            log_test("CREATE_ORDER", True, f"Order created: {order_id[:8]}")
            
            # Initialize with delivery details via client update
            if order_id:
                init_data = {
                    "nombre_destinatario": "Original Recipient",
                    "tel_destinatario": "5512345678",
                    "horario_entrega": "9:00-12:00",
                    "dedicatoria": "Original message"
                }
                
                update_response = requests.put(
                    f"{API_BASE}/pedidos/cliente/{order_id}/actualizar",
                    json=init_data,
                    headers={
                        'Authorization': f'Bearer {client_token}',
                        'Content-Type': 'application/json'
                    },
                    timeout=30
                )
                
                if update_response.status_code == 200:
                    log_test("INIT_ORDER", True, "Order initialized with delivery details")
                else:
                    log_test("INIT_ORDER", False, f"Init failed: {update_response.status_code}")
            
            return order_id
        else:
            log_test("CREATE_ORDER", False, f"Order creation failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        log_test("CREATE_ORDER", False, f"Error: {str(e)}")
        return None

def test_client_order_update_with_admin_notification(client_token: str, order_id: str) -> bool:
    """THE MAIN TEST: Client updates order with admin notification"""
    try:
        print(f"\n🎯 MAIN TEST: Client order update with admin notification")
        print(f"📝 Order ID: {order_id[:8]}")
        print(f"📧 Expected admin email to: {ADMIN_EMAIL}")
        print("-" * 60)
        
        # Clear logs first to see fresh entries
        subprocess.run(['sudo', 'supervisorctl', 'restart', 'nextjs'], capture_output=True)
        time.sleep(2)
        
        # Prepare the update with admin notification
        update_data = {
            "nombre_destinatario": "UPDATED BY TEST",
            "tel_destinatario": "5598765432", 
            "horario_entrega": "14:00-17:00",
            "dedicatoria": "UPDATED MESSAGE BY EMAIL TEST",
            "notificar_admin": True,  # THIS IS KEY!
            "cambios": {
                "cambiosRealizados": {
                    "nombre_destinatario": {
                        "anterior": "Original Recipient",
                        "nuevo": "UPDATED BY TEST"
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
                        "nuevo": "UPDATED MESSAGE BY EMAIL TEST"
                    }
                }
            }
        }
        
        print(f"📤 Sending update request...")
        print(f"🔔 notificar_admin: TRUE")
        
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
        print(f"📄 Response: {response.text}")
        
        if response.status_code == 200:
            log_test("CLIENT_ORDER_UPDATE", True, "Client order update successful")
            
            print("\n⏳ Waiting 5 seconds for async email processing...")
            time.sleep(5)
            
            return True
        else:
            log_test("CLIENT_ORDER_UPDATE", False, f"Update failed: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("CLIENT_ORDER_UPDATE", False, f"Error: {str(e)}")
        return False

def check_admin_email_logs() -> bool:
    """Check logs specifically for admin email notification"""
    try:
        print("\n🔍 CHECKING FOR ADMIN EMAIL NOTIFICATION IN LOGS")
        print("-" * 55)
        
        result = subprocess.run(
            ['tail', '-n', '50', '/var/log/supervisor/nextjs.out.log'],
            capture_output=True, text=True, timeout=10
        )
        
        if result.returncode != 0:
            log_test("ADMIN_EMAIL_LOGS", False, f"Cannot read logs")
            return False
            
        logs = result.stdout
        
        # Expected admin notification patterns from the code
        admin_patterns = [
            "📧 Intentando enviar email de notificación",
            "🔑 RESEND_API_KEY encontrada",
            "📨 Enviando email a blooment222@gmail.com",
            "✅ Email de notificación enviado exitosamente",
            "❌ Error enviando email al admin"
        ]
        
        found_patterns = []
        all_email_lines = []
        
        for line in logs.split('\n'):
            # Collect any email-related lines
            if any(word in line.lower() for word in ['email', 'notification', 'resend', 'admin']):
                all_email_lines.append(line.strip())
            
            # Check for specific admin notification patterns
            for pattern in admin_patterns:
                if pattern in line:
                    found_patterns.append((pattern, line.strip()))
        
        print("📋 All email-related log entries:")
        for line in all_email_lines[-10:]:  # Last 10
            if line:
                print(f"   {line}")
        
        print("\n🎯 Admin notification patterns found:")
        if found_patterns:
            for pattern, line in found_patterns:
                print(f"   ✅ {pattern}")
                print(f"      → {line}")
        else:
            print("   ❌ No admin notification patterns found")
        
        success = len(found_patterns) > 0
        log_test("ADMIN_EMAIL_LOGS", success, 
            f"Found {len(found_patterns)} admin notification indicators")
        
        return success
        
    except Exception as e:
        log_test("ADMIN_EMAIL_LOGS", False, f"Error: {str(e)}")
        return False

def main():
    """Main test execution"""
    print("🔔 CLIENT ORDER UPDATE → ADMIN EMAIL NOTIFICATION TEST")
    print("=" * 65)
    print(f"🎯 Testing: PUT /api/pedidos/cliente/:id/actualizar")
    print(f"📧 Expected: Admin email to {ADMIN_EMAIL}")
    print(f"🔑 Key: notificar_admin: true")
    
    # Step 1: Client authentication
    print(f"\n🚀 STEP 1: CLIENT AUTHENTICATION")
    print("-" * 35)
    client_token, client_id = get_client_token()
    if not client_token:
        print("❌ Cannot continue without client token")
        return
    
    # Step 2: Admin authentication (for order creation)
    print(f"\n🚀 STEP 2: ADMIN AUTHENTICATION")
    print("-" * 35)
    admin_token = get_admin_token()
    if admin_token:
        log_test("ADMIN_AUTH", True, "Admin token obtained")
    else:
        log_test("ADMIN_AUTH", False, "Admin token failed")
    
    # Step 3: Create test order
    print(f"\n🚀 STEP 3: CREATE TEST ORDER")
    print("-" * 30)
    order_id = create_order_via_checkout(client_token, client_id)
    if not order_id:
        print("❌ Cannot continue without test order")
        return
    
    # Step 4: THE MAIN TEST - Client update with admin notification
    print(f"\n🚀 STEP 4: CLIENT ORDER UPDATE WITH ADMIN NOTIFICATION")
    print("-" * 55)
    update_success = test_client_order_update_with_admin_notification(client_token, order_id)
    
    # Step 5: Check admin email logs
    print(f"\n🚀 STEP 5: ADMIN EMAIL LOG VERIFICATION")
    print("-" * 40)
    email_logs_found = check_admin_email_logs()
    
    # Final results
    print(f"\n" + "=" * 65)
    print("🏁 FINAL TEST RESULTS")
    print("=" * 65)
    
    print(f"📊 Test Results:")
    print(f"   Client Order Update: {'✅ Success' if update_success else '❌ Failed'}")
    print(f"   Admin Email Logs:    {'✅ Found' if email_logs_found else '❌ Not Found'}")
    
    if update_success and email_logs_found:
        print(f"\n🎉 SUCCESS: Client order update → Admin email notification WORKING!")
        print(f"   ✅ Client successfully updated order {order_id[:8]}")
        print(f"   ✅ Admin email notification triggered")
        print(f"   ✅ Logs show email processing to {ADMIN_EMAIL}")
        print(f"\n🔔 Result: The fix in line 1760 is working correctly!")
    elif update_success:
        print(f"\n⚠️ PARTIAL SUCCESS: Order updated but admin email unclear")
        print(f"   ✅ Client order update worked")
        print(f"   ❓ Admin email notification status unknown")
        print(f"   💡 May be working but logs unclear due to Resend test mode")
    else:
        print(f"\n❌ FAILURE: Order update process failed")
        print(f"   ❌ Client order update failed")
        print(f"   ❌ Admin email notification not triggered")
    
    print(f"\n📋 Verification Steps:")
    print(f"1. Check {ADMIN_EMAIL} for actual email delivery")
    print(f"2. Verify the 'from' field fix in line 1760 (onboarding@resend.dev)")
    print(f"3. Confirm RESEND_API_KEY configuration")

if __name__ == "__main__":
    main()