#!/usr/bin/env python3
"""
TESTING DE NUEVA FUNCIONALIDAD: Campos Fecha Especial en Contactos Favoritos
Testing all CRUD operations for /api/contactos-favoritos endpoints 
with special focus on fecha_especial and motivo fields
"""

import requests
import json
from datetime import datetime, date
from typing import List, Dict, Optional

# Configuration  
BASE_URL = "https://petal-shop-api.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials
TEST_CLIENT_EMAIL = "fechas.test@blooment.com"
TEST_CLIENT_PASSWORD = "Password123!"

class ContactosFavoritosDateTester:
    def __init__(self):
        self.client_token = None
        self.test_results = []
        self.created_contacts = []  # Track contacts created for cleanup
        
    def log_test(self, test_name: str, success: bool, details: str):
        """Log test results with status"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
    
    def setup_client_auth(self) -> bool:
        """Setup client authentication - create if doesn't exist"""
        try:
            # First try to login
            response = requests.post(f"{API_BASE}/clientes/login", 
                json={"email": TEST_CLIENT_EMAIL, "password": TEST_CLIENT_PASSWORD},
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.client_token = data.get('token')
                client_info = data.get('user', data.get('cliente', {}))
                client_id = client_info.get('id')
                self.log_test("CLIENT_AUTH", True, f"Client login successful - ID: {client_id}")
                return True
                
            # If login fails, try to create account
            elif response.status_code == 401:
                print("🔑 Cliente no existe, creando cuenta de prueba...")
                
                register_response = requests.post(f"{API_BASE}/clientes/register", 
                    json={
                        "nombre": "Cliente Test Fechas",
                        "email": TEST_CLIENT_EMAIL,
                        "password": TEST_CLIENT_PASSWORD
                    },
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
                
                if register_response.status_code == 201:
                    data = register_response.json()
                    self.client_token = data.get('token')
                    client_info = data.get('user', {})
                    client_id = client_info.get('id')
                    self.log_test("CLIENT_REGISTER", True, f"Client created successfully - ID: {client_id}")
                    return True
                else:
                    self.log_test("CLIENT_AUTH", False, f"Registration failed: {register_response.status_code} - {register_response.text}")
                    return False
            else:
                self.log_test("CLIENT_AUTH", False, f"Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("CLIENT_AUTH", False, f"Auth error: {str(e)}")
            return False
    
    def test_1_create_contact_without_special_date(self) -> Optional[str]:
        """TEST 1: Crear contacto SIN fecha especial (campos requeridos solamente)"""
        try:
            contact_data = {
                "nombre": "María González",
                "telefono": "5551234567",
                "direccion": "Av. Reforma 123, CDMX"
            }
            
            response = requests.post(f"{API_BASE}/contactos-favoritos",
                json=contact_data,
                headers={
                    'Authorization': f'Bearer {self.client_token}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 201:
                contact = response.json()
                contact_id = contact.get('id')
                self.created_contacts.append(contact_id)
                
                # Verify required fields
                if (contact.get('nombre') == "María González" and
                    contact.get('telefono') == "5551234567" and
                    contact.get('direccion') == "Av. Reforma 123, CDMX" and
                    contact.get('fecha_especial') is None and
                    contact.get('motivo') is None):
                    
                    self.log_test("CREATE_WITHOUT_DATE", True, f"Contact created without fecha_especial - ID: {contact_id}")
                    return contact_id
                else:
                    self.log_test("CREATE_WITHOUT_DATE", False, f"Field validation failed: {contact}")
                    return None
            else:
                self.log_test("CREATE_WITHOUT_DATE", False, f"Failed with status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("CREATE_WITHOUT_DATE", False, f"Error: {str(e)}")
            return None
    
    def test_2_create_contact_with_special_date_and_motivo(self) -> Optional[str]:
        """TEST 2: Crear contacto CON fecha especial y motivo"""
        try:
            contact_data = {
                "nombre": "Pedro López",
                "telefono": "5559876543",
                "direccion": "Calle Madero 456, CDMX",
                "fecha_especial": "2026-05-10",
                "motivo": "Día de las Madres"
            }
            
            response = requests.post(f"{API_BASE}/contactos-favoritos",
                json=contact_data,
                headers={
                    'Authorization': f'Bearer {self.client_token}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 201:
                contact = response.json()
                contact_id = contact.get('id')
                self.created_contacts.append(contact_id)
                
                # Verify all fields including special date
                if (contact.get('nombre') == "Pedro López" and
                    contact.get('telefono') == "5559876543" and
                    contact.get('direccion') == "Calle Madero 456, CDMX" and
                    contact.get('fecha_especial') is not None and
                    contact.get('motivo') == "Día de las Madres"):
                    
                    # Verify date format (should be ISO string)
                    fecha = contact.get('fecha_especial')
                    if "2026-05-10" in fecha:
                        self.log_test("CREATE_WITH_DATE_MOTIVO", True, f"Contact with fecha_especial created - ID: {contact_id}, Date: {fecha}")
                        return contact_id
                    else:
                        self.log_test("CREATE_WITH_DATE_MOTIVO", False, f"Date format incorrect: {fecha}")
                        return None
                else:
                    self.log_test("CREATE_WITH_DATE_MOTIVO", False, f"Field validation failed: {contact}")
                    return None
            else:
                self.log_test("CREATE_WITH_DATE_MOTIVO", False, f"Failed with status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("CREATE_WITH_DATE_MOTIVO", False, f"Error: {str(e)}")
            return None
    
    def test_3_create_contact_with_date_no_motivo(self) -> Optional[str]:
        """TEST 3: Crear contacto CON fecha especial pero SIN motivo"""
        try:
            contact_data = {
                "nombre": "Ana Martínez",
                "telefono": "5552223333",
                "direccion": "Polanco 789, CDMX",
                "fecha_especial": "2026-12-25"
            }
            
            response = requests.post(f"{API_BASE}/contactos-favoritos",
                json=contact_data,
                headers={
                    'Authorization': f'Bearer {self.client_token}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 201:
                contact = response.json()
                contact_id = contact.get('id')
                self.created_contacts.append(contact_id)
                
                # Verify fecha_especial exists but motivo is null
                if (contact.get('nombre') == "Ana Martínez" and
                    contact.get('telefono') == "5552223333" and
                    contact.get('direccion') == "Polanco 789, CDMX" and
                    contact.get('fecha_especial') is not None and
                    contact.get('motivo') is None):
                    
                    fecha = contact.get('fecha_especial')
                    if "2026-12-25" in fecha:
                        self.log_test("CREATE_WITH_DATE_NO_MOTIVO", True, f"Contact with only fecha_especial created - ID: {contact_id}, Date: {fecha}")
                        return contact_id
                    else:
                        self.log_test("CREATE_WITH_DATE_NO_MOTIVO", False, f"Date format incorrect: {fecha}")
                        return None
                else:
                    self.log_test("CREATE_WITH_DATE_NO_MOTIVO", False, f"Field validation failed: {contact}")
                    return None
            else:
                self.log_test("CREATE_WITH_DATE_NO_MOTIVO", False, f"Failed with status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("CREATE_WITH_DATE_NO_MOTIVO", False, f"Error: {str(e)}")
            return None
    
    def test_4_get_all_contacts(self) -> bool:
        """TEST 4: Obtener lista de contactos y verificar fecha_especial y motivo"""
        try:
            response = requests.get(f"{API_BASE}/contactos-favoritos",
                headers={'Authorization': f'Bearer {self.client_token}'},
                timeout=30
            )
            
            if response.status_code == 200:
                contacts = response.json()
                
                if len(contacts) >= 3:  # We created at least 3
                    # Check that our created contacts are in the list
                    found_contacts = []
                    for contact in contacts:
                        if contact.get('id') in self.created_contacts:
                            found_contacts.append(contact)
                            
                    # Verify different date scenarios
                    has_no_date = any(c.get('fecha_especial') is None for c in found_contacts)
                    has_date_with_motivo = any(c.get('fecha_especial') is not None and c.get('motivo') is not None for c in found_contacts)
                    has_date_no_motivo = any(c.get('fecha_especial') is not None and c.get('motivo') is None for c in found_contacts)
                    
                    details = f"Retrieved {len(contacts)} contacts. Found our 3 test scenarios: no_date={has_no_date}, with_motivo={has_date_with_motivo}, no_motivo={has_date_no_motivo}"
                    
                    if has_no_date and has_date_with_motivo and has_date_no_motivo:
                        self.log_test("GET_ALL_CONTACTS", True, details)
                        
                        # Show sample contact data
                        for contact in found_contacts[:2]:  # Show first 2 as sample
                            fecha_str = contact.get('fecha_especial', 'null')
                            motivo_str = contact.get('motivo', 'null')
                            print(f"      📋 Sample: {contact.get('nombre')} - fecha_especial: {fecha_str}, motivo: {motivo_str}")
                        
                        return True
                    else:
                        self.log_test("GET_ALL_CONTACTS", False, f"Missing test scenarios in results: {details}")
                        return False
                else:
                    self.log_test("GET_ALL_CONTACTS", False, f"Expected at least 3 contacts, got {len(contacts)}")
                    return False
            else:
                self.log_test("GET_ALL_CONTACTS", False, f"Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET_ALL_CONTACTS", False, f"Error: {str(e)}")
            return False
    
    def test_5_update_add_special_date(self, contact_id: str) -> bool:
        """TEST 5: Agregar fecha especial a contacto existente (el primero sin fecha)"""
        if not contact_id:
            self.log_test("UPDATE_ADD_DATE", False, "No contact ID provided")
            return False
            
        try:
            update_data = {
                "nombre": "María González",
                "telefono": "5551234567", 
                "direccion": "Av. Reforma 123, CDMX",
                "fecha_especial": "2026-06-15",
                "motivo": "Cumpleaños"
            }
            
            response = requests.put(f"{API_BASE}/contactos-favoritos/{contact_id}",
                json=update_data,
                headers={
                    'Authorization': f'Bearer {self.client_token}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                contact = response.json()
                
                # Verify fecha_especial and motivo were added
                if (contact.get('fecha_especial') is not None and
                    contact.get('motivo') == "Cumpleaños" and
                    "2026-06-15" in contact.get('fecha_especial', '')):
                    
                    self.log_test("UPDATE_ADD_DATE", True, f"Successfully added fecha_especial and motivo to existing contact")
                    return True
                else:
                    self.log_test("UPDATE_ADD_DATE", False, f"Fields not updated correctly: {contact}")
                    return False
            else:
                self.log_test("UPDATE_ADD_DATE", False, f"Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("UPDATE_ADD_DATE", False, f"Error: {str(e)}")
            return False
    
    def test_6_update_special_date(self, contact_id: str) -> bool:
        """TEST 6: Actualizar fecha especial y motivo existentes"""
        if not contact_id:
            self.log_test("UPDATE_EXISTING_DATE", False, "No contact ID provided")
            return False
            
        try:
            update_data = {
                "nombre": "Pedro López",
                "telefono": "5559876543",
                "direccion": "Calle Madero 456, CDMX",
                "fecha_especial": "2026-07-20",
                "motivo": "Aniversario"
            }
            
            response = requests.put(f"{API_BASE}/contactos-favoritos/{contact_id}",
                json=update_data,
                headers={
                    'Authorization': f'Bearer {self.client_token}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                contact = response.json()
                
                # Verify fecha_especial and motivo were updated
                if (contact.get('fecha_especial') is not None and
                    contact.get('motivo') == "Aniversario" and
                    "2026-07-20" in contact.get('fecha_especial', '')):
                    
                    self.log_test("UPDATE_EXISTING_DATE", True, f"Successfully updated fecha_especial and motivo")
                    return True
                else:
                    self.log_test("UPDATE_EXISTING_DATE", False, f"Fields not updated correctly: {contact}")
                    return False
            else:
                self.log_test("UPDATE_EXISTING_DATE", False, f"Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("UPDATE_EXISTING_DATE", False, f"Error: {str(e)}")
            return False
    
    def test_7_delete_contact(self, contact_id: str) -> bool:
        """TEST 7: Eliminar uno de los contactos de prueba"""
        if not contact_id:
            self.log_test("DELETE_CONTACT", False, "No contact ID provided")
            return False
            
        try:
            response = requests.delete(f"{API_BASE}/contactos-favoritos/{contact_id}",
                headers={'Authorization': f'Bearer {self.client_token}'},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if "exitosamente" in data.get('message', '').lower():
                    self.log_test("DELETE_CONTACT", True, f"Contact deleted successfully")
                    # Remove from our tracking list
                    if contact_id in self.created_contacts:
                        self.created_contacts.remove(contact_id)
                    return True
                else:
                    self.log_test("DELETE_CONTACT", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("DELETE_CONTACT", False, f"Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("DELETE_CONTACT", False, f"Error: {str(e)}")
            return False
    
    def test_8_authentication_required(self) -> bool:
        """TEST 8: Verificar que la autenticación es requerida"""
        try:
            # Try to access without token
            response = requests.get(f"{API_BASE}/contactos-favoritos",
                timeout=30
            )
            
            if response.status_code == 401:
                self.log_test("AUTH_REQUIRED", True, "Authentication properly required for contacts endpoint")
                return True
            else:
                self.log_test("AUTH_REQUIRED", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("AUTH_REQUIRED", False, f"Error: {str(e)}")
            return False
    
    def test_9_validation_required_fields(self) -> bool:
        """TEST 9: Verificar validaciones de campos requeridos"""
        try:
            # Try to create contact without required fields
            incomplete_data = {
                "nombre": "Test Incompleto"
                # Missing telefono and direccion
            }
            
            response = requests.post(f"{API_BASE}/contactos-favoritos",
                json=incomplete_data,
                headers={
                    'Authorization': f'Bearer {self.client_token}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 400:
                error_data = response.json()
                error_msg = error_data.get('error', '').lower()
                if "requeridos" in error_msg or "required" in error_msg:
                    self.log_test("VALIDATION_REQUIRED", True, "Validation correctly rejects missing required fields")
                    return True
                else:
                    self.log_test("VALIDATION_REQUIRED", False, f"Wrong error message: {error_data}")
                    return False
            else:
                self.log_test("VALIDATION_REQUIRED", False, f"Expected 400, got {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("VALIDATION_REQUIRED", False, f"Error: {str(e)}")
            return False
    
    def cleanup_remaining_contacts(self):
        """Clean up any remaining test contacts"""
        print("\\n🧹 Cleaning up remaining test contacts...")
        for contact_id in self.created_contacts[:]:  # Copy list to avoid modification during iteration
            try:
                response = requests.delete(f"{API_BASE}/contactos-favoritos/{contact_id}",
                    headers={'Authorization': f'Bearer {self.client_token}'},
                    timeout=30
                )
                if response.status_code == 200:
                    print(f"   ✅ Cleaned up contact {contact_id}")
                    self.created_contacts.remove(contact_id)
                else:
                    print(f"   ⚠️ Failed to clean contact {contact_id}: {response.status_code}")
            except Exception as e:
                print(f"   ❌ Cleanup error for {contact_id}: {str(e)}")
    
    def run_all_tests(self):
        """Execute comprehensive test suite for contactos favoritos with fecha especial"""
        print("🌸 TESTING CAMPOS FECHA ESPECIAL EN CONTACTOS FAVORITOS")
        print("=" * 80)
        
        # Setup phase
        print("\\n🚀 SETUP PHASE")
        print("-" * 40)
        
        if not self.setup_client_auth():
            print("❌ Cannot continue without client authentication")
            return
        
        # Testing phase
        print("\\n🧪 TESTING PHASE")
        print("-" * 40)
        
        print("\\n   Test 1: Authentication and Validation")
        self.test_8_authentication_required()
        self.test_9_validation_required_fields()
        
        print("\\n   Test 2: Create Contact WITHOUT Special Date")
        contact_1_id = self.test_1_create_contact_without_special_date()
        
        print("\\n   Test 3: Create Contact WITH Special Date and Motivo")
        contact_2_id = self.test_2_create_contact_with_special_date_and_motivo()
        
        print("\\n   Test 4: Create Contact WITH Date but NO Motivo") 
        contact_3_id = self.test_3_create_contact_with_date_no_motivo()
        
        print("\\n   Test 5: List All Contacts (Verify fecha_especial fields)")
        self.test_4_get_all_contacts()
        
        print("\\n   Test 6: Update - Add Special Date to Existing Contact")
        self.test_5_update_add_special_date(contact_1_id)
        
        print("\\n   Test 7: Update - Modify Existing Special Date")
        self.test_6_update_special_date(contact_2_id)
        
        print("\\n   Test 8: Delete Contact")
        self.test_7_delete_contact(contact_3_id)
        
        # Cleanup
        self.cleanup_remaining_contacts()
        
        # Results phase
        print("\\n" + "=" * 80)
        print("🎯 RESULTADOS FINALES")
        print("=" * 80)
        
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r['success'])
        failed = total - passed
        
        print(f"\\n📊 Resumen de Pruebas:")
        print(f"  📋 Total: {total}")
        print(f"  ✅ Exitosos: {passed}")
        print(f"  ❌ Fallidos: {failed}")
        print(f"  📈 Tasa de Éxito: {(passed/total*100):.1f}%")
        
        # Feature assessment
        core_tests = ['CREATE_WITHOUT_DATE', 'CREATE_WITH_DATE_MOTIVO', 'CREATE_WITH_DATE_NO_MOTIVO', 
                     'GET_ALL_CONTACTS', 'UPDATE_ADD_DATE', 'UPDATE_EXISTING_DATE']
        core_passed = sum(1 for r in self.test_results 
                         if r['test'] in core_tests and r['success'])
        
        print(f"\\n🌟 Evaluación de Funcionalidad Fecha Especial:")
        print(f"  📅 Tests Core Pasados: {core_passed}/{len(core_tests)}")
        
        if core_passed == len(core_tests):
            print("  ✅ FUNCIONALIDAD COMPLETA: Campos fecha_especial y motivo funcionando perfectamente")
        else:
            print("  ⚠️ FUNCIONALIDAD PARCIAL: Algunos aspectos necesitan atención")
        
        # Security assessment  
        security_tests = ['AUTH_REQUIRED', 'VALIDATION_REQUIRED']
        security_passed = sum(1 for r in self.test_results 
                             if r['test'] in security_tests and r['success'])
        
        print(f"\\n🛡️ Evaluación de Seguridad:")
        print(f"  🔒 Tests de Seguridad Pasados: {security_passed}/{len(security_tests)}")
        
        # Overall conclusion
        print(f"\\n🏆 CONCLUSIÓN GENERAL:")
        if failed == 0:
            print("  ✅ TODAS LAS PRUEBAS PASARON")
            print("  ✅ Funcionalidad de fecha_especial implementada correctamente")
            print("  ✅ Validaciones y seguridad funcionando") 
            print("  ✅ Backend listo para producción")
        elif core_passed >= len(core_tests) * 0.8:  # 80% of core functionality
            print("  ⚠️ FUNCIONALIDAD PRINCIPAL OPERATIVA")
            print("  ✅ Campos fecha_especial y motivo funcionan correctamente")
            print("  ℹ️ Algunos tests auxiliares necesitan atención")
        else:
            print("  ❌ PROBLEMAS CRÍTICOS DETECTADOS")
            print("  🔧 Funcionalidad de fechas especiales necesita corrección")
        
        # Show failed tests if any
        if failed > 0:
            print("\\n🔍 Detalles de Pruebas Fallidas:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   ❌ {result['test']}: {result['details']}")
        
        print("\\n🎉 ¡Testing completado!")

def main():
    """Main execution"""
    tester = ContactosFavoritosDateTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()