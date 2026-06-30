import { Repository, DataSource } from "typeorm";
import { AppDataSource } from "../data-source";
import { Character } from "../Entities/Character/Character";
import { Item, ItemType, EquipSlot } from "../Entities/Item/Item";
import { Inventory } from "../Entities/Item/Inventory";

export interface InventoryResult {
    success: boolean;
    message: string;
}

export class InventoryService {
    private characterRepo: Repository<Character>;
    private itemRepo: Repository<Item>;
    private inventoryRepo: Repository<Inventory>;

    private readonly MAX_SLOTS = 100;

    constructor(dataSource?: DataSource) {
        const ds = dataSource || AppDataSource;
        this.characterRepo = ds.getRepository(Character);
        this.itemRepo = ds.getRepository(Item);
        this.inventoryRepo = ds.getRepository(Inventory);
    }

    // Add an item to character's inventory
    async addItem(character: Character, item: Item, quantity: number = 1): Promise<InventoryResult> {
        // Check if item is stackable and already exists in inventory
        if (item.maxStackSize > 1) {
            const existing = await this.inventoryRepo.findOne({
                where: { character: { id: character.id }, item: { id: item.id }, isEquipped: false },
            });

            if (existing) {
                const canAdd = item.maxStackSize - existing.quantity;
                if (canAdd >= quantity) {
                    existing.quantity += quantity;
                    await this.inventoryRepo.save(existing);
                    return {
                        success: true,
                        message: `Added ${quantity}x ${item.name} to existing stack.`,
                    };
                } else if (canAdd > 0) {
                    existing.quantity = item.maxStackSize;
                    await this.inventoryRepo.save(existing);
                    const remaining = quantity - canAdd;
                    return await this.addItem(character, item, remaining);
                }
            }
        }

        // Find first empty slot
        const occupiedSlots = await this.inventoryRepo
            .createQueryBuilder("inventory")
            .where("inventory.characterId = :charId", { charId: character.id })
            .getCount();

        if (occupiedSlots >= this.MAX_SLOTS) {
            return {
                success: false,
                message: `❌ Inventory full (${this.MAX_SLOTS}/${this.MAX_SLOTS} slots used).`,
            };
        }

        // Find first available slot
        const usedSlots = await this.inventoryRepo
            .createQueryBuilder("inventory")
            .select("inventory.slot")
            .where("inventory.characterId = :charId", { charId: character.id })
            .getMany();

        const usedSlotNumbers = new Set(usedSlots.map(i => i.slot));
        let nextSlot = 1;
        while (usedSlotNumbers.has(nextSlot) && nextSlot <= this.MAX_SLOTS) {
            nextSlot++;
        }

        if (nextSlot > this.MAX_SLOTS) {
            return {
                success: false,
                message: `❌ No available inventory slots.`,
            };
        }

        // Create new inventory entry
        const inventory = new Inventory();
        inventory.character = character;
        inventory.item = item;
        inventory.slot = nextSlot;
        inventory.quantity = quantity;
        inventory.isEquipped = false;
        inventory.acquiredAt = new Date();

        if (item.type === ItemType.EQUIPPABLE) {
            inventory.durability = 100;
            inventory.maxDurability = 100;
        }

        await this.inventoryRepo.save(inventory);

        return {
            success: true,
            message: `✅ Added ${quantity}x ${item.name} to slot ${nextSlot}.`,
        };
    }

    // Remove an item from inventory
    async removeItem(character: Character, slot: number, quantity: number = 1): Promise<InventoryResult> {
        const inventory = await this.inventoryRepo.findOne({
            where: { character: { id: character.id }, slot },
            relations: ["item"],
        });

        if (!inventory) {
            return {
                success: false,
                message: `❌ No item in slot ${slot}.`,
            };
        }

        if (inventory.isEquipped) {
            return {
                success: false,
                message: `❌ Cannot remove equipped item. Unequip first.`,
            };
        }

        if (quantity >= inventory.quantity) {
            await this.inventoryRepo.remove(inventory);
            return {
                success: true,
                message: `✅ Removed ${inventory.item.name} from slot ${slot}.`,
            };
        } else {
            inventory.quantity -= quantity;
            await this.inventoryRepo.save(inventory);
            return {
                success: true,
                message: `✅ Removed ${quantity}x ${inventory.item.name} from slot ${slot}.`,
            };
        }
    }

