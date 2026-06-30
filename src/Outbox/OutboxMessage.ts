import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";
import { Platform } from "../Adapters/BaseAdapter";

// Outbox pattern: store messages to be sent to players
// A worker polls this table and sends messages via the appropriate adapter

export enum OutboxStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SENT = 'sent',
    FAILED = 'failed',
}

export enum MessageType {
    SYSTEM = 'system',          // System notifications
    TRAVEL = 'travel',          // Travel updates
    COMBAT = 'combat',          // Combat events
    CHAT = 'chat',              // Player/NPC chat
    QUEST = 'quest',            // Quest updates
    INVENTORY = 'inventory',    // Item notifications
    LEVEL_UP = 'level_up',      // Level/XP events
}

@Entity()
export class OutboxMessage {
    @PrimaryGeneratedColumn()
    id: number;

    // Target user info
    @Column({ type: 'varchar' })
    @Index()
    platformId: string;         // Platform-specific user ID

    @Column({ type: 'varchar' })
    platform: Platform;

    // Message content
    @Column({ type: 'varchar' })
    messageType: MessageType;

    @Column({ type: 'text' })
    content: string;

    // Optional: structured data for rich messages
    @Column({ type: 'text', nullable: true })
    metadata: string;           // JSON string for buttons, images, etc.

    // Processing status
    @Column({ type: 'varchar', default: OutboxStatus.PENDING })
    @Index()
    status: OutboxStatus;

    @Column({ type: 'int', default: 0 })
    retryCount: number;

    @Column({ type: 'int', default: 3 })
    maxRetries: number;

    @Column({ type: 'datetime', nullable: true })
    lastAttempt: Date;

    @Column({ type: 'varchar', nullable: true })
    errorMessage: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'datetime', nullable: true })
    sentAt: Date;

    // Priority: lower = higher priority
    @Column({ type: 'int', default: 10 })
    @Index()
    priority: number;

    // Helper to set metadata
    setMetadata(data: Record<string, any>): void {
        this.metadata = JSON.stringify(data);
    }

    // Helper to get metadata
    getMetadata<T = Record<string, any>>(): T | null {
        if (!this.metadata) return null;
        try {
            return JSON.parse(this.metadata) as T;
        } catch {
            return null;
        }
    }
}
