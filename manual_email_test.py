#!/usr/bin/env python3
"""
Manual Email Notification Test
Directly test the email notification flow by calling the endpoint
"""

import requests
import json
import time
import subprocess

# Configuration  
BASE_URL = "https://petal-shop-api.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test order from system (belongs to diegoahl11@hotmail.com)
TEST_ORDER_ID = "c37b70bb-cfd4-4ad3-b6f0-62ef49e499f5"
ADMIN_EMAIL_DESTINATION = "blooment222@gmail.com"

def log_test(test_name: str, success: bool, details: str):
    """Log test results with status"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}: {details}")

def get_admin_token() -> str:
    """Get admin authentication token"""
    try:
        print(f"🔐 Admin login...")
        response = requests.post(f"{API_BASE}/auth/login", 
            json={"email": "admin@blooment.com", "password": "admin123"},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            log_test("ADMIN_AUTH", True, "Admin authentication successful")
            return token
        else:
            log_test("ADMIN_AUTH", False, f"Admin login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        log_test("ADMIN_AUTH", False, f"Admin auth error: {str(e)}")
        return None

def manually_trigger_email_notification(admin_token: str) -> bool:
    """Manually trigger email notification by updating order via admin"""
    try:
        print(f"📝 Testing email notification by updating order {TEST_ORDER_ID[:8]} via admin...")
        
        # First, let's see if there's an admin order update endpoint
        # Try to update order status which should trigger email
        
        update_data = {
            "estado": "en_preparacion"  # Change status to trigger notification
        }
        
        response = requests.put(
            f"{API_BASE}/pedidos/admin/{TEST_ORDER_ID}/estado",
            json=update_data,
            headers={
                'Authorization': f'Bearer {admin_token}',
                'Content-Type': 'application/json'
            },
            timeout=30
        )
        
        print(f"📊 Admin Update Response: {response.status_code}")
        print(f"📄 Response Body: {response.text}")
        
        if response.status_code == 200:
            log_test("ADMIN_ORDER_UPDATE", True, "Order status updated successfully")
            
            # Wait for email processing
            print("⏳ Waiting 3 seconds for email processing...")
            time.sleep(3)
            return True
        else:
            log_test("ADMIN_ORDER_UPDATE", False, f"Status update failed: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("ADMIN_ORDER_UPDATE", False, f"Error: {str(e)}")
        return False

def test_email_endpoint_directly() -> bool:
    """Test if there's a direct email test endpoint"""
    try:
        print("📧 Testing direct email endpoint...")
        
        response = requests.get(
            f"{API_BASE}/test-email",
            timeout=30
        )
        
        print(f"📊 Email Test Response: {response.status_code}")
        print(f"📄 Response Body: {response.text}")
        
        if response.status_code == 200:
            log_test("EMAIL_TEST_ENDPOINT", True, "Email test endpoint works")
            return True
        else:
            log_test("EMAIL_TEST_ENDPOINT", False, f"Email test failed: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("EMAIL_TEST_ENDPOINT", False, f"Error: {str(e)}")
        return False

def check_resend_configuration() -> bool:
    """Check if Resend is properly configured"""
    try:
        print("🔑 Checking Resend configuration...")
        
        # Check environment variables (indirectly via an endpoint)
        response = requests.get(f"{API_BASE}/health", timeout=10)
        log_test("ENV_CHECK", True, f"API accessible: {response.status_code}")
        
        # The actual configuration check will be in logs
        return True
        
    except Exception as e:
        log_test("ENV_CHECK", False, f"Error: {str(e)}")
        return False

def check_backend_logs_detailed() -> bool:
    """Detailed check of backend logs"""
    try:
        print("\n📋 DETAILED BACKEND LOG ANALYSIS")
        print("-" * 40)
        
        result = subprocess.run(
            ['tail', '-n', '100', '/var/log/supervisor/nextjs.out.log'],
            capture_output=True, text=True, timeout=10
        )
        
        if result.returncode != 0:
            log_test("BACKEND_LOGS", False, f"Cannot read logs: {result.stderr}")
            return False
            
        logs = result.stdout
        lines = logs.split('\n')
        
        # Show recent API calls
        print("🔍 Recent API Activity (last 10 lines):")
        for line in lines[-10:]:
            if line.strip():
                print(f"   {line}")
        
        # Look for email-related entries  
        email_entries = []
        resend_entries = []
        error_entries = []
        
        for line in lines:
            line_lower = line.lower()
            if any(word in line_lower for word in ['email', 'resend', 'notification']):
                email_entries.append(line.strip())
            if 'resend' in line_lower:
                resend_entries.append(line.strip())
            if any(word in line for word in ['❌', 'ERROR', 'error']):
                error_entries.append(line.strip())
        
        print(f"\n📧 Email-related log entries ({len(email_entries)}):")
        for entry in email_entries[-5:]:  # Last 5
            print(f"   📧 {entry}")
            
        print(f"\n🔧 Resend-specific entries ({len(resend_entries)}):")
        for entry in resend_entries[-3:]:  # Last 3
            print(f"   🔧 {entry}")
            
        print(f"\n⚠️ Recent error entries ({len(error_entries)}):")
        for entry in error_entries[-3:]:  # Last 3
            print(f"   ⚠️ {entry}")
        
        # Check for the specific expected patterns
        expected_patterns = [
            "📧 Intentando enviar email de notificación",
            "🔑 RESEND_API_KEY encontrada",
            "📨 Enviando email a blooment222@gmail.com",
            "✅ Email de notificación enviado exitosamente"
        ]
        
        pattern_found = False
        for pattern in expected_patterns:
            if any(pattern in line for line in lines):
                print(f"   ✅ Found: {pattern}")
                pattern_found = True
            
        log_test("BACKEND_LOGS_DETAILED", pattern_found, 
            f"Email processing patterns found: {pattern_found}")
        return pattern_found
        
    except Exception as e:
        log_test("BACKEND_LOGS_DETAILED", False, f"Error: {str(e)}")
        return False

def main():
    """Main test execution"""
    print("🧪 MANUAL EMAIL NOTIFICATION TEST")
    print("=" * 40)
    print(f"🎯 Goal: Verify Resend email integration")
    print(f"📬 Target: {ADMIN_EMAIL_DESTINATION}")
    print(f"📦 Test Order: {TEST_ORDER_ID[:8]}")
    
    # Step 1: Admin authentication  
    print(f"\n🔑 STEP 1: ADMIN AUTHENTICATION")
    print("-" * 30)
    admin_token = get_admin_token()
    if not admin_token:
        print("❌ Cannot continue without admin access")
        return
    
    # Step 2: Test direct email endpoint
    print(f"\n📧 STEP 2: DIRECT EMAIL TEST")
    print("-" * 25)
    test_email_endpoint_directly()
    
    # Step 3: Check Resend configuration
    print(f"\n🔧 STEP 3: RESEND CONFIGURATION")
    print("-" * 30)
    check_resend_configuration()
    
    # Step 4: Trigger email via order update
    print(f"\n📝 STEP 4: TRIGGER EMAIL VIA ORDER UPDATE")
    print("-" * 40)
    email_triggered = manually_trigger_email_notification(admin_token)
    
    # Step 5: Detailed log analysis
    print(f"\n📋 STEP 5: DETAILED LOG ANALYSIS")
    print("-" * 35)
    logs_found = check_backend_logs_detailed()
    
    # Final summary
    print(f"\n" + "=" * 40)
    print("🏁 TEST SUMMARY")
    print("=" * 40)
    
    print(f"📊 Results:")
    print(f"   Email Trigger: {'✅ Success' if email_triggered else '❌ Failed'}")
    print(f"   Log Indicators: {'✅ Found' if logs_found else '❌ Not Found'}")
    
    if email_triggered and logs_found:
        print(f"\n🎉 SUCCESS: Email system appears to be working!")
        print(f"   - Order status update triggered successfully")
        print(f"   - Email processing indicators found in logs") 
        print(f"   - Check {ADMIN_EMAIL_DESTINATION} for actual delivery")
    elif email_triggered:
        print(f"\n⚠️ PARTIAL: Update worked, but no clear email indicators")
        print(f"   - Verify Resend API key configuration")
        print(f"   - Check for email delivery manually")
    else:
        print(f"\n❌ ISSUE: Email system may not be working properly")
        print(f"   - Check endpoint implementation")
        print(f"   - Verify Resend integration")
    
    print(f"\n📋 Manual Checks:")
    print(f"1. Monitor {ADMIN_EMAIL_DESTINATION} for email")
    print(f"2. Check: tail -f /var/log/supervisor/nextjs.out.log")
    print(f"3. Verify RESEND_API_KEY in environment")

if __name__ == "__main__":
    main()