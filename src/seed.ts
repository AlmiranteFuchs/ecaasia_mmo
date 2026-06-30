import { AppDataSource } from "./data-source";
import { User } from "./Entities/User";
import { Character } from "./Entities/Character/Character";
import { Race, RaceTypesName } from "./Entities/Character/Race";
import { CClass, ClassTypesName } from "./Entities/Character/Class";
import { Place, PlaceTypes } from "./Entities/World/Place";
import { Item, ItemType, EquipSlot } from "./Entities/Item/Item";
import { Inventory } from "./Entities/Item/Inventory";
import { PlatformLink } from "./Entities/Auth/PlatformLink";
import { AuthService } from "./Services/AuthService";

// Seed database with test data for local CLI testing

async function seed() {
    await AppDataSource.initialize();
    console.log("🌱 Seeding database...");

    const userRepo = AppDataSource.getRepository(User);
    const characterRepo = AppDataSource.getRepository(Character);
    const raceRepo = AppDataSource.getRepository(Race);
    const classRepo = AppDataSource.getRepository(CClass);
    const placeRepo = AppDataSource.getRepository(Place);
    const itemRepo = AppDataSource.getRepository(Item);
    const inventoryRepo = AppDataSource.getRepository(Inventory);
    const platformLinkRepo = AppDataSource.getRepository(PlatformLink);
    const authService = new AuthService();

    // Clear existing data
    await inventoryRepo.clear();
    await characterRepo.clear();
    await platformLinkRepo.clear();
    await userRepo.clear();
    await itemRepo.clear();
    await placeRepo.clear();
    await classRepo.clear();
    await raceRepo.clear();

    // Create Race
    const humanRace = new Race();
    humanRace.race = RaceTypesName.Humano;
    humanRace.strength = 10;
    humanRace.intelligence = 10;
    humanRace.dexterity = 10;
    humanRace.charisma = 10;
    humanRace.spirit = 10;
    humanRace.luck = 10;
    humanRace.talent = 5;
    await raceRepo.save(humanRace);

    // Create Class
    const circenseClass = new CClass(
        ClassTypesName.Circense,
        5, 10, 15, 20, 5, 10, 3
    );
    await classRepo.save(circenseClass);

    // Create User
    const user = new User();
    user.username = "cli_test_user";
    user.email = "cli@test.local";
    user.phonenumber = 123456789;
    user.password = "password";
    await userRepo.save(user);

    // Create Places
    const desert = new Place();
    desert.name = "Deserto de Areia";
    desert.description = "Um vasto deserto com dunas douradas até onde a vista alcança.";
    desert.type = PlaceTypes.Deserto;
    desert.isRegion = true;
    desert.depth = 0;
    desert.pos_x = 0;
    desert.pos_y = 0;
    await placeRepo.save(desert);

    const city = new Place();
    city.name = "Cidade de Pedra";
    city.description = "Uma cidade antiga construída em pedra, protegida do sol escaldante.";
    city.type = PlaceTypes.Cidade;
    city.isRegion = false;
    city.depth = 1;
    city.pos_x = 50;
    city.pos_y = 50;
    city.parent = desert;
    await placeRepo.save(city);

    const church = new Place();
    church.name = "Igreja Antiga";
    church.description = "Uma igreja de pedra com vitrais coloridos e um altar empoeirado.";
    church.type = PlaceTypes.Templo;
    church.isRegion = false;
    church.depth = 2;
    church.pos_x = 10;
    church.pos_y = 10;
    church.parent = city;
    await placeRepo.save(church);

    const market = new Place();
    market.name = "Mercado Central";
    market.description = "Um mercado movimentado com barracas de especiarias e tecidos.";
    market.type = PlaceTypes.Cidade;
    market.isRegion = false;
    city.depth = 2;
    market.pos_x = 30;
    market.pos_y = 20;
    market.parent = city;
    await placeRepo.save(market);

    // Create Items
    const healthPotion = new Item();
    healthPotion.name = "Poção de Vida";
    healthPotion.description = "Restaura 50 HP";
    healthPotion.type = ItemType.CONSUMABLE;
    healthPotion.maxStackSize = 10;
    healthPotion.value = 25;
    healthPotion.healAmount = 50;
    await itemRepo.save(healthPotion);

    const sword = new Item();
    sword.name = "Espada de Ferro";
    sword.description = "Uma espada resistente de ferro.";
    sword.type = ItemType.EQUIPPABLE;
    sword.maxStackSize = 1;
    sword.value = 100;
    sword.levelReq = 1;
    sword.equipSlot = EquipSlot.WEAPON;
    sword.bonusStrength = 5;
    await itemRepo.save(sword);

    const shield = new Item();
    shield.name = "Escudo de Madeira";
    shield.description = "Um escudo simples de madeira.";
    shield.type = ItemType.EQUIPPABLE;
    shield.maxStackSize = 1;
    shield.value = 50;
    shield.levelReq = 1;
    shield.equipSlot = EquipSlot.ACCESSORY;
    shield.bonusMaxHealth = 10;
    await itemRepo.save(shield);

    // Create Character using raw SQL to handle private fields
    await AppDataSource.query(`
        INSERT INTO character (
            name, title, appearance, 
            local_x, local_y, position_x, position_y,
            max_health, curr_health, max_energy, curr_energy,
            max_mana, curr_mana, max_spirit, curr_spirit,
            level, curr_xp, xp,
            strength, intelligence, dexterity, charisma, spirit, luck, talent,
            raceId, cclassId, userId, currentPlaceId
        ) VALUES (
            'Aventureiro CLI', 'O Testador', 'Um aventureiro curioso',
            50, 50, 0, 0,
            100, 100, 50, 50,
            30, 30, 20, 20,
            1, 0, 0,
            10, 10, 10, 10, 10, 10, 5,
            ?, ?, ?, ?
        )
    `, [humanRace.id, circenseClass.id, user.id, city.id]);

    // Get the character
    const character = await characterRepo.findOne({
        where: { name: "Aventureiro CLI" },
        relations: ["currentPlace", "race", "cclass", "user"],
    });

    if (!character) {
        throw new Error("Failed to create character");
    }

    // Give character some items
    const inv1 = new Inventory();
    inv1.character = character;
    inv1.item = healthPotion;
    inv1.slot = 1;
    inv1.quantity = 5;
    inv1.isEquipped = false;
    inv1.acquiredAt = new Date();
    await inventoryRepo.save(inv1);

    const inv2 = new Inventory();
    inv2.character = character;
    inv2.item = sword;
    inv2.slot = 2;
    inv2.quantity = 1;
    inv2.isEquipped = false;
    inv2.acquiredAt = new Date();
    inv2.durability = 100;
    inv2.maxDurability = 100;
    await inventoryRepo.save(inv2);

    const inv3 = new Inventory();
    inv3.character = character;
    inv3.item = shield;
    inv3.slot = 3;
    inv3.quantity = 1;
    inv3.isEquipped = false;
    inv3.acquiredAt = new Date();
    inv3.durability = 100;
    inv3.maxDurability = 100;
    await inventoryRepo.save(inv3);

    // Create PlatformLink for CLI user
    await authService.linkPlatform(user, "cli" as any, "cli-test-user");

    console.log("✅ Seeding complete!");
    console.log("");
    console.log("📊 Created:");
    console.log("   - User: cli_test_user");
    console.log("   - Character: Aventureiro CLI (Level 1)");
    console.log("   - Race: Humano");
    console.log("   - Class: Circense");
    console.log("   - Location: Cidade de Pedra");
    console.log("   - Items: 5x Poção de Vida, Espada de Ferro, Escudo de Madeira");
    console.log("   - Platform Link: cli-test-user -> cli platform");
    console.log("");
    console.log("🎮 Run 'npm run cli' to start the game CLI");
    console.log("   Use /login cli_test_user password123 to login");
    console.log("");

    await AppDataSource.destroy();
}

seed().catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
});
