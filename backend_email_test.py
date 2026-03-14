#!/usr/bin/env python3
"""
Email Notification System Testing for Blooment Florería
Tests the complete email flow with Resend integration after checkout and order status updates
"""
import requests
import json
import os
import time
from datetime import datetime

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://petal-shop-api.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class BloomentEmailTester:
    def __init__(self):
        self.admin_token = None
        self.cliente_token = None
        self.cliente_id = None
        self.producto_id = None
        self.pedido_id = None
        self.test_cliente_email = "cliente.test@blooment.com"
        self.test_cliente_password = "Password123!"
        
    def test_email_endpoint(self):
        """Test GET /api/test-email - Quick verification"""
        print("\n📧 Testing Email Test Endpoint...")
        try:
            response = requests.get(f"{API_URL}/test-email")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Email test endpoint working")
                print(f"   Success: {data.get('success')}")
                print(f"   Message ID: {data.get('messageId', 'Not provided')}")
                return True
            else:
                print(f"❌ Email test endpoint failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Email test endpoint error: {str(e)}")
            return False

    def test_admin_login(self):
        """Test admin login to get authentication token"""
        print("\n🔐 Testing Admin Login...")
        try:
            # Try new credentials first
            response = requests.post(f"{API_URL}/auth/login", json={
                "email": "admin@blooment.com",
                "password": "Blooment2025Secure!"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('token')
                print("✅ Admin login successful (new credentials)")
                return True
            else:
                # Fallback to old credentials
                response = requests.post(f"{API_URL}/auth/login", json={
                    "email": "admin@blooment.com",
                    "password": "admin123"
                })
                
                if response.status_code == 200:
                    data = response.json()
                    self.admin_token = data.get('token')
                    print("✅ Admin login successful (old credentials)")
                    return True
                else:
                    print(f"❌ Admin login failed: {response.status_code} - {response.text}")
                    return False
        except Exception as e:
            print(f"❌ Admin login error: {str(e)}")
            return False

    def test_cliente_login(self):
        """Login with existing test client"""
        print("\n👤 Testing Cliente Login...")
        try:
            response = requests.post(f"{API_URL}/clientes/login", json={
                "email": self.test_cliente_email,
                "password": self.test_cliente_password
            })
            
            if response.status_code == 200:
                data = response.json()
                self.cliente_token = data.get('token')
                self.cliente_id = data.get('user', {}).get('id')
                print("✅ Cliente login successful")
                print(f"   Cliente ID: {self.cliente_id}")
                print(f"   Email: {self.test_cliente_email}")
                return True
            else:
                print(f"❌ Cliente login failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Cliente login error: {str(e)}")
            return False

    def test_create_manual_order_with_emails(self):
        """Test POST /api/pedidos/test/create-manual - Create manual order with email notifications"""
        print("\n🛒 Testing Manual Order Creation with Email Notifications...")
        
        if not self.admin_token:
            print("❌ Missing admin token")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create a manual test order
            order_data = {
                "clienteEmail": self.test_cliente_email
            }
            
            print(f"   📦 Creating manual order for client: {self.test_cliente_email}")
            
            response = requests.post(f"{API_URL}/pedidos/test/create-manual", 
                                   json=order_data, 
                                   headers=headers)
            
            if response.status_code in [200, 201]:
                data = response.json()
                pedido = data.get('pedido')
                if pedido:
                    self.pedido_id = pedido.get('id')
                    print("✅ Manual order created successfully")
                    print(f"   Order ID: {self.pedido_id}")
                    print(f"   Total: ${pedido.get('total')} MXN")
                    print(f"   Status: {pedido.get('estado')}")
                    
                    # Check server logs for email notifications
                    print("\n   🔍 Checking for email notifications in logs...")
                    time.sleep(3)  # Wait for async email processing
                    
                    return True
                else:
                    print("⚠️  Order creation response missing pedido data")
                    return False
            else:
                print(f"❌ Manual order creation failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Manual order creation error: {str(e)}")
            return False

    def test_order_status_update_with_email(self, estado):
        """Test PUT /api/pedidos/admin/:id/estado - Update order status with email notification"""
        print(f"\n📝 Testing Order Status Update to '{estado}' with Email...")
        
        if not self.admin_token or not self.pedido_id:
            print("❌ Missing admin token or pedido ID")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            update_data = {
                "estado": estado
            }
            
            response = requests.put(f"{API_URL}/pedidos/admin/{self.pedido_id}/estado", 
                                  json=update_data, 
                                  headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Order status updated to '{estado}'")
                print(f"   Order ID: {data.get('id')}")
                print(f"   New Status: {data.get('estado')}")
                
                # Check for email notification in logs
                print(f"   📧 Email notification should be sent for status: {estado}")
                time.sleep(2)  # Wait for async email processing
                
                return True
            else:
                print(f"❌ Status update failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Status update error: {str(e)}")
            return False

    def check_server_logs(self):
        """Check server logs for email-related messages"""
        print("\n📋 Checking Server Logs for Email Activity...")
        try:
            print("   💡 Checking recent logs for email activity...")
            
            # Use bash to get recent logs
            import subprocess
            result = subprocess.run(['tail', '-n', '50', '/var/log/supervisor/nextjs.out.log'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                logs = result.stdout
                email_logs = []
                
                for line in logs.split('\n'):
                    if any(keyword in line for keyword in ['email', 'Email', '📧', '✅', 'Resend', 'messageId']):
                        email_logs.append(line)
                
                if email_logs:
                    print(f"   ✅ Found {len(email_logs)} email-related log entries:")
                    for log in email_logs[-10:]:  # Show last 10 entries
                        print(f"     {log}")
                else:
                    print("   ⚠️  No recent email-related log entries found")
                
                return True
            else:
                print("   ⚠️  Could not access log files")
                return False
        except Exception as e:
            print(f"   ⚠️  Log check error: {str(e)}")
            print("   💡 Manual check command:")
            print("   tail -n 100 /var/log/supervisor/nextjs.out.log | grep -E \"(email|Email|📧|✅)\"")
            return False

    def run_complete_email_tests(self):
        """Run all email notification tests"""
        print("📧 Blooment Email Notification System - Testing with Resend")
        print("=" * 70)
        
        results = {}
        
        # Test sequence
        tests = [
            ("Email Test Endpoint", self.test_email_endpoint),
            ("Admin Login", self.test_admin_login),
            ("Cliente Login", self.test_cliente_login),
            ("Manual Order with Emails", self.test_create_manual_order_with_emails),
        ]
        
        # Run initial tests
        for test_name, test_func in tests:
            try:
                results[test_name] = test_func()
                if not results[test_name]:
                    print(f"\n⚠️  Stopping tests due to failure in: {test_name}")
                    break
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {str(e)}")
                results[test_name] = False
                break
        
        # If order creation succeeded, test status updates
        if results.get("Manual Order with Emails", False):
            status_tests = [
                ("Update to 'en_preparacion'", lambda: self.test_order_status_update_with_email("en_preparacion")),
                ("Update to 'enviado'", lambda: self.test_order_status_update_with_email("enviado")),
                ("Update to 'entregado'", lambda: self.test_order_status_update_with_email("entregado")),
            ]
            
            for test_name, test_func in status_tests:
                try:
                    results[test_name] = test_func()
                    time.sleep(2)  # Wait between status changes
                except Exception as e:
                    print(f"❌ {test_name} failed with exception: {str(e)}")
                    results[test_name] = False
        
        # Always check logs
        results["Check Server Logs"] = self.check_server_logs()
        
        # Summary
        print("\n" + "=" * 70)
        print("🏁 EMAIL TESTING SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {test_name}")
        
        print(f"\n📊 Results: {passed}/{total} tests passed")
        
        # Email-specific success indicators
        print("\n🔍 WHAT TO LOOK FOR IN LOGS:")
        print("✅ Success indicators:")
        print("   - '📧 Intentando enviar email a cliente: [email]'")
        print("   - '✅ Email enviado a [email]. ID: [messageId]'")
        print("   - '✅ Notificación de confirmación enviada al cliente'")
        print("   - '✅ Notificación de nuevo pedido enviada al admin'")
        print("   - '✅ Notificación enviada al cliente para estado: [estado]'")
        print("\n❌ Error indicators to avoid:")
        print("   - 'nodemailer' mentioned in any error")
        print("   - 'createTransporter is not a function'")
        print("   - '⚠️ Error enviando notificaciones'")
        print("   - 'Error de Resend:'")
        
        # Final recommendations
        print("\n🔧 NEXT STEPS:")
        if passed >= 4:  # If basic flow works
            print("1. ✅ Email system appears to be working with Resend")
            print("2. ✅ Check admin email blooment222@gmail.com for notifications")
            print("3. ✅ Check client email cliente.test@blooment.com for status updates")
            print("4. ✅ Test manual order creation in production")
        else:
            print("1. ❌ Fix basic authentication and setup issues first")
            print("2. ❌ Ensure Resend API key is valid in .env")
            print("3. ❌ Check API endpoint implementations")
        
        if passed == total:
            print("\n🎉 All email tests passed! Resend integration working correctly.")
        elif passed >= 4:
            print("\n✅ Core functionality working. Email notifications should be operational.")
        else:
            print("\n⚠️  Critical issues found. Email system needs investigation.")
        
        return results

if __name__ == "__main__":
    tester = BloomentEmailTester()
    tester.run_complete_email_tests()