    // Equip an item
    async equipItem(character: Character, slot: number): Promise<InventoryResult> {
        const inventory = await this.inventoryRepo.findOne({
            where: { character: { id: character.id }, slot },
            relations: ["item"],
        });

        if (!inventory) {
            return {
                success: false,
                message: `❌ No item in slot ${slot}.`,
            };
        }

        const item = inventory.item;

        if (item.type !== ItemType.EQUIPPABLE) {
            return {
                success: false,
                message: `❌ ${item.name} cannot be equipped.`,
            };
        }

        // Check requirements
        if (!item.canEquip(character.level, character.curr_xp, character.cclass?.cclass)) {
            const reqs = [];
            if (item.levelReq && character.level < item.levelReq) {
                reqs.push(`Level ${item.levelReq}`);
            }
            if (item.xpReq && character.curr_xp < item.xpReq) {
                reqs.push(`${item.xpReq} XP`);
            }
            if (item.classReq && character.cclass?.cclass !== item.classReq) {
                reqs.push(`Class ${item.classReq}`);
            }
            return {
                success: false,
                message: `❌ Cannot equip. Requires: ${reqs.join(", ")}.`,
            };
        }

        // Check if slot is already occupied
        if (!item.equipSlot) {
            return {
                success: false,
                message: `❌ Item has no equip slot defined.`,
            };
        }

        const equippedInSlot = await this.inventoryRepo.findOne({
            where: { character: { id: character.id }, isEquipped: true, item: { equipSlot: item.equipSlot } },
            relations: ["item"],
        });

        if (equippedInSlot) {
            // Unequip current item first
            equippedInSlot.isEquipped = false;
            await this.inventoryRepo.save(equippedInSlot);
        }

        // Equip new item
        inventory.isEquipped = true;
        await this.inventoryRepo.save(inventory);

        return {
            success: true,
            message: `✅ Equipped ${item.name} (${item.equipSlot}).`,
        };
    }

    // Unequip an item
    async unequipItem(character: Character, equipSlot: EquipSlot): Promise<InventoryResult> {
        const inventory = await this.inventoryRepo.findOne({
            where: { character: { id: character.id }, isEquipped: true, item: { equipSlot } },
            relations: ["item"],
        });

        if (!inventory) {
            return {
                success: false,
                message: `❌ Nothing equipped in ${equipSlot}.`,
            };
        }

        inventory.isEquipped = false;
        await this.inventoryRepo.save(inventory);

        return {
            success: true,
            message: `✅ Unequipped ${inventory.item.name} (${equipSlot}).`,
        };
    }

    // Get character's inventory formatted for display
    async getInventoryDisplay(character: Character): Promise<string> {
        const inventory = await this.inventoryRepo.find({
            where: { character: { id: character.id } },
            relations: ["item"],
            order: { slot: "ASC" },
        });

        if (inventory.length === 0) {
            return `🎒 *Inventory*\n\n_Empty._`;
        }

        const equippedItems: string[] = [];
        const backpack: string[] = [];

        for (const inv of inventory) {
            const item = inv.item;
            const qty = item.maxStackSize > 1 ? ` (x${inv.quantity})` : "";
            const equippedMark = inv.isEquipped ? " ⚔️" : "";

            if (inv.isEquipped) {
                equippedItems.push(`• [${item.equipSlot}] ${item.name}${qty}${equippedMark}`);
            } else {
                backpack.push(`• [${inv.slot}] ${item.name}${qty}${equippedMark}`);
            }
        }

        let message = `🎒 *Inventory* (${inventory.length}/${this.MAX_SLOTS})\n\n`;

        if (equippedItems.length > 0) {
            message += `⚔️ *Equipped:*\n${equippedItems.join("\n")}\n\n`;
        }

        message += `📦 *Backpack:*\n${backpack.join("\n")}`;

        return message;
    }

