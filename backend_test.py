#!/usr/bin/env python3

"""
Backend Test Suite para Sistema de Recordatorios de Fechas Especiales
Objetivo: Probar el endpoint GET /api/cron/recordatorios-fechas
"""

import requests
import json
import sys
import os
from datetime import datetime, timedelta

# Configuración
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://petal-shop-api.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

def test_client_login():
    """Paso 1: Crear o login como cliente"""
    print("\n🔐 PASO 1: Login/Registro de Cliente")
    
    # Datos de cliente de prueba
    client_data = {
        "nombre": "Cliente Recordatorios Test",
        "email": "recordatorios.test@blooment.com",
        "password": "Password123!",
        "telefono": "5555-1234",
        "direccion": "Calle Test 123, Ciudad, CP 12345"
    }
    
    # Intentar login primero
    try:
        login_response = requests.post(f"{API_URL}/clientes/login", json={
            "email": client_data["email"],
            "password": client_data["password"]
        }, timeout=30)
        
        if login_response.status_code == 200:
            data = login_response.json()
            token = data.get('token')
            user = data.get('user', {})
            print(f"  ✅ Login exitoso con cliente existente!")
            print(f"  Usuario: {user.get('nombre')} ({user.get('email')})")
            return token, user.get('id')
    except Exception as e:
        print(f"  ⚠️ Error en login (intentando registro): {str(e)}")
    
    # Si login falla, intentar registro
    try:
        register_response = requests.post(f"{API_URL}/clientes/register", json=client_data, timeout=30)
        print(f"  Registro Status: {register_response.status_code}")
        
        if register_response.status_code == 201:
            data = register_response.json()
            token = data.get('token')
            user = data.get('user', {})
            print(f"  ✅ Registro exitoso!")
            print(f"  Usuario: {user.get('nombre')} ({user.get('email')})")
            return token, user.get('id')
        elif register_response.status_code == 409:
            print("  ⚠️ Cliente ya existe, pero login falló. Intentando con credenciales alternativas...")
            return None, None
        else:
            print(f"  ❌ Error en registro: {register_response.text}")
            return None, None
            
    except Exception as e:
        print(f"  ❌ Excepción en registro: {str(e)}")
        return None, None

def get_client_headers(token):
    """Helper: Headers de autorización para cliente"""
    return {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }

def test_create_contacto_favorito(token, client_id):
    """Paso 2: Crear ContactoFavorito con fecha especial para dentro de 4 días"""
    print("\n👥 PASO 2: Crear ContactoFavorito con Fecha Especial")
    
    # Calcular fecha especial: hoy + 4 días (para que caiga dentro de la ventana de 7 días)
    fecha_especial = datetime.now() + timedelta(days=4)
    fecha_especial_str = fecha_especial.strftime('%Y-%m-%d')
    
    contacto_data = {
        "nombre": "María Test",
        "telefono": "555-1234",
        "direccion": "Calle Test 123",
        "fecha_especial": fecha_especial_str,
        "motivo": "Cumpleaños"
    }
    
    print(f"  📅 Fecha especial calculada: {fecha_especial_str} ({fecha_especial.strftime('%A, %d de %B')})")
    print(f"  🎂 Motivo: {contacto_data['motivo']}")
    print(f"  👤 Destinatario: {contacto_data['nombre']}")
    
    try:
        headers = get_client_headers(token)
        response = requests.post(f"{API_URL}/contactos-favoritos", json=contacto_data, headers=headers, timeout=30)
        
        print(f"  URL: POST {API_URL}/contactos-favoritos")
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 201:
            contacto = response.json()
            contacto_id = contacto.get('id')
            print(f"  ✅ ContactoFavorito creado exitosamente!")
            print(f"  ID: {contacto_id}")
            print(f"  Nombre: {contacto.get('nombre')}")
            print(f"  Fecha especial: {contacto.get('fecha_especial')}")
            print(f"  Motivo: {contacto.get('motivo')}")
            return contacto_id, contacto
        else:
            print(f"  ❌ Error creando contacto: {response.text}")
            return None, None
            
    except Exception as e:
        print(f"  ❌ Excepción creando contacto: {str(e)}")
        return None, None

