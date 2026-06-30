import { Repository, DataSource } from "typeorm";
import { AppDataSource } from "../data-source";
import { Character } from "../Entities/Character/Character";
import { CombatState, CombatStatus } from "../Entities/Combat/CombatState";
import { OutboxService } from "../Outbox/OutboxService";
import { MessageType } from "../Outbox/OutboxMessage";
import { Platform } from "../Adapters/BaseAdapter";
import { InventoryService } from "./InventoryService";
import { Item, ItemType } from "../Entities/Item/Item";

export interface CombatResult {
    success: boolean;
    message: string;
    combatEnded?: boolean;
}

export class CombatService {
    private combatRepo: Repository<CombatState>;
    private characterRepo: Repository<Character>;
    private outboxService: OutboxService;
    private inventoryService: InventoryService;

    constructor(dataSource?: DataSource) {
        const ds = dataSource || AppDataSource;
        this.combatRepo = ds.getRepository(CombatState);
        this.characterRepo = ds.getRepository(Character);
        this.outboxService = new OutboxService();
        this.inventoryService = new InventoryService(ds);
    }

    // Start combat with an enemy
    async startCombat(
        character: Character,
        enemyName: string,
        enemyMaxHealth: number,
        enemyAttack: number,
        enemyDefense: number,
        enemyXpReward: number,
        enemyGoldReward: number,
        platform: Platform,
        platformId: string
    ): Promise<CombatResult> {
        // Check if character already in combat
        const existingCombat = await this.combatRepo.findOne({
            where: { character: { id: character.id }, status: CombatStatus.ACTIVE },
        });

        if (existingCombat) {
            return {
                success: false,
                message: `⚔️ You're already in combat with ${existingCombat.enemyName}!`,
            };
        }

        const combat = new CombatState();
        combat.character = character;
        combat.enemyName = enemyName;
        combat.enemyMaxHealth = enemyMaxHealth;
        combat.enemyCurrHealth = enemyMaxHealth;
        combat.enemyAttack = enemyAttack;
        combat.enemyDefense = enemyDefense;
        combat.enemyXpReward = enemyXpReward;
        combat.enemyGoldReward = enemyGoldReward;
        combat.status = CombatStatus.ACTIVE;
        combat.startedAt = new Date();
        combat.lastActionAt = new Date();
        combat.round = 1;
        combat.combatLog = "[]";
        combat.platform = platform;
        combat.platformId = platformId;

        combat.addLogEvent(`Combat started with ${enemyName}!`);

        await this.combatRepo.save(combat);

        return {
            success: true,
            message: `⚔️ Combat started with **${enemyName}**!\n\nEnemy HP: ${enemyMaxHealth}/${enemyMaxHealth}\nRound: 1`,
        };
    }

    // Player attacks enemy
    async attack(character: Character): Promise<CombatResult> {
        const combat = await this.combatRepo.findOne({
            where: { character: { id: character.id }, status: CombatStatus.ACTIVE },
        });

        if (!combat) {
            return {
                success: false,
                message: `❌ You're not in combat.`,
            };
        }

        // Calculate player damage
        const playerAttack = character.strengthValue + this.getWeaponBonus(character);
        const damage = Math.max(1, playerAttack - combat.enemyDefense + Math.floor(Math.random() * 5));

        combat.enemyCurrHealth = Math.max(0, combat.enemyCurrHealth - damage);
        combat.lastActionAt = new Date();
        combat.round++;
        combat.addLogEvent(`You attack for ${damage} damage!`);

        // Check if enemy is dead
        if (combat.isEnemyDead()) {
            combat.status = CombatStatus.VICTORY;
            await this.combatRepo.save(combat);
            return await this.handleVictory(combat, character);
        }

        // Enemy counter-attack
        await this.enemyAttack(combat, character);

        await this.combatRepo.save(combat);

        return {
            success: true,
            message: `⚔️ You attack for **${damage}** damage!\n\n${this.getCombatStatus(combat, character)}`,
        };
    }

    // Player defends (reduces incoming damage)
    async defend(character: Character): Promise<CombatResult> {
        const combat = await this.combatRepo.findOne({
            where: { character: { id: character.id }, status: CombatStatus.ACTIVE },
        });

        if (!combat) {
            return {
                success: false,
                message: `❌ You're not in combat.`,
            };
        }

        combat.lastActionAt = new Date();
        combat.round++;
        combat.addLogEvent(`You take a defensive stance.`);

        // Enemy attacks with reduced damage
        const defenseBonus = character.dexterityValue + this.getArmorBonus(character);
        const enemyDamage = Math.max(1, combat.enemyAttack - defenseBonus + Math.floor(Math.random() * 3));
        character.curr_health = Math.max(0, character.curr_health - enemyDamage);

        combat.addLogEvent(`Enemy attacks for ${enemyDamage} damage (reduced by defense).`);

        // Check if player is dead
        if (character.curr_health <= 0) {
            combat.status = CombatStatus.DEFEAT;
            await this.combatRepo.save(combat);
            await this.characterRepo.save(character);
            return await this.handleDefeat(combat, character);
        }

        await this.combatRepo.save(combat);
        await this.characterRepo.save(character);

        return {
            success: true,
            message: `🛡️ You defend. Enemy attacks for **${enemyDamage}** damage.\n\n${this.getCombatStatus(combat, character)}`,
        };
    }