    // Get item details
    async getItemDetails(character: Character, slot: number): Promise<string> {
        const inventory = await this.inventoryRepo.findOne({
            where: { character: { id: character.id }, slot },
            relations: ["item"],
        });

        if (!inventory) {
            return `❌ No item in slot ${slot}.`;
        }

        const item = inventory.item;
        let message = `📦 **${item.name}**\n\n`;
        message += `_${item.description}_\n\n`;
        message += `🏷️ Type: ${item.type}\n`;
        message += `💰 Value: ${item.value} gold\n`;

        if (item.type === ItemType.EQUIPPABLE) {
            message += `\n⚔️ *Equipment*\n`;
            message += `📍 Slot: ${item.equipSlot}\n`;
            if (item.levelReq) message += `📊 Level Req: ${item.levelReq}\n`;
            if (item.xpReq) message += `✨ XP Req: ${item.xpReq}\n`;
            if (item.classReq) message += `🎭 Class Req: ${item.classReq}\n`;

            const bonuses = [];
            if (item.bonusStrength) bonuses.push(`+${item.bonusStrength} STR`);
            if (item.bonusIntelligence) bonuses.push(`+${item.bonusIntelligence} INT`);
            if (item.bonusDexterity) bonuses.push(`+${item.bonusDexterity} DEX`);
            if (item.bonusCharisma) bonuses.push(`+${item.bonusCharisma} CHA`);
            if (item.bonusSpirit) bonuses.push(`+${item.bonusSpirit} SPI`);
            if (item.bonusLuck) bonuses.push(`+${item.bonusLuck} LCK`);
            if (item.bonusTalent) bonuses.push(`+${item.bonusTalent} TAL`);
            if (item.bonusMaxHealth) bonuses.push(`+${item.bonusMaxHealth} HP`);
            if (item.bonusMaxEnergy) bonuses.push(`+${item.bonusMaxEnergy} ENG`);
            if (item.bonusMaxMana) bonuses.push(`+${item.bonusMaxMana} MANA`);
            if (item.bonusMaxSpirit) bonuses.push(`+${item.bonusMaxSpirit} SPI`);

            if (bonuses.length > 0) {
                message += `\n📈 Stats: ${bonuses.join(", ")}\n`;
            }

            if (inventory.durability !== null) {
                message += `\n🔧 Durability: ${inventory.durability}/${inventory.maxDurability}\n`;
            }
        } else if (item.type === ItemType.CONSUMABLE) {
            message += `\n🧪 *Effects*\n`;
            if (item.healAmount) message += `❤️ Heals: ${item.healAmount} HP\n`;
            if (item.manaRestore) message += `🔮 Restores: ${item.manaRestore} Mana\n`;
            if (item.energyRestore) message += `⚡ Restores: ${item.energyRestore} Energy\n`;
        }

        return message;
    }

    // Use a consumable item
    async useItem(character: Character, slot: number): Promise<InventoryResult> {
        const inventory = await this.inventoryRepo.findOne({
            where: { character: { id: character.id }, slot },
            relations: ["item"],
        });

        if (!inventory) {
            return {
                success: false,
                message: `❌ No item in slot ${slot}.`,
            };
        }

        const item = inventory.item;

        if (item.type !== ItemType.CONSUMABLE) {
            return {
                success: false,
                message: `❌ ${item.name} cannot be used.`,
            };
        }

        // Apply effects
        let applied = false;
        if (item.healAmount) {
            character.curr_health = Math.min(character.max_health, character.curr_health + item.healAmount);
            applied = true;
        }
        if (item.manaRestore) {
            character.curr_mana = Math.min(character.max_mana, character.curr_mana + item.manaRestore);
            applied = true;
        }
        if (item.energyRestore) {
            character.curr_energy = Math.min(character.max_energy, character.curr_energy + item.energyRestore);
            applied = true;
        }

        if (applied) {
            await this.characterRepo.save(character);
        }

        // Remove one from stack
        if (inventory.quantity > 1) {
            inventory.quantity--;
            await this.inventoryRepo.save(inventory);
        } else {
            await this.inventoryRepo.remove(inventory);
        }

        return {
            success: true,
            message: `✅ Used ${item.name}.`,
        };
    }
}
