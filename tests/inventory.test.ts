import { TestDataSource } from "./setup";
import { seedTestData } from "./fixtures/seedData";
import { Character } from "../src/Entities/Character/Character";
import { Item, ItemType, EquipSlot } from "../src/Entities/Item/Item";
import { InventoryService } from "../src/Services/InventoryService";

describe("Inventory System", () => {
    let character: Character;
    let inventoryService: InventoryService;
    let healthPotion: Item;
    let sword: Item;
    let shield: Item;

    beforeEach(async () => {
        const data = await seedTestData(TestDataSource);
        // Reload character with cclass relation
        character = await TestDataSource.getRepository(Character).findOne({
            where: { id: data.character.id },
            relations: ["cclass"],
        }) as Character;
        inventoryService = new InventoryService(TestDataSource);

        // Create test items
        const itemRepo = TestDataSource.getRepository(Item);

        // Consumable: Health Potion
        healthPotion = new Item();
        healthPotion.name = "Health Potion";
        healthPotion.description = "Restores 50 HP";
        healthPotion.type = ItemType.CONSUMABLE;
        healthPotion.maxStackSize = 10;
        healthPotion.value = 25;
        healthPotion.healAmount = 50;
        await itemRepo.save(healthPotion);

        // Equippable: Sword (weapon)
        sword = new Item();
        sword.name = "Iron Sword";
        sword.description = "A sturdy iron sword";
        sword.type = ItemType.EQUIPPABLE;
        sword.maxStackSize = 1;
        sword.value = 100;
        sword.levelReq = 1;
        sword.xpReq = 0;
        sword.equipSlot = EquipSlot.WEAPON;
        sword.bonusStrength = 5;
        await itemRepo.save(sword);

        // Equippable: Shield (requires higher level)
        shield = new Item();
        shield.name = "Steel Shield";
        shield.description = "A heavy steel shield";
        shield.type = ItemType.EQUIPPABLE;
        shield.maxStackSize = 1;
        shield.value = 150;
        shield.levelReq = 5;
        shield.equipSlot = EquipSlot.ACCESSORY;
        shield.bonusMaxHealth = 20;
        await itemRepo.save(shield);
    });

    describe("Adding Items", () => {
        it("should add an item to empty inventory", async () => {
            const result = await inventoryService.addItem(character, healthPotion, 1);
            expect(result.success).toBe(true);
            expect(result.message).toContain("Added 1x Health Potion");
        });

        it("should stack consumable items", async () => {
            await inventoryService.addItem(character, healthPotion, 5);
            const result = await inventoryService.addItem(character, healthPotion, 3);
            expect(result.success).toBe(true);
            expect(result.message).toContain("Added");
            expect(result.message).toContain("existing stack");
        });

        it("should respect max stack size", async () => {
            await inventoryService.addItem(character, healthPotion, 8);
            const result = await inventoryService.addItem(character, healthPotion, 5);
            expect(result.success).toBe(true);
            // Should fill stack to 10 and create new entry for remaining 3
        });

        it("should fail when inventory is full", async () => {
            // Fill inventory with 100 items (non-stackable)
            const itemRepo = TestDataSource.getRepository(Item);
            for (let i = 0; i < 100; i++) {
                const uniqueItem = new Item();
                uniqueItem.name = `Unique Item ${i}`;
                uniqueItem.description = "A unique item";
                uniqueItem.type = ItemType.INERT;
                uniqueItem.maxStackSize = 1;
                await itemRepo.save(uniqueItem);
                await inventoryService.addItem(character, uniqueItem, 1);
            }

            const result = await inventoryService.addItem(character, sword, 1);
            expect(result.success).toBe(false);
            expect(result.message).toContain("Inventory full");
        });
    });

    describe("Removing Items", () => {
        it("should remove an item from inventory", async () => {
            await inventoryService.addItem(character, healthPotion, 5);
            const result = await inventoryService.removeItem(character, 1, 2);
            expect(result.success).toBe(true);
            expect(result.message).toContain("Removed 2x Health Potion");
        });

        it("should remove entire stack if quantity >= stack size", async () => {
            await inventoryService.addItem(character, healthPotion, 3);
            const result = await inventoryService.removeItem(character, 1, 3);
            expect(result.success).toBe(true);
            expect(result.message).toContain("Removed Health Potion from slot 1");
        });

        it("should fail if slot is empty", async () => {
            const result = await inventoryService.removeItem(character, 1, 1);
            expect(result.success).toBe(false);
            expect(result.message).toContain("No item in slot 1");
        });

        it("should fail if item is equipped", async () => {
            await inventoryService.addItem(character, sword, 1);
            await inventoryService.equipItem(character, 1);
            const result = await inventoryService.removeItem(character, 1, 1);
            expect(result.success).toBe(false);
            expect(result.message).toContain("Cannot remove equipped");
        });
    });

    describe("Equipping Items", () => {
        it("should equip an item", async () => {
            await inventoryService.addItem(character, sword, 1);
            const result = await inventoryService.equipItem(character, 1);
            expect(result.success).toBe(true);
            expect(result.message).toContain("Equipped Iron Sword");
        });

        it("should fail if item is not equippable", async () => {
            await inventoryService.addItem(character, healthPotion, 1);
            const result = await inventoryService.equipItem(character, 1);
            expect(result.success).toBe(false);
            expect(result.message).toContain("cannot be equipped");
        });

        it("should fail if level requirement not met", async () => {
            await inventoryService.addItem(character, shield, 1);
            const result = await inventoryService.equipItem(character, 1);
            expect(result.success).toBe(false);
            expect(result.message).toContain("Level 5");
        });

        it("should replace existing item in same slot", async () => {
            await inventoryService.addItem(character, sword, 1);
            await inventoryService.equipItem(character, 1);

            // Add another weapon
            const itemRepo = TestDataSource.getRepository(Item);
            const axe = new Item();
            axe.name = "Iron Axe";
            axe.description = "A sharp axe";
            axe.type = ItemType.EQUIPPABLE;
            axe.maxStackSize = 1;
            axe.equipSlot = EquipSlot.WEAPON;
            axe.bonusStrength = 7;
            await itemRepo.save(axe);

            await inventoryService.addItem(character, axe, 1);
            const result = await inventoryService.equipItem(character, 2);

            expect(result.success).toBe(true);
            expect(result.message).toContain("Equipped Iron Axe");
        });

        it("should unequip an item", async () => {
            await inventoryService.addItem(character, sword, 1);
            await inventoryService.equipItem(character, 1);
            const result = await inventoryService.unequipItem(character, EquipSlot.WEAPON);
            expect(result.success).toBe(true);
            expect(result.message).toContain("Unequipped Iron Sword");
        });
    });

    describe("Using Items", () => {
        it("should use a consumable item", async () => {
            await inventoryService.addItem(character, healthPotion, 1);
            character.curr_health = 50;
            character.max_health = 100;
            await TestDataSource.getRepository(Character).save(character);

            const result = await inventoryService.useItem(character, 1);
            expect(result.success).toBe(true);
            expect(result.message).toContain("Used Health Potion");

            const updatedChar = await TestDataSource.getRepository(Character).findOne({
                where: { id: character.id },
            });
            expect(updatedChar?.curr_health).toBe(100); // Healed to max
        });

        it("should remove item after use if quantity becomes 0", async () => {
            await inventoryService.addItem(character, healthPotion, 1);
            await inventoryService.useItem(character, 1);

            const display = await inventoryService.getInventoryDisplay(character);
            expect(display).toContain("Empty");
        });

        it("should decrease stack size when using consumable", async () => {
            await inventoryService.addItem(character, healthPotion, 5);
            await inventoryService.useItem(character, 1);

            const display = await inventoryService.getInventoryDisplay(character);
            expect(display).toContain("(x4)");
        });

        it("should fail if item is not consumable", async () => {
            await inventoryService.addItem(character, sword, 1);
            const result = await inventoryService.useItem(character, 1);
            expect(result.success).toBe(false);
            expect(result.message).toContain("cannot be used");
        });
    });

    describe("Inventory Display", () => {
        it("should display empty inventory", async () => {
            const display = await inventoryService.getInventoryDisplay(character);
            expect(display).toContain("Empty");
        });

        it("should display inventory with items", async () => {
            await inventoryService.addItem(character, healthPotion, 1);
            await inventoryService.addItem(character, sword, 1);

            const display = await inventoryService.getInventoryDisplay(character);
            expect(display).toContain("Health Potion");
            expect(display).toContain("Iron Sword");
            expect(display).toContain("2/100");
        });

        it("should show equipped items separately", async () => {
            await inventoryService.addItem(character, sword, 1);
            await inventoryService.equipItem(character, 1);

            const display = await inventoryService.getInventoryDisplay(character);
            expect(display).toContain("⚔️ *Equipped:");
            expect(display).toContain("[weapon]");
        });
    });

    describe("Item Details", () => {
        it("should show item details", async () => {
            await inventoryService.addItem(character, sword, 1);
            const details = await inventoryService.getItemDetails(character, 1);

            expect(details).toContain("Iron Sword");
            expect(details).toContain("A sturdy iron sword");
            expect(details).toContain("equippable");
            expect(details).toContain("weapon");
            expect(details).toContain("+5 STR");
        });

        it("should show consumable effects", async () => {
            await inventoryService.addItem(character, healthPotion, 1);
            const details = await inventoryService.getItemDetails(character, 1);

            expect(details).toContain("Health Potion");
            expect(details).toContain("consumable");
            expect(details).toContain("Heals: 50 HP");
        });
    });
});
