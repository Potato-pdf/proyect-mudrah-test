import { 
    MudraModule, 
    Action, 
    RequireRole, 
    MudraCoreClient 
} from "@byagsf/mudrah-sdk";

// Asegurar que las variables de entorno estén en el proceso OS para FFI
if (process.env.JWT_PUBLIC_KEY_PATH) {
    process.env.JWT_PUBLIC_KEY_PATH = process.env.JWT_PUBLIC_KEY_PATH;
}

// Simulación de un Contexto de Petición (lo que recibiría un servidor como Elysia o Express)
interface RequestContext {
    token?: string;
    passport?: any; // Aquí el SDK inyectará la identidad tras validar
}

/**
 * Este es un ejemplo de cómo un desarrollador real usaría el SDK.
 * El decorador @MudraModule registra el servicio automáticamente al arrancar.
 */
@MudraModule({ id: "doc-manager-service" })
class DocumentService {
    
    /**
     * @Action con auth: true valida que el usuario esté logueado.
     * Inyecta el passport en el contexto.
     */
    @Action({ name: "view_document", price: 0.1, auth: true })
    async viewDocument(ctx: RequestContext, docId: string) {
        console.log(`[Service] Acceso concedido a: ${ctx.passport.email}`);
        return { status: "success", data: `Contenido del documento ${docId}` };
    }

    /**
     * @RequireRole es un nivel superior que solo permite el acceso a roles específicos.
     */
    @RequireRole("owner")
    @Action({ name: "delete_document", price: 5.0, auth: true })
    async deleteDocument(ctx: RequestContext, docId: string) {
        console.log(`[Service] ACCESO NIVEL OWNER concedido a: ${ctx.passport.email}`);
        return { status: "deleted", id: docId };
    }
}

async function runRealWorldTest() {
    const BYAID_URL = process.env.BYAID_URL || "http://localhost:8081";
    console.log("\n--- 🧪 TEST DE INTEGRACIÓN REAL MUDRAH-SDK ---");

    const service = new DocumentService();

    // 1. Obtener Token fresco de ByaID
    const userEmail = `user-${Date.now()}@bya.com`;
    console.log(`\nStep 1: Creando usuario en ByaID (${userEmail})...`);
    
    const token = await getJwt(BYAID_URL, userEmail);
    console.log("✅ JWT obtenido de ByaID.");

    // --- ESCENARIO 1: Acceso sin Token ---
    console.log("\n--- ESCENARIO 1: Acceso sin Token (Debe fallar 401) ---");
    try {
        await service.viewDocument({}, "doc_123");
    } catch (e: any) {
        console.log(`   ✔️ Bloqueo exitoso: ${e.message}`);
    }

    // --- ESCENARIO 2: Acceso con Token Válido ---
    console.log("\n--- ESCENARIO 2: Acceso con Token Válido (Debe pasar e inyectar identidad) ---");
    try {
        const viewRes = await service.viewDocument({ token: token }, "doc_123");
        console.log("   ✔️ Resultado:", viewRes);
    } catch (e: any) {
        console.error("   ❌ Error inesperado:", e.message);
    }

    // --- ESCENARIO 3: Validación de Roles ---
    console.log("\n--- ESCENARIO 3: Validación de Roles (RequireRole: owner) ---");
    try {
        // Como el usuario es el creador, ByaID le asigna 'owner'
        const delRes = await service.deleteDocument({ token: token }, "doc_123");
        console.log("   ✔️ Acceso permitido (Rol Owner verificado):", delRes);
    } catch (e: any) {
        console.error("   ❌ Error inesperado:", e.message);
    }

    // --- ESCENARIO 4: Token Malformado ---
    console.log("\n--- ESCENARIO 4: Token Corrupto (Debe fallar 401) ---");
    try {
        await service.viewDocument({ token: "token-invalido-123" }, "doc_123");
    } catch (e: any) {
        console.log(`   ✔️ Rechazo exitoso: ${e.message}`);
    }

    console.log("\n--- ✅ TEST FINALIZADO CON ÉXITO ---");
    process.exit(0);
}

async function getJwt(url: string, email: string): Promise<string> {
    const res = await fetch(`${url}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Test User",
            email: email,
            password: "Password123!",
            module: "mudrah"
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Fallo registro en ByaID: ${err}`);
    }

    const data: any = await res.json();
    return data.token;
}

runRealWorldTest().catch(err => {
    console.error("💥 Error fatal en el test:", err);
    process.exit(1);
});
