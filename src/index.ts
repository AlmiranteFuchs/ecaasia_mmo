import { Character } from "./Model/Character/Character";
import { Race, RaceTypesName } from "./Model/Character/Race";
import { CClass, ClassTypesName } from "./Model/Character/Class";

import { json_db } from "./Model/Database/DbConstructor";
import { Place, PlaceTypes, Position } from "./Model/World/Place";


async function main() {
    
    // Create a place
    let planilha: Place = new Place(1, "Planice", "Uma planice verdejante", PlaceTypes.Floresta, null, {x: 0, y: 0}, {x: 5, y: 5});
    

    let pos:Position = {x: 0, y: 0};
    //let char: Character = new Character(1, "Art", "Noob", RaceTypesName.Goblin, ClassTypesName.Salteador, pos,  );
    
    //let test: Character | null = await json_db.create_character();
    //console.log(test?._name);
}

main();
