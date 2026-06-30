import { Repository, LessThan } from "typeorm";
import { OutboxMessage, OutboxStatus, MessageType } from "./OutboxMessage";
import { Platform } from "../Adapters/BaseAdapter";
import { AppDataSource } from "../data-source";

// Service to queue and process outbound messages

export class OutboxService {
    private repository: Repository<OutboxMessage>;

    constructor() {
        this.repository = AppDataSource.getRepository(OutboxMessage);
    }

    // Queue a message to be sent
    async queueMessage(
        platformId: string,
        platform: Platform,
        messageType: MessageType,
        content: string,
        options?: {
            metadata?: Record<string, any>;
            priority?: number;
        }
    ): Promise<OutboxMessage> {
        const message = new OutboxMessage();
        message.platformId = platformId;
        message.platform = platform;
        message.messageType = messageType;
        message.content = content;
        message.priority = options?.priority ?? 10;

        if (options?.metadata) {
            message.setMetadata(options.metadata);
        }

        return this.repository.save(message);
    }

    // Get pending messages for processing (ordered by priority, then age)
    async getPendingMessages(limit: number = 50): Promise<OutboxMessage[]> {
        return this.repository.find({
            where: { status: OutboxStatus.PENDING },
            order: { priority: 'ASC', createdAt: 'ASC' },
            take: limit,
        });
    }

    // Mark message as processing
    async markProcessing(message: OutboxMessage): Promise<void> {
        message.status = OutboxStatus.PROCESSING;
        message.lastAttempt = new Date();
        await this.repository.save(message);
    }

    // Mark message as sent
    async markSent(message: OutboxMessage): Promise<void> {
        message.status = OutboxStatus.SENT;
        message.sentAt = new Date();
        await this.repository.save(message);
    }

    // Mark message as failed (with retry logic)
    async markFailed(message: OutboxMessage, error: string): Promise<void> {
        message.retryCount++;
        message.errorMessage = error;

        if (message.retryCount >= message.maxRetries) {
            message.status = OutboxStatus.FAILED;
        } else {
            message.status = OutboxStatus.PENDING; // Will retry
        }

        await this.repository.save(message);
    }

    // Clean up old sent messages (call periodically)
    async cleanupOldMessages(olderThanDays: number = 7): Promise<number> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - olderThanDays);

        const result = await this.repository.delete({
            status: OutboxStatus.SENT,
            sentAt: LessThan(cutoff),
        });

        return result.affected ?? 0;
    }
}
