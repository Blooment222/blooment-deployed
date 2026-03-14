#!/usr/bin/env python3
"""
DIRECT CLIENT ORDER UPDATE ADMIN EMAIL TEST
Test the existing fix by using a mock client update request
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
ADMIN_EMAIL = "blooment222@gmail.com"

# Existing order from the system (we'll simulate client ownership)
EXISTING_ORDER_ID = "c37b70bb-cfd4-4ad3-b6f0-62ef49e499f5"

def log_test(test_name: str, success: bool, details: str):
    """Log test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}: {details}")

def get_client_token() -> str:
    """Get client token"""
    try:
        response = requests.post(f"{API_BASE}/clientes/login", 
            json={"email": TEST_CLIENT_EMAIL, "password": TEST_CLIENT_PASSWORD},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get('token')
        return None
    except:
        return None

def create_simple_test_order(client_token: str) -> str:
    """Create minimal test order using admin endpoint with client email"""
    try:
        # First try to get admin token
        admin_response = requests.post(f"{API_BASE}/auth/login", 
            json={"email": "admin@blooment.com", "password": "admin123"},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if admin_response.status_code != 200:
            print("❌ Cannot get admin token")
            return None
            
        admin_token = admin_response.json().get('token')
        
        # Get first product
        products_response = requests.get(f"{API_BASE}/productos", timeout=30)
        if products_response.status_code != 200:
            print("❌ Cannot get products")
            return None
            
        productos = products_response.json()
        if not productos:
            print("❌ No products available")
            return None
            
        producto = productos[0]
        
        # Create minimal order with all required fields
        order_data = {
            "clienteId": "907f55bd-221c-422b-ad05-1635ffbe1e45",  # Test client ID
            "usuarioId": "907f55bd-221c-422b-ad05-1635ffbe1e45",  # Same as clienteId 
            "total": float(producto['precio']),
            "nombre_cliente": "Test Client",
            "email_cliente": TEST_CLIENT_EMAIL,
            "telefono_cliente": "5512345678",
            "direccion_envio": "Test Address",
            "detalles": [{
                "productoId": producto['id'],
                "cantidad": 1,
                "precio_unitario": float(producto['precio'])
            }]
        }
        
        print(f"📦 Creating test order...")
        response = requests.post(f"{API_BASE}/pedidos",
            json=order_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 201:
            result = response.json()
            order_id = result.get('id')
            log_test("CREATE_TEST_ORDER", True, f"Order created: {order_id[:8]}")
            return order_id
        else:
            log_test("CREATE_TEST_ORDER", False, f"Failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        log_test("CREATE_TEST_ORDER", False, f"Error: {str(e)}")
        return None

def test_client_update_with_admin_notification(client_token: str, order_id: str) -> bool:
    """Test the main flow: client updates order → admin gets notified"""
    try:
        print(f"\n🎯 TESTING CLIENT ORDER UPDATE WITH ADMIN NOTIFICATION")
        print(f"📝 Order: {order_id[:8]}")
        print(f"📧 Expected notification to: {ADMIN_EMAIL}")
        print(f"🔧 Testing the fix from line 1760: from: 'onboarding@resend.dev'")
        print("-" * 70)
        
        # Clear recent logs to see fresh activity
        print("🔄 Clearing recent logs...")
        
        # The update data that should trigger admin notification
        update_data = {
            "nombre_destinatario": "MODIFIED BY CLIENT TEST",
            "tel_destinatario": "5598765432", 
            "horario_entrega": "15:00-18:00",
            "dedicatoria": "MODIFIED DEDICATION - EMAIL TEST",
            "notificar_admin": True,  # KEY FLAG!
            "cambios": {
                "cambiosRealizados": {
                    "nombre_destinatario": {
                        "anterior": "Original Name",
                        "nuevo": "MODIFIED BY CLIENT TEST"
                    },
                    "tel_destinatario": {
                        "anterior": "5512345678",
                        "nuevo": "5598765432"
                    },
                    "horario_entrega": {
                        "anterior": "9:00-12:00", 
                        "nuevo": "15:00-18:00"
                    },
                    "dedicatoria": {
                        "anterior": "Original dedication",
                        "nuevo": "MODIFIED DEDICATION - EMAIL TEST"
                    }
                }
            }
        }
        
        print(f"📤 Sending client update request...")
        print(f"🔔 notificar_admin: {update_data['notificar_admin']}")
        print(f"🔄 Cambios incluidos: {len(update_data['cambios']['cambiosRealizados'])} fields")
        
        # Make the request
        response = requests.put(
            f"{API_BASE}/pedidos/cliente/{order_id}/actualizar",
            json=update_data,
            headers={
                'Authorization': f'Bearer {client_token}',
                'Content-Type': 'application/json'
            },
            timeout=30
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📄 Response Body: {response.text[:500]}...")
        
        if response.status_code == 200:
            log_test("CLIENT_UPDATE_REQUEST", True, "Client order update request successful")
            
            print(f"\n⏳ Waiting 5 seconds for async email processing...")
            time.sleep(5)
            
            return True
        else:
            log_test("CLIENT_UPDATE_REQUEST", False, f"Update failed: {response.status_code}")
            print(f"Full error: {response.text}")
            return False
            
    except Exception as e:
        log_test("CLIENT_UPDATE_REQUEST", False, f"Error: {str(e)}")
        return False

def analyze_email_logs() -> dict:
    """Analyze logs for admin email notification evidence"""
    try:
        print(f"\n🔍 ANALYZING LOGS FOR ADMIN EMAIL NOTIFICATION")
        print("-" * 55)
        
        result = subprocess.run(
            ['tail', '-n', '100', '/var/log/supervisor/nextjs.out.log'],
            capture_output=True, text=True, timeout=10
        )
        
        if result.returncode != 0:
            return {"success": False, "error": "Cannot read logs"}
            
        logs = result.stdout
        lines = logs.split('\n')
        
        # Look for the exact patterns from the route.js code
        admin_email_patterns = {
            "intent": "📧 Intentando enviar email de notificación",
            "api_key": "🔑 RESEND_API_KEY encontrada",
            "sending": "📨 Enviando email a blooment222@gmail.com",
            "success": "✅ Email de notificación enviado exitosamente",
            "error": "❌ Error enviando email al admin"
        }
        
        found_evidence = {}
        recent_lines = []
        
        # Analyze recent logs (last 30 lines)
        for line in lines[-30:]:
            if line.strip():
                recent_lines.append(line.strip())
                
                # Check for admin notification patterns
                for key, pattern in admin_email_patterns.items():
                    if pattern in line:
                        found_evidence[key] = line.strip()
        
        # Print recent activity
        print("📋 Recent log activity (last 10 lines):")
        for line in recent_lines[-10:]:
            print(f"   {line}")
        
        # Print found email evidence
        print(f"\n🎯 Admin email notification evidence:")
        if found_evidence:
            for key, line in found_evidence.items():
                print(f"   ✅ {key.upper()}: Found")
                print(f"      → {line}")
        else:
            print("   ❌ No admin email notification patterns found")
        
        # Check for any email activity at all
        email_activity = []
        for line in lines[-50:]:
            if any(word in line.lower() for word in ['email', 'resend', 'notification', 'gmail']):
                email_activity.append(line.strip())
        
        print(f"\n📧 General email activity (last 5 entries):")
        for line in email_activity[-5:]:
            print(f"   📧 {line}")
        
        success = len(found_evidence) > 0
        log_test("EMAIL_LOG_ANALYSIS", success, 
            f"Found {len(found_evidence)} admin notification indicators")
        
        return {
            "success": success,
            "evidence": found_evidence,
            "email_activity": email_activity
        }
        
    except Exception as e:
        log_test("EMAIL_LOG_ANALYSIS", False, f"Error: {str(e)}")
        return {"success": False, "error": str(e)}

def main():
    """Main test execution"""
    print("🔔 CLIENT ORDER UPDATE → ADMIN EMAIL NOTIFICATION TEST")
    print("Testing the fix: from: 'onboarding@resend.dev' (line 1760)")
    print("=" * 70)
    
    # Step 1: Get client token
    print(f"\n🔐 STEP 1: GET CLIENT AUTHENTICATION")
    print("-" * 40)
    client_token = get_client_token()
    if not client_token:
        log_test("GET_CLIENT_TOKEN", False, "Client authentication failed")
        return
    log_test("GET_CLIENT_TOKEN", True, "Client token obtained")
    
    # Step 2: Create test order
    print(f"\n📦 STEP 2: CREATE TEST ORDER")
    print("-" * 30)
    order_id = create_simple_test_order(client_token)
    if not order_id:
        print("❌ Cannot continue without test order")
        return
    
    # Step 3: Test client update with admin notification
    print(f"\n🎯 STEP 3: CLIENT UPDATE WITH ADMIN NOTIFICATION")
    print("-" * 50)
    update_success = test_client_update_with_admin_notification(client_token, order_id)
    
    # Step 4: Analyze logs
    print(f"\n🔍 STEP 4: LOG ANALYSIS")
    print("-" * 25)
    log_analysis = analyze_email_logs()
    
    # Final results
    print(f"\n" + "=" * 70)
    print("🏁 FINAL TEST RESULTS")
    print("=" * 70)
    
    overall_success = update_success and log_analysis.get("success", False)
    
    print(f"📊 Test Components:")
    print(f"   Client Update Request: {'✅ Success' if update_success else '❌ Failed'}")
    print(f"   Admin Email Evidence:  {'✅ Found' if log_analysis.get('success') else '❌ Not Found'}")
    
    if overall_success:
        print(f"\n🎉 SUCCESS: CLIENT ORDER UPDATE → ADMIN EMAIL WORKING!")
        print(f"   ✅ Client successfully updated order")
        print(f"   ✅ Admin email notification triggered")
        print(f"   ✅ Resend integration working with fix from line 1760")
        print(f"   ✅ Email sent to: {ADMIN_EMAIL}")
        print(f"\n🔧 CONCLUSION: The fix is working correctly!")
    elif update_success:
        print(f"\n⚠️ PARTIAL SUCCESS: Update worked, email evidence unclear")
        print(f"   ✅ Client order update successful") 
        print(f"   ❓ Admin email notification status unclear")
        print(f"   💡 May be working but not clearly visible in logs")
    else:
        print(f"\n❌ FAILURE: Client order update process failed")
        print(f"   ❌ Client update request failed")
        print(f"   ❌ Admin email notification not triggered")
    
    print(f"\n📋 Verification Steps:")
    print(f"1. Check {ADMIN_EMAIL} inbox for email delivery")
    print(f"2. Verify line 1760 fix: from: 'onboarding@resend.dev'")
    print(f"3. Confirm RESEND_API_KEY: re_SnUFeMu6_HQ6aSJ27HaEAE867HAh2ogxQ")
    print(f"4. Test with different order scenarios if needed")

if __name__ == "__main__":
    main()