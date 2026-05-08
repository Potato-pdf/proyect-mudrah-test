# 🧪 Test de Consumo Multi-Runtime: Mudrah-SDK x ByaID

Este proyecto es el entorno de validación para el `Mudrah-SDK`. Aquí probamos que el SDK funciona de manera idéntica en **Bun** y **Node.js**.

## 🔄 Flujo de Testeo

El test valida 5 escenarios críticos:
1.  **401 Unauthorized:** Intento de acceso sin token.
2.  **200 OK:** Acceso exitoso con token válido (RS256).
3.  **403 Forbidden:** Intento de acceso con rol insuficiente (RBAC).
4.  **Token Malformado:** Intento de acceso con firma falsa detectada por Rust.
5.  **Logging Semántico (BCI):** Verificación de captura de eventos, inyección de logger contextual (`ctx.logger`) y envío de batches automáticos al servidor de logs.

---

## 🚀 Cómo ejecutar las pruebas

Independientemente del runtime, asegúrate de que **ByaID** esté corriendo en el puerto `8081` (o usa el Mock Server integrado).

### 1. Configurar Variables de Entorno
```bash
# Para validación de JWT
export JWT_PUBLIC_KEY_PATH=/tu/ruta/ByaID/keys/public.pem

# Para validación de Logs (Opcional, el test usa un mock interno por defecto)
export ARRGOS_LOGS_ENDPOINT=http://127.0.0.1:9999/logs/batch
```

### 2. Ejecutar con Bun
```bash
bun run index.ts
```

### 3. Ejecutar con Node.js (Universal Bridge Test)
```bash
npx tsx index.ts
```

---

## 🛠️ Infraestructura de Pruebas de Logs

El test (`index.ts`) incluye una infraestructura autónoma para validar la telemetría:
*   **Mock Log Server**: Levanta un servidor local en el puerto `9999` que recibe los batches de Rust y audita el formato JSON.
*   **Contextual Logger**: Valida que el decorador `@Action` inyecte correctamente el objeto `logger` con el `user_id` y `workspace_id` extraídos del token.
*   **Batching Audit**: Verifica que los eventos usen el naming convention de puntos (ej: `document.opened`) y que los IDs de usuario estén al nivel superior del JSON.

---

## 📊 Resultados Esperados

En ambos runtimes, deberías ver:
*   `[MudraResolver] Runtime [Bun/Node.js] detectado.`
*   `[MudraModule] Registrando módulo: doc-manager-service`
*   `✔️ Bloqueo exitoso: 401 Unauthorized...`
*   `🎉 ¡ÉXITO! JWT validado criptográficamente por el SDK.`
*   `[Mock Log Server] 📥 Batch Recibido (User: usr_XYZ, WS: ws_ABC)`
*   `Full JSON: { "user_id": "...", "events": [...] }`

---
*QA de Mudrah-SDK - Ecosistema BYA*
