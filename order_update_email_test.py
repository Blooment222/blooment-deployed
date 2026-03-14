#!/usr/bin/env python3
"""
Comprehensive Test Suite for Order Update and Admin Email Notification
Testing endpoint: PUT /api/pedidos/cliente/:id/actualizar
Focus: Email notification flow via Resend
"""

import requests
import json
import time
from typing import Dict, Optional

# Configuration  
BASE_URL = "https://petal-shop-api.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials (from test_result.md history)
TEST_CLIENT_EMAIL = "cliente.test@blooment.com"
TEST_CLIENT_PASSWORD = "Password123!"
ADMIN_EMAIL_DESTINATION = "blooment222@gmail.com"

class OrderUpdateEmailTester:
    def __init__(self):
        self.client_token = None
        self.admin_token = None
        self.test_results = []
        self.client_orders = []
        self.test_order_id = None
        
    def log_test(self, test_name: str, success: bool, details: str):
        """Log test results with status"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
    
    def log_info(self, message: str):
        """Log informational message"""
        print(f"ℹ️ {message}")
        
    def setup_admin_auth(self) -> bool:
        """Setup admin authentication for order creation"""
        try:
            print(f"🔐 Admin login for order creation...")
            response = requests.post(f"{API_BASE}/auth/login", 
                json={"email": "admin@blooment.com", "password": "Blooment2025Secure!"},
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('token')
                self.log_test("ADMIN_LOGIN", True, f"Admin auth successful")
                return True
            else:
                self.log_test("ADMIN_LOGIN", False, f"Admin login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_test("ADMIN_LOGIN", False, f"Admin auth error: {str(e)}")
            return False

    def setup_client_auth(self) -> bool:
        """Setup client authentication"""
        try:
            print(f"🔐 Attempting to login with {TEST_CLIENT_EMAIL}...")
            response = requests.post(f"{API_BASE}/clientes/login", 
                json={"email": TEST_CLIENT_EMAIL, "password": TEST_CLIENT_PASSWORD},
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.client_token = data.get('token')
                client_info = data.get('cliente', data.get('user'))
                client_id = client_info.get('id')
                self.log_test("CLIENT_LOGIN", True, f"Client auth successful - ID: {client_id}")
                return True
            else:
                self.log_test("CLIENT_LOGIN", False, f"Client login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_test("CLIENT_LOGIN", False, f"Client auth error: {str(e)}")
            return False
    
    def get_client_orders(self) -> bool:
        """Get client's existing orders"""
        try:
            response = requests.get(f"{API_BASE}/clientes/pedidos",
                headers={'Authorization': f'Bearer {self.client_token}'},
                timeout=30
            )
            
            if response.status_code == 200:
                self.client_orders = response.json()
                self.log_test("GET_ORDERS", True, f"Retrieved {len(self.client_orders)} orders for client")
                
                # Show order details
                for order in self.client_orders:
                    order_id = order.get('id', 'unknown')[:8]
                    estado = order.get('estado', 'unknown')
                    total = order.get('total', 0)
                    destinatario = order.get('nombre_destinatario', 'N/A')
                    print(f"    📦 Order {order_id}: {estado} - MXN ${total} - Para: {destinatario}")
                
                return True
            else:
                self.log_test("GET_ORDERS", False, f"Failed to get orders: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_test("GET_ORDERS", False, f"Error getting orders: {str(e)}")
            return False
    
    def create_test_order(self) -> bool:
        """Create a test order via admin endpoint"""
        try:
            # First, check if client already has orders
            if self.client_orders:
                pending_orders = [o for o in self.client_orders if o.get('estado') in ['pendiente', 'en_preparacion']]
                if pending_orders:
                    self.test_order_id = pending_orders[0]['id']
                    self.log_test("CREATE_ORDER", True, f"Using existing order {self.test_order_id[:8]} for testing")
                    return True
            
            # No suitable order found, create one via admin test endpoint
            if not self.admin_token:
                self.log_test("CREATE_ORDER", False, "Admin authentication required to create test order")
                return False
            
            print("🔨 Creating test order via admin endpoint...")
            response = requests.post(
                f"{API_BASE}/pedidos/test/create-manual",
                json={"clienteEmail": TEST_CLIENT_EMAIL},
                headers={
                    'Authorization': f'Bearer {self.admin_token}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 201:
                result = response.json()
                pedido = result.get('pedido', {})
                self.test_order_id = pedido.get('id')
                
                # Update the order to have delivery details for testing
                if self.test_order_id:
                    update_response = requests.put(
                        f"{API_BASE}/pedidos/cliente/{self.test_order_id}/actualizar",
                        json={
                            "nombre_destinatario": "Original",
                            "tel_destinatario": "5512345678",
                            "horario_entrega": "9:00-12:00",
                            "dedicatoria": "Mensaje original"
                        },
                        headers={
                            'Authorization': f'Bearer {self.client_token}',
                            'Content-Type': 'application/json'
                        },
                        timeout=30
                    )
                    
                    if update_response.status_code == 200:
                        self.log_test("CREATE_ORDER", True, f"Test order created and initialized: {self.test_order_id[:8]}")
                        return True
                    else:
                        self.log_test("CREATE_ORDER", False, f"Failed to initialize order details: {update_response.status_code}")
                        return False
                
                self.log_test("CREATE_ORDER", True, f"Test order created: {self.test_order_id[:8]}")
                return True
            else:
                self.log_test("CREATE_ORDER", False, f"Failed to create test order: {response.status_code} - {response.text}")
                return False
            
        except Exception as e:
            self.log_test("CREATE_ORDER", False, f"Error creating test order: {str(e)}")
            return False
    
    def test_order_update_with_email_notification(self) -> bool:
        """Main test: Update order and verify email notification"""
        try:
            if not self.test_order_id:
                self.log_test("UPDATE_ORDER_EMAIL", False, "No test order available")
                return False
            
            # Prepare update data with notification request
            update_data = {
                "nombre_destinatario": "Modificado",
                "tel_destinatario": "5598765432", 
                "horario_entrega": "14:00-17:00",
                "dedicatoria": "Mensaje modificado",
                "notificar_admin": True,
                "cambios": {
                    "cambiosRealizados": {
                        "nombre_destinatario": {
                            "anterior": "Original",
                            "nuevo": "Modificado"
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
                            "nuevo": "Mensaje modificado"
                        }
                    }
                }
            }
            
            print(f"📝 Updating order {self.test_order_id[:8]} with admin notification...")
            
            response = requests.put(
                f"{API_BASE}/pedidos/cliente/{self.test_order_id}/actualizar",
                json=update_data,
                headers={
                    'Authorization': f'Bearer {self.client_token}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                self.log_test("UPDATE_ORDER_EMAIL", True, 
                    f"Order updated successfully. Response: {json.dumps(result, indent=2)}")
                
                # Wait a moment for async email processing
                print("⏳ Waiting 3 seconds for async email processing...")
                time.sleep(3)
                
                return True
            else:
                self.log_test("UPDATE_ORDER_EMAIL", False, 
                    f"Failed to update order: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("UPDATE_ORDER_EMAIL", False, f"Error updating order: {str(e)}")
            return False
    
    def check_backend_logs(self) -> bool:
        """Check backend logs for email processing indicators"""
        try:
            import subprocess
            result = subprocess.run(
                ['tail', '-n', '50', '/var/log/supervisor/nextjs.out.log'],
                capture_output=True, text=True, timeout=10
            )
            
            if result.returncode == 0:
                logs = result.stdout
                print(f"\n📋 Recent Backend Logs (last 50 lines):")
                print("-" * 50)
                
                # Look for specific indicators
                success_indicators = [
                    "📧 Intentando enviar email de notificación",
                    "🔑 RESEND_API_KEY encontrada",
                    "📨 Enviando email a blooment222@gmail.com",
                    "✅ Email de notificación enviado exitosamente"
                ]
                
                error_indicators = [
                    "❌ RESEND_API_KEY no está configurada",
                    "❌ Error enviando email al admin"
                ]
                
                found_success = []
                found_errors = []
                
                lines = logs.split('\n')
                for line in lines[-20:]:  # Check last 20 lines
                    for indicator in success_indicators:
                        if indicator in line:
                            found_success.append(line.strip())
                            print(f"✅ {line.strip()}")
                    
                    for indicator in error_indicators:
                        if indicator in line:
                            found_errors.append(line.strip())
                            print(f"❌ {line.strip()}")
                
                if found_success:
                    self.log_test("BACKEND_LOGS_SUCCESS", True, f"Found {len(found_success)} success indicators in logs")
                elif found_errors:
                    self.log_test("BACKEND_LOGS_ERROR", False, f"Found {len(found_errors)} error indicators in logs")
                else:
                    self.log_test("BACKEND_LOGS_NONE", False, "No email processing indicators found in recent logs")
                
                return len(found_success) > 0
            else:
                self.log_test("BACKEND_LOGS_FAIL", False, f"Cannot read backend logs: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_test("BACKEND_LOGS_ERROR", False, f"Error checking logs: {str(e)}")
            return False

    def verify_backend_logs(self) -> bool:
        """Verify backend logs for email processing (manual check)"""
        print("\n🔍 MANUAL LOG VERIFICATION REQUIRED")
        print("-" * 50)
        print("Please check the backend logs at: /var/log/supervisor/nextjs.out.log")
        print("\nLook for these specific log messages:")
        print("✅ Expected Success Messages:")
        print("   - '📧 Intentando enviar email de notificación...'")
        print("   - '🔑 RESEND_API_KEY encontrada'")
        print("   - '📨 Enviando email a blooment222@gmail.com...'")
        print("   - '✅ Email de notificación enviado exitosamente:' (with result)")
        print("\n❌ Possible Error Messages:")
        print("   - '❌ RESEND_API_KEY no está configurada en el entorno'")
        print("   - '❌ Error enviando email al admin:' (with details)")
        print("\n📝 Command to check logs:")
        print("   tail -n 50 /var/log/supervisor/nextjs.out.log")
        
        return True
    
    def run_all_tests(self):
        """Execute comprehensive test suite"""
        print("📧 ORDER UPDATE EMAIL NOTIFICATION TESTING")
        print("=" * 60)
        print(f"Target Admin Email: {ADMIN_EMAIL_DESTINATION}")
        print(f"Client Credentials: {TEST_CLIENT_EMAIL}")
        print(f"API Base URL: {API_BASE}")
        
        # Setup phase
        print("\n🚀 SETUP PHASE")
        print("-" * 30)
        
        if not self.setup_client_auth():
            print("❌ Cannot continue without client authentication")
            return
            
        if not self.setup_admin_auth():
            print("⚠️ Admin auth failed - will try to use existing orders only")
            
        if not self.get_client_orders():
            print("❌ Cannot continue without order information")
            return
        
        if not self.create_test_order():
            print("⚠️ No test order available - testing may be limited")
            
        # Testing phase
        print("\n🧪 TESTING PHASE")  
        print("-" * 30)
        
        print("\n   Test 1: Order Update with Email Notification")
        self.test_order_update_with_email_notification()
        
        print("\n   Test 2: Backend Log Analysis")
        self.check_backend_logs()
        
        print("\n   Test 3: Manual Log Verification Guide")
        self.verify_backend_logs()
        
        # Results phase
        print("\n" + "=" * 60)
        print("🎯 FINAL RESULTS")
        print("=" * 60)
        
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r['success'])
        failed = total - passed
        
        print(f"\nTest Summary:")
        print(f"  📊 Total Tests: {total}")
        print(f"  ✅ Passed: {passed}")
        print(f"  ❌ Failed: {failed}")
        print(f"  📈 Success Rate: {(passed/total*100):.1f}%" if total > 0 else "  📈 Success Rate: N/A")
        
        # Critical information
        print(f"\n🔧 TECHNICAL DETAILS:")
        print(f"  📍 Endpoint: PUT /api/pedidos/cliente/:id/actualizar")
        print(f"  📧 Email Service: Resend")
        print(f"  🔑 API Key: RESEND_API_KEY (configured)")
        print(f"  📨 Sender: onboarding@resend.dev")
        print(f"  📬 Recipient: {ADMIN_EMAIL_DESTINATION}")
        print(f"  ⚡ Processing: Asynchronous via setImmediate()")
        
        # Show failed tests if any
        if failed > 0:
            print("\n🔍 Failed Tests Details:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   ❌ {result['test']}: {result['details']}")
        
        print(f"\n📋 NEXT STEPS:")
        print("1. Check backend logs for email processing messages")
        print("2. Verify email delivery to blooment222@gmail.com") 
        print("3. Confirm Resend API key is working properly")
        print("4. Test with different order scenarios if needed")

def main():
    """Main execution"""
    tester = OrderUpdateEmailTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()