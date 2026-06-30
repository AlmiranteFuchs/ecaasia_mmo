// Base adapter interface for messaging platforms
// Each platform (Telegram, WhatsApp, Discord) implements this

export interface InboundMessage {
    platformId: string;         // Platform-specific user ID
    platform: Platform;
    text: string;
    timestamp: Date;
    userId?: number;            // Resolved user ID (optional)
    metadata?: Record<string, any>;  // Platform-specific data
}

export interface OutboundMessage {
    platformId: string;
    platform: Platform;
    text: string;
    options?: MessageOptions;
}

export interface MessageOptions {
    buttons?: Button[];         // Quick reply buttons
    image?: string;             // Image URL
    parseMode?: 'text' | 'markdown' | 'html';
}

export interface Button {
    label: string;
    action: string;             // Command to execute when pressed
}

export enum Platform {
    TELEGRAM = 'telegram',
    WHATSAPP = 'whatsapp',
    DISCORD = 'discord',
    CLI = 'cli',
}

export abstract class BaseAdapter {
    abstract platform: Platform;

    // Initialize the adapter (webhooks, polling, etc.)
    abstract initialize(): Promise<void>;

    // Send a message to a user
    abstract sendMessage(message: OutboundMessage): Promise<boolean>;

    // Parse incoming platform-specific message to common format
    abstract parseInbound(raw: any): InboundMessage;

    // Format outbound message for platform-specific API
    abstract formatOutbound(message: OutboundMessage): any;

    // Handle platform-specific rate limits
    abstract getRateLimitDelay(): number;
}
