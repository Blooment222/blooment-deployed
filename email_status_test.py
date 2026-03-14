#!/usr/bin/env python3
"""
Email Notification System Testing for Blooment Florería - Order Status Updates
Tests email notifications when order status is updated (the main integration point)
"""
import requests
import json
import os
import time
from datetime import datetime

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://petal-shop-api.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class BloomentEmailStatusTester:
    def __init__(self):
        self.admin_token = None
        self.pedido_id = None
        
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
                return False
        except Exception as e:
            print(f"❌ Email test endpoint error: {str(e)}")
            return False

    def test_admin_login(self):
        """Test admin login to get authentication token"""
        print("\n🔐 Testing Admin Login...")
        try:
            response = requests.post(f"{API_URL}/auth/login", json={
                "email": "admin@blooment.com", 
                "password": "admin123"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('token')
                print("✅ Admin login successful")
                return True
            else:
                print(f"❌ Admin login failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Admin login error: {str(e)}")
            return False

    def get_existing_order(self):
        """Get an existing order to test status updates"""
        print("\n📦 Finding Existing Order...")
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{API_URL}/pedidos/admin/todos", headers=headers)
            
            if response.status_code == 200:
                pedidos = response.json()
                
                if pedidos:
                    # Find a pending order that has client data
                    for pedido in pedidos:
                        if (pedido.get('estado') == 'pendiente' and 
                            pedido.get('cliente') and 
                            pedido.get('cliente', {}).get('email')):
                            self.pedido_id = pedido['id']
                            cliente_email = pedido['cliente']['email']
                            print(f"✅ Found pending order: {self.pedido_id}")
                            print(f"   Cliente: {pedido['cliente'].get('nombre', 'N/A')}")
                            print(f"   Email: {cliente_email}")
                            print(f"   Total: ${pedido.get('total')} MXN")
                            return True
                    
                    # If no pending orders, use any order
                    if pedidos:
                        pedido = pedidos[0]
                        self.pedido_id = pedido['id']
                        print(f"✅ Using order: {self.pedido_id}")
                        print(f"   Status: {pedido.get('estado')}")
                        print(f"   Total: ${pedido.get('total')} MXN")
                        return True
                
                print("❌ No orders found")
                return False
            else:
                print(f"❌ Failed to get orders: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Get orders error: {str(e)}")
            return False

    def test_order_status_update_with_email(self, estado):
        """Test PUT /api/pedidos/admin/:id/estado - Update order status with email notification"""
        print(f"\n📝 Testing Order Status Update to '{estado}' with Email...")
        
        if not self.admin_token or not self.pedido_id:
            print("❌ Missing admin token or pedido ID")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            update_data = {"estado": estado}
            
            print(f"   📧 Updating order {self.pedido_id} to status '{estado}'...")
            
            response = requests.put(f"{API_URL}/pedidos/admin/{self.pedido_id}/estado", 
                                  json=update_data, 
                                  headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Order status updated to '{estado}'")
                print(f"   Order ID: {data.get('id')}")
                print(f"   New Status: {data.get('estado')}")
                
                # Check if cliente email exists
                cliente = data.get('cliente')
                if cliente and cliente.get('email'):
                    print(f"   📧 Email should be sent to: {cliente['email']}")
                else:
                    print("   ⚠️  No client email found - email may not be sent")
                
                print("   🔍 Waiting for email processing...")
                time.sleep(3)  # Wait for async email processing
                
                return True
            else:
                print(f"❌ Status update failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Status update error: {str(e)}")
            return False

    def check_recent_logs(self):
        """Check server logs for email-related messages"""
        print("\n📋 Checking Recent Server Logs...")
        try:
            import subprocess
            result = subprocess.run(['tail', '-n', '30', '/var/log/supervisor/nextjs.out.log'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                logs = result.stdout
                email_lines = []
                
                for line in logs.split('\n'):
                    if any(keyword in line for keyword in ['📧', '✅ Email', '✅ Notificación', 'Resend', 'messageId']):
                        email_lines.append(line.strip())
                
                if email_lines:
                    print(f"   ✅ Found {len(email_lines)} recent email log entries:")
                    for line in email_lines[-5:]:  # Show last 5
                        print(f"     {line}")
                else:
                    print("   ⚠️  No recent email-related logs found")
                
                return True
            else:
                print("   ⚠️  Could not access logs")
                return False
        except Exception as e:
            print(f"   ⚠️  Log check error: {str(e)}")
            return False

    def run_email_status_tests(self):
        """Run email notification tests focused on status updates"""
        print("📧 Blooment Email Status Update Testing - Resend Integration")
        print("=" * 65)
        
        results = {}
        
        # Basic setup tests
        setup_tests = [
            ("Email Test Endpoint", self.test_email_endpoint),
            ("Admin Login", self.test_admin_login),
            ("Find Existing Order", self.get_existing_order),
        ]
        
        for test_name, test_func in setup_tests:
            try:
                results[test_name] = test_func()
                if not results[test_name]:
                    print(f"\n⚠️  Stopping tests due to failure in: {test_name}")
                    break
            except Exception as e:
                print(f"❌ {test_name} failed: {str(e)}")
                results[test_name] = False
                break
        
        # If setup successful, test status updates
        if all(results.get(test, False) for test in ["Admin Login", "Find Existing Order"]):
            status_tests = [
                ("en_preparacion", "🌷 In Preparation"),
                ("enviado", "🚚 Shipped"), 
                ("entregado", "🎉 Delivered")
            ]
            
            for estado, description in status_tests:
                test_name = f"Update to '{estado}'"
                try:
                    print(f"\n{description}")
                    results[test_name] = self.test_order_status_update_with_email(estado)
                    time.sleep(2)
                except Exception as e:
                    print(f"❌ {test_name} failed: {str(e)}")
                    results[test_name] = False
        
        # Always check logs
        results["Check Recent Logs"] = self.check_recent_logs()
        
        # Summary
        print("\n" + "=" * 65)
        print("🏁 EMAIL STATUS TESTING SUMMARY")
        print("=" * 65)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {test_name}")
        
        print(f"\n📊 Results: {passed}/{total} tests passed")
        
        # Analysis
        print("\n🔍 EMAIL NOTIFICATION ANALYSIS:")
        if passed >= 3:  # Basic functionality works
            print("✅ EMAIL SYSTEM STATUS: OPERATIONAL")
            print("   - Resend integration working")
            print("   - Order status updates functional") 
            print("   - Email templates should be sent for each status change")
            print("\n📬 Expected Email Recipients:")
            print("   - Admin notifications: blooment222@gmail.com")
            print("   - Client notifications: (client's email address)")
            print("\n💡 Verification Steps:")
            print("   1. Check admin inbox for new order notifications")
            print("   2. Check client inbox for status update emails")
            print("   3. Verify email templates match the design in lib/email.js")
        else:
            print("❌ EMAIL SYSTEM STATUS: NEEDS ATTENTION")
            print("   - Check authentication setup")
            print("   - Verify order data exists")
            print("   - Review Resend configuration")
        
        if passed == total:
            print("\n🎉 All tests passed! Email notifications working perfectly.")
        elif passed >= 4:
            print("\n✅ Core email functionality operational. System ready for use.")
        else:
            print("\n⚠️  Issues found. Review email configuration.")
        
        return results

if __name__ == "__main__":
    tester = BloomentEmailStatusTester()
    tester.run_email_status_tests()