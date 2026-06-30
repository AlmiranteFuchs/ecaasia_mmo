import { BaseAdapter, InboundMessage, OutboundMessage, Platform, MessageOptions } from "./BaseAdapter";
import makeWASocket, { DisconnectReason, useMultiFileAuthState, WASocket } from "baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path";

// Baileys WhatsApp Adapter
// Uses Baileys library to connect directly to WhatsApp Web

export interface BaileysConfig {
    sessionId: string;
    authPath?: string;
}

export interface BaileysMessage {
    key: {
        remoteJid: string;  // Phone number
        fromMe: boolean;
        id: string;
    };
    message: {
        conversation?: string;
        extendedTextMessage?: {
            text: string;
        };
        imageMessage?: {
            caption?: string;
        };
    };
    messageTimestamp: number;
    pushName?: string;
}

export class WhatsAppAdapter extends BaseAdapter {
    platform = Platform.WHATSAPP;
    
    private sock: WASocket | null = null;
    private config: BaileysConfig;
    private authPath: string;
    private logger: pino.Logger;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;

    constructor(config: BaileysConfig) {
        super();
        this.config = config;
        this.authPath = config.authPath || path.join(process.cwd(), "auth", config.sessionId);
        
        // Ensure auth directory exists
        if (!fs.existsSync(this.authPath)) {
            fs.mkdirSync(this.authPath, { recursive: true });
        }

        this.logger = pino({ level: "silent" });
    }

    async initialize(): Promise<void> {
        // Set environment variable to ignore SSL certificate verification
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

        const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

        this.sock = makeWASocket({
            auth: state,
            logger: this.logger,
            browser: ["Ecaasia MMO", "Chrome", "1.0.0"],
        });

        // Save credentials on update
        this.sock?.ev.on("creds.update", saveCreds);

        // Handle connection updates and QR codes
        this.sock?.ev.on("connection.update", async (update: any) => {
            const { connection, lastDisconnect, qr } = update;

            // Handle QR code
            if (qr) {
                console.log(`📱 QR Code for WhatsApp: ${this.config.sessionId}`);
                console.log(qr);
            }

            if (connection === "close") {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`🔄 Reconnecting to WhatsApp (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                    await this.initialize();
                } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.error("❌ Max reconnection attempts reached. Please scan QR code again.");
                }
            } else if (connection === "open") {
                this.reconnectAttempts = 0;
                console.log(`✅ WhatsApp connected for session: ${this.config.sessionId}`);
            }
        });

        // Handle incoming messages
        this.sock?.ev.on("messages.upsert", async ({ messages, type }: any) => {
            if (type === "notify") {
                for (const message of messages) {
                    if (!message.key.fromMe) {
                        const inbound = this.parseInbound(message as any);
                        await this.handleMessage(inbound);
                    }
                }
            }
        });
    }

    async sendMessage(message: OutboundMessage): Promise<boolean> {
        if (!this.sock) {
            console.error("❌ WhatsApp socket not connected");
            return false;
        }

        try {
            const jid = message.platformId + "@s.whatsapp.net";
            await this.sock.sendMessage(jid, {
                text: message.text,
            });
            return true;
        } catch (error) {
            console.error(`❌ Failed to send WhatsApp message:`, error);
            return false;
        }
    }

    parseInbound(raw: BaileysMessage): InboundMessage {
        const remoteJid = raw.key.remoteJid;
        const text = raw.message.conversation || 
                     raw.message.extendedTextMessage?.text || 
                     raw.message.imageMessage?.caption || 
                     "";

        return {
            platformId: remoteJid.replace("@s.whatsapp.net", ""),
            platform: Platform.WHATSAPP,
            text: text,
            timestamp: new Date(raw.messageTimestamp * 1000),
            metadata: {
                messageId: raw.key.id,
                fromMe: raw.key.fromMe,
                pushName: raw.pushName,
            }
        };
    }

    formatOutbound(message: OutboundMessage): any {
        return {
            text: message.text,
        };
    }

    getRateLimitDelay(): number {
        // WhatsApp rate limits
        return 1000; // 1 second between messages
    }

    async handleMessage(message: InboundMessage): Promise<void> {
        // This will be handled by the service layer
        console.log(`📩 Message from ${message.platformId}: ${message.text}`);
    }

    async getConnectionStatus(): Promise<boolean> {
        return this.sock !== null;
    }

    async disconnect(): Promise<void> {
        if (this.sock) {
            await this.sock.end(undefined);
            this.sock = null;
        }
    }

    getSessionInfo(): any {
        return {
            sessionId: this.config.sessionId,
            authPath: this.authPath,
            connected: this.sock !== null,
        };
    }
}