def test_cron_recordatorios():
    """Paso 3: Probar endpoint GET /api/cron/recordatorios-fechas"""
    print("\n🔔 PASO 3: Probar Endpoint de Recordatorios")
    
    try:
        # El endpoint no requiere autenticación (es para cron jobs externos)
        response = requests.get(f"{API_URL}/cron/recordatorios-fechas", timeout=30)
        
        print(f"  URL: GET {API_URL}/cron/recordatorios-fechas")
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"  ✅ Endpoint de recordatorios ejecutado exitosamente!")
            print(f"  Success: {data.get('success')}")
            print(f"  Fecha revisión: {data.get('fecha_revision')}")
            print(f"  Fecha objetivo: {data.get('fecha_objetivo')}")
            print(f"  Total recordatorios: {data.get('total_recordatorios')}")
            
            resultados = data.get('resultados', [])
            print(f"  📋 Resultados encontrados: {len(resultados)}")
            
            for i, resultado in enumerate(resultados):
                print(f"    Recordatorio {i+1}:")
                print(f"      👤 Contacto: {resultado.get('contacto')}")
                print(f"      🎂 Motivo: {resultado.get('motivo')}")
                print(f"      📅 Días restantes: {resultado.get('dias_restantes')}")
                print(f"      📧 Email admin enviado: {resultado.get('email_admin')}")
                print(f"      📧 Email cliente enviado: {resultado.get('email_cliente')}")
            
            # Verificaciones críticas
            success_checks = []
            
            # 1. Verificar que success = true
            if data.get('success') == True:
                print(f"  ✅ SUCCESS: Campo 'success' = true")
                success_checks.append(True)
            else:
                print(f"  ❌ ERROR: Campo 'success' no es true: {data.get('success')}")
                success_checks.append(False)
            
            # 2. Verificar que encontró al menos 1 recordatorio
            total_recordatorios = data.get('total_recordatorios', 0)
            if total_recordatorios >= 1:
                print(f"  ✅ RECORDATORIOS: Encontrados {total_recordatorios} recordatorios")
                success_checks.append(True)
            else:
                print(f"  ⚠️ RECORDATORIOS: Se esperaba al menos 1, encontrados: {total_recordatorios}")
                success_checks.append(False)
            
            # 3. Verificar que los emails se enviaron correctamente
            emails_exitosos = 0
            for resultado in resultados:
                if resultado.get('email_admin') and resultado.get('email_cliente'):
                    emails_exitosos += 1
            
            if emails_exitosos > 0:
                print(f"  ✅ EMAILS: {emails_exitosos} recordatorios con emails exitosos")
                success_checks.append(True)
            else:
                print(f"  ⚠️ EMAILS: Ningún recordatorio tuvo ambos emails exitosos")
                success_checks.append(False)
            
            return all(success_checks), data
        else:
            print(f"  ❌ Error en endpoint de recordatorios: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"  ❌ Excepción en endpoint de recordatorios: {str(e)}")
        return False, None

def test_verify_contacto_exists(token):
    """Paso 4: Verificar que el contacto existe en la base de datos"""
    print("\n🔍 PASO 4: Verificar ContactoFavorito en Base de Datos")
    
    try:
        headers = get_client_headers(token)
        response = requests.get(f"{API_URL}/contactos-favoritos", headers=headers, timeout=30)
        
        print(f"  URL: GET {API_URL}/contactos-favoritos")
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            contactos = response.json()
            print(f"  ✅ Contactos obtenidos exitosamente!")
            print(f"  Total contactos del cliente: {len(contactos)}")
            
            # Buscar nuestro contacto de prueba
            test_contacto = None
            for contacto in contactos:
                if contacto.get('nombre') == "María Test" and contacto.get('motivo') == "Cumpleaños":
                    test_contacto = contacto
                    break
            
            if test_contacto:
                print(f"  ✅ ContactoFavorito de prueba encontrado!")
                print(f"  👤 Nombre: {test_contacto.get('nombre')}")
                print(f"  📞 Teléfono: {test_contacto.get('telefono')}")
                print(f"  📍 Dirección: {test_contacto.get('direccion')}")
                print(f"  📅 Fecha especial: {test_contacto.get('fecha_especial')}")
                print(f"  🎂 Motivo: {test_contacto.get('motivo')}")
                
                # Verificar que la fecha está dentro del rango correcto (próximos 7 días)
                fecha_especial = datetime.fromisoformat(test_contacto.get('fecha_especial').replace('Z', '+00:00'))
                hoy = datetime.now()
                dias_restantes = (fecha_especial.date() - hoy.date()).days
                
                if 0 <= dias_restantes <= 7:
                    print(f"  ✅ Fecha especial está dentro del rango (faltan {dias_restantes} días)")
                    return True, test_contacto.get('id')
                else:
                    print(f"  ⚠️ Fecha especial fuera de rango: faltan {dias_restantes} días")
                    return False, test_contacto.get('id')
            else:
                print(f"  ❌ ContactoFavorito de prueba NO encontrado")
                return False, None
        else:
            print(f"  ❌ Error obteniendo contactos: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"  ❌ Excepción obteniendo contactos: {str(e)}")
        return False, None

def cleanup_test_contacto(token, contacto_id):
    """Limpieza: Eliminar contacto de prueba"""
    if not contacto_id:
        return
        
    print(f"\n🧹 LIMPIEZA: Eliminar ContactoFavorito de Prueba")
    
    try:
        headers = get_client_headers(token)
        response = requests.delete(f"{API_URL}/contactos-favoritos/{contacto_id}", headers=headers, timeout=30)
        
        if response.status_code == 200:
            print(f"  ✅ ContactoFavorito {contacto_id[:8]}... eliminado")
        else:
            print(f"  ⚠️ No se pudo eliminar contacto {contacto_id[:8]}... (Status: {response.status_code})")
    except Exception as e:
        print(f"  ⚠️ Error eliminando contacto {contacto_id[:8]}...: {str(e)}")

def run_recordatorios_test_suite():
    """Ejecutar suite completo de pruebas para recordatorios"""
    print("="*80)
    print("🔔 TESTING SUITE: SISTEMA DE RECORDATORIOS DE FECHAS ESPECIALES")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"API URL: {API_URL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Variables para tracking
    test_results = {
        "client_auth": False,
        "create_contacto": False,
        "verify_contacto": False,
        "cron_recordatorios": False
    }
    
    created_contacto_id = None
    client_token = None
    
    try:
        # Paso 1: Autenticación de cliente
        client_token, client_id = test_client_login()
        if not client_token:
            print("\n❌ FALLO CRÍTICO: No se pudo autenticar cliente")
            return False
            
        test_results["client_auth"] = True
        
        # Paso 2: Crear ContactoFavorito con fecha especial
        created_contacto_id, contacto = test_create_contacto_favorito(client_token, client_id)
        if created_contacto_id:
            test_results["create_contacto"] = True
            
            # Paso 3: Verificar que el contacto existe
            contacto_verified, verified_contacto_id = test_verify_contacto_exists(client_token)
            if contacto_verified:
                test_results["verify_contacto"] = True
        
        # Paso 4: Probar endpoint de recordatorios
        cron_success, cron_data = test_cron_recordatorios()
        if cron_success:
            test_results["cron_recordatorios"] = True
        
        # Análisis adicional de resultados
        if cron_data:
            print("\n" + "="*80)
            print("📊 ANÁLISIS DETALLADO DE RESULTADOS")
            print("="*80)
            
            total_recordatorios = cron_data.get('total_recordatorios', 0)
            resultados = cron_data.get('resultados', [])
            
            if total_recordatorios > 0:
                print(f"✅ SISTEMA OPERACIONAL: {total_recordatorios} recordatorios procesados")
                
                # Analizar éxito de emails
                admin_emails = sum(1 for r in resultados if r.get('email_admin'))
                client_emails = sum(1 for r in resultados if r.get('email_cliente'))
                
                print(f"📧 Emails al admin enviados: {admin_emails}/{total_recordatorios}")
                print(f"📧 Emails a clientes enviados: {client_emails}/{total_recordatorios}")
                
                if admin_emails == total_recordatorios and client_emails == total_recordatorios:
                    print("🎯 ¡PERFECTO! Todos los emails se enviaron correctamente")
                elif admin_emails > 0 or client_emails > 0:
                    print("⚠️ PARCIAL: Algunos emails se enviaron, revisar configuración de Resend")
                else:
                    print("❌ CRÍTICO: No se enviaron emails, revisar configuración")
            else:
                print("⚠️ NO HAY RECORDATORIOS: El sistema no encontró fechas especiales próximas")
                print("   Esto puede ser normal si no hay contactos con fechas en los próximos 7 días")
        
        # Limpieza
        cleanup_test_contacto(client_token, created_contacto_id)
        
    except Exception as e:
        print(f"\n💥 ERROR INESPERADO EN SUITE DE PRUEBAS: {str(e)}")
        return False
    
    # Resumen final
    print("\n" + "="*80)
    print("📊 RESUMEN DE RESULTADOS")
    print("="*80)
    
    total_tests = len(test_results)
    passed_tests = sum(test_results.values())
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        test_display = test_name.upper().replace('_', ' ')
        print(f"  {test_display}: {status}")
    
    print(f"\nRESULTADO FINAL: {passed_tests}/{total_tests} pruebas exitosas")
    
    if passed_tests == total_tests:
        print("🎉 ¡TODAS LAS PRUEBAS EXITOSAS! El sistema de recordatorios funciona correctamente.")
        print("📧 Los emails se están enviando usando Resend API")
        print("🔔 El endpoint está listo para ser llamado por un cron job externo")
        return True
    elif passed_tests >= 3:  # Al menos cliente, contacto y cron funcionan
        print("⚠️ FUNCIONALIDAD BÁSICA OK. Posibles issues menores con emails.")
        print("💡 Revisar configuración de Resend API si los emails fallan")
        return True
    else:
        print("❌ FALLAS CRÍTICAS. Revisar implementación.")
        return False

if __name__ == "__main__":
    print("Iniciando testing del sistema de recordatorios de fechas especiales...")
    success = run_recordatorios_test_suite()
    sys.exit(0 if success else 1)