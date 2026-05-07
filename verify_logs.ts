import { MudraLogger, LogEventType, EntityType } from "@byagsf/mudrah-sdk";

async function verifyLogs() {
    console.log("--- 🧪 VERIFICACIÓN DE FUNCIONALIDAD DE LOGS ---");

    try {
        const logger = new MudraLogger({
            endpoint: "http://localhost:8080/logs/batch",
            module: "test-consumer",
            workspace_id: "ws_test_123",
            user_id: "usr_test_456",
            buffer_size: 5, // Buffer pequeño para testear auto-flush
            auto_flush: false // Desactivamos auto-flush para control manual en el test
        });

        console.log("✅ MudraLogger inicializado.");

        // 1. Verificar buffer inicial
        console.log(`Buffer inicial: ${logger.bufferSize()} (esperado: 0)`);

        // 2. Trackear algunos eventos
        console.log("Trackeando 3 eventos...");
        logger.track(LogEventType.DocumentOpened, { 
            entity_id: "doc_001", 
            entity_type: EntityType.Document 
        });
        logger.track(LogEventType.SearchExecuted, { 
            metadata: { query: "como hacer un sdk" } 
        });
        logger.track(LogEventType.ModuleNavigated, { 
            metadata: { from: "home", to: "editor" } 
        });

        const sizeAfterTrack = logger.bufferSize();
        console.log(`Buffer después de track: ${sizeAfterTrack} (esperado: 3)`);

        if (sizeAfterTrack !== 3) {
            throw new Error(`Error en buffer size: se esperaba 3, se obtuvo ${sizeAfterTrack}`);
        }

        // 3. Probar Flush manual
        console.log("Ejecutando flush manual...");
        // Nota: Esto intentará hacer un POST a localhost:8080. 
        // Si no hay servidor, fallará en el core de Rust, pero queremos ver si llega ahí.
        const flushResult = await logger.flush();
        console.log("Resultado del flush:", flushResult);

        if (flushResult.success) {
            console.log(`✅ Flush exitoso: ${flushResult.count} eventos enviados.`);
        } else {
            console.log(`⚠️ Flush falló (esperado si no hay server): ${flushResult.error}`);
        }

        const sizeAfterFlush = logger.bufferSize();
        console.log(`Buffer después de flush: ${sizeAfterFlush} (esperado: 0)`);

        if (sizeAfterFlush !== 0) {
            throw new Error(`Error en buffer size post-flush: se esperaba 0, se obtuvo ${sizeAfterFlush}`);
        }

        console.log("\n--- ✅ VERIFICACIÓN DE LOGS COMPLETADA ---");
    } catch (error) {
        console.error("\n❌ ERROR DURANTE LA VERIFICACIÓN:", error);
        process.exit(1);
    }
}

verifyLogs();
