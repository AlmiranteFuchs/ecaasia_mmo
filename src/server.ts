import express, { Request, Response } from "express";
import { WhatsAppService } from "./Services/WhatsAppService";
import { BaileysConfig } from "./Adapters/WhatsAppAdapter";
import { AppDataSource } from "./data-source";
import { GameScheduler } from "./Scheduler/GameScheduler";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
let whatsappService: WhatsAppService | null = null;
let gameScheduler: GameScheduler;

async function initializeServices() {
    // Initialize database
    await AppDataSource.initialize();
    console.log("✅ Database initialized");

    // Initialize WhatsApp service if configured
    if (process.env.WHATSAPP_SESSION_ID) {
        const config: BaileysConfig = {
            sessionId: process.env.WHATSAPP_SESSION_ID || "ecaasia_mmo",
            authPath: process.env.WHATSAPP_AUTH_PATH,
        };
        
        try {
            whatsappService = new WhatsAppService(config);
            await whatsappService.initialize();
        } catch (error) {
            console.warn("⚠️ Failed to initialize WhatsApp service, continuing without it:", error);
        }
    } else {
        console.log("ℹ️ WhatsApp service not configured (set WHATSAPP_SESSION_ID in .env)");
    }

    // Initialize game scheduler
    gameScheduler = new GameScheduler();
    gameScheduler.start();
    console.log("✅ Game scheduler started");
}

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
    res.json({
        status: "ok",
        whatsapp: false,
    });
});

// Start server
async function startServer() {
    try {
        await initializeServices();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🏥 Health check: http://localhost:${PORT}/health`);
            if (whatsappService) {
                console.log(`📱 WhatsApp integration enabled`);
            }
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

startServer();
