import { OutboxService } from "../Outbox/OutboxService";
import { OutboxMessage } from "../Outbox/OutboxMessage";
import { BaseAdapter, OutboundMessage, Platform } from "../Adapters/BaseAdapter";

// Worker that polls the outbox and sends messages via adapters

export class OutboundWorker {
    private outboxService: OutboxService;
    private adapters: Map<Platform, BaseAdapter> = new Map();
    private isRunning: boolean = false;
    private pollIntervalMs: number;

    constructor(pollIntervalMs: number = 1000) {
        this.outboxService = new OutboxService();
        this.pollIntervalMs = pollIntervalMs;
    }

    // Register an adapter for a platform
    registerAdapter(adapter: BaseAdapter): void {
        this.adapters.set(adapter.platform, adapter);
    }

    // Start the worker loop
    async start(): Promise<void> {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log('OutboundWorker started');

        while (this.isRunning) {
            try {
                await this.processMessages();
            } catch (error) {
                console.error('OutboundWorker error:', error);
            }

            await this.sleep(this.pollIntervalMs);
        }
    }

    // Stop the worker
    stop(): void {
        this.isRunning = false;
        console.log('OutboundWorker stopped');
    }

    // Process pending messages
    private async processMessages(): Promise<void> {
        const messages = await this.outboxService.getPendingMessages(50);

        for (const message of messages) {
            await this.sendMessage(message);
        }
    }

    // Send a single message via the appropriate adapter
    private async sendMessage(message: OutboxMessage): Promise<void> {
        const adapter = this.adapters.get(message.platform as Platform);

        if (!adapter) {
            await this.outboxService.markFailed(
                message,
                `No adapter registered for platform: ${message.platform}`
            );
            return;
        }

        await this.outboxService.markProcessing(message);

        try {
            const outbound: OutboundMessage = {
                platformId: message.platformId,
                platform: message.platform as Platform,
                text: message.content,
                options: message.getMetadata() ?? undefined,
            };

            const success = await adapter.sendMessage(outbound);

            if (success) {
                await this.outboxService.markSent(message);
            } else {
                await this.outboxService.markFailed(message, 'Send returned false');
            }

            // Respect rate limits
            const delay = adapter.getRateLimitDelay();
            if (delay > 0) {
                await this.sleep(delay);
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            await this.outboxService.markFailed(message, errorMsg);
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
