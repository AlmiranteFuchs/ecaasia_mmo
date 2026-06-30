import { TestDataSource } from "./setup";
import { seedTestData } from "./fixtures/seedData";
import { Character } from "../src/Entities/Character/Character";
import { CombatService } from "../src/Services/CombatService";
import { CombatStatus } from "../src/Entities/Combat/CombatState";

describe("Combat System", () => {
    let character: Character;
    let combatService: CombatService;

    beforeEach(async () => {
        const data = await seedTestData(TestDataSource);
        character = await TestDataSource.getRepository(Character).findOne({
            where: { id: data.character.id },
            relations: ["cclass"],
        }) as Character;
        combatService = new CombatService(TestDataSource);
    });

    describe("Starting Combat", () => {
        it("should start combat with an enemy", async () => {
            const result = await combatService.startCombat(
                character,
                "Goblin",
                50,
                10,
                5,
                100,
                25,
                "telegram" as any,
                "123456"
            );

            expect(result.success).toBe(true);
            expect(result.message).toContain("Combat started");
            expect(result.message).toContain("Goblin");
            expect(result.message).toContain("50/50");
        });

        it("should fail if already in combat", async () => {
            await combatService.startCombat(
                character,
                "Goblin",
                50,
                10,
                5,
                100,
                25,
                "telegram" as any,
                "123456"
            );

            const result = await combatService.startCombat(
                character,
                "Orc",
                80,
                15,
                8,
                200,
                50,
                "telegram" as any,
                "123456"
            );

            expect(result.success).toBe(false);
            expect(result.message).toContain("already in combat");
        });
    });

    describe("Attacking", () => {
        it("should attack enemy and deal damage", async () => {
            await combatService.startCombat(
                character,
                "Goblin",
                50,
                10,
                5,
                100,
                25,
                "telegram" as any,
                "123456"
            );

            const result = await combatService.attack(character);

            expect(result.success).toBe(true);
            expect(result.message).toContain("attack for");
            expect(result.message).toContain("damage");
        });

        it("should fail if not in combat", async () => {
            const result = await combatService.attack(character);

            expect(result.success).toBe(false);
            expect(result.message).toContain("not in combat");
        });

        it("should defeat enemy when HP reaches 0", async () => {
            await combatService.startCombat(
                character,
                "Weak Goblin",
                10,
                5,
                0,
                50,
                10,
                "telegram" as any,
                "123456"
            );

            // Attack multiple times to defeat
            await combatService.attack(character);
            await combatService.attack(character);

            // After victory, getActiveCombat should return null since combat ended
            const combat = await combatService.getActiveCombat(character);
            expect(combat).toBeNull();
        });
    });

    describe("Defending", () => {
        it("should defend and reduce incoming damage", async () => {
            await combatService.startCombat(
                character,
                "Goblin",
                50,
                10,
                5,
                100,
                25,
                "telegram" as any,
                "123456"
            );

            const result = await combatService.defend(character);

            expect(result.success).toBe(true);
            expect(result.message).toContain("defend");
            expect(result.message).toContain("reduced");
        });

        it("should fail if not in combat", async () => {
            const result = await combatService.defend(character);

            expect(result.success).toBe(false);
            expect(result.message).toContain("not in combat");
        });
    });

    describe("Fleeing", () => {
        it("should flee from combat successfully", async () => {
            await combatService.startCombat(
                character,
                "Goblin",
                50,
                10,
                5,
                100,
                25,
                "telegram" as any,
                "123456"
            );

            // Mock flee chance to always succeed
            const originalRandom = Math.random;
            Math.random = () => 0.1; // 10% < 30% + dexterity bonus

            const result = await combatService.flee(character);

            Math.random = originalRandom;

            expect(result.success).toBe(true);
            expect(result.message).toContain("successfully fled");
        });

        it("should fail flee attempt and take damage", async () => {
            await combatService.startCombat(
                character,
                "Goblin",
                50,
                10,
                5,
                100,
                25,
                "telegram" as any,
                "123456"
            );

            // Mock flee chance to always fail
            const originalRandom = Math.random;
            Math.random = () => 0.9; // 90% > flee chance

            const result = await combatService.flee(character);

            Math.random = originalRandom;

            expect(result.success).toBe(false);
            expect(result.message).toContain("Flee attempt failed");
        });

        it("should fail if not in combat", async () => {
            const result = await combatService.flee(character);

            expect(result.success).toBe(false);
            expect(result.message).toContain("not in combat");
        });
    });

    describe("Combat State", () => {
        it("should track combat rounds", async () => {
            await combatService.startCombat(
                character,
                "Goblin",
                50,
                10,
                5,
                100,
                25,
                "telegram" as any,
                "123456"
            );

            await combatService.attack(character);
            await combatService.attack(character);

            const combat = await combatService.getActiveCombat(character);
            expect(combat?.round).toBe(3); // Start at 1, +1 for attack, +1 for enemy counter-attack
        });

        it("should log combat events", async () => {
            await combatService.startCombat(
                character,
                "Goblin",
                50,
                10,
                5,
                100,
                25,
                "telegram" as any,
                "123456"
            );

            await combatService.attack(character);

            const combat = await combatService.getActiveCombat(character);
            const log = combat?.getCombatLog();
            expect(log).toContain("Combat started");
            expect(log).toContain("attack");
        });

        it("should detect when enemy is dead", async () => {
            const combat = await combatService.startCombat(
                character,
                "Goblin",
                50,
                10,
                5,
                100,
                25,
                "telegram" as any,
                "123456"
            );

            const combatState = await combatService.getActiveCombat(character);
            combatState!.enemyCurrHealth = 0;
            await TestDataSource.getRepository(combatState!.constructor).save(combatState!);

            expect(combatState!.isEnemyDead()).toBe(true);
        });
    });
});