    // Player flees from combat
    async flee(character: Character): Promise<CombatResult> {
        const combat = await this.combatRepo.findOne({
            where: { character: { id: character.id }, status: CombatStatus.ACTIVE },
        });

        if (!combat) {
            return {
                success: false,
                message: `❌ You're not in combat.`,
            };
        }

        // Flee chance based on dexterity
        const fleeChance = 0.3 + (character.dexterityValue * 0.02);
        const roll = Math.random();

        combat.lastActionAt = new Date();
        combat.round++;

        if (roll < fleeChance) {
            combat.status = CombatStatus.FLED;
            combat.addLogEvent(`You successfully fled from combat!`);
            await this.combatRepo.save(combat);

            return {
                success: true,
                message: `🏃 You successfully fled from combat!`,
                combatEnded: true,
            };
        } else {
            combat.addLogEvent(`Flee attempt failed!`);
            // Enemy gets a free attack
            await this.enemyAttack(combat, character);
            await this.combatRepo.save(combat);

            return {
                success: false,
                message: `🏃 Flee attempt failed! Enemy attacks.\n\n${this.getCombatStatus(combat, character)}`,
            };
        }
    }

    // Enemy attacks player
    private async enemyAttack(combat: CombatState, character: Character): Promise<void> {
        const defense = character.dexterityValue + this.getArmorBonus(character);
        const damage = Math.max(1, combat.enemyAttack - defense + Math.floor(Math.random() * 5));
        character.curr_health = Math.max(0, character.curr_health - damage);

        combat.addLogEvent(`${combat.enemyName} attacks for ${damage} damage.`);

        if (character.curr_health <= 0) {
            combat.status = CombatStatus.DEFEAT;
        }
    }

    // Handle victory
    private async handleVictory(combat: CombatState, character: Character): Promise<CombatResult> {
        combat.addLogEvent(`Victory! ${combat.enemyName} defeated.`);

        // Grant XP
        character.curr_xp += combat.enemyXpReward;

        // Grant gold
        if (combat.enemyGoldReward) {
            // TODO: Add gold to character when currency system exists
        }

        await this.characterRepo.save(character);
        await this.combatRepo.save(combat);

        let message = `🎉 **VICTORY!**\n\n`;
        message += `You defeated ${combat.enemyName}!\n`;
        message += `+${combat.enemyXpReward} XP\n`;
        if (combat.enemyGoldReward) {
            message += `+${combat.enemyGoldReward} Gold\n`;
        }

        // Queue notification
        await this.outboxService.queueMessage(
            combat.platformId,
            combat.platform as any,
            MessageType.COMBAT,
            message,
            { priority: 5 }
        );

        return {
            success: true,
            message,
            combatEnded: true,
        };
    }

    // Handle defeat
    private async handleDefeat(combat: CombatState, character: Character): Promise<CombatResult> {
        combat.addLogEvent(`Defeat. You were defeated by ${combat.enemyName}.`);

        // Penalty: lose some XP, respawn at safe location
        character.curr_xp = Math.max(0, character.curr_xp - Math.floor(character.curr_xp * 0.1));
        character.curr_health = Math.floor(character.max_health * 0.5);

        // TODO: Respawn logic

        await this.characterRepo.save(character);
        await this.combatRepo.save(combat);

        let message = `💀 **DEFEATED**\n\n`;
        message += `You were defeated by ${combat.enemyName}.\n`;
        message += `Lost ${Math.floor(character.curr_xp * 0.1)} XP\n`;
        message += `Respawned with ${character.curr_health}/${character.max_health} HP`;

        await this.outboxService.queueMessage(
            combat.platformId,
            combat.platform as any,
            MessageType.COMBAT,
            message,
            { priority: 5 }
        );

        return {
            success: true,
            message,
            combatEnded: true,
        };
    }

    // Get weapon bonus from equipped items
    private getWeaponBonus(character: Character): number {
        // TODO: Get actual weapon bonus from equipped items
        return 0;
    }

    // Get armor bonus from equipped items
    private getArmorBonus(character: Character): number {
        // TODO: Get actual armor bonus from equipped items
        return 0;
    }

    // Get combat status message
    private getCombatStatus(combat: CombatState, character: Character): string {
        let status = `⚔️ **Combat with ${combat.enemyName}**\n\n`;
        status += `👤 You: ${character.curr_health}/${character.max_health} HP\n`;
        status += `👹 Enemy: ${combat.enemyCurrHealth}/${combat.enemyMaxHealth} HP\n`;
        status += `📊 Round: ${combat.round}\n\n`;
        status += `Recent events:\n${combat.getCombatLog(3)}`;
        return status;
    }

    // Process combat round (for scheduler)
    async processCombatRound(): Promise<void> {
        const activeCombats = await this.combatRepo.find({
            where: { status: CombatStatus.ACTIVE },
            relations: ["character"],
        });

        for (const combat of activeCombats) {
            // Auto-attack if player hasn't acted in 30 seconds
            const lastAction = new Date(combat.lastActionAt);
            const now = new Date();
            const secondsSinceAction = (now.getTime() - lastAction.getTime()) / 1000;

            if (secondsSinceAction > 30) {
                // Enemy gets free attack
                await this.enemyAttack(combat, combat.character);
                await this.characterRepo.save(combat.character);
                await this.combatRepo.save(combat);

                if (combat.status === CombatStatus.DEFEAT) {
                    await this.handleDefeat(combat, combat.character);
                }
            }
        }
    }

    // Get active combat for character
    async getActiveCombat(character: Character): Promise<CombatState | null> {
        return this.combatRepo.findOne({
            where: { character: { id: character.id }, status: CombatStatus.ACTIVE },
        });
    }
}
