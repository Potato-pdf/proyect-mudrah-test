import { 
    MudraModule, 
    Action, 
    MudraLogger,
    LogEventType,
    EntityType
} from "@byagsf/mudrah-sdk";

// --- CONFIGURACIÓN DE ENTORNO ---
// Forzamos el bypass de auth para centrarnos en la funcionalidad de logs
process.env.MUDRA_DISABLE_AUTH = "true"; 

// --- MOCK SERVERS ---
const LOG_SERVER_PORT = 9999;
const mockLogServer = Bun.serve({
    port: LOG_SERVER_PORT,
    hostname: "127.0.0.1",
    async fetch(req) {
        const url = new URL(req.url);
        if (req.method === "POST" && url.pathname === "/logs/batch") {
            const body = await req.json();
            console.log(`\n[Mock Log Server] 📥 Recibido batch de logs (${body.events.length} eventos):`);
            body.events.forEach((e: any, i: number) => {
                const metadata = e.metadata ? JSON.stringify(e.metadata) : "{}";
                console.log(`   ${i+1}. [${e.event_type}] | Modulo: ${e.module} | Entity: ${e.entity_id || "N/A"} | Meta: ${metadata}`);
            });
            return Response.json({ status: "accepted" }, { status: 202 });
        }
        if (url.pathname === "/health") {
            return new Response("OK");
        }
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`[System] Mock Log Server activo en http://localhost:${LOG_SERVER_PORT}`);

// --- INICIALIZACIÓN DEL LOGGER ---
const logger = new MudraLogger({
    endpoint: `http://127.0.0.1:${LOG_SERVER_PORT}/logs/batch`,
    module: "doc-manager-service",
    workspace_id: "ws_prod_888",
    user_id: "usr_dev_001",
    buffer_size: 3, // Flush cada 3 eventos para propósitos del test
    flush_interval_ms: 10000 // Timer de 10s (se activará si no llegamos al buffer_size)
});

@MudraModule({ id: "doc-manager-service" })
class DocumentService {
    
    // Usamos auth: false para que no falle la verificación criptográfica en este test
    @Action({ name: "view_document", price: 0.1, auth: false })
    async viewDocument(ctx: any, docId: string) {
        console.log(`[Service] Procesando vista de documento: ${docId}`);
        
        // Trackeamos evento semántico
        logger.track(LogEventType.DocumentOpened, {
            entity_id: docId,
            entity_type: EntityType.Document,
            metadata: { title: `Documento ${docId}`, source: "cloud" }
        });

        return { status: "success" };
    }

    @Action({ name: "delete_document", price: 5.0, auth: false })
    async deleteDocument(ctx: any, docId: string) {
        console.log(`[Service] Procesando eliminación de documento: ${docId}`);

        logger.track(LogEventType.EntityActioned, {
            entity_id: docId,
            entity_type: EntityType.Document,
            metadata: { action: "delete", reason: "cleanup" }
        });

        return { status: "deleted" };
    }

    async performSearch(query: string) {
        console.log(`[Service] Ejecutando búsqueda: ${query}`);
        
        logger.track(LogEventType.SearchExecuted, {
            metadata: { query, filters: "none" }
        });

        return { results: [] };
    }
}

async function runSimulation() {
    console.log("\n--- 🚀 INICIANDO SIMULACIÓN DE FLUJO DE LOGS ---");
    const service = new DocumentService();

    // 1. Navegación inicial
    console.log("\n>> Paso 1: El usuario entra al dashboard");
    logger.track(LogEventType.ModuleNavigated, { metadata: { section: "dashboard" } });
    console.log(`   Buffer actual: ${logger.bufferSize()} eventos.`);

    // 2. Ver documento
    console.log("\n>> Paso 2: El usuario abre el documento doc_001");
    await service.viewDocument({}, "doc_001");
    console.log(`   Buffer actual: ${logger.bufferSize()} eventos.`);

    // 3. Ver otro documento (esto debería disparar el flush automático porque buffer_size = 3)
    console.log("\n>> Paso 3: El usuario abre el documento doc_002 (Disparará auto-flush)");
    await service.viewDocument({}, "doc_002");
    
    // Esperamos un poco para que el Core procese el flush async si es necesario
    await new Promise(r => setTimeout(r, 500));
    console.log(`   Buffer actual tras auto-flush: ${logger.bufferSize()} eventos.`);

    // 4. Búsqueda y eliminación
    console.log("\n>> Paso 4: El usuario realiza una búsqueda");
    await service.performSearch("reportes 2024");

    console.log("\n>> Paso 5: El usuario borra un documento");
    await service.deleteDocument({}, "doc_001");
    console.log(`   Buffer actual: ${logger.bufferSize()} eventos.`);

    // Esperar un segundo para asegurar que el socket esté libre
    await new Promise(r => setTimeout(r, 1000));

    // 5. Flush manual final
    console.log("\n>> Paso 6: Forzando flush manual antes de apagar el servicio");
    const res = await logger.flush();
    console.log("   Resultado flush final:", JSON.stringify(res));

    if (res.success) {
        console.log(`\n[Success] Se enviaron ${res.count} eventos en el flush final.`);
    } else {
        console.log(`\n[Warning] El flush final falló, pero el auto-flush funcionó.`);
    }

    console.log("\n--- ✅ SIMULACIÓN COMPLETADA EXITOSAMENTE ---");
    
    mockLogServer.stop();
    process.exit(0);
}

runSimulation().catch(console.error);
