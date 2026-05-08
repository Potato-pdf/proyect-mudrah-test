import { 
    MudraModule, 
    Action, 
    MudraLogger,
    LogEventType,
    EntityType
} from "@byagsf/mudrah-sdk";

// --- CONFIGURACIÓN DE ENTORNO ---
const LOG_SERVER_PORT = 9999;
process.env.ARRGOS_LOGS_ENDPOINT = `http://127.0.0.1:${LOG_SERVER_PORT}/logs/batch`;
process.env.MUDRA_DISABLE_AUTH = "true"; 

// --- MOCK SERVERS ---
interface LogBatch {
    user_id: string;
    workspace_id: string;
    events: Array<{ event_type: string; module: string; [key: string]: unknown }>;
}

const mockLogServer = Bun.serve({
    port: LOG_SERVER_PORT,
    hostname: "127.0.0.1",
    async fetch(req) {
        const url = new URL(req.url);
        if (req.method === "POST" && url.pathname === "/logs/batch") {
            const body = (await req.json()) as LogBatch;
            console.log(`\n[Mock Log Server] 📥 Batch Recibido (User: ${body.user_id}, WS: ${body.workspace_id})`);
            console.log(`   Full JSON: ${JSON.stringify(body, null, 2)}`);
            body.events.forEach((e: any, i: number) => {
                console.log(`   ${i+1}. [${e.event_type}] en ${e.module}`);
            });
            return Response.json({ status: "accepted" }, { status: 202 });
        }
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`[System] Mock Log Server activo en ${process.env.ARRGOS_LOGS_ENDPOINT}`);

// Simulación de un Contexto de Petición
interface RequestContext {
    token?: string;
    passport?: any; 
    logger?: any; // El SDK inyectará esto automáticamente
}

@MudraModule({ 
    id: "doc-manager-service",
    logger: {
        buffer_size: 1,
        flush_interval_ms: 60000
    }
})
class DocumentService {

    @Action({ name: "view_document", price: 0.1, auth: false })
    async viewDocument(ctx: RequestContext, docId: string) {
        console.log(`[Service] Procesando vista de documento: ${docId}`);

        const res = ctx.logger.track(LogEventType.DocumentOpened, {
            entity_id: docId,
            entity_type: EntityType.Document
        });
        console.log(`   Track Result: ${JSON.stringify(res)}`);

        return { status: "success" };
    }


    @Action({ name: "delete_document", price: 5.0, auth: false })
    async deleteDocument(ctx: RequestContext, docId: string) {
        console.log(`[Service] Eliminando documento: ${docId}`);

        ctx.logger.track(LogEventType.EntityActioned, {
            entity_id: docId,
            entity_type: EntityType.Document,
            metadata: { action: "delete" }
        });

        return { status: "deleted" };
    }
}

async function runSimulation() {
    console.log("\n--- 🚀 SIMULACIÓN: LOGS CONTEXTUALES Y AUTOMÁTICOS ---");
    const service = new DocumentService();

    // Simulamos un contexto que ya tiene información de identidad (normalmente vendría del JWT)
    const ctx: RequestContext = {
        passport: {
            user_id: "usr_contextual_007",
            current_workspace_id: "ws_contextual_99"
        }
    };

    console.log("\n>> Paso 1: Acción con contexto de usuario");
    await service.viewDocument(ctx, "doc_context_001");

    console.log("\n>> Paso 2: Otra acción en el mismo contexto");
    await service.viewDocument(ctx, "doc_context_002");

    console.log("\n>> Paso 3: Eliminación");
    await service.deleteDocument(ctx, "doc_context_001");
    
    console.log("\n>> Paso 4: Forzando flush manual...");
    const res = await ctx.logger.flush();
    console.log(`   Resultado: ${res.count} eventos enviados.`);

    // Espera larga para ver si el mock server imprime algo
    console.log("Esperando 2 segundos para asegurar logs del mock server...");
    await new Promise(r => setTimeout(r, 2000));

    console.log("\n--- ✅ SIMULACIÓN COMPLETADA ---");
    mockLogServer.stop();
    process.exit(0);
}

runSimulation().catch(console.error);
