import { DataSource } from "typeorm";
import { User } from "../../src/Entities/User";
import { Character } from "../../src/Entities/Character/Character";
import { Race, RaceTypesName } from "../../src/Entities/Character/Race";
import { CClass, ClassTypesName } from "../../src/Entities/Character/Class";
import { Place, PlaceTypes } from "../../src/Entities/World/Place";

// Seed data for testing

export async function seedTestData(dataSource: DataSource) {
    const userRepo = dataSource.getRepository(User);
    const raceRepo = dataSource.getRepository(Race);
    const classRepo = dataSource.getRepository(CClass);
    const placeRepo = dataSource.getRepository(Place);
    const characterRepo = dataSource.getRepository(Character);

    // Create a race
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

    // Create a class
    const circenseClass = new CClass(
        ClassTypesName.Circense,
        5, 10, 15, 20, 5, 10, 3
    );
    await classRepo.save(circenseClass);

    // Create place hierarchy: Desert (region) -> City -> Church -> Basement
    const desert = new Place();
    desert.name = "Deserto de Areia";
    desert.description = "Um vasto deserto com dunas douradas até onde a vista alcança.";
    desert.type = PlaceTypes.Deserto;
    desert.isRegion = true;
    desert.depth = 0;
    desert.grid_x = 0;
    desert.grid_y = 0;
    desert.pos_x = 0;
    desert.pos_y = 0;
    desert.parent = null;
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

    const oasis = new Place();
    oasis.name = "Oásis Secreto";
    oasis.description = "Um oásis escondido entre as dunas, com água cristalina.";
    oasis.type = PlaceTypes.Lago;
    oasis.isRegion = false;
    oasis.depth = 1;
    oasis.pos_x = 100;
    oasis.pos_y = 30;
    oasis.parent = desert;
    await placeRepo.save(oasis);

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
    market.depth = 2;
    market.pos_x = 30;
    market.pos_y = 20;
    market.parent = city;
    await placeRepo.save(market);

    const basement = new Place();
    basement.name = "Porão da Igreja";
    basement.description = "Um porão escuro e úmido. Algo se move nas sombras...";
    basement.type = PlaceTypes.Masmorra;
    basement.isRegion = false;
    basement.depth = 3;
    basement.pos_x = 5;
    basement.pos_y = 5;
    basement.parent = church;
    await placeRepo.save(basement);

    // Create a user
    const user = new User();
    user.username = "testplayer";
    user.email = "test@example.com";
    user.phonenumber = 123456789;
    user.password = "hashedpassword";
    await userRepo.save(user);

    // Create a character in the city using raw SQL for private fields
    await dataSource.query(`
        INSERT INTO character (
            name, title, appearance, 
            local_x, local_y, position_x, position_y,
            max_health, curr_health, max_energy, curr_energy,
            max_mana, curr_mana, max_spirit, curr_spirit,
            level, curr_xp, xp,
            strength, intelligence, dexterity, charisma, spirit, luck, talent,
            raceId, cclassId, userId, currentPlaceId
        ) VALUES (
            'Aventureiro', 'O Novato', 'Um jovem de olhos curiosos',
            50, 50, 0, 0,
            100, 100, 50, 50,
            30, 30, 20, 20,
            1, 0, 0,
            10, 10, 10, 10, 10, 10, 5,
            ?, ?, ?, ?
        )
    `, [humanRace.id, circenseClass.id, user.id, city.id]);

    const character = await characterRepo.findOne({
        where: { name: "Aventureiro" },
        relations: ["currentPlace", "race", "cclass", "user"],
    }) as Character;

    // Reload to ensure proper TypeORM attachment after raw insert
    const charReloaded = await characterRepo.findOne({
        where: { id: character.id },
        relations: ["currentPlace", "race", "cclass", "user"],
    }) as Character;

    return {
        user,
        character: charReloaded,
        humanRace,
        circenseClass,
        places: { desert, city, oasis, church, market, basement },
    };
}
