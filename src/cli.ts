import * as readline from "readline";
import { AppDataSource } from "./data-source";
import { TravelService } from "./Services/TravelService";
import { CombatService } from "./Services/CombatService";
import { InventoryService } from "./Services/InventoryService";
import { CharacterService } from "./Services/CharacterService";
import { AuthService } from "./Services/AuthService";
import { Character } from "./Entities/Character/Character";
import { User } from "./Entities/User";

// Simple CLI REPL for local testing

const PLATFORM_ID = "cli-test-user";
const PLATFORM = "cli" as any;

async function main() {
    // Initialize database
    await AppDataSource.initialize();
    console.log("✅ Database initialized");
    console.log("🎮 MMO CLI - Type commands to interact with the game");
    console.log("   Type 'exit' or 'quit' to exit");
    console.log("");

    const travelService = new TravelService();
    const combatService = new CombatService();
    const inventoryService = new InventoryService();
    const characterService = new CharacterService();
    const authService = new AuthService();

    let currentUser: User | null = null;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "> ",
    });

    rl.prompt();

    rl.on("line", async (input) => {
        const command = input.trim();

        if (command === "exit" || command === "quit") {
            rl.close();
            return;
        }

        if (!command) {
            rl.prompt();
            return;
        }

        try {
            // Parse command
            const parts = command.split(" ");
            const cmd = parts[0].toLowerCase();
            const args = parts.slice(1);

            let response = "";

            switch (cmd) {
                case "/help":
                case "/h":
                    response = `📜 *Available Commands*

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
/start - Start combat with test enemy

**Character:**
/status - View your character
/inventory - Check your items`;
                    break;

                case "/register":
                    if (args.length < 2) {
                        response = "❌ Usage: /register <username> <password>";
                    } else {
                        const result = await authService.register(args[0], args[1]);
                        response = result.message;
                    }
                    break;

                case "/login":
                    if (args.length < 2) {
                        response = "❌ Usage: /login <username> <password>";
                    } else {
                        const result = await authService.login(args[0], args[1]);
                        response = result.message;
                        if (result.success && result.user) {
                            currentUser = result.user;
                            await authService.linkPlatform(result.user, PLATFORM, PLATFORM_ID);
                        }
                    }
                    break;

                case "/characters":
                case "/chars":
                    if (!currentUser) {
                        response = "❌ Not logged in. Use /login first.";
                    } else {
                        response = await authService.listCharacters(currentUser);
                    }
                    break;

                case "/look":
                case "/l":
                    if (!currentUser) {
                        response = "❌ Not logged in. Use /login first.";
                    } else {
                        const character = await authService.getActiveCharacter(currentUser);
                        if (!character) {
                            response = "❌ No character found. Create one first.";
                        } else {
                            const place = character.currentPlace;
                            response = `📍 **${place?.name || "Unknown"}**

${place?.description || "No description."}

📍 Position: (${character.local_x}, ${character.local_y})
🎭 ${character.race?.race || "Unknown race"} - ${character.cclass?.cclass || "Unknown class"}`;
                        }
                    }
                    break;

                case "/status":
                case "/me":
                    if (!currentUser) {
                        response = "❌ Not logged in. Use /login first.";
                    } else {
                        const character = await authService.getActiveCharacter(currentUser);
                        if (!character) {
                            response = "❌ No character found. Create one first.";
                        } else {
                            response = `👤 **${character.name}** - ${character.title}

🎭 ${character.race?.race || "Unknown"} | ${character.cclass?.cclass || "Unknown"}
📊 Level ${character.level} | ${character.curr_xp} XP

❤️ HP: ${character.curr_health}/${character.max_health}
⚡ Energy: ${character.curr_energy}/${character.max_energy}
🔮 Mana: ${character.curr_mana}/${character.max_mana}
✨ Spirit: ${character.curr_spirit}/${character.max_spirit}

**Stats:**
💪 STR: ${character.strengthValue}
🧠 INT: ${character.intelligenceValue}
🎯 DEX: ${character.dexterityValue}
🎭 CHA: ${character.charismaValue}
👻 SPI: ${character.spiritValue}
🍀 LCK: ${character.luckValue}
⭐ TAL: ${character.talentValue}`;
                        }
                    }
                    break;

                case "/inventory":
                case "/inv":
                case "/i":
                    if (!currentUser) {
                        response = "❌ Not logged in. Use /login first.";
                    } else {
                        const character = await authService.getActiveCharacter(currentUser);
                        if (!character) {
                            response = "❌ No character found. Create one first.";
                        } else {
                            response = await inventoryService.getInventoryDisplay(character);
                        }
                    }
                    break;

                case "/go":
                case "/move":
                    if (!currentUser) {
                        response = "❌ Not logged in. Use /login first.";
                    } else if (args.length === 0) {
                        response = "❌ Usage: /go <place>";
                    } else {
                        const character = await authService.getActiveCharacter(currentUser);
                        if (!character) {
                            response = "❌ No character found. Create one first.";
                        } else {
                            const result = await travelService.startTravel(character, args[0], PLATFORM, PLATFORM_ID);
                            response = result.message;
                        }
                    }
                    break;

                case "/cancel":
                    if (!currentUser) {
                        response = "❌ Not logged in. Use /login first.";
                    } else {
                        const character = await authService.getActiveCharacter(currentUser);
                        if (!character) {
                            response = "❌ No character found. Create one first.";
                        } else {
                            const result = await travelService.cancelTravel(character);
                            response = result.message;
                        }
                    }
                    break;

                case "/attack":
                case "/hit":
                    if (!currentUser) {
                        response = "❌ Not logged in. Use /login first.";
                    } else {
                        const character = await authService.getActiveCharacter(currentUser);
                        if (!character) {
                            response = "❌ No character found. Create one first.";
                        } else {
                            const result = await combatService.attack(character);
                            response = result.message;
                        }
                    }
                    break;

                case "/defend":
                case "/block":
                    if (!currentUser) {
                        response = "❌ Not logged in. Use /login first.";
                    } else {
                        const character = await authService.getActiveCharacter(currentUser);
                        if (!character) {
                            response = "❌ No character found. Create one first.";
                        } else {
                            const result = await combatService.defend(character);
                            response = result.message;
                        }
                    }
                    break;

                case "/flee":
                case "/run":
                    if (!currentUser) {
                        response = "❌ Not logged in. Use /login first.";
                    } else {
                        const character = await authService.getActiveCharacter(currentUser);
                        if (!character) {
                            response = "❌ No character found. Create one first.";
                        } else {
                            const result = await combatService.flee(character);
                            response = result.message;
                        }
                    }
                    break;

                case "/start":
                    if (!currentUser) {
                        response = "❌ Not logged in. Use /login first.";
                    } else {
                        const character = await authService.getActiveCharacter(currentUser);
                        if (!character) {
                            response = "❌ No character found. Create one first.";
                        } else {
                            const combatResult = await combatService.startCombat(
                                character,
                                "Goblin",
                                50,
                                10,
                                5,
                                100,
                                25,
                                PLATFORM,
                                PLATFORM_ID
                            );
                            response = combatResult.message;
                        }
                    }
                    break;

                default:
                    response = `❌ Unknown command: ${cmd}\nType /help for available commands.`;
            }

            console.log(response);
            console.log("");
        } catch (error) {
            console.error("❌ Error:", error);
            console.log("");
        }

        rl.prompt();
    });

    rl.on("close", () => {
        console.log("\n👋 Goodbye!");
        AppDataSource.destroy();
        process.exit(0);
    });
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
