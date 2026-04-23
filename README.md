# 🧪 Test de Consumo Multi-Runtime: Mudrah-SDK x ByaID

Este proyecto es el entorno de validación para el `Mudrah-SDK`. Aquí probamos que el SDK funciona de manera idéntica en **Bun** y **Node.js**.

## 🔄 Flujo de Testeo

El test valida 4 escenarios críticos:
1.  **401 Unauthorized:** Intento de acceso sin token.
2.  **200 OK:** Acceso exitoso con token válido (RS256).
3.  **403 Forbidden:** Intento de acceso con rol insuficiente (RBAC).
4.  **Token Malformado:** Intento de acceso con firma falsa detectada por Rust.

---

## 🚀 Cómo ejecutar las pruebas

Independientemente del runtime, asegúrate de que **ByaID** esté corriendo en el puerto `8081`.

### 1. Configurar Variable de Entorno
```bash
export JWT_PUBLIC_KEY_PATH=/tu/ruta/ByaID/keys/public.pem
```

### 2. Ejecutar con Bun
```bash
bun run index.ts
```

### 3. Ejecutar con Node.js (Universal Bridge Test)
Para esto usamos `tsx` para manejar TypeScript en Node de forma directa:
```bash
npx tsx index.ts
```

---

## 📝 Requisitos Técnicos para Node.js

Para que el SDK funcione correctamente con Node.js, tu archivo `tsconfig.json` debe tener habilitada la opción de decoradores experimentales:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "target": "ESNext",
    "module": "Preserve"
  }
}
```

## 📊 Resultados Esperados

En ambos runtimes, deberías ver:
*   `[MudraResolver] Runtime [Bun/Node.js] detectado.`
*   `[MudraModule] Registrando módulo: doc-manager-service`
*   `✔️ Bloqueo exitoso: 401 Unauthorized...`
*   `🎉 ¡ÉXITO! JWT validado criptográficamente por el SDK.`
*   `✔️ Acceso permitido (Rol Owner verificado)...`

---
*QA de Mudrah-SDK - Ecosistema BYA*
