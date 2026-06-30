import { InboundMessage, Platform } from "../Adapters/BaseAdapter";
import { OutboxService } from "../Outbox/OutboxService";
import { MessageType } from "../Outbox/OutboxMessage";
import { TravelService } from "../Services/TravelService";
import { CombatService } from "../Services/CombatService";
import { InventoryService } from "../Services/InventoryService";
import { AuthService } from "../Services/AuthService";
import { AppDataSource } from "../data-source";
import { User } from "../Entities/User";
import { Character } from "../Entities/Character/Character";

// Processes incoming player commands
// This is where you route commands to the game engine

export interface CommandResult {
    success: boolean;
    response: string;
    metadata?: Record<string, any>;
}

export class InboundProcessor {
    private outboxService: OutboxService;
    private travelService: TravelService;
    private combatService: CombatService;
    private authService: AuthService;

    constructor() {
        this.outboxService = new OutboxService();
        this.travelService = new TravelService();
        this.combatService = new CombatService();
        this.authService = new AuthService();
    }

    // Main entry point for processing player input
    async processMessage(message: InboundMessage): Promise<void> {
        // Resolve user from platformId if not already provided
        let user: User | null = null;
        if (message.userId) {
            const userRepo = AppDataSource.getRepository(User);
            user = await userRepo.findOne({ where: { id: message.userId } });
        } else {
            user = await this.authService.getUserByPlatformId(message.platform, message.platformId);
        }

        const command = this.parseCommand(message.text);
        const result = await this.executeCommand(command, message, user);

        // Queue the response
        await this.outboxService.queueMessage(
            message.platformId,
            message.platform,
            MessageType.SYSTEM,
            result.response,
            { metadata: result.metadata }
        );
    }

    // Parse raw text into command + args
    private parseCommand(text: string): ParsedCommand {
        const trimmed = text.trim().toLowerCase();
        const parts = trimmed.split(/\s+/);
        const command = parts[0] || '';
        const args = parts.slice(1);

        return { command, args, raw: text };
    }

    // Route command to appropriate handler
    private async executeCommand(cmd: ParsedCommand, message: InboundMessage, user: User | null): Promise<CommandResult> {
        // TODO: Implement actual game commands
        // This is a placeholder showing the pattern

        switch (cmd.command) {
            case '/start':
            case '/help':
                return this.handleHelp();

            case '/register':
                return this.handleRegister(cmd.args);

            case '/login':
                return this.handleLogin(cmd.args, message.platform, message.platformId);

            case '/characters':
            case '/chars':
                if (!user) {
                    return { success: false, response: "❌ Not logged in. Use /login first." };
                }
                return this.handleCharacters(user);

            case '/look':
            case '/l':
                if (!user) {
                    return { success: false, response: "❌ Not logged in. Use /login first." };
                }
                return this.handleLook(user);

            case '/go':
            case '/move':
                if (!user) {
                    return { success: false, response: "❌ Not logged in. Use /login first." };
                }
                return this.handleMove(user, cmd.args, message.platform);

            case '/cancel':
                if (!user) {
                    return { success: false, response: "❌ Not logged in. Use /login first." };
                }
                return this.handleCancel(user);

            case '/status':
            case '/me':
                if (!user) {
                    return { success: false, response: "❌ Not logged in. Use /login first." };
                }
                return this.handleStatus(user);

            case '/inventory':
            case '/inv':
            case '/i':
                if (!user) {
                    return { success: false, response: "❌ Not logged in. Use /login first." };
                }
                return this.handleInventory(user);

            case '/attack':
            case '/hit':
                if (!user) {
                    return { success: false, response: "❌ Not logged in. Use /login first." };
                }
                return this.handleAttack(user);

            case '/defend':
            case '/block':
                if (!user) {
                    return { success: false, response: "❌ Not logged in. Use /login first." };
                }
                return this.handleDefend(user);

            case '/flee':
            case '/run':
                if (!user) {
                    return { success: false, response: "❌ Not logged in. Use /login first." };
                }
                return this.handleFlee(user);

            default:
                return {
                    success: false,
                    response: `Unknown command: ${cmd.command}\nType /help for available commands.`,
                };
        }
    }

    // Command handlers

    private handleHelp(): CommandResult {
        return {
            success: true,
            response: `📜 *Available Commands*

**Auth:**
/register <username> <password> - Create account
/login <username> <password> - Login
/characters - List your characters

**Movement:**
/look - See your surroundings
/go <place> - Travel to a place
/cancel - Cancel current travel

**Combat:**
/attack - Attack enemy
/defend - Defend against enemy
/flee - Flee from combat

**Character:**
/status - View your character
/inventory - Check your items

_More commands coming soon..._`,
            metadata: { parseMode: 'markdown' },
        };
    }

    private async handleRegister(args: string[]): Promise<CommandResult> {
        if (args.length < 2) {
            return {
                success: false,
                response: "❌ Usage: /register <username> <password>",
            };
        }

        const [username, password] = args;
        const result = await this.authService.register(username, password);

        return {
            success: result.success,
            response: result.message,
        };
    }

    private async handleLogin(args: string[], platform: Platform, platformId: string): Promise<CommandResult> {
        if (args.length < 2) {
            return {
                success: false,
                response: "❌ Usage: /login <username> <password>",
            };
        }

        const [username, password] = args;
        const result = await this.authService.login(username, password);

        if (result.success && result.user) {
            // Link platform to user
            await this.authService.linkPlatform(result.user, platform, platformId);
        }

        return {
            success: result.success,
            response: result.message,
        };
    }

    private async handleCharacters(user: User): Promise<CommandResult> {
        const display = await this.authService.listCharacters(user);
        return {
            success: true,
            response: display,
            metadata: { parseMode: 'markdown' },
        };
    }

