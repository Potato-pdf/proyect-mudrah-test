# 🧪 Test de Consumo: Mudrah-SDK x ByaID

Este proyecto es un **entorno de pruebas controlado** diseñado para validar la integración del `Mudrah-SDK` con el módulo de seguridad `ByaID`. Simula un microservicio real de gestión de documentos protegido por los decoradores de seguridad del ecosistema BYA.

## 🔄 Flujo de Ejecución del Test

El script de prueba (`index.ts`) ejecuta automáticamente el siguiente ciclo de vida:

1.  **Bootstrap del Módulo:** Al arrancar, el decorador `@MudraModule` registra el servicio `doc-manager-service` en el motor de Rust.
2.  **Generación de Identidad:** Se realiza una petición a ByaID para registrar un usuario de prueba y obtener un JWT RS256 válido.
3.  **Escenarios de Ataque y Acceso:**
    *   **Acceso Anónimo:** Se intenta llamar a un método `@Action` sin token (Bloqueado 401).
    *   **Acceso Autorizado:** Se usa el JWT para entrar a un método permitido (Inyección de Passport).
    *   **Validación de RBAC:** Se intenta ejecutar una acción que requiere rol `owner`.
    *   **Token Corrupto:** Se envía un string inválido para verificar que el motor de Rust detecta la firma falsa.

---

## 📡 Referencia de Peticiones (ByaID)

Durante el test, se interactúa con el endpoint de ByaID para obtener la identidad:

### Registro de Usuario de Prueba
*   **URL:** `POST http://localhost:8081/api/v1/auth/register`
*   **Cuerpo (Request):**
```json
{
  "name": "Test User",
  "email": "user-123@bya.com",
  "password": "Password123!",
  "module": "mudrah"
}
```
*   **Respuesta Exitosa (200 OK):**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "is_new_to_module": true
}
```

---

## 🛡️ Comportamiento de los Decoradores

El SDK protege los métodos de la clase `DocumentService` de la siguiente manera:

### 1. `@Action({ auth: true })`
*   **Entrada:** Busca la propiedad `token` en el objeto de contexto pasado como primer argumento.
*   **Procesamiento:** El motor de Rust valida el JWT contra la llave pública.
*   **Salida:** Si es válido, inyecta el objeto `ctx.passport`. Si no, lanza `Error: 401 Unauthorized`.

### 2. `@RequireRole("owner")`
*   **Condición:** Solo se ejecuta si `passport.workspace_role === "owner"`.
*   **Salida:** Lanza `Error: 403 Forbidden` si el rol no coincide, incluso si el token es válido.

---

## 🚀 Cómo ejecutar el Test

### Requisitos Previos
1. Tener **ByaID** corriendo (Docker o local) en el puerto `8081`.
2. Haber compilado el core de Rust en `Mudrah-SDK/src/mudra-core`.

### Paso 1: Configurar Variables de Entorno
Asegúrate de que el SDK sepa dónde está la llave pública:
```bash
export JWT_PUBLIC_KEY_PATH=/tu/ruta/ByaID/keys/public.pem
```

### Paso 2: Ejecutar
```bash
bun run index.ts
```

## 📊 Resultados Esperados en Consola
Deberías ver una salida similar a esta:
*   `[MudraModule] Registrando módulo: doc-manager-service`
*   `✔️ Bloqueo exitoso: 401 Unauthorized...`
*   `✔️ Resultado: { status: "success", data: "..." }`
*   `✔️ Acceso permitido (Rol Owner verificado)...`

---
*Este proyecto es exclusivamente para fines de testing y QA del SDK.*
