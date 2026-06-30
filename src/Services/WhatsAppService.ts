import { WhatsAppAdapter, BaileysConfig } from "../Adapters/WhatsAppAdapter";
import { InboundProcessor } from "../Queue/InboundProcessor";

// Service to handle WhatsApp integration
// Manages the adapter and routes messages to the InboundProcessor

export class WhatsAppService {
    private adapter: WhatsAppAdapter;
    private inboundProcessor: InboundProcessor;

    constructor(config: BaileysConfig) {
        this.adapter = new WhatsAppAdapter(config);
        this.inboundProcessor = new InboundProcessor();
    }

    async initialize(): Promise<void> {
        await this.adapter.initialize();
        console.log("✅ WhatsApp service initialized");
    }

    // Handle incoming messages from Baileys
    async handleMessage(message: any): Promise<void> {
        const inbound = this.adapter.parseInbound(message);
        await this.inboundProcessor.processMessage(inbound);
    }

    // Send a message via WhatsApp
    async sendMessage(platformId: string, text: string): Promise<boolean> {
        return this.adapter.sendMessage({
            platformId,
            platform: this.adapter.platform,
            text,
        });
    }

    // Check connection status
    async isConnected(): Promise<boolean> {
        return this.adapter.getConnectionStatus();
    }

    // Get adapter reference for event handling
    getAdapter(): WhatsAppAdapter {
        return this.adapter;
    }
}