    private async handleLook(user: User): Promise<CommandResult> {
        const character = await this.authService.getActiveCharacter(user);
        if (!character) {
            return { success: false, response: `❌ No character found. Create one first.` };
        }

        const place = character.currentPlace;
        if (!place) {
            return { success: false, response: `❌ You're nowhere... something is wrong.` };
        }

        // Check if traveling
        const travel = await this.travelService.getActiveTravel(character);
        if (travel) {
            const pos = travel.getCurrentPosition();
            return {
                success: true,
                response: `🚶 *Traveling to ${travel.destination.name}*\n\n` +
                    `📍 Position: (${pos.x}, ${pos.y})\n` +
                    `⏱️ ${travel.getRemainingSeconds()}s remaining\n` +
                    `📊 Progress: ${travel.getProgress()}%\n\n` +
                    `Use /cancel to stop.`,
                metadata: { parseMode: 'markdown' },
            };
        }

        // Build description of current place
        let response = `📍 **${place.name}**\n\n`;
        response += `_${place.description}_\n\n`;
        response += `📌 Position: (${character.local_x}, ${character.local_y})\n\n`;

        // Show accessible places
        const children = place.children || [];
        if (children.length > 0) {
            response += `🚪 *Places here:*\n`;
            for (const child of children) {
                const dist = place.distanceFrom(character.local_x, character.local_y);
                const time = Math.round(dist / 1); // BASE_SPEED = 1
                response += `• **${child.name}** (~${time}s)\n`;
            }
        }

        return {
            success: true,
            response,
            metadata: { parseMode: 'markdown' },
        };
    }

    private async handleMove(user: User, args: string[], platform: Platform): Promise<CommandResult> {
        const character = await this.authService.getActiveCharacter(user);
        if (!character) {
            return { success: false, response: `❌ No character found. Create one first.` };
        }

        if (args.length === 0) {
            return {
                success: false,
                response: `❓ Where do you want to go?\n\nUsage: /go <place name>\nUse /look to see available places.`,
            };
        }

        const destination = args.join(' ');
        const result = await this.travelService.startTravel(character, destination, platform, "cli-test");

        return {
            success: result.success,
            response: result.message,
            metadata: { parseMode: 'markdown' },
        };
    }

    private async handleCancel(user: User): Promise<CommandResult> {
        const character = await this.authService.getActiveCharacter(user);
        if (!character) {
            return { success: false, response: `❌ No character found.` };
        }

        const result = await this.travelService.cancelTravel(character);

        return {
            success: result.success,
            response: result.message,
            metadata: { parseMode: 'markdown' },
        };
    }

    private async handleStatus(user: User): Promise<CommandResult> {
        const character = await this.authService.getActiveCharacter(user);
        if (!character) {
            return { success: false, response: `❌ No character found. Create one first.` };
        }

        const response = `📊 **${character.name}** ${character.title ? `- ${character.title}` : ''}\n\n` +
            `❤️ HP: ${character.curr_health}/${character.max_health}\n` +
            `⚡ Energy: ${character.curr_energy}/${character.max_energy}\n` +
            `🔮 Mana: ${character.curr_mana}/${character.max_mana}\n` +
            `✨ Spirit: ${character.curr_spirit}/${character.max_spirit}\n\n` +
            `📈 Level: ${character.level} (${character.curr_xp} XP)\n` +
            `📍 Location: ${character.currentPlace?.name || 'Unknown'}`;

        return {
            success: true,
            response,
            metadata: { parseMode: 'markdown' },
        };
    }

    private async handleInventory(user: User): Promise<CommandResult> {
        const character = await this.authService.getActiveCharacter(user);
        if (!character) {
            return { success: false, response: `❌ No character found. Create one first.` };
        }

        const inventoryService = new InventoryService();
        const display = await inventoryService.getInventoryDisplay(character);

        return {
            success: true,
            response: display,
            metadata: { parseMode: 'markdown' },
        };
    }

    private async handleAttack(user: User): Promise<CommandResult> {
        const character = await this.authService.getActiveCharacter(user);
        if (!character) {
            return { success: false, response: `❌ No character found. Create one first.` };
        }

        const result = await this.combatService.attack(character);

        return {
            success: result.success,
            response: result.message,
            metadata: { parseMode: 'markdown' },
        };
    }

    private async handleDefend(user: User): Promise<CommandResult> {
        const character = await this.authService.getActiveCharacter(user);
        if (!character) {
            return { success: false, response: `❌ No character found. Create one first.` };
        }

        const result = await this.combatService.defend(character);

        return {
            success: result.success,
            response: result.message,
            metadata: { parseMode: 'markdown' },
        };
    }

    private async handleFlee(user: User): Promise<CommandResult> {
        const character = await this.authService.getActiveCharacter(user);
        if (!character) {
            return { success: false, response: `❌ No character found. Create one first.` };
        }

        const result = await this.combatService.flee(character);

        return {
            success: result.success,
            response: result.message,
            metadata: { parseMode: 'markdown' },
        };
    }

    // Helper: Get character by platform ID (deprecated - use AuthService instead)
    private async getCharacterByPlatformId(platformId: string): Promise<Character | null> {
        // TODO: Need a mapping from platformId to User
        // For now, this is a placeholder - you'll need a PlatformLink entity
        const userRepo = AppDataSource.getRepository(User);
        const characterRepo = AppDataSource.getRepository(Character);

        // Placeholder: find first character (implement proper linking later)
        const character = await characterRepo.findOne({
            where: {},
            relations: ['currentPlace', 'currentPlace.children', 'race', 'cclass'],
        });

        return character;
    }
}

interface ParsedCommand {
    command: string;
    args: string[];
    raw: string;
}
