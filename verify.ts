import { MudraModule, Action, MudraCoreClient } from "@byagsf/mudrah-sdk";

console.log("🧪 Testing Mudrah-SDK Library...");

@MudraModule({ id: "test-module" })
class TestModule {
    @Action({ name: "hello", price: 0 })
    async sayHello() {
        return "Hello from consumer!";
    }
}

async function test() {
    try {
        const client = new MudraCoreClient();
        const handshake = client.initHandshake();
        console.log("✅ Core Handshake:", handshake);

        const module = new TestModule();
        const result = await module.sayHello();
        console.log("✅ Action Result:", result);

        console.log("🚀 ALL TESTS PASSED");
    } catch (e) {
        console.error("❌ TEST FAILED:", e);
        process.exit(1);
    }
}

test();
